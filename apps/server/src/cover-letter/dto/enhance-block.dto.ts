export class EnhanceBlockDto {
  blockId: string;
  instructions: string;
  metadata?: {
    transactionId?: string;
  };
}