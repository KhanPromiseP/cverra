// notification/dto/notification.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  @IsOptional()
  data?: any;
}

export class MarkAsReadDto {
  @IsString()
  @IsNotEmpty()
  notificationId: string;
}