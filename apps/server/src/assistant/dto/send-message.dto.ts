import { IsString, IsOptional, IsEnum, IsArray, MinLength, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum AssistantMode {
  GENERAL_ASSISTANT = 'GENERAL_ASSISTANT',
  TUTOR = 'TUTOR',
  CAREER_COACH = 'CAREER_COACH',
  CONTENT_GUIDE = 'CONTENT_GUIDE',
}

export class SendMessageDto {
  @IsString()
  @MinLength(1, { message: 'Message cannot be empty' })
  @MaxLength(5000, { message: 'Message is too long (max 5000 characters)' })
  content: string;

  @IsOptional()
  @IsEnum(AssistantMode, { 
    message: `Mode must be one of: ${Object.values(AssistantMode).join(', ')}` 
  })
  mode?: AssistantMode;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contextIds?: string[]; // Article/Resume IDs to include in context

  @IsOptional()
  @IsString()
  conversationId?: string; // Optional: Continue existing conversation

  @IsOptional()
  attachments?: Array<{
    type: 'image' | 'document' | 'code';
    content: string;
    name?: string;
    language?: string; // For code snippets
  }>;

  @IsOptional()
  metadata?: Record<string, any>;
}