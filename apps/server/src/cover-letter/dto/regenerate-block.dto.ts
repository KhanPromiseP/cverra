
import { IsString, IsNotEmpty } from 'class-validator';

export class RegenerateBlockDto {
  @IsString()
  @IsNotEmpty()
  blockId: string;
}