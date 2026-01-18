// import { Injectable } from "@nestjs/common";
// import { ConfigService } from "@nestjs/config";
// import { PassportStrategy } from "@nestjs/passport";
// import type { Request } from "express";
// import { ExtractJwt, Strategy, StrategyOptions } from "passport-jwt";

// import { Config } from "@/server/config/schema";
// import { UserService } from "@/server/user/user.service";

// import { Payload } from "../utils/payload";

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
//   constructor(
//     private readonly configService: ConfigService<Config>,
//     private readonly userService: UserService,
//   ) {
//     const extractors = [(request: Request) => request.cookies.Authentication];

//     super({
//       secretOrKey: configService.get<string>("ACCESS_TOKEN_SECRET"),
//       jwtFromRequest: ExtractJwt.fromExtractors(extractors),
//       ignoreExpiration: false,
//     } as StrategyOptions);
//   }

//   async validate(payload: Payload) {
//     return this.userService.findOneById(payload.id);
//   }
// }



import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { Request } from "express";
import { ExtractJwt, Strategy, StrategyOptions } from "passport-jwt";

import { Config } from "@/server/config/schema";
import { UserService } from "@/server/user/user.service";

import { Payload } from "../utils/payload";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  // Cache for JWT validation - separate from user service cache
  private readonly validationCache = new Map<string, { user: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly userService: UserService,
  ) {
    const extractors = [(request: Request) => request.cookies.Authentication];

    super({
      secretOrKey: configService.get<string>("ACCESS_TOKEN_SECRET"),
      jwtFromRequest: ExtractJwt.fromExtractors(extractors),
      ignoreExpiration: false,
    } as StrategyOptions);
  }

  async validate(payload: Payload) {
    const userId = payload.id;
    const now = Date.now();
    
    // 1. Check cache first
    const cached = this.validationCache.get(userId);
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      Logger.debug(`[JWT Cache] Returning cached user for ${userId}`);
      return cached.user;
    }
    
    // 2. Fetch from user service
    Logger.debug(`[JWT Cache] Fetching user ${userId} from database`);
    const user = await this.userService.findOneById(payload.id);
    
    // 3. Cache the result
    this.cacheUser(userId, user);
    
    return user;
  }
  
  private cacheUser(userId: string, user: any): void {
    // Clean up old entries if cache is too large
    if (this.validationCache.size >= this.MAX_CACHE_SIZE) {
      const now = Date.now();
      for (const [key, value] of this.validationCache.entries()) {
        if (now - value.timestamp > this.CACHE_TTL) {
          this.validationCache.delete(key);
        }
      }
    }
    
    this.validationCache.set(userId, { user, timestamp: Date.now() });
  }
  
  // Optional: Method to clear cache for a specific user (useful when user updates their profile)
  clearUserCache(userId: string): void {
    this.validationCache.delete(userId);
  }
}