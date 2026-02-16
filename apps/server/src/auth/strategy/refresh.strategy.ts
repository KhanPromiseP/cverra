// import { Injectable } from "@nestjs/common";
// import { ConfigService } from "@nestjs/config";
// import { PassportStrategy } from "@nestjs/passport";
// import type { Request } from "express";
// import { ExtractJwt, Strategy, StrategyOptions } from "passport-jwt";

// import { Config } from "@/server/config/schema";

// import { AuthService } from "../auth.service";
// import { Payload } from "../utils/payload";

// @Injectable()
// export class RefreshStrategy extends PassportStrategy(Strategy, "refresh") {
//   constructor(
//     private readonly configService: ConfigService<Config>,
//     private readonly authService: AuthService,
//   ) {
//     const extractors = [(request: Request) => request.cookies.Refresh];

//     super({
//       secretOrKey: configService.getOrThrow<string>("REFRESH_TOKEN_SECRET"),
//       jwtFromRequest: ExtractJwt.fromExtractors(extractors),
//       passReqToCallback: true,
//       ignoreExpiration: false,
//     } as StrategyOptions);
//   }

//   async validate(request: Request, payload: Payload) {
//     const refreshToken = request.cookies.Refresh;

//     return this.authService.validateRefreshToken(payload, refreshToken);
//   }
// }


import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { Request } from "express";
import { ExtractJwt, Strategy, StrategyOptions } from "passport-jwt";

import { Config } from "@/server/config/schema";

import { AuthService } from "../auth.service";
import { Payload } from "../utils/payload";

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, "refresh") {
  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly authService: AuthService,
  ) {
    const extractors = [(request: Request) => {
      // Log what cookies are present
      console.log('🍪 [RefreshStrategy] All cookies:', request.cookies);
      console.log('🍪 [RefreshStrategy] Refresh cookie:', request.cookies?.Refresh);
      return request.cookies?.Refresh;
    }];

    super({
      secretOrKey: configService.getOrThrow<string>("REFRESH_TOKEN_SECRET"),
      jwtFromRequest: ExtractJwt.fromExtractors(extractors),
      passReqToCallback: true,
      ignoreExpiration: false,
    } as StrategyOptions);
  }

  async validate(request: Request, payload: Payload) {
    console.log('🔍 [RefreshStrategy] Validating payload:', payload);
    
    const refreshToken = request.cookies.Refresh;
    console.log('🔍 [RefreshStrategy] Refresh token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'missing');

    try {
      const result = await this.authService.validateRefreshToken(payload, refreshToken);
      console.log('✅ [RefreshStrategy] Validation successful:', result ? 'user found' : 'no user');
      return result;
    } catch (error) {
      console.error('❌ [RefreshStrategy] Validation failed:', error.message);
      throw error;
    }
  }
}