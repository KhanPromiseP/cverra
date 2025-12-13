// server/cover-letter/dto/create-cover-letter.dto.ts
import { IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

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