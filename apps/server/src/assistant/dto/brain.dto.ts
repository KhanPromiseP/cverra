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
