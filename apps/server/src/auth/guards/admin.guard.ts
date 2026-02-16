
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Get user from database to check role
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, email: true }
    });

    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    // Allow both ADMIN and SUPER_ADMIN
    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Insufficient permissions. Admin access required.');
    }

    // Add user to request for use in controllers
    request.user = dbUser;
    return true;
  }
}

// Super Admin Guard for more restrictive routes
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, email: true }
    });

    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    if (dbUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Insufficient permissions. Super Admin access required.');
    }

    request.user = dbUser;
    return true;
  }
}