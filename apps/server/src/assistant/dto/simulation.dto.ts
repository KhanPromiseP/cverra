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
