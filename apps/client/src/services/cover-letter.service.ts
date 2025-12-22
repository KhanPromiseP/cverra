
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
    const response = await apiClient.get(`/cover-letter/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateCoverLetterData): Promise<CoverLetter> {
    const response = await apiClient.put(`/cover-letter/${id}`, data);
    return response.data;
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
};