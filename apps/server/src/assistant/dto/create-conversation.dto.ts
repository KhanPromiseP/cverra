import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { AssistantMode } from './send-message.dto';

export class CreateConversationDto {
  @IsOptional()
  @IsEnum(AssistantMode)
  mode?: AssistantMode;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Title is too long (max 100 characters)' })
  title?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  contextIds?: string[];

  @IsOptional()
  metadata?: Record<string, any>;
}