// client/services/resume.service.ts
import { http } from '../libs/http';

// Define the Resume interface based on your existing structure
export interface Resume {
  id: string;
  name: string;
  title: string;
  visibility: 'public' | 'private';
  userId: string;
  createdAt: string;
  updatedAt: string;
  data: {
    basics: {
      name: string;
      email: string;
      phone: string;
      location: {
        address: string;
      };
      profiles: Array<{
        network: string;
        username: string;
        url: string;
      }>;
    };
    skills: Array<{
      name: string;
      level: string;
      keywords: string[];
    }>;
    work: Array<{
      name: string;
      position: string;
      summary: string;
      startDate: string;
      endDate: string;
      url: string;
    }>;
    awards: Array<{
      title: string;
      date: string;
      awarder: string;
      summary: string;
    }>;
    projects: Array<{
      name: string;
      description: string;
      keywords: string[];
      startDate: string;
      endDate: string;
    }>;
  };
}

// Enhanced resume service with getAll method
export const resumeService = {
  
  // Get all resumes for the current user
  getAll: async (): Promise<Resume[]> => {
    const response = await http.get<Resume[]>('/resume');
    return response; // Remove .data if http.get already returns the data directly
  },

  // Get a specific resume by ID
  getOne: async (id: string): Promise<Resume> => {
    const response = await http.get<Resume>(`/resume/${id}`);
    return response; // Remove .data if http.get already returns the data directly
  },

  // Create a new resume
  create: async (data: Partial<Resume>): Promise<Resume> => {
    const response = await http.post<Resume>('/resume', data);
    return response;
  },

  // Update an existing resume
  update: async (id: string, data: Partial<Resume>): Promise<Resume> => {
    const response = await http.put<Resume>(`/resume/${id}`, data);
    return response;
  },

  // Delete a resume
  delete: async (id: string): Promise<void> => {
    await http.delete(`/resume/${id}`);
  },

  // Print a resume (PDF generation)
  print: async (id: string): Promise<{ url: string }> => {
    const response = await http.post<{ url: string }>(`/resume/${id}/print`);
    return response;
  },

  // Get resume statistics
  statistics: async (id: string): Promise<any> => {
    const response = await http.get(`/resume/${id}/statistics`);
    return response;
  },
};

// Re-export everything
export * from './resume';