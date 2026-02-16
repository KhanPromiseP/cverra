// src/assistant/dto/conversation-management.dto.ts
import { 
  IsString, 
  IsBoolean, 
  IsOptional, 
  IsEnum, 
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
  MaxLength 
} from 'class-validator';
import { Type } from 'class-transformer';

export class ClearConversationDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;
}

export class DeleteConversationDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsBoolean()
  @IsOptional()
  permanent?: boolean = false;
}

export class RestoreConversationDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;
}

export class ArchiveConversationDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsBoolean()
  @IsOptional()
  archive?: boolean = true;
}

export class StarConversationDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsBoolean()
  star: boolean;
}

export class PinConversationDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsBoolean()
  pin: boolean;
}

export class UpdateConversationTitleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;
}


export class GetConversationsDto {
  @IsEnum(['all', 'active', 'archived', 'deleted', 'starred', 'pinned'])
  @IsOptional()
  filter?: 'all' | 'active' | 'archived' | 'deleted' | 'starred' | 'pinned' = 'all';

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  offset?: number = 0;

  @IsString()
  @IsOptional()
  search?: string;
}

export class ExportConversationDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsEnum(['json', 'txt', 'md'])
  @IsOptional()
  format?: 'json' | 'txt' | 'md';
}

export class GetConversationAnalyticsDto {
  @IsEnum(['day', 'week', 'month', 'year'])
  @IsOptional()
  timeframe?: 'day' | 'week' | 'month' | 'year' = 'month';
}

export class EmptyTrashDto {
  @IsBoolean()
  @IsOptional()
  confirm?: boolean = true;
}