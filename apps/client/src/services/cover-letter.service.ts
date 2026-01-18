
import { apiClient } from './api-client';

export interface CoverLetterTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  style: string;
  layout: string;
  structure: any;
  isFeatured?: boolean;
  isPopular?: boolean;
  usageCount?: number;
  tags?: string[];
}

export interface CoverLetter {
  id: string;
  title: string;
  slug: string;
  content: any;
  style: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  layout?: string; 
  category: string;
}

export interface CreateCoverLetterData {
  title: string;
  style: string;
  layout?: string;
  structure?: any;
  content?: any;
  userData: {
    name: string;
    email: string;
    phone?: string;
    skills: string[];
    experience: string[];
    achievements: string[];
    professionalSummary?: string;
    // Additional fields for different categories
    address?: string;
    academicLevel?: string;
    relevantCoursework?: string[];
    careerGoals?: string;
    academicAchievements?: string[];
    researchInterests?: string;
    academicGoals?: string;
    futurePlans?: string;
    relationship?: string;
    company?: string;
    partnershipType?: string;
    collaborationDetails?: string;
    currentOffer?: string;
    negotiationPoints?: string[];
    purpose?: string;
    keyPoints?: string[];
    situation?: string;
    impact?: string;
    resolution?: string;
    recipient?: string;
    reason?: string;
    personalContext?: string;
    familyUpdates?: string;
    personalNews?: string;
    emotionalTone?: string;
    travelPurpose?: string;
    destination?: string;
    duration?: string;
    supportingDocs?: string;
    accommodation?: string;
    financialSupport?: string;
    returnPlans?: string;
    issue?: string;
    productService?: string;
    desiredResolution?: string;
    keyInformation?: string;
    selectedResumeId?: string;
  };
  jobData: {
    position: string;
    company: string;
    hiringManager?: string;
    jobDescription?: string;
    programName?: string;
    institution?: string;
    fieldOfStudy?: string;
    department?: string;
    // Additional job fields
    partnershipType?: string;
    collaborationDetails?: string;
    currentOffer?: string;
    negotiationPoints?: string[];
    purpose?: string;
    keyPoints?: string[];
    situation?: string;
    impact?: string;
    resolution?: string;
    recipient?: string;
    reason?: string;
    relationship?: string;
    personalContext?: string;
    travelPurpose?: string;
    destination?: string;
    duration?: string;
    supportingDocs?: string;
    accommodation?: string;
    financialSupport?: string;
    returnPlans?: string;
    issue?: string;
    productService?: string;
    desiredResolution?: string;
    keyInformation?: string;
  };
  customInstructions?: string;
  category?: string; 
}



export interface UpdateCoverLetterData {
  title?: string;
  content?: any;
  style?: string;
  layout?: string;
  structure?: any;
  userData?: any;
  jobData?: any;
  updatedAt?: string;
}

export interface RegenerateCompleteLetterData {
  instructions: string;
  metadata?: {
    transactionId?: string;
  };
}

export interface TranslateLetterData {
  targetLanguage: string;
  metadata?: {
    transactionId?: string;
  };
}

export const coverLetterService = {
  async create(data: CreateCoverLetterData): Promise<{ coverLetter: CoverLetter; blocks: any[] }> {
    const response = await apiClient.post('/cover-letter', data);
    return response.data;
  },

  async findAll(): Promise<CoverLetter[]> {
    const response = await apiClient.get('/cover-letter');
    return response.data;
  },

  async findOne(id: string): Promise<CoverLetter> {
  console.log(`🔍 findOne called for: ${id}`);
  const response = await apiClient.get(`/cover-letter/${id}`);
  const letter = response.data;
  
  console.log(`📥 Raw API response for ${id}:`, {
    title: letter.title,
    language: letter.language,
    contentType: typeof letter.content,
    hasContent: !!letter.content,
    contentIsObject: letter.content && typeof letter.content === 'object',
    contentKeys: letter.content ? Object.keys(letter.content) : []
  });
  
  // CRITICAL FIX: Handle the content parsing
  if (letter.content) {
    // Method 1: If content has Prisma's set property
    if (letter.content.set) {
      console.log(`🔄 ${id}: Extracting from Prisma set property`);
      letter.content = letter.content.set;
    }
    
    // Method 2: If content is a string (JSON string)
    if (typeof letter.content === 'string') {
      try {
        console.log(`🔄 ${id}: Parsing JSON string`);
        letter.content = JSON.parse(letter.content);
      } catch (e) {
        console.error(`❌ ${id}: Failed to parse JSON string:`, e);
      }
    }
    
    // Method 3: If content is empty object but should have data
    if (letter.content && typeof letter.content === 'object' && Object.keys(letter.content).length === 0) {
      console.warn(`⚠️ ${id}: Content is empty object, might be Prisma issue`);
      // Try to reload with raw endpoint
      try {
        const rawResponse = await apiClient.get(`/cover-letter/${id}/raw`);
        if (rawResponse.data?.content) {
          console.log(`✅ ${id}: Got content from raw endpoint`);
          letter.content = rawResponse.data.content;
        }
      } catch (e) {
        console.error(`❌ ${id}: Raw endpoint failed:`, e);
      }
    }
    
    // Method 4: Ensure blocks array exists
    if (letter.content && typeof letter.content === 'object') {
      if (!letter.content.blocks || !Array.isArray(letter.content.blocks)) {
        console.warn(`⚠️ ${id}: No blocks array found in content`);
        
        // Try to find blocks in different locations
        const possibleBlocks = 
          letter.content.data?.blocks || 
          letter.content.content?.blocks ||
          letter.content.document?.blocks ||
          [];
        
        if (Array.isArray(possibleBlocks) && possibleBlocks.length > 0) {
          console.log(`✅ ${id}: Found blocks in alternative location`);
          letter.content.blocks = possibleBlocks;
        } else {
          console.log(`📝 ${id}: Creating empty blocks array`);
          letter.content.blocks = [];
        }
      }
      
      console.log(`✅ ${id} Final content check:`, {
        blocksCount: letter.content.blocks?.length || 0,
        blocksIsArray: Array.isArray(letter.content.blocks),
        hasLayout: !!letter.content.layout,
        hasStructure: !!letter.content.structure
      });
    }
  } else {
    console.warn(`⚠️ ${id}: No content property at all`);
    letter.content = {
      blocks: [],
      layout: {},
      structure: {},
      lastSaved: new Date().toISOString()
    };
  }
  
  return letter;
},

  // async update(id: string, data: UpdateCoverLetterData): Promise<CoverLetter> {
  //   const response = await apiClient.put(`/cover-letter/${id}`, data);
  //   return response.data;
  // },

  update: async (id: string, data: UpdateCoverLetterData): Promise<CoverLetter> => {
    console.log('🚀 Sending update request for:', { id, data });
    
    const response = await apiClient.put(`/cover-letter/${id}`, data);
    
    console.log('📥 Update response:', response.data);
    
    // Return the cover letter data
    return response.data as CoverLetter;
  },


  async delete(id: string): Promise<void> {
    await apiClient.delete(`/cover-letter/${id}`);
  },

   async enhanceBlock(
    id: string, 
    blockId: string, 
    instructions: string,
    metadata?: { transactionId?: string }
  ): Promise<{ block: any; coverLetter: CoverLetter }> {
    const response = await apiClient.post(`/cover-letter/${id}/enhance`, {
      blockId,
      instructions,
      metadata 
    });
    return response.data;
  },


 duplicate: async (id: string, newName?: string) => {
  return apiClient.post(`/cover-letter/${id}/duplicate`, { newName });
},


  getCurrentUser: async () => {
    const res = await fetch('/api/user/me');
    if (!res.ok) throw new Error('Failed to fetch user data');
    return res.json(); // expects wallet.balance to exist
  },

  deductCoins: async (amount: number) => {
    const res = await fetch('/api/wallet/deduct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('Failed to deduct coins');
    return res.json();
  },
  
  // Template methods
  getTemplates: async (): Promise<CoverLetterTemplate[]> => {
    const response = await apiClient.get('/cover-letter/templates/all');
    return response.data;
  },

  getTemplateCategories: async (): Promise<string[]> => {
    const response = await apiClient.get('/cover-letter/templates/categories');
    return response.data;
  },

  getTemplatesByCategory: async (category: string): Promise<CoverLetterTemplate[]> => {
    const response = await apiClient.get(`/cover-letter/templates/category/${category}`);
    return response.data;
  },

  getTemplateById: async (id: string): Promise<CoverLetterTemplate> => {
    const response = await apiClient.get(`/cover-letter/templates/${id}`);
    return response.data;
  },

  applyTemplate: async (coverLetterId: string, templateId: string) => {
    const response = await apiClient.post(`/cover-letter/${coverLetterId}/apply-template`, {
      templateId
    });
    return response.data;
  },

  searchTemplates: async (query: string): Promise<CoverLetterTemplate[]> => {
    const response = await apiClient.get(`/cover-letter/templates/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  getFeaturedTemplates: async (): Promise<CoverLetterTemplate[]> => {
    const response = await apiClient.get('/cover-letter/templates/featured');
    return response.data;
  },

  getPopularTemplates: async (): Promise<CoverLetterTemplate[]> => {
    const response = await apiClient.get('/cover-letter/templates/popular');
    return response.data;
  },

  getTemplateStats: async (): Promise<any> => {
    const response = await apiClient.get('/cover-letter/templates/stats');
    return response.data;
  },


  

  async regenerateBlock(
    id: string, 
    blockId: string,
    metadata?: { transactionId?: string }
  ): Promise<{ block: any; coverLetter: CoverLetter }> {
    const response = await apiClient.put(`/cover-letter/${id}/blocks/${blockId}/regenerate`, {
      metadata // Add metadata to the request
    });
    return response.data;
  },

async regenerateCompleteLetter(
  id: string,
  instructions: string,
  metadata?: { transactionId?: string }
): Promise<{ coverLetter: CoverLetter; blocks: any[]; transactionId?: string }> {
  const response = await apiClient.post(`/cover-letter/${id}/regenerate-complete`, {
    instructions,
    metadata
  });
  return response.data;
},

  

  async translateLetterEnhanced(
  id: string,
  data: {
    targetLanguage: string;
    method?: string;
    preservation?: string;
    preserveNames?: boolean;
    preserveDates?: boolean;
    preserveNumbers?: boolean;
    preserveUrls?: boolean;
    preserveEmailAddresses?: boolean;
    preserveTerms?: string[];
    createNewVersion?: boolean;
    versionName?: string;
    metadata?: { transactionId?: string };
  }
): Promise<{ 
  coverLetter: CoverLetter; 
  blocks: any[]; 
  targetLanguage: string; 
  transactionId?: string;
  method?: string;
  preservation?: string;
  createNewVersion?: boolean;
  allTranslations?: any[];
  metadata?: any;
}> {
  const response = await apiClient.post(`/cover-letter/${id}/translate-enhanced`, data);
  return response.data;
},


async getLetterTranslations(id: string): Promise<any[]> {
  const response = await apiClient.get(`/cover-letter/${id}/translations`);
  return response.data;
},

async switchToLanguage(coverLetterId: string, languageCode: string): Promise<any> {
  const response = await apiClient.post(`/cover-letter/${coverLetterId}/switch-language`, {
    languageCode: languageCode 
  });
  return response.data;
},
  
};