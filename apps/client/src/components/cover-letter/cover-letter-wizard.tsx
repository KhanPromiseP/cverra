// client/components/cover-letter/cover-letter-wizard.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@reactive-resume/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@reactive-resume/ui';
import { CreateCoverLetterData , coverLetterService} from '@/client/services/cover-letter.service';
import { CoverLetterTemplate, TemplateStructure } from '../cover-letter/sidebars/sections/template';
import { useResumes } from '@/client/services/resume';
import type { ResumeDto } from "@reactive-resume/dto";
import { toast } from 'sonner';






import { 
  FileText, User, Briefcase, Plus, Check, ArrowRight, 
  Layout, Palette, Type, Download, Sparkles, Edit3,
  Building2, Mail, Phone, Award, Zap, BookOpen, Eye, EyeOff,
  GraduationCap, Heart, Handshake, ThumbsUp, Plane, AlertCircle,
  ArrowLeft, ArrowRight as ArrowRightIcon, Target, Shield
} from 'lucide-react';

interface CoverLetterWizardProps {
  onGenerate: (data: CreateCoverLetterData) => void;
  isGenerating: boolean;
  onCancel: () => void;
}

type WizardStep = 'welcome' | 'category' | 'input-method' | 'data-input' | 'configuration';

type LetterCategory = 
  | 'Job Application'
  | 'Internship Application'
  | 'Scholarship/Academic Request'
  | 'Complaint Letter'
  | 'Recommendation Request'
  | 'Business Partnership Proposal'
  | 'Contract / Offer Negotiation'
  | 'Apology Letter'
  | 'Appreciation Letter'
  | 'Letter to Parent/Relative'
  | 'Visa Request / Embassy Letter'
  | 'General Official Correspondence';

type InputMethod = 'resume' | 'manual';

const CATEGORY_CONFIG: Record<LetterCategory, {
  icon: any;
  description: string;
  color: string;
  fields: {
    user: string[];
    job?: string[];
    custom?: string[];
  };
}> = {
  'Job Application': {
    icon: Briefcase,
    description: 'Professional job application letters tailored to specific roles and companies',
    color: 'blue',
    fields: {
      user: ['name', 'email', 'phone', 'skills', 'experience', 'achievements'],
      job: ['position', 'company', 'hiringManager', 'jobDescription'],
      custom: ['customInstructions']
    }
  },
  'Internship Application': {
    icon: GraduationCap,
    description: 'Applications for internship positions focusing on learning and growth potential',
    color: 'green',
    fields: {
      user: ['name', 'email', 'phone', 'skills', 'experience', 'academicLevel', 'relevantCoursework', 'careerGoals'],
      job: ['position', 'company', 'department'],
      custom: ['customInstructions']
    }
  },
  'Scholarship/Academic Request': {
    icon: Award,
    description: 'Formal requests for scholarships, grants, or academic opportunities',
    color: 'purple',
    fields: {
      user: ['name', 'email', 'phone', 'academicAchievements', 'researchInterests', 'academicGoals', 'futurePlans'],
      job: ['programName', 'institution', 'fieldOfStudy'],
      custom: ['customInstructions']
    }
  },
  'Business Partnership Proposal': {
    icon: Handshake,
    description: 'Professional proposals for business collaborations and partnerships',
    color: 'indigo',
    fields: {
      user: ['name', 'email', 'phone', 'company', 'experience'],
      job: ['partnershipType', 'collaborationDetails'],
      custom: ['customInstructions']
    }
  },
  'Contract / Offer Negotiation': {
    icon: FileText,
    description: 'Formal letters for negotiating employment terms and contract details',
    color: 'orange',
    fields: {
      user: ['name', 'email', 'phone', 'experience', 'achievements'],
      job: ['position', 'company', 'currentOffer', 'negotiationPoints'],
      custom: ['customInstructions']
    }
  },
  'Recommendation Request': {
    icon: ThumbsUp,
    description: 'Polite requests for professional or academic recommendations',
    color: 'teal',
    fields: {
      user: ['name', 'email', 'phone', 'relationship'],
      job: ['purpose', 'keyPoints'],
      custom: ['customInstructions']
    }
  },
  'Apology Letter': {
    icon: AlertCircle,
    description: 'Sincere apology letters for professional or personal situations',
    color: 'red',
    fields: {
      user: ['name', 'email', 'phone'],
      job: ['situation', 'impact', 'resolution'],
      custom: ['customInstructions']
    }
  },
  'Appreciation Letter': {
    icon: Heart,
    description: 'Heartfelt letters expressing gratitude and appreciation',
    color: 'pink',
    fields: {
      user: ['name', 'email', 'phone'],
      job: ['recipient', 'reason', 'impact'],
      custom: ['customInstructions']
    }
  },
  'Letter to Parent/Relative': {
    icon: Heart,
    description: 'Personal letters to family members with warm, caring tone',
    color: 'rose',
    fields: {
      user: ['name', 'email', 'phone'],
      job: ['relationship', 'purpose', 'personalContext', 'familyUpdates', 'personalNews', 'emotionalTone'],
      custom: ['customInstructions']
    }
  },
  'Visa Request / Embassy Letter': {
    icon: Plane,
    description: 'Formal letters for visa applications and embassy correspondence',
    color: 'cyan',
    fields: {
      user: ['name', 'email', 'phone', 'address'],
      job: ['travelPurpose', 'destination', 'duration', 'supportingDocs', 'accommodation', 'financialSupport', 'returnPlans'],
      custom: ['customInstructions']
    }
  },
  'Complaint Letter': {
    icon: AlertCircle,
    description: 'Professional complaint letters addressing issues and seeking resolution',
    color: 'amber',
    fields: {
      user: ['name', 'email', 'phone', 'address'],
      job: ['issue', 'productService', 'desiredResolution'],
      custom: ['customInstructions']
    }
  },
  'General Official Correspondence': {
    icon: FileText,
    description: 'Versatile formal letters for various official communications',
    color: 'gray',
    fields: {
      user: ['name', 'email', 'phone', 'address'],
      job: ['purpose', 'recipient', 'keyInformation'],
      custom: ['customInstructions']
    }
  }
};

export const CoverLetterWizard = ({ onGenerate, isGenerating, onCancel }: CoverLetterWizardProps) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [selectedCategory, setSelectedCategory] = useState<LetterCategory | null>(null);
  const [inputMethod, setInputMethod] = useState<InputMethod | null>(null);
  const [formData, setFormData] = useState<CreateCoverLetterData>({
    title: '',
    style: 'Professional',
    layout: 'professional',
    userData: {
      name: '',
      email: '',
      phone: '',
      skills: [],
      experience: [],
      achievements: [],
      professionalSummary: '',
      // Additional fields for different categories
      address: '',
      academicLevel: '',
      relevantCoursework: [],
      careerGoals: '',
      academicAchievements: [],
      researchInterests: '',
      academicGoals: '',
      futurePlans: '',
      relationship: '',
      company: '',
      partnershipType: '',
      collaborationDetails: '',
      currentOffer: '',
      negotiationPoints: [],
      purpose: '',
      keyPoints: [],
      situation: '',
      impact: '',
      resolution: '',
      recipient: '',
      reason: '',
      personalContext: '',
      familyUpdates: '',
      personalNews: '',
      emotionalTone: 'Warm and caring',
      travelPurpose: '',
      destination: '',
      duration: '',
      supportingDocs: '',
      accommodation: '',
      financialSupport: '',
      returnPlans: '',
      issue: '',
      productService: '',
      desiredResolution: '',
      keyInformation: ''
    },
    jobData: {
      position: '',
      company: '',
      hiringManager: '',
      jobDescription: '',
      programName: '',
      institution: '',
      fieldOfStudy: '',
      department: '',
      // Additional job fields
      partnershipType: '',
      collaborationDetails: '',
      currentOffer: '',
      negotiationPoints: [],
      purpose: '',
      keyPoints: [],
      situation: '',
      impact: '',
      resolution: '',
      recipient: '',
      reason: '',
      relationship: '',
      personalContext: '',
      travelPurpose: '',
      destination: '',
      duration: '',
      supportingDocs: '',
      accommodation: '',
      financialSupport: '',
      returnPlans: '',
      issue: '',
      productService: '',
      desiredResolution: '',
      keyInformation: ''
    },
    customInstructions: '',
    
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [showImportedData, setShowImportedData] = useState(true);
  const [isImportingResume, setIsImportingResume] = useState(false);

  const { resumes, loading: isLoadingResumes, error: resumesError } = useResumes();
  const hasResumes = resumes && resumes.length > 0;
  const resumeServiceAvailable = !resumesError;

  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);


  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };


  const handleUserDataChange = (field: string, value: any) => {
  setFormData(prev => ({
    ...prev,
    userData: {
      ...prev.userData,
      [field]: value
    }
  } as CreateCoverLetterData));
  
  const errorKey = `user${field.charAt(0).toUpperCase() + field.slice(1)}`;
  if (errors[errorKey]) {
    setErrors(prev => ({ ...prev, [errorKey]: '' }));
  }
};

const handleJobDataChange = (field: string, value: any) => {
  setFormData(prev => ({
    ...prev,
    jobData: {
      ...prev.jobData,
      [field]: value
    }
  } as CreateCoverLetterData));
  
  const errorKey = `job${field.charAt(0).toUpperCase() + field.slice(1)}`;
  if (errors[errorKey]) {
    setErrors(prev => ({ ...prev, [errorKey]: '' }));
  }
};

  const importResumeData = useCallback((resume: ResumeDto) => {
  setIsImportingResume(true);
  const resumeData = resume.data as any;
  const basics = resumeData.basics || {};
  const sections = resumeData.sections || {};

  // Helper function to strip HTML tags with proper type checking
  const stripHtmlTags = (input: any): string => {
    // Handle null, undefined, or non-string inputs
    if (input === null || input === undefined) return '';
    if (typeof input !== 'string') {
      // Try to convert to string if it's not already
      if (typeof input.toString === 'function') {
        input = input.toString();
      } else {
        return '';
      }
    }
    
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with regular spaces
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing whitespace
  };

  console.log('=== RESUME DATA DEBUG ===');
  console.log('Full resume data:', resumeData);
  console.log('Basics:', basics);
  console.log('Sections:', sections);
  console.log('Skills section:', sections.skills);
  console.log('Experience section:', sections.experience);
  console.log('Projects section:', sections.projects);
  console.log('Awards section:', sections.awards);
  console.log('=== END DEBUG ===');

  // Extract structured skills
  const structuredSkills: Array<{ name: string; level?: string }> = [];
  const skillsSection = sections.skills;
  if (skillsSection && Array.isArray(skillsSection.items)) {
    skillsSection.items.forEach((item: any) => {
      if (typeof item === 'string') {
        structuredSkills.push({ name: stripHtmlTags(item) });
      } else if (item && typeof item === 'object') {
        if (item.name) {
          structuredSkills.push({ 
            name: stripHtmlTags(item.name),
            level: item.level ? stripHtmlTags(item.level) : undefined
          });
        } else if (item.skill) {
          structuredSkills.push({ name: stripHtmlTags(item.skill) });
        } else if (item.keywords && Array.isArray(item.keywords)) {
          item.keywords.forEach((keyword: any) => {
            if (keyword) {
              structuredSkills.push({ name: stripHtmlTags(keyword) });
            }
          });
        }
      }
    });
  }

  // Extract structured experience
  const structuredExperience: Array<{
    position: string;
    company: string;
    period: string;
    description: string;
  }> = [];
  const experienceSection = sections.experience;
  if (experienceSection && Array.isArray(experienceSection.items)) {
    experienceSection.items.forEach((item: any) => {
      if (!item) return;
      
      const position = stripHtmlTags(item.position || item.title || item.name || 'Position');
      const company = stripHtmlTags(item.company || item.employer || item.organization || 'Company');
      const startDate = item.startDate || item.date || '';
      const endDate = item.endDate || item.end || 'Present';
      const description = stripHtmlTags(item.summary || item.description || '');
      
      structuredExperience.push({
        position,
        company,
        period: startDate ? `${startDate} - ${endDate}` : '',
        description
      });
    });
  }

  // Extract structured achievements from multiple sections
  const structuredAchievements: Array<{
    type: 'award' | 'project' | 'certification' | 'publication' | 'volunteer';
    title: string;
    issuer?: string;
    date?: string;
    description?: string;
  }> = [];
  
  // Awards
  const awardsSection = sections.awards;
  if (awardsSection && Array.isArray(awardsSection.items)) {
    awardsSection.items.forEach((item: any) => {
      if (!item) return;
      
      structuredAchievements.push({
        type: 'award',
        title: stripHtmlTags(item.title || item.name || 'Award'),
        issuer: item.awarder ? stripHtmlTags(item.awarder) : undefined,
        date: item.date,
        description: item.summary ? stripHtmlTags(item.summary) : undefined
      });
    });
  }

  // Projects
  const projectsSection = sections.projects;
  if (projectsSection && Array.isArray(projectsSection.items)) {
    projectsSection.items.forEach((item: any) => {
      if (!item) return;
      
      structuredAchievements.push({
        type: 'project',
        title: stripHtmlTags(item.name || item.title || 'Project'),
        description: item.description ? stripHtmlTags(item.description) : 
                     item.summary ? stripHtmlTags(item.summary) : undefined,
        date: item.date
      });
    });
  }

  // Certifications
  const certificationsSection = sections.certifications;
  if (certificationsSection && Array.isArray(certificationsSection.items)) {
    certificationsSection.items.forEach((item: any) => {
      if (!item) return;
      
      structuredAchievements.push({
        type: 'certification',
        title: stripHtmlTags(item.name || item.title || 'Certification'),
        issuer: item.issuer ? stripHtmlTags(item.issuer) : undefined,
        date: item.date,
        description: item.summary ? stripHtmlTags(item.summary) : undefined
      });
    });
  }

  // Publications
  const publicationsSection = sections.publications;
  if (publicationsSection && Array.isArray(publicationsSection.items)) {
    publicationsSection.items.forEach((item: any) => {
      if (!item) return;
      
      structuredAchievements.push({
        type: 'publication',
        title: stripHtmlTags(item.name || item.title || 'Publication'),
        issuer: item.publisher ? stripHtmlTags(item.publisher) : undefined,
        date: item.date,
        description: item.summary ? stripHtmlTags(item.summary) : undefined
      });
    });
  }

  // Volunteer experience
  const volunteerSection = sections.volunteer;
  if (volunteerSection && Array.isArray(volunteerSection.items)) {
    volunteerSection.items.forEach((item: any) => {
      if (!item) return;
      
      structuredAchievements.push({
        type: 'volunteer',
        title: stripHtmlTags(item.position || item.title || item.name || 'Volunteer Role'),
        issuer: item.organization ? stripHtmlTags(item.organization) : undefined,
        date: item.date,
        description: item.summary ? stripHtmlTags(item.summary) : undefined
      });
    });
  }

  // Extract education
  const structuredEducation: Array<{
    institution: string;
    degree: string;
    area: string;
    period: string;
    description: string;
  }> = [];
  const educationSection = sections.education;
  if (educationSection && Array.isArray(educationSection.items)) {
    educationSection.items.forEach((item: any) => {
      if (!item) return;
      
      const institution = stripHtmlTags(item.institution || item.school || 'Institution');
      const degree = stripHtmlTags(item.degree || item.studyType || '');
      const area = stripHtmlTags(item.area || item.field || '');
      const startDate = item.startDate || '';
      const endDate = item.endDate || item.date || '';
      const description = stripHtmlTags(item.summary || item.description || '');
      
      structuredEducation.push({
        institution,
        degree,
        area,
        period: startDate ? `${startDate} - ${endDate}` : '',
        description
      });
    });
  }

  // Extract summary
  const summarySection = sections.summary;
  const professionalSummary = summarySection && summarySection.content ? 
    stripHtmlTags(summarySection.content) : '';

  // Extract address properly with null checks
  const address = stripHtmlTags(
    (basics.location && basics.location.address) || 
    basics.location || 
    basics.address || 
    ''
  );

 // Update form data with all extracted information
setFormData(prev => ({
  ...prev,
  userData: {
    ...prev.userData,
    // Personal info
    name: stripHtmlTags(basics.name || prev.userData?.name || ''),
    email: stripHtmlTags(basics.email || prev.userData?.email || ''),
    phone: stripHtmlTags(basics.phone || prev.userData?.phone || ''),
    address: address || prev.userData?.address || '',
    
    // Professional summary
    professionalSummary: professionalSummary || prev.userData?.professionalSummary || '',
    
    // Structured professional info - ensure these are arrays
    structuredSkills: Array.isArray(structuredSkills) ? structuredSkills : [],
    structuredExperience: Array.isArray(structuredExperience) ? structuredExperience : [],
    structuredAchievements: Array.isArray(structuredAchievements) ? structuredAchievements : [],
    structuredEducation: Array.isArray(structuredEducation) ? structuredEducation : [],
    
    // Keep flat arrays for backward compatibility - ensure these are always arrays
    skills: Array.isArray(structuredSkills) ? structuredSkills.map(skill => skill.name).filter(Boolean) : [],
    experience: Array.isArray(structuredExperience) ? structuredExperience.map(exp => {
      const position = exp.position || '';
      const company = exp.company || '';
      const period = exp.period ? `(${exp.period})` : '';
      const description = exp.description ? `: ${exp.description}` : '';
      return `${position} at ${company} ${period}${description}`.trim();
    }).filter(Boolean) : [],
    achievements: Array.isArray(structuredAchievements) ? structuredAchievements.map(ach => {
      if (!ach || !ach.title) return '';
      let text = ach.title;
      if (ach.issuer) text += ` from ${ach.issuer}`;
      if (ach.date) text += ` (${ach.date})`;
      if (ach.description) text += `: ${ach.description}`;
      return text;
    }).filter(Boolean) : [],
    education: Array.isArray(structuredEducation) ? structuredEducation.map(edu => {
      const institution = edu.institution || '';
      const degree = edu.degree ? ` - ${edu.degree}` : '';
      const area = edu.area ? ` in ${edu.area}` : '';
      const period = edu.period ? ` (${edu.period})` : '';
      const description = edu.description ? `: ${edu.description}` : '';
      return `${institution}${degree}${area}${period}${description}`.trim();
    }).filter(Boolean) : [],
    
    // Initialize other array fields as empty arrays if not already set
    relevantCoursework: Array.isArray(prev.userData?.relevantCoursework) ? prev.userData.relevantCoursework : [],
    academicAchievements: Array.isArray(prev.userData?.academicAchievements) ? prev.userData.academicAchievements : [],
    negotiationPoints: Array.isArray(prev.userData?.negotiationPoints) ? prev.userData.negotiationPoints : [],
    keyPoints: Array.isArray(prev.userData?.keyPoints) ? prev.userData.keyPoints : [],
  }
}));

  setShowImportedData(true);
  
  // Enhanced success message with detailed counts
  const importedItems = [
    basics.name && 'name',
    basics.email && 'email', 
    basics.phone && 'phone',
    address && 'address',
    professionalSummary && 'professional summary',
    structuredSkills.length > 0 && `${structuredSkills.length} skills`,
    structuredExperience.length > 0 && `${structuredExperience.length} experiences`,
    structuredEducation.length > 0 && `${structuredEducation.length} education entries`,
    structuredAchievements.length > 0 && `${structuredAchievements.length} achievements`
  ].filter(Boolean).join(', ');

  toast.success(
    <div>
      <div className="font-semibold">✓ Data imported from "{resume.title}"</div>
      <div className="text-sm">Imported: {importedItems}</div>
      {(!structuredSkills.length && !structuredExperience.length && !structuredAchievements.length) && (
        <div className="text-xs text-orange-600 mt-1">
          Note: No skills, experience, or achievements found in this resume
        </div>
      )}
    </div>,
    { duration: 5000 }
  );
  
  setIsImportingResume(false);
}, []);


const hasAutoSelectedTemplate = useRef(false);

// Template fetching - FIXED: Remove problematic dependencies
useEffect(() => {
  const fetchTemplatesByCategory = async () => {
    if (!selectedCategory) return;
    
    setIsLoadingTemplates(true);
    try {
      const encodedCategory = encodeURIComponent(selectedCategory);
      const response = await coverLetterService.getTemplatesByCategory(encodedCategory);
      setTemplates(response);
      
      // Auto-select first template only once when category changes
      if (response.length > 0 && !formData.layout && !hasAutoSelectedTemplate.current) {
        setFormData(prev => ({
          ...prev,
          layout: response[0].id
        }));
        hasAutoSelectedTemplate.current = true;
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load templates. Using default templates.');
      // Set default templates if API fails
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  fetchTemplatesByCategory();
  
  // Cleanup: reset the ref when category changes
  return () => {
    hasAutoSelectedTemplate.current = false;
  };
}, [selectedCategory]); // Only selectedCategory as dependency


  // Auto-select first resume if available and in resume mode
  useEffect(() => {
    if (inputMethod === 'resume' && hasResumes && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [inputMethod, hasResumes, resumes, selectedResumeId]);

  // Handle resume selection and data import
useEffect(() => {
  if (selectedResumeId && inputMethod === 'resume' && resumes) {
    const selectedResume = resumes.find(r => r.id === selectedResumeId);
    if (selectedResume) {
      importResumeData(selectedResume);
    }
  }
}, [selectedResumeId, inputMethod, resumes, importResumeData]); 

  

  {isImportingResume && (
    <div className="text-center py-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mx-auto"></div>
      <p className="text-xs text-gray-500 mt-1">Importing data...</p>
    </div>
  )}

  const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  // Basic required fields
  if (!formData.title?.trim()) {
    newErrors.title = 'Letter title is required';
  }
  
  if (!formData.userData?.name?.trim()) {
    newErrors.userName = 'Your name is required';
  }

  // Category-specific required fields
  if (selectedCategory) {
    const config = CATEGORY_CONFIG[selectedCategory];
    
    // Check required user fields
    config.fields.user.forEach(field => {
      const fieldConfig = getFieldConfig(field);
      if (fieldConfig.required) {
        const value = formData.userData?.[field as keyof typeof formData.userData];
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors[`user${field.charAt(0).toUpperCase() + field.slice(1)}`] = `${fieldConfig.label} is required`;
        }
      }
    });
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


const getFieldConfig = (field: string) => {
  const fieldConfig: Record<string, any> = {
    // Personal Information
    name: {
      label: 'Your Name',
      type: 'text',
      placeholder: 'John Doe',
      required: true
    },
    email: {
      label: 'Email Address',
      type: 'email',
      placeholder: 'john@example.com',
      required: false
    },
    phone: {
      label: 'Phone Number',
      type: 'tel',
      placeholder: '+1 (555) 123-4567',
      required: false
    },
    address: {
      label: 'Your Address',
      type: 'text',
      placeholder: '123 Main St, City, State 12345',
      required: false
    },

    // Professional Information
    skills: {
      label: 'Key Skills & Qualifications',
      type: 'textarea',
      placeholder: 'JavaScript, React, Project Management, Leadership...',
      required: false
    },
    experience: {
      label: 'Professional Experience',
      type: 'textarea',
      placeholder: 'Senior Developer at Tech Corp (2020-Present): Led team of 5 developers...',
      required: false
    },
    achievements: {
      label: 'Achievements & Awards',
      type: 'textarea',
      placeholder: 'Employee of the Year 2022, Best Project Award...',
      required: false
    },
    professionalSummary: {
      label: 'Professional Summary',
      type: 'textarea',
      placeholder: 'Experienced professional with expertise in...',
      required: false
    },

    // Academic Information
    academicLevel: {
      label: 'Academic Level',
      type: 'text',
      placeholder: 'e.g., Undergraduate, Graduate, PhD Candidate',
      required: false
    },
    relevantCoursework: {
      label: 'Relevant Coursework',
      type: 'textarea',
      placeholder: 'List relevant courses separated by commas',
      required: false
    },
    careerGoals: {
      label: 'Career Goals',
      type: 'textarea',
      placeholder: 'Describe your career aspirations and goals',
      required: false
    },
    academicAchievements: {
      label: 'Academic Achievements',
      type: 'textarea',
      placeholder: 'Honors, awards, publications, research experience',
      required: false
    },
    researchInterests: {
      label: 'Research Interests',
      type: 'textarea',
      placeholder: 'Your specific research interests and focus areas',
      required: false
    },
    academicGoals: {
      label: 'Academic Goals',
      type: 'textarea',
      placeholder: 'Your educational objectives and plans',
      required: false
    },
    futurePlans: {
      label: 'Future Plans',
      type: 'textarea',
      placeholder: 'Your long-term career or academic plans',
      required: false
    },

    // Professional & Business
    company: {
      label: 'Your Company/Organization',
      type: 'text',
      placeholder: 'Your current company or organization',
      required: false
    },
    partnershipType: {
      label: 'Partnership Type',
      type: 'text',
      placeholder: 'e.g., Strategic Alliance, Joint Venture, Collaboration',
      required: false
    },
    collaborationDetails: {
      label: 'Collaboration Details',
      type: 'textarea',
      placeholder: 'Specific details about the proposed collaboration',
      required: false
    },
    currentOffer: {
      label: 'Current Offer Details',
      type: 'textarea',
      placeholder: 'Details of the current contract or offer',
      required: false
    },
    negotiationPoints: {
      label: 'Negotiation Points',
      type: 'textarea',
      placeholder: 'Key points you want to negotiate',
      required: false
    },

    // Recommendation & Relationships
    relationship: {
      label: 'Relationship',
      type: 'text',
      placeholder: 'e.g., Former Manager, Professor, Colleague',
      required: false
    },
    purpose: {
      label: 'Purpose',
      type: 'textarea',
      placeholder: 'Purpose of this request or letter',
      required: false
    },
    keyPoints: {
      label: 'Key Points to Highlight',
      type: 'textarea',
      placeholder: 'Important points you want emphasized',
      required: false
    },

    // Apology & Complaint
    situation: {
      label: 'Situation Description',
      type: 'textarea',
      placeholder: 'Describe what happened',
      required: false
    },
    impact: {
      label: 'Impact',
      type: 'textarea',
      placeholder: 'Describe the impact or consequences',
      required: false
    },
    resolution: {
      label: 'Proposed Resolution',
      type: 'textarea',
      placeholder: 'How you plan to resolve the situation',
      required: false
    },

    // Appreciation & Personal
    recipient: {
      label: 'Recipient',
      type: 'text',
      placeholder: 'Name of the person or organization',
      required: false
    },
    reason: {
      label: 'Reason for Appreciation',
      type: 'textarea',
      placeholder: 'Why you are expressing appreciation',
      required: false
    },

    // Personal/Family Letters
    personalContext: {
      label: 'Personal Context',
      type: 'textarea',
      placeholder: 'Background information or context',
      required: false
    },
    familyUpdates: {
      label: 'Family Updates',
      type: 'textarea',
      placeholder: 'Recent family news or updates',
      required: false
    },
    personalNews: {
      label: 'Personal News',
      type: 'textarea',
      placeholder: 'Your personal updates and news',
      required: false
    },
    emotionalTone: {
      label: 'Emotional Tone',
      type: 'text',
      placeholder: 'e.g., Warm and caring, Formal, Casual',
      required: false
    },

    // Visa & Travel
    travelPurpose: {
      label: 'Travel Purpose',
      type: 'textarea',
      placeholder: 'Reason for travel or visa application',
      required: false
    },
    destination: {
      label: 'Destination',
      type: 'text',
      placeholder: 'Country and city you are traveling to',
      required: false
    },
    duration: {
      label: 'Duration of Stay',
      type: 'text',
      placeholder: 'e.g., 2 weeks, 6 months, 1 year',
      required: false
    },
    supportingDocs: {
      label: 'Supporting Documents',
      type: 'textarea',
      placeholder: 'Documents you are submitting with application',
      required: false
    },
    accommodation: {
      label: 'Accommodation Details',
      type: 'textarea',
      placeholder: 'Where you will be staying',
      required: false
    },
    financialSupport: {
      label: 'Financial Support',
      type: 'textarea',
      placeholder: 'How your trip will be funded',
      required: false
    },
    returnPlans: {
      label: 'Return Plans',
      type: 'textarea',
      placeholder: 'Your plans to return home',
      required: false
    },

    // Complaint & Resolution
    issue: {
      label: 'Issue Description',
      type: 'textarea',
      placeholder: 'Detailed description of the problem',
      required: false
    },
    productService: {
      label: 'Product/Service',
      type: 'text',
      placeholder: 'Product or service involved',
      required: false
    },
    desiredResolution: {
      label: 'Desired Resolution',
      type: 'textarea',
      placeholder: 'What you would like to happen',
      required: false
    },

    // General Correspondence
    keyInformation: {
      label: 'Key Information',
      type: 'textarea',
      placeholder: 'Main points or information to include',
      required: false
    },

    // Job Specific
    position: {
      label: 'Position/Role',
      type: 'text',
      placeholder: 'Job title or position you are applying for',
      required: false
    },
    hiringManager: {
      label: 'Hiring Manager/Recipient Name',
      type: 'text',
      placeholder: 'Name of the hiring manager or recipient',
      required: false
    },
    jobDescription: {
      label: 'Job Description/Requirements',
      type: 'textarea',
      placeholder: 'Key requirements and responsibilities from job description',
      required: false
    },
    programName: {
      label: 'Program Name',
      type: 'text',
      placeholder: 'Name of the program or opportunity',
      required: false
    },
    institution: {
      label: 'Institution/Organization',
      type: 'text',
      placeholder: 'Name of the institution or organization',
      required: false
    },
    fieldOfStudy: {
      label: 'Field of Study',
      type: 'text',
      placeholder: 'Your academic or professional field',
      required: false
    },
    department: {
      label: 'Department',
      type: 'text',
      placeholder: 'Specific department or division',
      required: false
    }
  };

  return fieldConfig[field] || { 
    label: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'), 
    type: 'text', 
    placeholder: `Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
    required: false 
  };
};


  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    toast.error('Please fill in all required fields');
    return;
  }

  // Helper function to convert string to array
  const stringToArray = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Split by commas or newlines, trim, and filter out empty strings
      return value.split(/[,;\n]+/).map(item => item.trim()).filter(Boolean);
    }
    return [];
  };

  // Process form data to ensure arrays are properly formatted
  const processedFormData = {
    ...formData,
    category: selectedCategory!,
    selectedResumeId: inputMethod === 'resume' ? selectedResumeId : undefined,
    userData: {
      ...formData.userData,
      // Convert string fields to arrays
      skills: stringToArray(formData.userData?.skills),
      experience: stringToArray(formData.userData?.experience),
      achievements: stringToArray(formData.userData?.achievements),
      relevantCoursework: stringToArray(formData.userData?.relevantCoursework),
      academicAchievements: stringToArray(formData.userData?.academicAchievements),
      negotiationPoints: stringToArray(formData.userData?.negotiationPoints),
      keyPoints: stringToArray(formData.userData?.keyPoints),
    },
    jobData: {
      ...formData.jobData,
      // Convert string fields to arrays
      negotiationPoints: stringToArray(formData.jobData?.negotiationPoints),
      keyPoints: stringToArray(formData.jobData?.keyPoints),
    }
  };

  console.log('=== SUBMITTING FORM DATA ===');
  console.log('Skills:', processedFormData.userData.skills);
  console.log('Experience:', processedFormData.userData.experience);
  console.log('Achievements:', processedFormData.userData.achievements);
  console.log('=== END DEBUG ===');

  onGenerate(processedFormData as CreateCoverLetterData);
};


  const getCategoryColor = (category: LetterCategory) => {
    return CATEGORY_CONFIG[category].color;
  };

  const getCategoryIcon = (category: LetterCategory) => {
    const IconComponent = CATEGORY_CONFIG[category].icon;
    return <IconComponent className="w-6 h-6" />;
  };

const renderField = (field: string, category: LetterCategory) => {
  const config = CATEGORY_CONFIG[category];
  const isUserField = config.fields.user.includes(field);
  const value = isUserField 
    ? formData.userData?.[field as keyof typeof formData.userData] || ''
    : formData.jobData?.[field as keyof typeof formData.jobData] || '';
  const onChange = isUserField ? handleUserDataChange : handleJobDataChange;

  const fieldConfig: Record<string, any> = {
    name: {
      label: 'Your Name *',
      type: 'text',
      placeholder: 'John Doe',
      required: true
    },
    email: {
      label: 'Email Address',
      type: 'email',
      placeholder: 'john@example.com'
    },
    phone: {
      label: 'Phone Number',
      type: 'tel',
      placeholder: '+1 (555) 123-4567'
    },
    address: {
      label: 'Your Address',
      type: 'text',
      placeholder: '123 Main St, City, State 12345'
    },
    skills: {
      label: 'Key Skills & Qualifications',
      type: 'textarea',
      placeholder: 'JavaScript, React, Project Management, Leadership...'
    },
    experience: {
      label: 'Professional Experience',
      type: 'textarea',
      placeholder: 'Senior Developer at Tech Corp (2020-Present): Led team of 5 developers...'
    },
    achievements: {
      label: 'Achievements & Awards',
      type: 'textarea',
      placeholder: 'Employee of the Year 2022, Best Project Award...'
    },
    academicLevel: {
      label: 'Academic Level',
      type: 'text',
      placeholder: 'e.g., Undergraduate, Graduate, PhD Candidate'
    },
    relevantCoursework: {
      label: 'Relevant Coursework',
      type: 'textarea',
      placeholder: 'List relevant courses separated by commas'
    },
    careerGoals: {
      label: 'Career Goals',
      type: 'textarea',
      placeholder: 'Describe your career aspirations and goals'
    },
    academicAchievements: {
      label: 'Academic Achievements',
      type: 'textarea',
      placeholder: 'Honors, awards, publications, research experience'
    },
    researchInterests: {
      label: 'Research Interests',
      type: 'textarea',
      placeholder: 'Your specific research interests and focus areas'
    },
    // Add more field configurations as needed...
  };

  const fieldInfo = fieldConfig[field] || { 
    label: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'), 
    type: 'text', 
    placeholder: `Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}` 
  };

  // List of fields that should be treated as arrays
  const arrayFields = [
    'skills', 'experience', 'achievements', 
    'relevantCoursework', 'academicAchievements', 
    'negotiationPoints', 'keyPoints'
  ];

  if (fieldInfo.type === 'textarea') {
    const isArrayField = arrayFields.includes(field);
    
    // For array fields: display as comma/line-separated string for editing
    // But store as array in state
    const displayValue = isArrayField && Array.isArray(value) 
      ? value.join(', ')  // Show array as comma-separated string
      : (typeof value === 'string' ? value : '');

    return (
      <div key={field}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {fieldInfo.label} {fieldInfo.required && '*'}
          {isArrayField && (
            <span className="text-xs text-gray-500 ml-2">
              (Separate with commas or new lines)
            </span>
          )}
        </label>
        <textarea
          value={displayValue}
          onChange={(e) => {
            if (isArrayField) {
              // Convert text to array when user types
              const arrayValue = e.target.value
                .split(/[,;\n]+/)
                .map(item => item.trim())
                .filter(Boolean);
              onChange(field, arrayValue);
            } else {
              onChange(field, e.target.value);
            }
          }}
          onBlur={(e) => {
            if (isArrayField) {
              // Clean up the display value on blur
              const cleanValue = e.target.value
                .split(/[,;\n]+/)
                .map(item => item.trim())
                .filter(Boolean)
                .join(', ');
              // Update display value for better UX
              e.target.value = cleanValue;
            }
          }}
          rows={4}
          className="w-full text-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder={fieldInfo.placeholder}
        />
        {isArrayField && Array.isArray(value) && value.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {value.length} item{value.length !== 1 ? 's' : ''} entered
          </div>
        )}
      </div>
    );
  }

  // For regular input fields
  return (
    <div key={field}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {fieldInfo.label} {fieldInfo.required && '*'}
        {arrayFields.includes(field) && (
          <span className="text-xs text-gray-500 ml-2">
            (Separate with commas)
          </span>
        )}
      </label>
      <input
        type={fieldInfo.type}
        required={fieldInfo.required}
        value={Array.isArray(value) ? value.join(', ') : value || ''}
        onChange={(e) => {
          if (arrayFields.includes(field)) {
            // For array fields, convert comma-separated string to array
            const arrayValue = e.target.value
              .split(',')
              .map(item => item.trim())
              .filter(Boolean);
            onChange(field, arrayValue);
          } else {
            onChange(field, e.target.value);
          }
        }}
        onBlur={(e) => {
          if (arrayFields.includes(field)) {
            // Clean up the display value on blur
            const cleanValue = e.target.value
              .split(',')
              .map(item => item.trim())
              .filter(Boolean)
              .join(', ');
            e.target.value = cleanValue;
          }
        }}
        className="w-full px-4 py-3 text-gray-700 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={fieldInfo.placeholder}
      />
      {arrayFields.includes(field) && Array.isArray(value) && value.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          {value.length} item{value.length !== 1 ? 's' : ''} entered
        </div>
      )}
    </div>
  );
};

 // Step 1: Welcome Screen
if (currentStep === 'welcome') {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center space-y-12 py-16">
        {/* Hero Section with Animated Elements */}
        <div className="relative">
          {/* Floating Background Elements */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -top-10 -right-20 w-60 h-60 bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/4 w-32 h-32 bg-indigo-200/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          
         

          {/* Main Heading */}
          <CardTitle className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
            Craft Letters That
            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Open Doors
            </span>
          </CardTitle>

          {/* Subtitle */}
          <CardDescription className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
            Transform your communication with AI-powered precision. From job applications to professional correspondence, 
            create letters that make <span className="font-semibold text-purple-600 dark:text-purple-400">lasting impressions</span>.
          </CardDescription>
        </div>

        {/* CTA Section */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Ready to Make Your Mark?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join thousands of professionals who've transformed their communication with our AI-powered platform.
            </p>
          </div>

          {/* Enhanced CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              onClick={() => setCurrentStep('category')}
              className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-lg font-semibold rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 group overflow-hidden"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <span className="relative flex items-center">
                Start Creating Now
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>

            <Button 
              variant="outline"
              size="lg"
              onClick={onCancel}
              className="px-8 py-6 text-lg rounded-2xl border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            >
              Explore Examples
            </Button>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400 pt-4">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Secure & Confidential • No Spam</span>
          </div>
        </div>

        {/* Value Proposition Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {[
            {
              icon: <Zap className="w-8 h-8" />,
              title: "Lightning Fast",
              description: "Generate professional letters in minutes, not hours",
              stats: "Save 80% time",
              color: "from-yellow-500 to-orange-500"
            },
            {
              icon: <Target className="w-8 h-8" />,
              title: "Precision Crafted",
              description: "Tailored content for every scenario and audience",
              stats: "12+ categories",
              color: "from-green-500 to-teal-500"
            },
            {
              icon: <Award className="w-8 h-8" />,
              title: "Professional Quality",
              description: "Industry-standard templates that impress recruiters",
              stats: "98% success rate",
              color: "from-purple-500 to-pink-500"
            }
          ].map((feature, index) => (
            <div 
              key={feature.title}
              className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-transparent transition-all duration-500 hover:scale-105 hover:shadow-2xl"
            >
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl p-0.5 -z-10">
                <div className={`w-full h-full bg-gradient-to-r ${feature.color} rounded-2xl`}></div>
              </div>
              
              <div className="relative">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <div className="text-sm font-semibold bg-gradient-to-r bg-clip-text text-transparent bg-gray-400 dark:bg-gray-500">
                  {feature.stats}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-2xl p-8 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10K+", label: "Letters Generated" },
              { number: "95%", label: "User Satisfaction" },
              { number: "12+", label: "Letter Categories" },
              { number: "2min", label: "Average Creation Time" }
            ].map((stat, index) => (
              <div key={stat.label} className="space-y-2">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        
      </div>
    </div>
  );
}


  // Step 2: Category Selection
if (currentStep === 'category') {
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, any> = {
      blue: {
        border: 'hover:border-blue-500 dark:hover:border-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900',
        bgHover: 'group-hover:bg-blue-200 dark:group-hover:bg-blue-800',
        text: 'text-blue-600 dark:text-blue-400',
        button: 'bg-blue-600 hover:bg-blue-700 text-white'
      },
      green: {
        border: 'hover:border-green-500 dark:hover:border-green-400',
        bg: 'bg-green-100 dark:bg-green-900',
        bgHover: 'group-hover:bg-green-200 dark:group-hover:bg-green-800',
        text: 'text-green-600 dark:text-green-400',
        button: 'bg-green-600 hover:bg-green-700 text-white'
      },
      purple: {
        border: 'hover:border-purple-500 dark:hover:border-purple-400',
        bg: 'bg-purple-100 dark:bg-purple-900',
        bgHover: 'group-hover:bg-purple-200 dark:group-hover:bg-purple-800',
        text: 'text-purple-600 dark:text-purple-400',
        button: 'bg-purple-600 hover:bg-purple-700 text-white'
      },
      indigo: {
        border: 'hover:border-indigo-500 dark:hover:border-indigo-400',
        bg: 'bg-indigo-100 dark:bg-indigo-900',
        bgHover: 'group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800',
        text: 'text-indigo-600 dark:text-indigo-400',
        button: 'bg-indigo-600 hover:bg-indigo-700 text-white'
      },
      orange: {
        border: 'hover:border-orange-500 dark:hover:border-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-900',
        bgHover: 'group-hover:bg-orange-200 dark:group-hover:bg-orange-800',
        text: 'text-orange-600 dark:text-orange-400',
        button: 'bg-orange-600 hover:bg-orange-700 text-white'
      },
      teal: {
        border: 'hover:border-teal-500 dark:hover:border-teal-400',
        bg: 'bg-teal-100 dark:bg-teal-900',
        bgHover: 'group-hover:bg-teal-200 dark:group-hover:bg-teal-800',
        text: 'text-teal-600 dark:text-teal-400',
        button: 'bg-teal-600 hover:bg-teal-700 text-white'
      },
      red: {
        border: 'hover:border-red-500 dark:hover:border-red-400',
        bg: 'bg-red-100 dark:bg-red-900',
        bgHover: 'group-hover:bg-red-200 dark:group-hover:bg-red-800',
        text: 'text-red-600 dark:text-red-400',
        button: 'bg-red-600 hover:bg-red-700 text-white'
      },
      pink: {
        border: 'hover:border-pink-500 dark:hover:border-pink-400',
        bg: 'bg-pink-100 dark:bg-pink-900',
        bgHover: 'group-hover:bg-pink-200 dark:group-hover:bg-pink-800',
        text: 'text-pink-600 dark:text-pink-400',
        button: 'bg-pink-600 hover:bg-pink-700 text-white'
      },
      rose: {
        border: 'hover:border-rose-500 dark:hover:border-rose-400',
        bg: 'bg-rose-100 dark:bg-rose-900',
        bgHover: 'group-hover:bg-rose-200 dark:group-hover:bg-rose-800',
        text: 'text-rose-600 dark:text-rose-400',
        button: 'bg-rose-600 hover:bg-rose-700 text-white'
      },
      cyan: {
        border: 'hover:border-cyan-500 dark:hover:border-cyan-400',
        bg: 'bg-cyan-100 dark:bg-cyan-900',
        bgHover: 'group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800',
        text: 'text-cyan-600 dark:text-cyan-400',
        button: 'bg-cyan-600 hover:bg-cyan-700 text-white'
      },
      amber: {
        border: 'hover:border-amber-500 dark:hover:border-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-900',
        bgHover: 'group-hover:bg-amber-200 dark:group-hover:bg-amber-800',
        text: 'text-amber-600 dark:text-amber-400',
        button: 'bg-amber-600 hover:bg-amber-700 text-white'
      },
      gray: {
        border: 'hover:border-gray-500 dark:hover:border-gray-400',
        bg: 'bg-gray-100 dark:bg-gray-900',
        bgHover: 'group-hover:bg-gray-200 dark:group-hover:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        button: 'bg-gray-600 hover:bg-gray-700 text-white'
      }
    };
    
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-8 pt-6">
  <div className="flex flex-col space-y-4">
    {/* Back button positioned at the top */}
    <div className="flex justify-between items-start">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setCurrentStep('welcome')}
        className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Welcome</span>
      </Button>
    </div>
    
    {/* Main title and description */}
    <div className="text-center space-y-3">
      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Choose Your Letter Type
      </CardTitle>
      <CardDescription className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
        Select the category that best matches your purpose. We'll customize the experience 
        and templates specifically for your needs.
      </CardDescription>
    </div>

   
  </div>
</CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Object.keys(CATEGORY_CONFIG) as LetterCategory[]).map((category) => {
            const config = CATEGORY_CONFIG[category];
            const Icon = config.icon;
            const colorClasses = getColorClasses(config.color);
            
            return (
              <div
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setCurrentStep('input-method');
                }}
                className={`group cursor-pointer transition-all duration-300 hover:scale-105 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 bg-white dark:bg-gray-800 ${colorClasses.border} hover:shadow-xl`}
              >
                <div className="flex flex-col items-center text-center h-full">
                  <div className={`w-12 h-12 ${colorClasses.bg} rounded-full flex items-center justify-center mb-4 ${colorClasses.bgHover} transition-colors`}>
                    <Icon className={`w-6 h-6 ${colorClasses.text}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {category}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow">
                    {config.description}
                  </p>
                  <Button className={`w-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl ${colorClasses.button}`}>
                    Select
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </div>
  );
}

  // Step 3: Input Method Selection
  if (currentStep === 'input-method' && selectedCategory) {
    const config = CATEGORY_CONFIG[selectedCategory];
    
    return (
      <div className="max-w-4xl mx-auto">
        {/* <Card className="border-0 shadow-xl"> */}
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep('category')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="flex justify-between space-x-2">
                  <div className={`w-8 h-8 bg-${config.color}-100 dark:bg-${config.color}-900 rounded-full flex items-center justify-center`}>
                    {getCategoryIcon(selectedCategory)}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedCategory}
                    </CardTitle>
                    <CardDescription>
                      How would you like to provide your information?
                    </CardDescription>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Manual Entry */}
              <div 
                onClick={() => {
                  setInputMethod('manual');
                  setCurrentStep('data-input');
                }}
                className="group cursor-pointer transition-all duration-300 hover:scale-105"
              >
                <div className="relative p-8 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-2xl transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                      <Edit3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      Enter Details Manually
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                      Fill in the specific information needed for your {selectedCategory.toLowerCase()}. 
                      We'll show you only the relevant fields.
                    </p>
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 text-left w-full">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Category-specific fields only</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Full control over content</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Optimized for {selectedCategory.toLowerCase()}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Start Filling Details
                    </Button>
                  </div>
                </div>
              </div>

              {/* Resume Import */}
              <div 
                onClick={() => {
                  if (hasResumes && resumeServiceAvailable) {
                    setInputMethod('resume');
                    setCurrentStep('data-input');
                  } else if (!resumeServiceAvailable) {
                    toast.error('Resume service is currently unavailable.');
                  } else {
                    toast.error('No resumes found. Please create a resume first.');
                  }
                }}
                className={`group cursor-pointer transition-all duration-300 ${
                  hasResumes && resumeServiceAvailable ? 'hover:scale-105' : 'opacity-60'
                }`}
              >
                <div className={`relative p-8 border-2 rounded-2xl bg-white dark:bg-gray-800 transition-all duration-300 h-full ${
                  hasResumes && resumeServiceAvailable 
                    ? 'border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 hover:shadow-2xl' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="flex flex-col items-center text-center h-full">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                      hasResumes && resumeServiceAvailable
                        ? 'bg-green-100 dark:bg-green-900 group-hover:bg-green-200 dark:group-hover:bg-green-800'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <FileText className={`w-8 h-8 ${
                        hasResumes && resumeServiceAvailable
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      Import from Resume
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                      Quickly import your information from an existing resume and review the imported data.
                    </p>
                    
                    {isLoadingResumes ? (
                      <div className="w-full py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading resumes...</p>
                      </div>
                    ) : hasResumes ? (
                      <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 text-left w-full">
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Auto-fill from {resumes.length} resume{resumes.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Edit imported data before generating</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Quick setup with full control</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-orange-600 dark:text-orange-400 w-full py-4">
                        <FileText className="w-6 h-6 mx-auto mb-2" />
                        <p>No resumes found</p>
                      </div>
                    )}
                    
                    <Button 
                      className={`w-full mt-6 transition-colors ${
                        hasResumes && resumeServiceAvailable
                          ? 'group-hover:bg-green-600 group-hover:text-white'
                          : 'opacity-50'
                      }`}
                      disabled={!hasResumes || !resumeServiceAvailable}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {hasResumes ? 'Import from Resume' : 'No Resumes Available'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        {/* </Card> */}
      </div>
    );
  }

  // Step 4: Data Input (Manual or Resume-based)
  if (currentStep === 'data-input' && selectedCategory && inputMethod) {
    const config = CATEGORY_CONFIG[selectedCategory];
    
    return (
      <div className="max-w-4xl mx-auto">
        {/* <Card className="border-0 shadow-xl"> */}
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep('input-method')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 bg-${config.color}-100 dark:bg-${config.color}-900 rounded-full flex items-center justify-center`}>
                    {getCategoryIcon(selectedCategory)}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedCategory} Details
                    </CardTitle>
                    <CardDescription>
                      {inputMethod === 'manual' 
                        ? `Provide the information needed for your ${selectedCategory.toLowerCase()}`
                        : 'Review and edit your imported information'
                      }
                    </CardDescription>
                  </div>
                </div>
              </div>
              {inputMethod === 'resume' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowImportedData(!showImportedData)}
                >
                  {showImportedData ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {showImportedData ? 'Hide Preview Data' : 'Show Preview Data'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Resume Selection (only for resume mode) */}
              {inputMethod === 'resume' && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                    Select Resume to Import From
                  </h3>
                  {isLoadingResumes ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-2"></div>
                      <p className="text-gray-600 dark:text-gray-400">Loading your resumes...</p>
                    </div>
                  ) : (
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800"
                    >
                      <option value="">Choose a resume to import from...</option>
                      {resumes?.map(resume => {
                        const resumeData = resume.data as any;
                        const basics = resumeData.basics || {};
                        return (
                          <option key={resume.id} value={resume.id}>
                            {basics.name || 'Untitled'} - {resume.title}
                            {resumeData.skills?.length > 0 && ` • ${resumeData.skills.length} skills`}
                            {resumeData.work?.length > 0 && ` • ${resumeData.work.length} positions`}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              )}

              {/* Resume Data Preview */}
              {inputMethod === 'resume' && selectedResumeId && showImportedData && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                      Imported Resume Data Preview
                    </h3>
                    <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Data Imported</span>
                    </div>
                  </div>
                  
                  {/* Resume-like Structured Layout */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800 overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-green-50 dark:bg-green-900/30 px-6 py-4 border-b border-green-200 dark:border-green-700">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {formData.userData.name || 'Your Name'}
                      </h2>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {formData.userData.email && (
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {formData.userData.email}
                          </div>
                        )}
                        {formData.userData.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {formData.userData.phone}
                          </div>
                        )}
                        {formData.userData.address && (
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-1" />
                            {formData.userData.address}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Skills Section */}
                      {formData.userData.skills?.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-green-700 dark:text-green-400 flex items-center">
                            <Zap className="w-4 h-4 mr-2" />
                            Skills & Qualifications
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {formData.userData.skills.map((skill, index) => (
                              <span 
                                key={index}
                                className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm px-3 py-1 rounded-full border border-green-200 dark:border-green-700"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience Section */}
                      {formData.userData.experience?.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-green-700 dark:text-green-400 flex items-center">
                            <Briefcase className="w-4 h-4 mr-2" />
                            Professional Experience
                          </h3>
                          <div className="space-y-4">
                            {formData.userData.experience.map((exp, index) => {
                              // Parse the experience string to extract components
                              const parts = exp.split(':');
                              const titleAndCompany = parts[0] || '';
                              const description = parts.slice(1).join(':').trim();
                              
                              return (
                                <div key={index} className="border-l-2 border-green-300 pl-4 py-1">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {titleAndCompany}
                                  </div>
                                  {description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {description}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Achievements Section */}
                      {formData.userData.achievements?.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-green-700 dark:text-green-400 flex items-center">
                            <Award className="w-4 h-4 mr-2" />
                            Achievements & Projects
                          </h3>
                          <div className="space-y-3">
                            {formData.userData.achievements.map((achievement, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {achievement}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formData.userData.skills?.length || 0}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Skills</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formData.userData.experience?.length || 0}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Experiences</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formData.userData.achievements?.length || 0}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Achievements</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {[
                              formData.userData.name,
                              formData.userData.email,
                              formData.userData.phone,
                              formData.userData.address
                            ].filter(Boolean).length}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Contact Info</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center">
                      <Edit3 className="w-4 h-4 mr-2" />
                      <strong>Tip:</strong> You can edit any of the imported data in the fields below before generating your letter.
                    </p>
                  </div>
                </div>
              )}

              {/* Data Input Fields */}
              <div className="space-y-6">
                {/* User Information Fields */}
                {config.fields.user.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                      Your Information
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {config.fields.user.map(field => renderField(field, selectedCategory))}
                    </div>
                  </div>
                )}

                {/* Rest of your existing code remains the same */}
                {/* Job/Recipient Information Fields */}
                {config.fields.job && config.fields.job.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                      <Target className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                      {selectedCategory.includes('Job') || selectedCategory.includes('Internship') 
                        ? 'Job Information' 
                        : selectedCategory.includes('Recommendation') || selectedCategory.includes('Appreciation')
                        ? 'Recipient Information'
                        : 'Letter Details'
                      }
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {config.fields.job.map(field => renderField(field, selectedCategory))}
                    </div>
                  </div>
                )}

                {/* Custom Instructions */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Type className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                    Additional Instructions (Optional)
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Provide specific guidance to tailor your letter exactly how you want it.
                  </p>
                  <textarea
                    value={formData.customInstructions}
                    onChange={(e) => handleInputChange('customInstructions', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-white dark:bg-gray-800"
                    placeholder={`Specific guidance for your ${selectedCategory.toLowerCase()}... Address particular requirements or concerns
                            `}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Please here you make sure to specify all the requirements.
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={() => setCurrentStep('input-method')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep('configuration')}
                  disabled={!formData.userData.name.trim()}
                >
                  Continue to Configuration
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </CardContent>
        {/* </Card> */}
      </div>
    );
  }

  // Step 5: Final Configuration
  if (currentStep === 'configuration' && selectedCategory) {
    const config = CATEGORY_CONFIG[selectedCategory];
    
    return (
       <div className="max-w-4xl mx-auto py-8">
        {/* <Card className="border-0 shadow-xl"> */}
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep('data-input')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 bg-${config.color}-100 dark:bg-${config.color}-900 rounded-full flex items-center justify-center`}>
                    {getCategoryIcon(selectedCategory)}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      Final Configuration
                    </CardTitle>
                    <CardDescription>
                      Review your settings and generate your {selectedCategory.toLowerCase()}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Letter Configuration */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  Letter Configuration
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Letter Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={`w-full px-4 py-3 border text-gray-700  dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={`e.g., ${selectedCategory} for ${formData.jobData.company || 'Target Company'}`}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Palette className="w-4 h-4 inline mr-1" />
                        Writing Style
                      </label>
                      <select
                        value={formData.style}
                        onChange={(e) => handleInputChange('style', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                      >
                        <option value="Professional">Professional</option>
                        <option value="Modern">Modern</option>
                        <option value="Traditional">Traditional</option>
                        <option value="Executive">Executive</option>
                        <option value="Creative">Creative</option>
                        <option value="Minimalist">Minimalist</option>
                        <option value="Academic">Academic</option>
                        <option value="Technical">Technical</option>
                      </select>
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Layout className="w-4 h-4 inline mr-1" />
                      Template Layout
                    </label>
                    <select
                      value={formData.layout || (templates.length > 0 ? templates[0].id : '')}
                      onChange={(e) => handleInputChange('layout', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                      disabled={isLoadingTemplates || templates.length === 0}
                    >
                      {isLoadingTemplates ? (
                        <option value="">Loading templates for {selectedCategory}...</option>
                      ) : templates.length === 0 ? (
                        <option value="">No templates available</option>
                      ) : (
                        <>
                          <option value="">Select a template...</option>
                          {templates.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.name} {template.premium ? '⭐' : ''}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {templates.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {templates.length} template{templates.length !== 1 ? 's' : ''} available for {selectedCategory}
                      </p>
                    )}
                  </div>
                  </div>
                </div>
              </div>

              {/* Preview Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ready to Generate!
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Category:</strong> {selectedCategory}
                  </div>
                  <div>
                    <strong>Style:</strong> {formData.style}
                  </div>
                  <div>
                    <strong>Template:</strong> {templates.find(t => t.layout === formData.layout)?.name || 'Professional'}
                  </div>
                  <div>
                    <strong>Input Method:</strong> {inputMethod === 'manual' ? 'Manual Entry' : 'Resume Import'}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={() => setCurrentStep('data-input')} className="w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Details
                </Button>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button variant="outline" onClick={onCancel} disabled={isGenerating} className="flex-1 sm:flex-none">
                    Cancel
                  </Button>
                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Generating Your Letter...
                    </>
                  ) : (
                    <>
                    
                      Generate {selectedCategory}
                    </>
                  )}
                </Button>

                </div>
              </div>
            </form>
          </CardContent>
        {/* </Card> */}
      </div>
    );
  }

  return null;
};