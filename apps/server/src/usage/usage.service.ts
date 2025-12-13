import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';

@Injectable()
export class UsageService {
  constructor(private prisma: PrismaService) {}

  async log(userId: string, action: string, cost: number, metadata?: any) {
    return this.prisma.usageLog.create({
      data: { userId, action: action as any, cost, metadata },
    });
  }

  async list(userId: string, limit = 50) {
    return this.prisma.usageLog.findMany({ where: { userId }, take: limit, orderBy: { createdAt: 'desc' } });
  }
}
