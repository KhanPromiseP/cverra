// server/resume/ai-builder.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Get,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiConsumes } from "@nestjs/swagger";
import { TwoFactorGuard } from "@/server/auth/guards/two-factor.guard";
import { User } from "@/server/user/decorators/user.decorator";
import { User as UserEntity, AIBuilderSource } from "@prisma/client";
import { AIResumeBuilderService, AIBuilderOptions } from "./ai-builder.service";
import { ResumeService } from "./resume.service";
import { WalletService } from "@/server/wallet/wallet.service";




@ApiTags("AI Resume Builder")
@Controller("resume/ai-builder")
@UseGuards(TwoFactorGuard)
export class AIResumeBuilderController {
  constructor(
    private readonly aiBuilderService: AIResumeBuilderService,
    private readonly resumeService: ResumeService,
    private readonly walletService: WalletService,
  ) {}

  @Post("build-from-text")
  @ApiOperation({ summary: "Build resume from text with AI" })
  async buildFromText(
    @User() user: UserEntity,
    @Body() body: {
      text: string;
      title?: string;
      options?: Partial<AIBuilderOptions>;
    },
  ) {
    let transactionId: string | undefined;
    
    try {
      if (!body.text || body.text.trim().length < 10) {
        throw new BadRequestException("Text must be at least 10 characters");
      }

      // Calculate cost first
      const cost = this.aiBuilderService.calculateCost(
        { source: AIBuilderSource.TEXT, ...body.options },
        body.text.length
      );

      // Check wallet balance
      const canAfford = await this.walletService.canAfford(user.id, cost);
      if (!canAfford) {
        throw new BadRequestException(`Insufficient coins. Need ${cost} coins.`);
      }

      
      // Deduct coins with rollback support
      const deductionResult = await this.walletService.deductCoinsWithRollback(
        cost,
        `AI Resume Builder - Text`,
        {
          userId: user.id,
          transactionType: 'ai_resume_builder',
          sourceType: 'text',
          textLength: body.text.length,
          action: 'ai_resume_builder_text',
        }
      );

      if (!deductionResult.success) {
        throw new BadRequestException('Failed to process payment');
      }

      transactionId = deductionResult.transactionId;

      // Build resume with AI
      const aiResult = await this.aiBuilderService.buildResumeFromSource(
        user.id,
        body.text,
        { source: AIBuilderSource.TEXT, ...body.options }
      );

      // Create resume with AI-generated data
      const resumeTitle = body.title || `${aiResult.resumeData.basics.name || 'My'} Resume - AI Built`;
      
      const resume = await this.resumeService.create(user.id, {
        title: resumeTitle,
        visibility: "private",
      });

      // Update with AI-generated data
      const updatedResume = await this.resumeService.update(user.id, resume.id, {
        data: aiResult.resumeData,
      });

      // Complete transaction
      if (transactionId) {
        await this.walletService.completeTransaction(transactionId, {
          result: 'success',
          resumeId: resume.id,
          resumeTitle: resume.title,
          confidence: aiResult.confidence,
          cost: aiResult.cost,
          userId: user.id,
        });
      }

      return {
        success: true,
        resume: updatedResume,
        aiResult: {
          confidence: aiResult.confidence,
          needsReview: aiResult.needsReview,
          cost: aiResult.cost,
          extractedSections: aiResult.extractedSections,
        },
        wallet: {
          transactionId: transactionId,
          coinsDeducted: aiResult.cost,
          newBalance: deductionResult.newBalance,
        },
      };

    } catch (error) {
      // Refund if error occurred after deduction
      if (transactionId) {
        await this.walletService.refundTransaction(user.id, transactionId, error.message);
      }
      throw error;
    }
  }

 @Post("build-from-file")
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: "Build resume from file with AI" })
  async buildFromFile(
    @User() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      source: string; // Change from AIBuilderSource to string
      title?: string;
      options?: Partial<AIBuilderOptions>;
    },
  ) {
    let transactionId: string | undefined;
    
    try {
      if (!file) {
        throw new BadRequestException("No file uploaded");
      }

      // Convert string source to enum
      const sourceEnum = this.mapSourceToEnum(body.source);

      // Calculate cost - use the enum value
      const fileText = file.buffer.toString('utf-8', 0, 1000);
      const cost = this.aiBuilderService.calculateCost(
        { source: sourceEnum, ...body.options },
        fileText.length
      );

      // Check wallet balance
      const canAfford = await this.walletService.canAfford(user.id, cost);
      if (!canAfford) {
        throw new BadRequestException(`Insufficient coins. Need ${cost} coins.`);
      }

      // Deduct coins with rollback support
      const deductionResult = await this.walletService.deductCoinsWithRollback(
        cost,
        `AI Resume Builder - ${body.source} file`,
        {
          userId: user.id,
          transactionType: 'ai_resume_builder',
          sourceType: body.source, // Keep as string for metadata
          fileName: file.originalname,
          fileSize: file.size,
          action: 'ai_resume_builder_file',
        }
      );

      if (!deductionResult.success) {
        throw new BadRequestException('Failed to process payment');
      }

      transactionId = deductionResult.transactionId;

      // Build resume with AI - use the enum value
      const aiResult = await this.aiBuilderService.buildResumeFromSource(
        user.id,
        file.buffer,
        { source: sourceEnum, ...body.options }
      );

      // Create resume
      const resumeTitle = body.title || `${aiResult.resumeData.basics.name || 'My'} Resume - AI Built`;
      
      const resume = await this.resumeService.create(user.id, {
        title: resumeTitle,
        visibility: "private",
      });

      // Update with AI data
      const updatedResume = await this.resumeService.update(user.id, resume.id, {
        data: aiResult.resumeData,
      });

      // Complete transaction
      if (transactionId) {
        await this.walletService.completeTransaction(transactionId, {
          result: 'success',
          resumeId: resume.id,
          resumeTitle: resume.title,
          confidence: aiResult.confidence,
          cost: aiResult.cost,
          userId: user.id,
        });
      }

      return {
        success: true,
        resume: updatedResume,
        aiResult: {
          confidence: aiResult.confidence,
          needsReview: aiResult.needsReview,
          cost: aiResult.cost,
          extractedSections: aiResult.extractedSections,
        },
        wallet: {
          transactionId: transactionId,
          coinsDeducted: aiResult.cost,
          newBalance: deductionResult.newBalance,
        },
      };

    } catch (error) {
      if (transactionId) {
        await this.walletService.refundTransaction(user.id, transactionId, error.message);
      }
      throw error;
    }
  }

  @Get("cost-estimate")
  @ApiOperation({ summary: "Estimate cost for AI resume building" })
  async estimateCost(
    @Query('source') source: string,
    @Query('textLength') textLength: string,
    @Query('enhance') enhance: string,
    @Query('suggestions') suggestions: string,
  ) {
    const sourceEnum = this.mapSourceToEnum(source);
    const options: AIBuilderOptions = {
      source: sourceEnum,
      enhanceWithAI: enhance === 'true',
      includeSuggestions: suggestions === 'true',
    };

    const cost = this.aiBuilderService.calculateCost(
      options,
      parseInt(textLength) || 0
    );

    return {
      source,
      textLength: parseInt(textLength) || 0,
      options,
      estimatedCost: cost,
      breakdown: {
        textExtraction: 10,
        aiBuilding: 20,
        pdfProcessing: source === 'PDF' ? 15 : 0,
        docProcessing: source === 'DOC' ? 10 : 0,
        enhancement: options.enhanceWithAI ? 25 : 0,
        suggestions: options.includeSuggestions ? 15 : 0,
        lengthAdjustment: cost - (10 + 20 + 
          (source === 'PDF' ? 15 : 0) + 
          (source === 'DOC' ? 10 : 0) +
          (options.enhanceWithAI ? 25 : 0) +
          (options.includeSuggestions ? 15 : 0)
        ),
      },
    };
  }

  @Get("history")
  @ApiOperation({ summary: "Get user's AI builder history" })
  async getHistory(@User() user: UserEntity, @Query('limit') limit: string) {
    const history = await this.aiBuilderService.getUserHistory(
      user.id,
      parseInt(limit) || 10
    );

    const stats = await this.aiBuilderService.getStatistics(user.id);

    return {
      history,
      statistics: stats,
    };
  }

  @Get("statistics")
  @ApiOperation({ summary: "Get AI builder statistics" })
  async getStatistics(@User() user: UserEntity) {
    return this.aiBuilderService.getStatistics(user.id);
  }

  private mapSourceToEnum(source: string): AIBuilderSource {
    switch (source.toUpperCase()) {
      case 'TEXT': return AIBuilderSource.TEXT;
      case 'PDF': return AIBuilderSource.PDF;
      case 'DOC': return AIBuilderSource.DOC;
      case 'LINKEDIN': return AIBuilderSource.LINKEDIN;
      default: return AIBuilderSource.TEXT;
    }
  }




  // Add this method to your AIResumeBuilderController

@Post("build")
@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
@ApiOperation({ summary: "Build resume with AI (unified endpoint)" })
async buildResume(
  @User() user: UserEntity,
  @Body() body: any,
  @UploadedFile() file?: Express.Multer.File,
) {
  let transactionId: string | undefined;
  
  try {
    console.log('Build endpoint called with body keys:', Object.keys(body));
    console.log('Has file?', !!file);
    console.log('Body content-type:', body.contentType);
    
    // Handle FormData vs JSON
    let source: string;
    let sourceData: any;
    let title: string;
    let enhanceWithAI = true;
    let includeSuggestions = true;
    let aiModel: string;

    if (file) {
      // FormData request (file upload)
      console.log('Processing FormData with file:', file.originalname);
      
      source = body.source || 'text';
      title = body.title || `AI Resume from ${file.originalname}`;
      enhanceWithAI = body.enhanceWithAI === 'true' || body.enhanceWithAI === true;
      includeSuggestions = body.includeSuggestions === 'true' || body.includeSuggestions === true;
      aiModel = body.aiModel || 'llama-3.3-70b-versatile';
      
      // Use file buffer as sourceData
      sourceData = file.buffer;
    } else {
      // JSON request (text input)
      console.log('Processing JSON request');
      
      // Parse body if it's a string (might come as raw JSON string)
      const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
      
      source = parsedBody.source || 'text';
      sourceData = parsedBody.sourceData;
      title = parsedBody.title || `AI Generated Resume`;
      enhanceWithAI = parsedBody.enhanceWithAI !== false;
      includeSuggestions = parsedBody.includeSuggestions !== false;
      aiModel = parsedBody.aiModel || 'llama-3.3-70b-versatile';
    }

    if (!sourceData && !file) {
      throw new BadRequestException("No source data provided");
    }

    // Convert source string to enum
    const sourceType = this.mapSourceToEnum(source);
    console.log('Source type:', sourceType, 'from source:', source);

    // Calculate cost
    const textLength = Buffer.isBuffer(sourceData) 
      ? sourceData.toString('utf-8', 0, 1000).length // Sample first 1000 chars
      : (typeof sourceData === 'string' ? sourceData.length : 0);
    
    const cost = this.aiBuilderService.calculateCost(
      { 
        source: sourceType, 
        enhanceWithAI,
        includeSuggestions,
        aiModel,
      },
      textLength
    );

    console.log('Calculated cost:', cost, 'for text length:', textLength);

    // Check wallet balance
    const canAfford = await this.walletService.canAfford(user.id, cost);
    if (!canAfford) {
      throw new BadRequestException(`Insufficient coins. Need ${cost} coins.`);
    }

    // Deduct coins
    const deductionResult = await this.walletService.deductCoinsWithRollback(
      cost,
      `AI Resume Builder - ${source}`,
      {
        userId: user.id,
        transactionType: 'ai_resume_builder',
        sourceType: source,
        textLength: textLength,
        fileName: file?.originalname,
        fileSize: file?.size,
        action: 'ai_resume_builder_build',
      }
    );

    if (!deductionResult.success) {
      throw new BadRequestException('Failed to process payment');
    }

    transactionId = deductionResult.transactionId;

    // Build resume with AI
    const aiResult = await this.aiBuilderService.buildResumeFromSource(
      user.id,
      sourceData,
      { 
        source: sourceType, 
        enhanceWithAI,
        includeSuggestions,
        aiModel,
        metadata: {
          title: title,
          ...(file ? {
            fileName: file.originalname,
            fileSize: file.size,
          } : {
            textLength: typeof sourceData === 'string' ? sourceData.length : 0,
          })
        }
      }
    );

    console.log('AI Result received, creating resume...');

    // Create resume title
    const resumeTitle = title || 
      (aiResult.resumeData?.basics?.name 
        ? `${aiResult.resumeData.basics.name}'s Resume` 
        : `AI Resume - ${new Date().toLocaleDateString()}`);

    // Normalize and create resume
    const normalizedData = this.resumeService.normalizeResumeDataForStorage(aiResult.resumeData);

    const resume = await this.resumeService.create(user.id, {
      title: resumeTitle,
      visibility: "private",
      data: normalizedData as any,
    });

    // Update with AI-generated data (optional - already normalized)
    const updatedResume = await this.resumeService.update(user.id, resume.id, {
      data: aiResult.resumeData,
    });

    // Complete transaction
    if (transactionId) {
      await this.walletService.completeTransaction(transactionId, {
        result: 'success',
        resumeId: resume.id,
        resumeTitle: resume.title,
        confidence: aiResult.confidence,
        cost: aiResult.cost,
        userId: user.id,
      });
    }

    console.log('Resume created successfully:', resume.id);

    return {
      success: true,
      message: "Resume generated successfully",
      resumeId: resume.id,
      redirectTo: `/builder/${resume.id}`,
      resume: resume,
      aiResult: {
        confidence: aiResult.confidence,
        needsReview: aiResult.needsReview,
        cost: aiResult.cost,
        extractedSections: aiResult.extractedSections,
      },
      wallet: {
        transactionId,
        coinsDeducted: aiResult.cost,
        newBalance: deductionResult.newBalance,
      },
    };

  } catch (error) {
    console.error('Error in build endpoint:', error);
    
    // Refund if error occurred after deduction
    if (transactionId) {
      await this.walletService.refundTransaction(user.id, transactionId, error.message);
    }
    
    throw new BadRequestException(
      error.message || 'AI processing failed. Please try again.'
    );
  }
}

  
}