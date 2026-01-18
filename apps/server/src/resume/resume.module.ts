import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios"; 

import { AuthModule } from "@/server/auth/auth.module";
import { PrinterModule } from "@/server/printer/printer.module";
import { WalletService } from "@/server/wallet/wallet.service"; 

import { StorageModule } from "../storage/storage.module";
import { ResumeController } from "./resume.controller";
import { ResumeService } from "./resume.service";

import { AIResumeBuilderService } from "./ai-builder.service";
import { AIResumeBuilderController } from "./ai-builder.controller";
import { PrismaService } from 'nestjs-prisma';

@Module({
  imports: [
    HttpModule, 
    AuthModule, 
    PrinterModule, 
    StorageModule
  ],
  controllers: [
    ResumeController, 
    AIResumeBuilderController
  ],
  providers: [
    ResumeService, 
    AIResumeBuilderService,
    WalletService,
    PrismaService 
  ],
  exports: [
    ResumeService, 
    AIResumeBuilderService
  ],
})
export class ResumeModule {}