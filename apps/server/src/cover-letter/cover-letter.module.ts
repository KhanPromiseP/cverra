import { HttpModule } from '@nestjs/axios';
import { Module, Logger } from '@nestjs/common';
import { CoverLetterController } from './cover-letter.controller';
import { CoverLetterService } from './cover-letter.service';
import { TemplateService } from './templates/template.service';

@Module({
  imports: [HttpModule],
  controllers: [CoverLetterController],
  providers: [CoverLetterService, TemplateService],
  exports: [CoverLetterService, TemplateService],
})
export class CoverLetterModule {
  private readonly logger = new Logger(CoverLetterModule.name);

  constructor() {
    this.logger.log('CoverLetterModule initialized successfully');
  }
}