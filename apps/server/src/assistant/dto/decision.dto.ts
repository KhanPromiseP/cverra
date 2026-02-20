// src/modules/assistant/dto/decision.dto.ts
export class DecisionAnalysisDto {
  optionA: string;
  optionB: string;
  goals?: string[];
  constraints?: string[];
}

export class DecisionResponseDto {
  analysis: {
    options: Array<{
      description: string;
      pros: string[];
      cons: string[];
    }>;
    scores: Array<{
      option: string;
      score: number;
      breakdown: {
        pros: number;
        cons: number;
        goalAlignment: number;
        identityAlignment: number;
        pastPattern: number;
      };
    }>;
    recommendation: string;
    confidence: number;
    tradeoffs: string[];
    questionsToConsider: string[];
  };
}

// src/modules/assistant/dto/simulation.dto.ts
export class SimulationRequestDto {
  path: string;
  duration?: number; // months
}

export class SimulationResponseDto {
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

// src/modules/assistant/dto/brain.dto.ts
export class BrainDumpDto {
  content: string;
}

export class BrainItemDto {
  id: string;
  type: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  priority: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// src/modules/assistant/dto/weekly-summary.dto.ts
export class WeeklySummaryDto {
  weekStart: Date;
  weekEnd: Date;
  summary: string;
  highlights: string[];
  challenges: string[];
  goalProgress: any;
  emotionalTrend: any;
  recommendedFocus: string;
  recommendedActions: string[];
}