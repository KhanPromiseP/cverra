import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser"; // Changed
import * as session from "express-session"; // Changed
import helmet from "helmet";
import { patchNestJsSwagger } from "nestjs-zod";
import { join } from 'path';
import * as bodyParser from 'body-parser';

import { AppModule } from "./app.module";
import type { Config } from "./config/schema";

patchNestJsSwagger();

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: process.env.NODE_ENV === "development" ? ["debug", "error", "warn", "log", "verbose"] : ["error", "warn", "log"],
    });

    const configService = app.get(ConfigService<Config>);

    const accessTokenSecret = configService.getOrThrow("ACCESS_TOKEN_SECRET");
    const publicUrl = configService.getOrThrow("PUBLIC_URL");
    const isHTTPS = publicUrl.startsWith("https://") ?? false;

    // Cookie Parser
    app.use(cookieParser.default()); // Use .default() for ES modules

    // Session
    app.use(
      session.default({ // Use .default() for ES modules
        resave: false,
        saveUninitialized: false,
        secret: accessTokenSecret,
        cookie: { 
          httpOnly: true, 
          secure: isHTTPS,
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        },
      }),
    );

    // Body Parser
    app.use(bodyParser.json({
      limit: '10mb',
    }));

    app.use(bodyParser.urlencoded({
      extended: true,
      limit: '10mb',
    }));

    // Serve static files
    const uploadsPath = join(process.cwd(), 'uploads');
    console.log('📁 Serving static files from:', uploadsPath);
    
    app.useStaticAssets(uploadsPath, {
      prefix: '/uploads/',
    });

    // CORS - More permissive for development
    app.enableCors({
      origin: function(origin, callback) {
        // Allow all origins in development
        if (process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          // Production CORS logic
          const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:5173',
            publicUrl,
          ];
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'Range'],
      exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Range'],
    });

    // Global Prefix
    app.setGlobalPrefix('api');

    // Enable Shutdown Hooks
    app.enableShutdownHooks();

    // Swagger (OpenAPI Docs)
    const config = new DocumentBuilder()
      .setTitle("Cverra")
      .setDescription("Cverra Resume Builder API")
      .addCookieAuth("Authentication", { type: "http", in: "cookie", scheme: "Bearer" })
      .setVersion("4.0.0")
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);

    // Port
    const port = configService.get<number>("PORT") || 3000;

    await app.listen(port, '0.0.0.0');

    Logger.log(`🚀 Server is up and running on port ${port}`, "Bootstrap");
    Logger.log(`📱 API available at: http://localhost:${port}/api`, "Bootstrap");
    Logger.log(`📚 Swagger docs at: http://localhost:${port}/docs`, "Bootstrap");
    Logger.log(`🔗 CORS enabled for all origins in development`, "Bootstrap");

  } catch (error) {
    Logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();



// import { Logger } from "@nestjs/common";
// import { ConfigService } from "@nestjs/config";
// import { NestFactory } from "@nestjs/core";
// import type { NestExpressApplication } from "@nestjs/platform-express";
// import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
// import cookieParser from "cookie-parser";
// import session from "express-session";
// import helmet from "helmet";
// import { patchNestJsSwagger } from "nestjs-zod";
// import { join } from 'path';
// import { AppModule } from "./app.module";
// import type { Config } from "./config/schema";
// import * as bodyParser from 'body-parser';
// import { Request, Response, NextFunction } from 'express';

// patchNestJsSwagger();

// async function bootstrap() {
//   const app = await NestFactory.create<NestExpressApplication>(AppModule, {
//     logger: process.env.NODE_ENV === "development" ? ["debug"] : ["error", "warn", "log"],
//   });

//   const configService = app.get(ConfigService<Config>);

//   const accessTokenSecret = configService.getOrThrow("ACCESS_TOKEN_SECRET");
//   const publicUrl = configService.getOrThrow("PUBLIC_URL");
//   const isHTTPS = publicUrl.startsWith("https://") ?? false;

//   // Cookie Parser
//   app.use(cookieParser());

//   // Session
//   app.use(
//     session({
//       resave: false,
//       saveUninitialized: false,
//       secret: accessTokenSecret,
//       cookie: { httpOnly: true, secure: isHTTPS },
//     }),
//   );

//   app.use(bodyParser.json({
//     verify: (req: any, res: any, buf: Buffer) => {
//       req.rawBody = buf.toString();
//     },
//     limit: '1mb',
//   }));

//   app.use(bodyParser.urlencoded({
//     extended: true,
//     verify: (req: any, res: any, buf: Buffer) => {
//       req.rawBody = buf.toString();
//     },
//     limit: '1mb',
//   }));

//   // 🔥 CRITICAL FIX: Serve files from the correct directory
//   // Get the absolute path to the articles directory where uploads are stored
//   const articlesUploadsPath = join(__dirname, 'articles');
  
//   console.log('📁 Current directory:', __dirname);
//   console.log('📁 Articles uploads path:', articlesUploadsPath);
//   console.log('📁 Articles path exists?', require('fs').existsSync(articlesUploadsPath));
  
//   // List files to verify
//   try {
//     const fs = require('fs');
//     if (fs.existsSync(articlesUploadsPath)) {
//       const files = fs.readdirSync(articlesUploadsPath);
//       console.log('📁 Files in articles directory:', files);
//     } else {
//       console.error('❌ Articles directory does not exist!');
      
//       // Try alternative paths
//       const alternativePaths = [
//         join(__dirname, '..', 'articles'), // One level up
//         join(__dirname, '..', '..', 'articles'), // Two levels up
//         join(process.cwd(), 'apps', 'server', 'src', 'articles'), // From project root
//       ];
      
//       for (const path of alternativePaths) {
//         console.log(`🔍 Checking alternative: ${path}`);
//         if (fs.existsSync(path)) {
//           console.log(`✅ Found at: ${path}`);
//           const files = fs.readdirSync(path);
//           console.log(`📁 Files: ${files}`);
//         }
//       }
//     }
//   } catch (error) {
//     console.error('❌ Error checking directory:', error);
//   }

//   // Serve static files from the articles directory
//   app.use('/articles', (req: Request, res: Response, next: NextFunction) => {
//     // Add CORS headers for static files
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET');
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
//     next();
//   }, require('express').static(articlesUploadsPath, {
//     setHeaders: (res: Response, path: string) => {
//       // Add cache control for images
//       if (path.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
//         res.setHeader('Cache-Control', 'public, max-age=86400');
//       }
//       // Remove problematic security headers
//       res.removeHeader('Cross-Origin-Embedder-Policy');
//       res.removeHeader('Cross-Origin-Opener-Policy');
//       res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
//     }
//   }));

//   // Also serve from uploads if needed (for backward compatibility)
//   const uploadsPath = join(__dirname, '..', '..', 'uploads');
//   app.use('/uploads', require('express').static(uploadsPath, {
//     setHeaders: (res: Response) => {
//       res.setHeader('Access-Control-Allow-Origin', '*');
//       res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
//     }
//   }));

//   // CORS Configuration
//   app.enableCors({
//     origin: [
//       'http://localhost:5173',
//       'http://localhost:3000',
//       'http://localhost:3001',
//       'http://127.0.0.1:5173',
//       'http://127.0.0.1:3000',
//     ],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept'],
//     exposedHeaders: ['Content-Length', 'Content-Type'],
//   });

//   // Disable Helmet for development to avoid security header issues
//   if (!isHTTPS) {
//     // Development - minimal security
//     app.use(helmet({
//       contentSecurityPolicy: false,
//       crossOriginEmbedderPolicy: false,
//       crossOriginOpenerPolicy: false,
//       crossOriginResourcePolicy: false,
//     }));
//   }

//   // Global Prefix
//   const globalPrefix = "api";
//   app.setGlobalPrefix(globalPrefix);

//   // Enable Shutdown Hooks
//   app.enableShutdownHooks();

//   // Swagger (OpenAPI Docs)
//   const config = new DocumentBuilder()
//     .setTitle("Cverra")
//     .setDescription(
//       "Cverra is a powerful resume builder that's built to make the mundane tasks of creating, updating and sharing your resume as easy as 1, 2, 3.",
//     )
//     .addCookieAuth("Authentication", { type: "http", in: "cookie", scheme: "Bearer" })
//     .setVersion("4.0.0")
//     .build();
//   const document = SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup("docs", app, document);

//   // Port
//   const port = configService.get<number>("PORT") ?? 3000;

//   await app.listen(port, '0.0.0.0');

//   Logger.log(`🚀 Server is up and running on port ${port}`, "Bootstrap");
//   Logger.log(`📱 Frontend: http://localhost:5173`, "Bootstrap");
//   Logger.log(`🔗 API: http://localhost:${port}/api`, "Bootstrap");
//   Logger.log(`🖼️ Article images: http://localhost:${port}/articles/`, "Bootstrap");
  
//   // Test URLs
//   console.log(`✅ Test image URL 1: http://localhost:${port}/articles/1765089375431-906329202.jpeg`);
//   console.log(`✅ Test image URL 2: http://localhost:${port}/articles/1765089444052-778610615.png`);
// }

// void bootstrap();