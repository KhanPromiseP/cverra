// services/identity-framer.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { IntentAnalysis, IntentType } from '../interfaces/intent.types';
import { Prisma } from '@prisma/client';

@Injectable()
export class IdentityFramerService {
  constructor(private prisma: PrismaService) {}

  async getIdentitySummary(userId: string, intent?: IntentAnalysis): Promise<string> {
    const identity = await this.prisma.assistantIdentity.findUnique({
      where: { userId },
      select: {
        statements: true,
        values: true,
        careerIdentity: true,
        learningIdentity: true,
        confidence: true
      }
    });

    if (!identity) {
      return 'Identity not yet established';
    }

    return this.compressIdentity(identity, intent);
  }

  private compressIdentity(identity: any, intent?: IntentAnalysis): string {
    const parts = [];
    
    // Safely extract statements array
    const statements = this.extractStatementsArray(identity.statements);
    
    // Safely extract values array
    const values = this.extractValuesArray(identity.values);
    
    // Intent-aware identity selection - USING CORRECT ENUM VALUES
    if (intent) {
      // For career-related intents, prioritize career identity
      if (intent.primary === IntentType.CAREER_ADVICE || 
          intent.primary === IntentType.INTERVIEW_PREP ||
          intent.primary === IntentType.RESUME_FEEDBACK) {
        if (identity.careerIdentity) {
          parts.push(`Career: ${identity.careerIdentity}`);
        }
        if (statements.length > 0) {
          parts.push(`Self-view: ${statements[0]}`);
        }
      }
      // For learning intents, prioritize learning identity
      else if (intent.primary === IntentType.LEARNING_PATH) {
        if (identity.learningIdentity) {
          parts.push(`Learning: ${identity.learningIdentity}`);
        }
        if (statements.length > 0) {
          parts.push(`Self-view: ${statements[0]}`);
        }
      }
      // For content/tutor related intents
      else if (intent.primary === IntentType.CONTENT_CLARIFICATION ||
               intent.primary === IntentType.ARTICLE_RECOMMENDATION) {
        if (identity.learningIdentity) {
          parts.push(`Learning: ${identity.learningIdentity}`);
        }
        if (statements.length > 0) {
          parts.push(`Self-view: ${statements[0]}`);
        }
      }
      // For goal-related intents, show goals alignment
      else if (intent.primary === IntentType.GOAL_DISCUSSION || 
               intent.primary === IntentType.GOAL_STALLED ||
               intent.primary === IntentType.GOAL_UPDATE) {
        if (statements.length > 0) {
          parts.push(`Sees self as: ${statements[0]}`);
        }
        if (values.length > 0) {
          const valueList = values.slice(0, 3).join(', ');
          parts.push(`Values: ${valueList}`);
        }
      }
      // For identity exploration
      else if (intent.primary === IntentType.IDENTITY_EXPLORATION ||
               intent.primary === IntentType.VALUE_CLARIFICATION) {
        if (statements.length > 0) {
          parts.push(`Self-view: ${statements[0]}`);
        }
        if (values.length > 0) {
          const valueList = values.slice(0, 3).join(', ');
          parts.push(`Values: ${valueList}`);
        }
        if (identity.careerIdentity) {
          parts.push(`Career: ${identity.careerIdentity}`);
        }
        if (identity.learningIdentity) {
          parts.push(`Learning: ${identity.learningIdentity}`);
        }
      }
      // Default: show basic identity
      else {
        if (statements.length > 0) {
          parts.push(`Sees self as: ${statements[0]}`);
        }
        if (values.length > 0) {
          const valueList = values.slice(0, 3).join(', ');
          parts.push(`Values: ${valueList}`);
        }
      }
    } else {
      // No intent - show all
      if (statements.length > 0) {
        parts.push(`Sees self as: ${statements[0]}`);
      }
      if (values.length > 0) {
        const valueList = values.slice(0, 3).join(', ');
        parts.push(`Values: ${valueList}`);
      }
      if (identity.careerIdentity) {
        parts.push(`Career: ${identity.careerIdentity}`);
      }
      if (identity.learningIdentity) {
        parts.push(`Learning: ${identity.learningIdentity}`);
      }
    }
    
    return parts.join(' · ');
  }

  /**
   * Safely extract statements array from JsonValue
   */
  private extractStatementsArray(statements: Prisma.JsonValue): string[] {
    if (!statements) return [];
    
    // If it's already an array
    if (Array.isArray(statements)) {
      // Filter to only string values
      return statements.filter((item): item is string => typeof item === 'string');
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof statements === 'string') {
      try {
        const parsed = JSON.parse(statements);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string');
        }
      } catch {
        // If parsing fails, treat the string itself as a single statement
        return [statements];
      }
    }
    
    return [];
  }

  /**
   * Safely extract values array from JsonValue
   */
  private extractValuesArray(values: Prisma.JsonValue): string[] {
    if (!values) return [];
    
    // If it's already an array
    if (Array.isArray(values)) {
      // Filter to only string values
      return values.filter((item): item is string => typeof item === 'string');
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof values === 'string') {
      try {
        const parsed = JSON.parse(values);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string');
        }
      } catch {
        // If parsing fails, treat as a single value if it's a comma-separated list
        return values.split(',').map(v => v.trim()).filter(Boolean);
      }
    }
    
    return [];
  }

  async getIdentityForGoalAlignment(userId: string): Promise<{
    statements: string[];
    values: string[];
    careerIdentity: string | null;
  } | null> {
    const identity = await this.prisma.assistantIdentity.findUnique({
      where: { userId },
      select: {
        statements: true,
        values: true,
        careerIdentity: true
      }
    });

    if (!identity) return null;

    // Safely extract statements and values
    const statements = this.extractStatementsArray(identity.statements);
    const values = this.extractValuesArray(identity.values);

    return {
      statements: statements.slice(0, 2),
      values: values.slice(0, 3),
      careerIdentity: identity.careerIdentity
    };
  }
}