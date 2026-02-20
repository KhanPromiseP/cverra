
// src/modules/assistant/dto/
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