

import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

// Add these enums if not already defined
export enum TranslationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum TranslationMethod {
  COMPLETE = 'complete',
  SECTION_BY_SECTION = 'section-by-section',
  PRESERVE_STRUCTURE = 'preserve-structure'
}

export enum TranslationPreservation {
  ALL = 'all',
  FORMATTING_ONLY = 'formatting-only',
  STRUCTURE_ONLY = 'structure-only',
  NONE = 'none'
}


export class UserDataDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsArray()
  @IsOptional()
  skills: string[];

  @IsArray()
  @IsOptional()
  experience: string[];

  @IsArray()
  @IsOptional()
  achievements: string[];

  // Additional fields for different categories
  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  academicLevel?: string;

  @IsArray()
  @IsOptional()
  relevantCoursework?: string[];

  @IsString()
  @IsOptional()
  careerGoals?: string;

  @IsArray()
  @IsOptional()
  academicAchievements?: string[];

  @IsString()
  @IsOptional()
  researchInterests?: string;

  @IsString()
  @IsOptional()
  academicGoals?: string;

  @IsString()
  @IsOptional()
  futurePlans?: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  partnershipType?: string;

  @IsString()
  @IsOptional()
  collaborationDetails?: string;

  @IsString()
  @IsOptional()
  currentOffer?: string;

  @IsArray()
  @IsOptional()
  negotiationPoints?: string[];

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsArray()
  @IsOptional()
  keyPoints?: string[];

  @IsString()
  @IsOptional()
  situation?: string;

  @IsString()
  @IsOptional()
  impact?: string;

  @IsString()
  @IsOptional()
  resolution?: string;

  @IsString()
  @IsOptional()
  recipient?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  personalContext?: string;

  @IsString()
  @IsOptional()
  familyUpdates?: string;

  @IsString()
  @IsOptional()
  personalNews?: string;

  @IsString()
  @IsOptional()
  emotionalTone?: string;

  @IsString()
  @IsOptional()
  travelPurpose?: string;

  @IsString()
  @IsOptional()
  destination?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsString()
  @IsOptional()
  supportingDocs?: string;

  @IsString()
  @IsOptional()
  accommodation?: string;

  @IsString()
  @IsOptional()
  financialSupport?: string;

  @IsString()
  @IsOptional()
  returnPlans?: string;

  @IsString()
  @IsOptional()
  issue?: string;

  @IsString()
  @IsOptional()
  productService?: string;

  @IsString()
  @IsOptional()
  desiredResolution?: string;

  @IsString()
  @IsOptional()
  keyInformation?: string;
}

export class JobDataDto {
  @IsString()
  @IsOptional() // Changed to optional since not all categories need position/company
  position?: string;

  @IsString()
  @IsOptional() // Changed to optional since not all categories need position/company
  company?: string;

  @IsString()
  @IsOptional()
  hiringManager?: string;

  @IsString()
  @IsOptional()
  jobDescription?: string;

  // Additional job fields
  @IsString()
  @IsOptional()
  programName?: string;

  @IsString()
  @IsOptional()
  institution?: string;

  @IsString()
  @IsOptional()
  fieldOfStudy?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  partnershipType?: string;

  @IsString()
  @IsOptional()
  collaborationDetails?: string;

  @IsString()
  @IsOptional()
  currentOffer?: string;

  @IsArray()
  @IsOptional()
  negotiationPoints?: string[];

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsArray()
  @IsOptional()
  keyPoints?: string[];

  @IsString()
  @IsOptional()
  situation?: string;

  @IsString()
  @IsOptional()
  impact?: string;

  @IsString()
  @IsOptional()
  resolution?: string;

  @IsString()
  @IsOptional()
  recipient?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  @IsString()
  @IsOptional()
  personalContext?: string;

  @IsString()
  @IsOptional()
  travelPurpose?: string;

  @IsString()
  @IsOptional()
  destination?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsString()
  @IsOptional()
  supportingDocs?: string;

  @IsString()
  @IsOptional()
  accommodation?: string;

  @IsString()
  @IsOptional()
  financialSupport?: string;

  @IsString()
  @IsOptional()
  returnPlans?: string;

  @IsString()
  @IsOptional()
  issue?: string;

  @IsString()
  @IsOptional()
  productService?: string;

  @IsString()
  @IsOptional()
  desiredResolution?: string;

  @IsString()
  @IsOptional()
  keyInformation?: string;

  // 🔥 NEW BUSINESS PARTNERSHIP FIELDS - ADD THESE
  @IsString()
  @IsOptional()
  recipientCompany?: string;

  @IsString()
  @IsOptional()
  recipientPosition?: string;

  @IsString()
  @IsOptional()
  proposalPurpose?: string;

  @IsString()
  @IsOptional()
  proposedBenefits?: string;

  @IsString()
  @IsOptional()
  partnershipScope?: string;

  @IsString()
  @IsOptional()
  proposedTimeline?: string;

  @IsString()
  @IsOptional()
  rolesAndResponsibilities?: string;

  @IsString()
  @IsOptional()
  financialTerms?: string;

  @IsString()
  @IsOptional()
  confidentialityClause?: string;

  @IsString()
  @IsOptional()
  disputeResolution?: string;

  @IsString()
  @IsOptional()
  exitTerms?: string;
}

export class CreateCoverLetterDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  userData: UserDataDto;

  @IsOptional()
  jobData: JobDataDto;

  @IsString()
  @IsNotEmpty()
  style: string;

  @IsString()
  @IsOptional()
  layout?: string;

  @IsOptional()
  structure?: any;

  @IsString()
  @IsOptional()
  customInstructions?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  selectedResumeId?: string;

  // language override field
  @IsString()
  @IsOptional()
  language?: string;
}

export class UpdateCoverLetterDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsOptional()
  content?: any;

  @IsString()
  @IsOptional()
  style?: string;

  @IsString()
  @IsOptional()
  layout?: string;

  @IsOptional()
  structure?: any;
}

export class EnhanceBlockDto {
  @IsString()
  @IsNotEmpty()
  blockId: string;

  @IsString()
  @IsNotEmpty()
  instructions: string;

  @IsString()
  @IsOptional()
  selectedResumeId?: string;
}


export class RegenerateCompleteLetterDto {
  @IsString()
  @IsNotEmpty()
  instructions: string;

  @IsOptional()
  metadata?: {
    transactionId?: string;
  };
}


export class TranslationProgressDto {
  @IsString()
  translationId: string;

  @IsEnum(TranslationStatus)
  status: TranslationStatus;

  @IsOptional()
  @IsNumber()
  progress?: number; // 0-100

  @IsOptional()
  @IsNumber()
  translatedSections?: number;

  @IsOptional()
  @IsNumber()
  totalSections?: number;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  result?: any;
}

export class TranslateLetterDto {
  @IsString()
  @IsNotEmpty()
  targetLanguage: string;

  @IsOptional()
  @IsString()
  sourceLanguage?: string;

  @IsOptional()
  @IsEnum(TranslationMethod)
  method?: TranslationMethod = TranslationMethod.PRESERVE_STRUCTURE;

  @IsOptional()
  @IsEnum(TranslationPreservation)
  preservation?: TranslationPreservation = TranslationPreservation.ALL;

  @IsOptional()
  @IsBoolean()
  createNewVersion?: boolean = true;

  @IsOptional()
  @IsString()
  versionName?: string;

  @IsOptional()
  @IsBoolean()
  preserveNames?: boolean = true;

  @IsOptional()
  @IsBoolean()
  preserveDates?: boolean = true;

  @IsOptional()
  @IsBoolean()
  preserveNumbers?: boolean = true;

  @IsOptional()
  @IsBoolean()
  preserveUrls?: boolean = true;

  @IsOptional()
  @IsBoolean()
  preserveEmailAddresses?: boolean = true;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preserveTerms?: string[] = [];

  @IsOptional()
  metadata?: {
    transactionId?: string;
    customInstructions?: string;
    [key: string]: any;
  };
}