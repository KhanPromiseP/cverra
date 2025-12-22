import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TemplateService } from './templates/template.service';
import { CoverLetterService } from './cover-letter.service';
import { CreateCoverLetterDto } from './dto/create-cover-letter.dto';
import { UpdateCoverLetterDto } from './dto/update-cover-letter.dto';
import { EnhanceBlockDto } from './dto/enhance-block.dto';
import { CoverLetterStyle } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@Controller('cover-letter')
@UseGuards(AuthGuard('jwt'))
export class CoverLetterController {
  private readonly logger = new Logger(CoverLetterController.name);

  
  constructor(
    private readonly coverLetterService: CoverLetterService,
    private readonly templateService: TemplateService // Inject template service
  ) {}

  @Post()
async create(@Request() req: AuthenticatedRequest, @Body() createCoverLetterDto: CreateCoverLetterDto) {
  try {
    this.logger.log(`Creating cover letter for user ${req.user.id}`);
    
    // Log the incoming data for debugging
    this.logger.log('Incoming cover letter data:', JSON.stringify(createCoverLetterDto, null, 2));
    
    // Validate required fields
    if (!createCoverLetterDto.title?.trim()) {
      throw new BadRequestException('Title is required');
    }
    if (!createCoverLetterDto.userData?.name) {
      throw new BadRequestException('User name is required');
    }
    

    const result = await this.coverLetterService.generateCoverLetter(req.user.id, createCoverLetterDto);
    this.logger.log(`Successfully created cover letter ${result.coverLetter.id} for user ${req.user.id}`);
    
    return result;
  } catch (error) {
    this.logger.error(`Failed to create cover letter for user ${req.user.id}:`, error.stack);
    
    // Log the actual error details
    this.logger.error('Error details:', error.response?.data || error.message);
    
    if (error instanceof HttpException) {
      throw error;
    }
    
    if (error.message?.includes('GEMINI_API_KEY')) {
      throw new InternalServerErrorException('AI service configuration error');
    }
    
    throw new InternalServerErrorException(
      error.message || 'Failed to create cover letter. Please try again.'
    );
  }
}



  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    try {
      this.logger.log(`Fetching cover letters for user ${req.user.id}`);
      const coverLetters = await this.coverLetterService.findAll(req.user.id);
      this.logger.log(`Found ${coverLetters.length} cover letters for user ${req.user.id}`);
      
      return coverLetters;
    } catch (error) {
      this.logger.error(`Failed to fetch cover letters for user ${req.user.id}:`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to fetch cover letters. Please try again.');
    }
  }

  @Get(':id')
  async findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    try {
      this.logger.log(`Fetching cover letter ${id} for user ${req.user.id}`);
      
      if (!id) {
        throw new BadRequestException('Cover letter ID is required');
      }

      const coverLetter = await this.coverLetterService.findOne(req.user.id, id);
      this.logger.log(`Successfully fetched cover letter ${id} for user ${req.user.id}`);
      
      return coverLetter;
    } catch (error) {
      this.logger.error(`Failed to fetch cover letter ${id} for user ${req.user.id}:`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to fetch cover letter. Please try again.');
    }
  }

  @Put(':id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateCoverLetterDto: UpdateCoverLetterDto
  ) {
    try {
      this.logger.log(`Updating cover letter ${id} for user ${req.user.id}`);
      
      if (!id) {
        throw new BadRequestException('Cover letter ID is required');
      }

      // Validate that at least one field is being updated
      if (Object.keys(updateCoverLetterDto).length === 0) {
        throw new BadRequestException('No update data provided');
      }

      const updatedCoverLetter = await this.coverLetterService.update(req.user.id, id, updateCoverLetterDto);
      this.logger.log(`Successfully updated cover letter ${id} for user ${req.user.id}`);
      
      return updatedCoverLetter;
    } catch (error) {
      this.logger.error(`Failed to update cover letter ${id} for user ${req.user.id}:`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to update cover letter. Please try again.');
    }
  }

  @Get('templates/all')
  async getTemplates(@Request() req: AuthenticatedRequest) {
    const templates = this.templateService.getAllTemplates();
    
    // I can add user-specific logic here (e.g., filter premium templates based on user subscription).  but for now, return all. cause I will be using coin billing to manage premium access. and my subscription as well will just be to subscribe for more coins per month, so users will have access to all templates by default. but the template will have a premium flag to identify premium templates. and their access will be managed on the frontend based on user's coin balance.
    return templates;
  }

  @Get('templates/categories')
  async getTemplateCategories(@Request() req: AuthenticatedRequest) {
    const categories = this.templateService.getCategories();
    return categories;
  }

  @Get('templates/category/:category')
  async getTemplatesByCategory(
    @Request() req: AuthenticatedRequest,
    @Param('category') category: string
  ) {
    const templates = this.templateService.getTemplatesByCategory(category as any);
    return templates;
  }

  @Get('templates/search/:query')
async searchTemplates(
  @Request() req: AuthenticatedRequest,
  @Param('query') query: string
) {
  return this.coverLetterService.searchTemplates(query);
}

@Get('templates/featured')
async getFeaturedTemplates(@Request() req: AuthenticatedRequest) {
  return this.coverLetterService.getFeaturedTemplates();
}

@Get('templates/popular')
async getPopularTemplates(@Request() req: AuthenticatedRequest) {
  return this.coverLetterService.getPopularTemplates();
}

@Get('templates/stats')
async getTemplateStats(@Request() req: AuthenticatedRequest) {
  return this.coverLetterService.getTemplateStats();
}

  @Get('templates/:id')
  async getTemplateById(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    const template = this.templateService.getTemplateById(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  @Post(':id/apply-template')
  async applyTemplate(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { templateId: string }
  ) {
    return this.coverLetterService.applyTemplate(req.user.id, id, body.templateId);
  }

  @Put(':id/blocks/:blockId/regenerate')
async regenerateBlock(
  @Param('id') id: string,
  @Param('blockId') blockId: string,
  @Request() req: AuthenticatedRequest,
  @Body() body?: { metadata?: { transactionId?: string } }
) {
  try {
    this.logger.log(`Regenerating block ${blockId} in cover letter ${id} for user ${req.user.id}`);
    
    if (!id) {
      throw new BadRequestException('Cover letter ID is required');
    }
    if (!blockId) {
      throw new BadRequestException('Block ID is required');
    }

    // Log transaction ID if provided
    if (body?.metadata?.transactionId) {
      this.logger.log(`Transaction ID: ${body.metadata.transactionId}`);
    }

    // Pass transaction ID to service
    const result = await this.coverLetterService.regenerateBlock(
      req.user.id, 
      id, 
      blockId,
      body?.metadata?.transactionId
    );
    
    this.logger.log(`Successfully regenerated block ${blockId} in cover letter ${id} for user ${req.user.id}`);
    
    return result;
  } catch (error) {
    this.logger.error(`Failed to regenerate block ${blockId} in cover letter ${id} for user ${req.user.id}:`, error.stack);
    
    // Log transaction ID in error if available
    if (body?.metadata?.transactionId) {
      this.logger.error(`Failed transaction ID: ${body.metadata.transactionId}`);
    }
    
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    
    if (error instanceof HttpException) {
      throw error;
    }
    
    throw new InternalServerErrorException('Failed to regenerate block. Please try again.');
  }
}
  @Delete(':id')
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    try {
      this.logger.log(`Deleting cover letter ${id} for user ${req.user.id}`);
      
      if (!id) {
        throw new BadRequestException('Cover letter ID is required');
      }

      const result = await this.coverLetterService.remove(req.user.id, id);
      this.logger.log(`Successfully deleted cover letter ${id} for user ${req.user.id}`);
      
      return {
        success: true,
        message: 'Cover letter deleted successfully',
        data: result
      };
    } catch (error) {
      this.logger.error(`Failed to delete cover letter ${id} for user ${req.user.id}:`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to delete cover letter. Please try again.');
    }
  }

@Post(':id/duplicate')
async duplicateCoverLetter(
  @Request() req: AuthenticatedRequest,
  @Param('id') id: string,
  @Body() body?: { newName?: string } // Add this parameter
) {
  try {
    this.logger.log(`Duplicating cover letter ${id} for user ${req.user.id}`);
    
    if (!id) {
      throw new BadRequestException('Cover letter ID is required');
    }

    // Pass the newName to the service if provided
    const duplicate = await this.coverLetterService.duplicateQuick(
      req.user.id, 
      id,
      body?.newName // Pass the custom name
    );
    
    this.logger.log(`Successfully duplicated cover letter ${id} to ${duplicate.id} for user ${req.user.id}`);
    
    return {
      success: true,
      message: 'Cover letter duplicated successfully',
      data: duplicate
    };
    
  } catch (error) {
    this.logger.error(`Failed to duplicate cover letter ${id} for user ${req.user.id}:`, error.stack);
    
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    
    if (error instanceof HttpException) {
      throw error;
    }
    
    throw new InternalServerErrorException(
      error.message || 'Failed to duplicate cover letter. Please try again.'
    );
  }
}
  

 @Post(':id/enhance')
async enhanceBlock(
  @Request() req: AuthenticatedRequest,
  @Param('id') id: string,
  @Body() enhanceBlockDto: EnhanceBlockDto
) {
  try {
    this.logger.log(`Enhancing block in cover letter ${id} for user ${req.user.id}`);
    
    if (!id) {
      throw new BadRequestException('Cover letter ID is required');
    }
    if (!enhanceBlockDto.blockId) {
      throw new BadRequestException('Block ID is required');
    }
    if (!enhanceBlockDto.instructions?.trim()) {
      throw new BadRequestException('Enhancement instructions are required');
    }

    // Log transaction ID if provided
    if (enhanceBlockDto.metadata?.transactionId) {
      this.logger.log(`Transaction ID: ${enhanceBlockDto.metadata.transactionId}`);
    }

    const result = await this.coverLetterService.enhanceBlock(
      req.user.id, 
      id, 
      enhanceBlockDto
    );
    
    this.logger.log(`Successfully enhanced block ${enhanceBlockDto.blockId} in cover letter ${id} for user ${req.user.id}`);
    
    return result;
  } catch (error) {
    this.logger.error(`Failed to enhance block in cover letter ${id} for user ${req.user.id}:`, error.stack);
    
    // Log transaction ID in error if available
    if (enhanceBlockDto?.metadata?.transactionId) {
      this.logger.error(`Failed transaction ID: ${enhanceBlockDto.metadata.transactionId}`);
    }
    
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    
    if (error instanceof HttpException) {
      throw error;
    }
    
    if (error.message?.includes('GEMINI_API_KEY')) {
      throw new InternalServerErrorException('AI service configuration error');
    }
    
    throw new InternalServerErrorException(
      error.message || 'Failed to enhance block. Please try again.'
    );
  }
}
}