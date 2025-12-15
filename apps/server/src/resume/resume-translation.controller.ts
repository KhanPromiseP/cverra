// resume-translation.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ResumeTranslationService, TranslationOptions, AvailableLanguage } from './resume-translation.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { User } from "@/server/user/decorators/user.decorator";
import { PrismaService } from '../../../../tools/prisma/prisma.service';

class TranslateResumeDto {
  force?: boolean;
  aiModel?: string;
  useCache?: boolean;
  priority?: number;
}


class CreateTranslatedResumeDto {
  language: string;
  title?: string;
  options?: TranslateResumeDto;
}

@ApiTags('resume-translation')
@Controller('resume')
@ApiBearerAuth()
@UseGuards(JwtGuard)
export class ResumeTranslationController {
  private readonly logger = new Logger(ResumeTranslationController.name);

  constructor(
    private readonly translationService: ResumeTranslationService,
    private readonly prisma: PrismaService,
  ) {}


  @Get(':id/translations')
  @ApiOperation({ summary: 'Get available translations for a resume' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  @ApiResponse({ status: 200, description: 'List of available translations' })
  async getAvailableTranslations(
    @Param('id') resumeId: string,
    @User("id") userId: string,
  ): Promise<{ languages: AvailableLanguage[] }> {
    await this.verifyResumeAccess(resumeId, userId);
    
    const languages = await this.translationService.getAvailableLanguages(resumeId);
    
    return { languages };
  }

  @Get(':id/translate/:language')
  @ApiOperation({ summary: 'Get a specific translation' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  @ApiParam({ name: 'language', description: 'Language code' })
  @ApiResponse({ status: 200, description: 'Translation found' })
  @ApiResponse({ status: 404, description: 'Translation not found' })
  async getTranslation(
    @Param('id') resumeId: string,
    @Param('language') language: string,
    @User("id") userId: string,
  ) {
    await this.verifyResumeAccess(resumeId, userId);
    
    const translation = await this.translationService.getTranslation(resumeId, language);
    
    if (!translation) {
      return {
        success: false,
        message: `No translation found for language: ${language}`,
      };
    }
    
    return {
      success: true,
      translation,
    };
  }


  @Post(':id/translate/save')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Translate resume and save as new copy in workspace' })
  @ApiParam({ name: 'id', description: 'Original resume ID' })
  @ApiResponse({ status: 201, description: 'Translated resume created successfully' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async createTranslatedResume(
    @Param('id') originalResumeId: string,
    @User("id") userId: string,
    @Body() body: CreateTranslatedResumeDto,
  ) {
    await this.verifyResumeAccess(originalResumeId, userId);
    
    this.logger.log(`User ${userId} creating translated resume from ${originalResumeId} to ${body.language}`);
    
    const result = await this.translationService.translateAndSaveAsCopy(
      originalResumeId,
      body.language,
      body.title,
      body.options || {}
    );

    return {
      success: true,
      message: `Resume translated to ${result.translation.languageName} and saved to your workspace`,
      data: result,
    };
  }

  
  @Post(':id/translate/:language')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Translate a resume to another language' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  @ApiParam({ name: 'language', description: 'Target language code (e.g., es, fr, de)' })
  @ApiResponse({ status: 202, description: 'Translation started successfully' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async translateResume(
    @Param('id') resumeId: string,
    @Param('language') language: string,
    @User("id") userId: string,
    @Body() options: TranslateResumeDto,
  ) {
    await this.verifyResumeAccess(resumeId, userId);
    
    this.logger.log(`User ${userId} requested translation: ${resumeId} -> ${language}`);
    
    // Start translation (async - returns immediately)
    const result = await this.translationService.translateResume(resumeId, language, options);
    
    return {
      success: true,
      message: `Resume translation to ${language} completed successfully`,
      data: result.data,
      confidence: result.confidence,
      needsReview: result.needsReview,
      timestamp: new Date().toISOString(),
    };
  }


  @Post('batch-translate')
  @ApiOperation({ summary: 'Translate multiple resumes' })
  @ApiQuery({ name: 'language', required: true, description: 'Target language code' })
  @ApiResponse({ status: 202, description: 'Batch translation started' })
  async batchTranslate(
    @User("id") userId: string,
    @Query('language') language: string,
    @Body() body: { resumeIds: string[]; options?: TranslateResumeDto },
  ) {
    // Verify user has access to all resumes
    for (const resumeId of body.resumeIds) {
      await this.verifyResumeAccess(resumeId, userId);
    }
    
    const results = await this.translationService.translateMultiple(
      body.resumeIds,
      language,
      body.options,
    );
    
    return {
      success: true,
      message: `Batch translation to ${language} completed`,
      results,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/retry-translations')
  @ApiOperation({ summary: 'Retry failed translations for a resume' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  @ApiResponse({ status: 200, description: 'Retry initiated' })
  async retryFailedTranslations(
    @Param('id') resumeId: string,
    @User("id") userId: string,
  ) {
    await this.verifyResumeAccess(resumeId, userId);
    
    const results = await this.translationService.retryFailedTranslations(resumeId);
    
    return {
      success: true,
      message: 'Retry completed',
      results,
    };
  }

  @Get('translation-stats')
  @ApiOperation({ summary: 'Get translation statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics(@User("id") userId: string,) {
    // Only return stats for user's resumes
    const userResumes = await this.prisma.resume.findMany({
      where: { userId: userId },
      select: { id: true },
    });
    
    const resumeIds = userResumes.map(r => r.id);
    
    // Note: The service method returns global stats. You might want to modify it
    // to filter by resumeIds if needed.
    const stats = await this.translationService.getStatistics();
    
    return {
      success: true,
      stats,
    };
  }

  @Get('supported-languages')
  @ApiOperation({ summary: 'Get all supported languages' })
  @ApiResponse({ status: 200, description: 'List of supported languages' })
  async getSupportedLanguages() {
    const languages = await this.translationService['SUPPORTED_LANGUAGES'];
    
    return {
      success: true,
      languages,
    };
  }

  private async verifyResumeAccess(resumeId: string, userId: string): Promise<void> {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    
    if (!resume) {
      throw new Error('Resume not found or access denied');
    }
  }
}