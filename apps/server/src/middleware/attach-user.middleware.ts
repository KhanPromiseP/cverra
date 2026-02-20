// middleware/attach-user.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AttachUserMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AttachUserMiddleware.name);
  private readonly jwtSecret: string;

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    // Provide a default value or throw an error if secret is missing
    const secret = this.configService.get<string>('ACCESS_TOKEN_SECRET');
    if (!secret) {
      this.logger.error('❌ ACCESS_TOKEN_SECRET is not defined in environment variables!');
      // Use a fallback for development (NOT recommended for production)
      this.jwtSecret = 'your-fallback-secret-for-development-only';
    } else {
      this.jwtSecret = secret;
    }
    this.logger.log('🔧 AttachUserMiddleware initialized with secret:', this.jwtSecret ? 'Secret exists' : 'No secret!');
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Log all cookies for debugging
      this.logger.log('🍪 AttachUserMiddleware - Cookies:', req.cookies);
      
      // Try to get token from cookie
      const token = req.cookies?.Authentication;
      
      if (token) {
        this.logger.log('🍪 Token found in cookie, verifying...');
        
        try {
          // Verify the token using jsonwebtoken directly
          const payload = jwt.verify(token, this.jwtSecret) as any;
          this.logger.log('✅ Token verified, payload:', { id: payload.id });
          
          if (payload && payload.id) {
            // Get full user from database
            const user = await this.userService.findOneById(payload.id);
            
            if (user) {
              // Attach user to request
              req['user'] = user;
              this.logger.log('✅ User attached to request:', { 
                id: user.id, 
                role: user.role,
                email: user.email 
              });
            } else {
              this.logger.log('⚠️ User not found in database');
            }
          }
        } catch (tokenError) {
          this.logger.log('❌ Token verification failed:', tokenError.message);
        }
      } else {
        this.logger.log('ℹ️ No Authentication cookie found');
      }
    } catch (error) {
      this.logger.error('❌ Error in AttachUserMiddleware:', error.message);
    }
    
    next();
  }
}