
export interface CoverLetterTemplate {
  id: string;
  name: string;
  layout: string;
  style: any;
  premium?: boolean;
}

export interface CreateCoverLetterData {
  layout?: string;
  userData: {
    name: string;
    email: string;
    phone?: string;
    skills: string[];
    experience: string[];
    achievements: string[];
    // Add missing properties
    address?: string;
    academicLevel?: string;
    relevantCoursework?: string[];
    careerGoals?: string;
    academicAchievements?: string[];
    negotiationPoints?: string[];
    keyPoints?: string[];
  };
  jobData: {
    position: string;
    company: string;
    hiringManager?: string;
    jobDescription?: string;
    // Add missing properties
    programName?: string;
    institution?: string;
    fieldOfStudy?: string;
    department?: string;
    negotiationPoints?: string[];
    keyPoints?: string[];
  };
  customInstructions?: string;
}

export interface UpdateCoverLetterData {
  style?: any;
  layout?: string;
  content?: any;
}