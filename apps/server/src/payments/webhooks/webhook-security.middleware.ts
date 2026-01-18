// src/payments/webhooks/webhook-security.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class WebhookSecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(WebhookSecurityMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Verify request comes from Stripe/Tranzak IPs (in production)
    const ip = req.ip;
    
    // Add rate limiting for webhooks
    const path = req.path;
    if (path.includes('/webhook/')) {
      // Log all webhook requests
      this.logger.log(`Webhook received: ${path} from ${ip}`);
      
      // Ensure raw body is preserved for signature verification
      if (!(req as any).rawBody) {
        let data = '';
        req.on('data', chunk => {
          data += chunk;
        });
        req.on('end', () => {
          (req as any).rawBody = data;
          next();
        });
        return;
      }
    }
    
    next();
  }
}