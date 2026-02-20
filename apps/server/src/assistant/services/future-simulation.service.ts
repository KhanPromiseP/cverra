import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { GroqService } from './groq.service';
import { GoalService } from './goal.service';

interface SimulationResult {
  primaryPath: {
    path: string;
    duration: number;
    skillProjections: Array<{
      skill: string;
      currentLevel: number;
      projectedLevel: number;
      confidence: number;
    }>;
    marketOpportunities: Array<{
      role: string;
      demand: 'high' | 'medium' | 'low';
      salary: string;
      timeToReach: number;
    }>;
    risks: Array<{
      risk: string;
      probability: number;
      impact: 'high' | 'medium' | 'low';
      mitigation: string;
    }>;
    tradeoffs: string[];
  };
  alternatives: Array<{
    path: string;
    score: number;
    tradeoffs: string[];
    keyDifference: string;
  }>;
}

@Injectable()
export class FutureSimulationService {
  private readonly logger = new Logger(FutureSimulationService.name);

 constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => GroqService)) private groqService: GroqService,
    private goalService: GoalService,
  ) {}

  /**
   * Simulate a learning/career path
   */
  async simulatePath(
    userId: string,
    path: string,
    duration: number = 6, // months
  ): Promise<SimulationResult> {
    try {
      // Get user's current skills and context
      const userProfile = await this.getUserSkillProfile(userId);
      const userGoals = await this.goalService.getActiveGoals(userId);

      // Get market data (in production, you'd have a real market data source)
      const marketData = await this.getMarketData(path);

      const prompt = `
You are a career path simulator. Simulate what would happen if this user focuses on:

Path: "${path}"
Duration: ${duration} months

User Profile:
${JSON.stringify(userProfile)}

Current Goals:
${userGoals.map(g => `- ${g.description}`).join('\n')}

Market Data:
${JSON.stringify(marketData)}

Generate a realistic simulation with:

1. Skill Projections:
   - List key skills they'd develop
   - Current level (0-100 based on profile)
   - Projected level after ${duration} months
   - Confidence in projection

2. Market Opportunities:
   - Job roles they could qualify for
   - Demand level (high/medium/low)
   - Estimated salary range
   - Months needed to reach this level

3. Risks:
   - Potential obstacles
   - Probability (0-1)
   - Impact level
   - How to mitigate

4. Tradeoffs (what they'd sacrifice by choosing this path)

5. Compare with 2 alternative paths (similar duration) with scores

Return as JSON with this exact structure:
{
  "primaryPath": {
    "path": "...",
    "duration": ${duration},
    "skillProjections": [
      {"skill": "...", "currentLevel": 30, "projectedLevel": 70, "confidence": 0.8}
    ],
    "marketOpportunities": [
      {"role": "...", "demand": "high", "salary": "$80k-$100k", "timeToReach": 4}
    ],
    "risks": [
      {"risk": "...", "probability": 0.3, "impact": "medium", "mitigation": "..."}
    ],
    "tradeoffs": ["tradeoff1", "tradeoff2"]
  },
  "alternatives": [
    {
      "path": "Alternative 1",
      "score": 75,
      "tradeoffs": ["tradeoff1"],
      "keyDifference": "faster but less depth"
    }
  ]
}
`;

      const response = await this.groqService.chatCompletion(
        [{ role: 'user', content: prompt }],
        { user: { id: userId } },
        'CAREER_COACH',
        { temperature: 0.5, maxTokens: 4000 }
      );

      if (response.isFallback || !response.content) {
        throw new Error('Simulation failed');
      }

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid simulation format');
      }

      const simulation = JSON.parse(jsonMatch[0]) as SimulationResult;

      // Save simulation
      await this.saveSimulation(userId, path, duration, simulation);

      return simulation;
    } catch (error) {
      this.logger.error('Path simulation failed:', error);
      throw error;
    }
  }

  /**
   * Get user skill profile from various sources
   */
  private async getUserSkillProfile(userId: string): Promise<any> {
    // Get resumes
    const resumes = await this.prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    });

    // Get learning goals
    const learningGoals = await this.prisma.assistantGoal.findMany({
      where: {
        userId,
        category: 'LEARNING',
        status: 'ACTIVE',
      },
    });

    // Get conversation topics
    const conversations = await this.prisma.assistantConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: { messages: { take: 5 } },
    });

    const skills: Record<string, number> = {};

    // Extract from resumes
    resumes.forEach(resume => {
      const data = resume.data as any;
      if (data.skills) {
        data.skills.forEach((skill:any) => {
          skills[skill] = Math.max(skills[skill] || 0, 70);
        });
      }
    });

    // Extract from goals
    learningGoals.forEach((goal:any) => {
      const words = goal.description.split(' ');
      // Simple heuristic - in production, use AI
      words.forEach((word:any) => {
        if (word.length > 3 && !['learn', 'study', 'master'].includes(word.toLowerCase())) {
          skills[word] = Math.max(skills[word] || 0, 30);
        }
      });
    });

    return {
      skills: Object.entries(skills).map(([name, level]) => ({ name, level })),
      learningGoals: learningGoals.map(g => g.description),
      recentTopics: conversations.map(c => c.mode),
    };
  }

  /**
   * Get market data for a path (simplified)
   */
  private async getMarketData(path: string): Promise<any> {
    // In production, this would call real market APIs
    // For now, return simulated data based on path keywords
    
    const lowerPath = path.toLowerCase();
    
    if (lowerPath.includes('react') || lowerPath.includes('frontend')) {
      return {
        demand: 'high',
        roles: ['Frontend Developer', 'React Developer', 'UI Engineer'],
        salary: { entry: '$60k', mid: '$90k', senior: '$130k' },
        growth: '15% year over year',
        locations: ['Remote', 'Tech Hubs'],
      };
    }
    
    if (lowerPath.includes('backend') || lowerPath.includes('node') || lowerPath.includes('python')) {
      return {
        demand: 'very high',
        roles: ['Backend Developer', 'API Engineer', 'Systems Engineer'],
        salary: { entry: '$70k', mid: '$100k', senior: '$150k' },
        growth: '20% year over year',
        locations: ['Remote', 'Tech Hubs', 'Enterprise'],
      };
    }
    
    if (lowerPath.includes('data') || lowerPath.includes('analytics')) {
      return {
        demand: 'high',
        roles: ['Data Analyst', 'Data Engineer', 'Business Intelligence'],
        salary: { entry: '$65k', mid: '$95k', senior: '$140k' },
        growth: '25% year over year',
        locations: ['Remote', 'Tech Hubs', 'Finance', 'Healthcare'],
      };
    }
    
    // Default
    return {
      demand: 'medium',
      roles: ['Developer', 'Engineer'],
      salary: { entry: '$50k', mid: '$80k', senior: '$120k' },
      growth: '10% year over year',
      locations: ['Various'],
    };
  }

  /**
   * Save simulation to database
   */
  private async saveSimulation(
    userId: string,
    path: string,
    duration: number,
    simulation: SimulationResult,
  ): Promise<void> {
    try {
      await this.prisma.assistantPathSimulation.create({
        data: {
          userId,
          path,
          duration,
          confidence: 0.7,
          skillProjections: simulation.primaryPath.skillProjections,
          marketOpportunities: simulation.primaryPath.marketOpportunities,
          risks: simulation.primaryPath.risks,
          tradeoffs: {
            primary: simulation.primaryPath.tradeoffs,
            alternatives: simulation.alternatives,
          },
          alternatives: simulation.alternatives,
        },
      });
    } catch (error) {
      this.logger.error('Failed to save simulation:', error);
    }
  }

  /**
   * Compare two paths
   */
  async comparePaths(
    userId: string,
    pathA: string,
    pathB: string,
    duration: number = 6,
  ): Promise<any> {
    const [simA, simB] = await Promise.all([
      this.simulatePath(userId, pathA, duration),
      this.simulatePath(userId, pathB, duration),
    ]);

    return {
      pathA: simA.primaryPath,
      pathB: simB.primaryPath,
      comparison: {
        fasterPath: simA.primaryPath.skillProjections.length > simB.primaryPath.skillProjections.length ? pathA : pathB,
        higherSalary: (simA.primaryPath.marketOpportunities[0]?.salary || '') > (simB.primaryPath.marketOpportunities[0]?.salary || '') ? pathA : pathB,
        lowerRisk: this.calculateRiskScore(simA) < this.calculateRiskScore(simB) ? pathA : pathB,
      },
      tradeoffMatrix: {
        [pathA]: simA.primaryPath.tradeoffs,
        [pathB]: simB.primaryPath.tradeoffs,
      },
    };
  }

  private calculateRiskScore(simulation: SimulationResult): number {
    return simulation.primaryPath.risks.reduce(
      (acc, risk) => acc + risk.probability * (risk.impact === 'high' ? 3 : risk.impact === 'medium' ? 2 : 1),
      0
    );
  }
}