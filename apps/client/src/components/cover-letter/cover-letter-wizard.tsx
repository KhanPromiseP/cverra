import { t, Trans } from "@lingui/macro";
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@reactive-resume/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@reactive-resume/ui';
import { CreateCoverLetterData , coverLetterService} from '@/client/services/cover-letter.service';
import { CoverLetterTemplate, TemplateStructure } from '../cover-letter/sidebars/sections/template';
import { useResumes } from '@/client/services/resume';
import type { ResumeDto } from "@reactive-resume/dto";
import { toast } from 'sonner';
import { useNavigate } from 'react-router';


import { useAuthStore } from '@/client/stores/auth';
import { useWallet } from '@/client/hooks/useWallet';
import { CoinConfirmPopover } from '@/client/components/modals/coin-confirm-modal';
import { Loader2, Coins, Crown, ChevronDown, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

import {
  FileText, User, Briefcase, Plus, Check, ArrowRight,
  Layout, Palette, Type, Download, Sparkles, Edit3,
  Building2, Mail, Phone, Award, Zap, BookOpen, Eye, EyeOff,
  GraduationCap, Heart, Handshake, ThumbsUp, Plane, AlertCircle,
  ArrowLeft, ArrowRight as ArrowRightIcon, Target, Shield, Globe, Info,
  Wand2
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

// Payment processing states - SAME AS AI SECTION
type ProcessState = 'idle' | 'checking' | 'insufficient' | 'reserving' | 'processing' | 'success' | 'error';
type ProcessType = 'generate';

interface ProcessStatus {
  state: ProcessState;
  type?: ProcessType;
  message?: string;
  instructions?: string;
  transactionId?: string;
}

const CATEGORY_CONFIG: Record<LetterCategory, {
  icon: any;
  description: string;
  color: string;
  fields: {
    user: string[];
    job: string[];
    custom: string[];
  };
}> = {
  'Job Application': {
    icon: Briefcase,
    description: t`Professional job application letters tailored to specific roles and companies`,
    color: 'blue',
    fields: {
      user: ['name', 'email', 'phone', 'skills', 'experience', 'achievements'],
      job: ['recipient', 'position', 'company', 'hiringManager', 'jobDescription'], // Added recipient
      custom: ['customInstructions']
    }
  },
  'Internship Application': {
    icon: GraduationCap,
    description: t`Applications for internship positions focusing on learning and growth potential`,
    color: 'green',
    fields: {
      user: ['name', 'email', 'phone', 'skills', 'experience', 'academicLevel', 'relevantCoursework', 'careerGoals'],
      job: ['recipient', 'position', 'company', 'department'], // Added recipient
      custom: ['customInstructions']
    }
  },
  'Scholarship/Academic Request': {
    icon: Award,
    description: t`Formal requests for scholarships, grants, or academic opportunities`,
    color: 'purple',
    fields: {
      user: ['name', 'email', 'phone', 'academicAchievements', 'researchInterests', 'academicGoals', 'futurePlans'],
      job: ['recipient', 'programName', 'institution', 'fieldOfStudy'], // Added recipient
      custom: ['customInstructions']
    }
  },
  'Business Partnership Proposal': {
    icon: Handshake,
    description: t`Professional proposals for business collaborations and partnerships`,
    color: 'indigo',
    fields: {
      user: ['name', 'email', 'phone', 'company', 'position', 'companyAddress', 'experience'],
      job: ['recipient', 'partnershipType', 'collaborationDetails', 'recipientCompany', 'recipientPosition', 
            'proposalPurpose', 'proposedBenefits', 'partnershipScope', 'proposedTimeline', 
            'rolesAndResponsibilities', 'financialTerms', 'confidentialityClause', 'disputeResolution', 'exitTerms'], // Added recipient
      custom: ['customInstructions']
    }
  },
  'Contract / Offer Negotiation': {
    icon: FileText,
    description: t`Formal letters for negotiating employment terms and contract details`,
    color: 'orange',
    fields: {
      user: ['name', 'email', 'phone', 'experience', 'achievements'],
      job: ['recipient', 'position', 'company', 'currentOffer', 'negotiationPoints'], // Added recipient
      custom: ['customInstructions']
    }
  },
  'Recommendation Request': {
    icon: ThumbsUp,
    description: t`Polite requests for professional or academic recommendations`,
    color: 'teal',
    fields: {
      user: ['name', 'email', 'phone', 'relationship'],
      job: ['recipient', 'purpose', 'keyPoints'], // Added recipient
      custom: ['customInstructions']
    }
  },
  'Apology Letter': {
    icon: AlertCircle,
    description: t`Sincere apology letters for professional or personal situations`,
    color: 'red',
    fields: {
      user: ['name', 'email', 'phone'],
      job: ['recipient', 'situation', 'impact', 'resolution'], // Added recipient
      custom: ['customInstructions']
    }
  },
  'Appreciation Letter': {
    icon: Heart,
    description: t`Heartfelt letters expressing gratitude and appreciation`,
    color: 'pink',
    fields: {
      user: ['name', 'email', 'phone'],
      job: ['recipient', 'reason', 'impact'], // Added recipient
      custom: ['customInstructions']
    }
  },
  'Letter to Parent/Relative': {
    icon: Heart,
    description: t`Personal letters to family members with warm, caring tone`,
    color: 'rose',
    fields: {
      user: ['name', 'email', 'phone'],
      job: ['recipient', 'relationship', 'purpose', 'personalContext', 'familyUpdates', 'personalNews', 'emotionalTone'], // Added recipient
      custom: ['customInstructions']
    }
  },
  'Visa Request / Embassy Letter': {
    icon: Plane,
    description: t`Formal letters for visa applications and embassy correspondence`,
    color: 'cyan',
    fields: {
      user: ['name', 'email', 'phone', 'address'],
      job: ['recipient', 'travelPurpose', 'destination', 'duration', 'supportingDocs', 'accommodation', 'financialSupport', 'returnPlans'], // Added recipient
      custom: ['customInstructions']
    }
  },
  'Complaint Letter': {
    icon: AlertCircle,
    description: t`Professional complaint letters addressing issues and seeking resolution`,
    color: 'amber',
    fields: {
      user: ['name', 'email', 'phone', 'address'],
      job: ['recipient', 'issue', 'productService', 'desiredResolution'], // Added recipient
      custom: ['customInstructions']
    }
  },
  'General Official Correspondence': {
    icon: FileText,
    description: t`Versatile formal letters for various official communications`,
    color: 'gray',
    fields: {
      user: ['name', 'email', 'phone', 'address'],
      job: ['recipient', 'purpose', 'keyInformation'], // Added recipient
      custom: ['customInstructions']
    }
  }
};

export const CoverLetterWizard = ({ onGenerate, isGenerating, onCancel }: CoverLetterWizardProps) => {
  // Wizard states
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [selectedCategory, setSelectedCategory] = useState<LetterCategory | null>(null);
  const [inputMethod, setInputMethod] = useState<InputMethod | null>(null);

  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  // Payment states - SAME AS AI SECTION
  const [showCoinPopover, setShowCoinPopover] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: ProcessType;
    instructions?: string;
    data?: any;
    processedFormData?: CreateCoverLetterData;
  } | null>(null);
  
  const [processStatus, setProcessStatus] = useState<ProcessStatus>({ state: 'idle' });
  
  // Wallet hooks
  const { user } = useAuthStore();
  const { balance, canAfford, deductCoinsWithRollback, completeTransaction, refundTransaction, fetchBalance } = useWallet(user?.id || '');
  
  // Cost for generating a letter
  const GENERATE_COST = 5;


  const [formData, setFormData] = useState<CreateCoverLetterData>({
    title: '',
    style: t`Professional`,
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
      emotionalTone: t`Warm and caring`,
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
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [showImportedData, setShowImportedData] = useState(true);
  const [isImportingResume, setIsImportingResume] = useState(false);
  const { resumes, loading: isLoadingResumes, error: resumesError } = useResumes();
  const hasResumes = resumes && resumes.length > 0;
  const resumeServiceAvailable = !resumesError;
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [languageOverride, setLanguageOverride] = useState<string>('');
  const generateButtonRef = useRef<HTMLButtonElement>(null);
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
    basics.name && t`name`,
    basics.email && t`email`,
    basics.phone && t`phone`,
    address && t`address`,
    professionalSummary && t`professional summary`,
    structuredSkills.length > 0 && t`${structuredSkills.length} skills`,
    structuredExperience.length > 0 && t`${structuredExperience.length} experiences`,
    structuredEducation.length > 0 && t`${structuredEducation.length} education entries`,
    structuredAchievements.length > 0 && t`${structuredAchievements.length} achievements`
  ].filter(Boolean).join(', ');
  toast.success(
    <div>
      <div className="font-semibold">{t`✓ Data imported from "${resume.title}"`}</div>
      <div className="text-sm">{t`Imported: ${importedItems}`}</div>
      {(!structuredSkills.length && !structuredExperience.length && !structuredAchievements.length) && (
        <div className="text-xs text-orange-600 mt-1">
          {t`Note: No skills, experience, or achievements found in this resume`}
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
      
      // Always select the first template of THIS category when category changes
      if (response.length > 0) {
        // Check if the currently selected template belongs to this category
        const currentTemplateBelongsToThisCategory = formData.layout && 
          response.some(t => t.id === formData.layout);
        
        // If no template is selected OR the selected template is not from this category,
        // select the first template of this category
        if (!formData.layout || !currentTemplateBelongsToThisCategory) {
          setFormData(prev => ({
            ...prev,
            layout: response[0].id
          }));
          
          // Optional: Show which template was selected
          console.log(`Selected ${response[0].name} template for ${selectedCategory} category`);
        }
        // If the current template IS from this category, keep it (user's choice)
        
      } else {
        // No templates for this category
        setFormData(prev => ({
          ...prev,
          layout: undefined
        }));
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error(t`Failed to load templates. Using default templates.`);
      setTemplates([]);
      setFormData(prev => ({
        ...prev,
        layout: undefined
      }));
    } finally {
      setIsLoadingTemplates(false);
    }
  };
  
  fetchTemplatesByCategory();
  
}, [selectedCategory]); // Only depend on selectedCategory
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
      <p className="text-xs text-gray-500 mt-1">{t`Importing data...`}</p>
    </div>
  )}
  const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};
  // Basic required fields
  if (!formData.title?.trim()) {
    newErrors.title = t`Letter title is required`;
  }
 
  if (!formData.userData?.name?.trim()) {
    newErrors.userName = t`Your name is required`;
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
          newErrors[`user${field.charAt(0).toUpperCase() + field.slice(1)}`] = t`${fieldConfig.label} is required`;
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
      label: t`Your Name`,
      type: 'text',
      placeholder: t`John Doe`,
      required: true
    },
    email: {
      label: t`Email Address`,
      type: 'email',
      placeholder: t`john@example.com`,
      required: false
    },
    phone: {
      label: t`Phone Number`,
      type: 'tel',
      placeholder: t`+1 (555) 123-4567`,
      required: false
    },
    address: {
      label: t`Your Address`,
      type: 'text',
      placeholder: t`123 Main St, City, State 12345`,
      required: false
    },
    // Professional Information
    skills: {
      label: t`Key Skills & Qualifications`,
      type: 'textarea',
      placeholder: t`JavaScript, React, Project Management, Leadership...`,
      required: false
    },
    experience: {
      label: t`Professional Experience`,
      type: 'textarea',
      placeholder: t`Senior Developer at Tech Corp (2020-Present): Led team of 5 developers...`,
      required: false
    },
    achievements: {
      label: t`Achievements & Awards`,
      type: 'textarea',
      placeholder: t`Employee of the Year 2022, Best Project Award...`,
      required: false
    },
    professionalSummary: {
      label: t`Professional Summary`,
      type: 'textarea',
      placeholder: t`Experienced professional with expertise in...`,
      required: false
    },
    // Academic Information
    academicLevel: {
      label: t`Academic Level`,
      type: 'text',
      placeholder: t`e.g., Undergraduate, Graduate, PhD Candidate`,
      required: false
    },
    relevantCoursework: {
      label: t`Relevant Coursework`,
      type: 'textarea',
      placeholder: t`List relevant courses separated by commas`,
      required: false
    },
    careerGoals: {
      label: t`Career Goals`,
      type: 'textarea',
      placeholder: t`Describe your career aspirations and goals`,
      required: false
    },
    academicAchievements: {
      label: t`Academic Achievements`,
      type: 'textarea',
      placeholder: t`Honors, awards, publications, research experience`,
      required: false
    },
    researchInterests: {
      label: t`Research Interests`,
      type: 'textarea',
      placeholder: t`Your specific research interests and focus areas`,
      required: false
    },
    academicGoals: {
      label: t`Academic Goals`,
      type: 'textarea',
      placeholder: t`Your educational objectives and plans`,
      required: false
    },
    futurePlans: {
      label: t`Future Plans`,
      type: 'textarea',
      placeholder: t`Your long-term career or academic plans`,
      required: false
    },
    // Professional & Business
    company: {
      label: t`Company/Organization`,
      type: 'text',
      placeholder: t`company or organization if applicable`,
      required: false
    },
    position: {
      label: t`Your Position/Title`,
      type: 'text',
      placeholder: t`e.g., CEO, Business Development Manager`
    },
    companyAddress: {
      label: t`Company Address`,
      type: 'text',
      placeholder: t`Full address of your company`
    },
    partnershipType: {
      label: t`Partnership Type`,
      type: 'text',
      placeholder: t`e.g., Strategic Alliance, Joint Venture, Collaboration`,
      required: false
    },
    collaborationDetails: {
      label: t`Collaboration Details`,
      type: 'textarea',
      placeholder: t`Specific details about the proposed collaboration`,
      required: false
    },
    currentOffer: {
      label: t`Current Offer Details`,
      type: 'textarea',
      placeholder: t`Details of the current contract or offer`,
      required: false
    },
    negotiationPoints: {
      label: t`Negotiation Points`,
      type: 'textarea',
      placeholder: t`Key points you want to negotiate`,
      required: false
    },
    recipientCompany: {
      label: t`Recipient Company/Organization`,
      type: 'text',
      placeholder: t`Name of the company you're proposing to`
    },
    recipientPosition: {
      label: t`Recipient's Position/Title`,
      type: 'text',
      placeholder: t`e.g., CEO, Partnerships Director`
    },
    proposalPurpose: {
      label: t`Proposal Purpose`,
      type: 'textarea',
      placeholder: t`Clear statement of why you're proposing this partnership`
    },
    proposedBenefits: {
      label: t`Proposed Benefits`,
      type: 'textarea',
      placeholder: t`Mutual benefits for both parties - what each company gains from this partnership`
    },
    partnershipScope: {
      label: t`Partnership Scope`,
      type: 'textarea',
      placeholder: t`What the partnership will cover (shared resources, joint projects, market access, etc.)`
    },
    proposedTimeline: {
      label: t`Proposed Timeline`,
      type: 'textarea',
      placeholder: t`Start date, duration, key milestones, and review periods`
    },
    rolesAndResponsibilities: {
      label: t`Roles & Responsibilities`,
      type: 'textarea',
      placeholder: t`Specific responsibilities for each party - who does what`
    },
    financialTerms: {
      label: t`Financial Terms`,
      type: 'textarea',
      placeholder: t`Investment amounts, profit sharing, payment terms, revenue split, etc.`
    },
    confidentialityClause: {
      label: t`Confidentiality Requirements`,
      type: 'textarea',
      placeholder: t`How sensitive information will be handled and protected`
    },
    disputeResolution: {
      label: t`Dispute Resolution`,
      type: 'textarea',
      placeholder: t`How disagreements or conflicts will be resolved (mediation, arbitration, etc.)`
    },
    exitTerms: {
      label: t`Exit Terms`,
      type: 'textarea',
      placeholder: t`How the partnership can be terminated and what happens afterward`
    },
    // Recommendation & Relationships
    relationship: {
      label: t`Relationship`,
      type: 'text',
      placeholder: t`e.g., Former Manager, Professor, Colleague`,
      required: false
    },
    purpose: {
      label: t`Purpose`,
      type: 'textarea',
      placeholder: t`Purpose of this request or letter`,
      required: false
    },
    keyPoints: {
      label: t`Key Points to Highlight`,
      type: 'textarea',
      placeholder: t`Important points you want emphasized`,
      required: false
    },
    // Apology & Complaint
    situation: {
      label: t`Situation Description`,
      type: 'textarea',
      placeholder: t`Describe what happened`,
      required: false
    },
    impact: {
      label: t`Impact`,
      type: 'textarea',
      placeholder: t`Describe the impact or consequences`,
      required: false
    },
    resolution: {
      label: t`Proposed Resolution`,
      type: 'textarea',
      placeholder: t`How you plan to resolve the situation`,
      required: false
    },
    // Appreciation & Personal
    recipient: {
      label: t`Recipient`,
      type: 'text',
      placeholder: t`Name of the person or organization`,
      required: false
    },
    reason: {
      label: t`Reason for Appreciation`,
      type: 'textarea',
      placeholder: t`Why you are expressing appreciation`,
      required: false
    },
    // Personal/Family Letters
    personalContext: {
      label: t`Personal Context`,
      type: 'textarea',
      placeholder: t`Background information or context`,
      required: false
    },
    familyUpdates: {
      label: t`Family Updates`,
      type: 'textarea',
      placeholder: t`Recent family news or updates`,
      required: false
    },
    personalNews: {
      label: t`Personal News`,
      type: 'textarea',
      placeholder: t`Your personal updates and news`,
      required: false
    },
    emotionalTone: {
      label: t`Emotional Tone`,
      type: 'text',
      placeholder: t`e.g., Warm and caring, Formal, Casual`,
      required: false
    },
    // Visa & Travel
    travelPurpose: {
      label: t`Travel Purpose`,
      type: 'textarea',
      placeholder: t`Reason for travel or visa application`,
      required: false
    },
    destination: {
      label: t`Destination`,
      type: 'text',
      placeholder: t`Country and city you are traveling to`,
      required: false
    },
    duration: {
      label: t`Duration of Stay`,
      type: 'text',
      placeholder: t`e.g., 2 weeks, 6 months, 1 year`,
      required: false
    },
    supportingDocs: {
      label: t`Supporting Documents`,
      type: 'textarea',
      placeholder: t`Documents you are submitting with application`,
      required: false
    },
    accommodation: {
      label: t`Accommodation Details`,
      type: 'textarea',
      placeholder: t`Where you will be staying`,
      required: false
    },
    financialSupport: {
      label: t`Financial Support`,
      type: 'textarea',
      placeholder: t`How your trip will be funded`,
      required: false
    },
    returnPlans: {
      label: t`Return Plans`,
      type: 'textarea',
      placeholder: t`Your plans to return home`,
      required: false
    },
    // Complaint & Resolution
    issue: {
      label: t`Issue Description`,
      type: 'textarea',
      placeholder: t`Detailed description of the problem`,
      required: false
    },
    productService: {
      label: t`Product/Service`,
      type: 'text',
      placeholder: t`Product or service involved`,
      required: false
    },
    desiredResolution: {
      label: t`Desired Resolution`,
      type: 'textarea',
      placeholder: t`What you would like to happen`,
      required: false
    },
    // General Correspondence
    keyInformation: {
      label: t`Key Information`,
      type: 'textarea',
      placeholder: t`Main points or information to include`,
      required: false
    },
    // Job Specific
   
    hiringManager: {
      label: t`Hiring Manager/Recipient Name`,
      type: 'text',
      placeholder: t`Name of the hiring manager or recipient`,
      required: false
    },
    jobDescription: {
      label: t`Job Description/Requirements`,
      type: 'textarea',
      placeholder: t`Key requirements and responsibilities from job description`,
      required: false
    },
    programName: {
      label: t`Program Name`,
      type: 'text',
      placeholder: t`Name of the program or opportunity`,
      required: false
    },
    institution: {
      label: t`Institution/Organization`,
      type: 'text',
      placeholder: t`Name of the institution or organization`,
      required: false
    },
    fieldOfStudy: {
      label: t`Field of Study`,
      type: 'text',
      placeholder: t`Your academic or professional field`,
      required: false
    },
    department: {
      label: t`Department`,
      type: 'text',
      placeholder: t`Specific department or division`,
      required: false
    }
  };
  return fieldConfig[field] || {
    label: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
    type: 'text',
    placeholder: t`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
    required: false
  };
};


const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error(t`Please fill in all required fields`);
      return;
    }
    
    // Check if user is authenticated
    if (!user) {
      toast.error(t`Please sign in to generate a cover letter`);
      return;
    }
    
    // Start checking balance
    setProcessStatus({ 
      state: 'checking', 
      type: 'generate',
      message: t`Checking coin balance...`
    });
    
    try {
      const affordable = await canAfford(GENERATE_COST);
      
      if (!affordable) {
        setProcessStatus({ 
          state: 'insufficient', 
          type: 'generate',
          message: t`Insufficient coins`
        });
        
        // Prepare processed form data for later use
        const processedFormData = await prepareFormData();
        setPendingAction({ 
          type: 'generate', 
          processedFormData,
          data: {
            category: selectedCategory,
            language: languageOverride.trim() || undefined
          }
        });
        setShowCoinPopover(true);
        return;
      }
      
      // If they can afford, proceed directly
      await executeLetterGeneration();
      
    } catch (error) {
      console.error('Balance check failed:', error);
      setProcessStatus({ 
        state: 'error', 
        type: 'generate',
        message: t`Unable to check balance. Please try again.`
      });
      toast.error(t`Unable to check balance. Please try again.`);
    }
  };

  const prepareFormData = async (): Promise<CreateCoverLetterData & { metadata?: any }> => {
  const stringToArray = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(/[,;\n]+/).map(item => item.trim()).filter(Boolean);
    }
    return [];
  };
  
  // Create a comprehensive jobData object with ALL possible fields
  const jobData: any = {
    // Job Application / Internship
    position: formData.jobData?.position || '',
    company: formData.jobData?.company || '',
    hiringManager: formData.jobData?.hiringManager || '',
    jobDescription: formData.jobData?.jobDescription || '',
    department: formData.jobData?.department || '',
    
    // Academic
    programName: formData.jobData?.programName || '',
    institution: formData.jobData?.institution || '',
    fieldOfStudy: formData.jobData?.fieldOfStudy || '',
    
    // Business Partnership - ALL FIELDS
    partnershipType: formData.jobData?.partnershipType || '',
    collaborationDetails: formData.jobData?.collaborationDetails || '',
    recipientCompany: formData.jobData?.recipientCompany || '',
    recipientPosition: formData.jobData?.recipientPosition || '',
    proposalPurpose: formData.jobData?.proposalPurpose || '',
    proposedBenefits: formData.jobData?.proposedBenefits || '',
    partnershipScope: formData.jobData?.partnershipScope || '',
    proposedTimeline: formData.jobData?.proposedTimeline || '',
    rolesAndResponsibilities: formData.jobData?.rolesAndResponsibilities || '',
    financialTerms: formData.jobData?.financialTerms || '',
    confidentialityClause: formData.jobData?.confidentialityClause || '',
    disputeResolution: formData.jobData?.disputeResolution || '',
    exitTerms: formData.jobData?.exitTerms || '',
    
    // Contract Negotiation
    currentOffer: formData.jobData?.currentOffer || '',
    negotiationPoints: stringToArray(formData.jobData?.negotiationPoints),
    
    // Recommendation
    purpose: formData.jobData?.purpose || '',
    keyPoints: stringToArray(formData.jobData?.keyPoints),
    
    // Apology
    situation: formData.jobData?.situation || '',
    impact: formData.jobData?.impact || '',
    resolution: formData.jobData?.resolution || '',
    
    // Appreciation
    recipient: formData.jobData?.recipient || '',
    reason: formData.jobData?.reason || '',
    
    // Personal/Family
    relationship: formData.jobData?.relationship || '',
    personalContext: formData.jobData?.personalContext || '',
    familyUpdates: formData.jobData?.familyUpdates || '',
    personalNews: formData.jobData?.personalNews || '',
    emotionalTone: formData.jobData?.emotionalTone || '',
    
    // Visa/Travel
    travelPurpose: formData.jobData?.travelPurpose || '',
    destination: formData.jobData?.destination || '',
    duration: formData.jobData?.duration || '',
    supportingDocs: formData.jobData?.supportingDocs || '',
    accommodation: formData.jobData?.accommodation || '',
    financialSupport: formData.jobData?.financialSupport || '',
    returnPlans: formData.jobData?.returnPlans || '',
    
    // Complaint
    issue: formData.jobData?.issue || '',
    productService: formData.jobData?.productService || '',
    desiredResolution: formData.jobData?.desiredResolution || '',
    
    // General
    keyInformation: formData.jobData?.keyInformation || ''
  };

  // Create userData object with ALL possible fields
  const userData: any = {
    name: formData.userData?.name || '',
    email: formData.userData?.email || '',
    phone: formData.userData?.phone || '',
    address: formData.userData?.address || '',
    skills: stringToArray(formData.userData?.skills),
    experience: stringToArray(formData.userData?.experience),
    achievements: stringToArray(formData.userData?.achievements),
    professionalSummary: formData.userData?.professionalSummary || '',
    academicLevel: formData.userData?.academicLevel || '',
    relevantCoursework: stringToArray(formData.userData?.relevantCoursework),
    careerGoals: formData.userData?.careerGoals || '',
    academicAchievements: stringToArray(formData.userData?.academicAchievements),
    researchInterests: formData.userData?.researchInterests || '',
    academicGoals: formData.userData?.academicGoals || '',
    futurePlans: formData.userData?.futurePlans || '',
    relationship: formData.userData?.relationship || '',
    company: formData.userData?.company || '',
    position: formData.userData?.position || '',
    companyAddress: formData.userData?.companyAddress || '',
    partnershipType: formData.userData?.partnershipType || '',
    collaborationDetails: formData.userData?.collaborationDetails || '',
    currentOffer: formData.userData?.currentOffer || '',
    negotiationPoints: stringToArray(formData.userData?.negotiationPoints),
    purpose: formData.userData?.purpose || '',
    keyPoints: stringToArray(formData.userData?.keyPoints),
    situation: formData.userData?.situation || '',
    impact: formData.userData?.impact || '',
    resolution: formData.userData?.resolution || '',
    recipient: formData.userData?.recipient || '',
    reason: formData.userData?.reason || '',
    personalContext: formData.userData?.personalContext || '',
    familyUpdates: formData.userData?.familyUpdates || '',
    personalNews: formData.userData?.personalNews || '',
    emotionalTone: formData.userData?.emotionalTone || '',
    travelPurpose: formData.userData?.travelPurpose || '',
    destination: formData.userData?.destination || '',
    duration: formData.userData?.duration || '',
    supportingDocs: formData.userData?.supportingDocs || '',
    accommodation: formData.userData?.accommodation || '',
    financialSupport: formData.userData?.financialSupport || '',
    returnPlans: formData.userData?.returnPlans || '',
    issue: formData.userData?.issue || '',
    productService: formData.userData?.productService || '',
    desiredResolution: formData.userData?.desiredResolution || '',
    keyInformation: formData.userData?.keyInformation || '',
    selectedResumeId: inputMethod === 'resume' ? selectedResumeId : undefined
  };

  const preparedData: CreateCoverLetterData & { metadata?: any } = {
    ...formData,
    category: selectedCategory!,
    userData,
    jobData,
    metadata: {
      language: languageOverride.trim() || undefined,
      inputMethod: inputMethod,
    }
  };
  
  // Debug log to see what's being sent
  console.log('📤 Sending to backend:', {
    category: preparedData.category,
    userDataKeys: Object.keys(preparedData.userData || {}).filter(k => preparedData.userData?.[k]),
    jobDataKeys: Object.keys(preparedData.jobData || {}).filter(k => preparedData.jobData?.[k]),
    businessPartnershipFields: {
      partnershipType: preparedData.jobData?.partnershipType,
      collaborationDetails: preparedData.jobData?.collaborationDetails?.substring(0, 50),
      recipientCompany: preparedData.jobData?.recipientCompany,
      proposalPurpose: preparedData.jobData?.proposalPurpose?.substring(0, 50)
    }
  });
  
  return preparedData;
};


// Add this helper function at the top of your component (inside the CoverLetterWizard function)
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return t`An unknown error occurred`;
};

// Then fix your executeLetterGeneration function:
const executeLetterGeneration = async () => {
  if (!user) {
    toast.error(t`Please sign in to generate a cover letter`);
    return;
  }

  const transactionId = `generate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let transactionSuccess = false;

  try {
    // 1. Start reservation process
    setProcessStatus({ 
      state: 'reserving', 
      type: 'generate',
      message: t`Reserving coins for letter generation...`,
      transactionId
    });

    // 2. Reserve coins FIRST
    const transactionResult = await deductCoinsWithRollback(
      GENERATE_COST,
      `Cover Letter Generation - ${selectedCategory}`,
      { transactionId, actionType: 'generate', category: selectedCategory }
    );

    if (!transactionResult.success) {
      throw new Error(transactionResult.error || t`Failed to process payment`);
    }

    transactionSuccess = true;

    // 3. Update to processing state
    setProcessStatus({ 
      state: 'processing', 
      type: 'generate',
      message: t`Payment successful! Generating your letter with AI...`,
      transactionId
    });

    // 4. Prepare data
    const processedFormData = await prepareFormData();

    // 5. 🚨 CALL THE CORRECT API METHOD - use create() not generate()
    const result = await coverLetterService.create(processedFormData);
    
    // 6. Only mark as successful AFTER API call succeeds
    setProcessStatus({ 
      state: 'success', 
      type: 'generate',
      message: t`Letter generation completed successfully!`,
      transactionId
    });

    await completeTransaction(transactionId, {
      result: 'success',
      actionType: 'generate',
      category: selectedCategory
    });

    // Call onGenerate with the processedFormData (for parent component to handle)
    // This will trigger the parent component's success flow
    onGenerate(processedFormData);

    toast.success(
      <div className="space-y-1">
        <div className="font-medium">{t`Letter generated successfully!`}</div>
        <div className="text-xs text-green-600">
          {t`Used ${GENERATE_COST} coins • Transaction: ${transactionId.slice(-8)}`}
        </div>
      </div>,
      { duration: 5000 }
    );

  } catch (error) {
    // Use the helper function to safely get error message
    const errorMessage = getErrorMessage(error);
    console.error('Letter generation failed:', error);
    
    setProcessStatus({ 
      state: 'error', 
      type: 'generate',
      message: errorMessage,
      transactionId
    });

    toast.error(
      <div className="space-y-1">
        <div className="font-medium">{t`Generation Failed`}</div>
        <div className="text-xs text-red-600">
          {errorMessage}
        </div>
        {transactionSuccess && (
          <div className="text-xs text-amber-600 mt-1">
            {t`Coins will be refunded...`}
          </div>
        )}
      </div>,
      { duration: 5000 }
    );

    // REFUND if payment was successful but generation failed
    if (transactionSuccess) {
      try {
        await refundTransaction(transactionId, `Generation failed: ${errorMessage}`);
        console.log(`💸 Refunded ${GENERATE_COST} coins due to generation failure`);
        toast.info(t`${GENERATE_COST} coins have been refunded to your account.`);
      } catch (refundError) {
        console.error('Failed to process refund:', refundError);
        toast.error(t`Failed to process refund. Please contact support.`);
      }
    }
    
    // 🚨 DO NOT call onGenerate on error!
    // The parent component's onGenerate should handle failures separately
    
  } finally {
    await fetchBalance();
  }
};
// Handle coin confirmation
 const handleCoinConfirm = async () => {
    setShowCoinPopover(false);
    if (pendingAction?.type === 'generate' && pendingAction.processedFormData) {
      await executeLetterGeneration();
    }
    setPendingAction(null);
  };

// Handle buying coins
const handleBuyCoins = (goSubscription = false) => {
    setShowCoinPopover(false);
    setPendingAction(null);
    setProcessStatus({ state: 'idle' });
    
    if (goSubscription) {
      window.location.href = "/dashboard/pricing";
    } else {
      const cost = pendingAction?.type === 'generate' ? GENERATE_COST : 5;
      window.location.href = `/dashboard/coins?needed=${Math.max(0, cost - balance)}`;
    }
  };

  const StatusDisplay = () => {
    if (processStatus.state === 'idle') return null;
    
    const statusConfig = {
      checking: {
        icon: Loader2,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        spin: true
      },
      insufficient: {
        icon: XCircle,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        spin: false
      },
      reserving: {
        icon: Loader2,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        spin: true
      },
      processing: {
        icon: Loader2,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        spin: true
      },
      success: {
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        spin: false
      },
      error: {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        spin: false
      }
    };

    const config = statusConfig[processStatus.state];
    const IconComponent = config.icon;

    return (
      <div className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} animate-in slide-in-from-bottom-2 duration-300 mb-4`}>
        <div className="flex items-start space-x-2">
          <IconComponent className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {processStatus.message}
            </p>
            {processStatus.state === 'error' && (
              <div className="mt-2 space-y-2">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProcessStatus({ state: 'idle' })}
                    className="text-xs h-7"
                  >
                    {t`Dismiss`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
    // Personal Information
    name: {
      label: t`Your Name *`,
      type: 'text',
      placeholder: t`John Doe`,
      required: true
    },
    email: {
      label: t`Email Address`,
      type: 'email',
      placeholder: t`john@example.com`
    },
    phone: {
      label: t`Phone Number`,
      type: 'tel',
      placeholder: t`+1 (555) 123-4567`
    },
    address: {
      label: t`Your Address`,
      type: 'text',
      placeholder: t`123 Main St, City, State 12345`
    },
    // Professional Information
    skills: {
      label: t`Key Skills & Qualifications`,
      type: 'textarea',
      placeholder: t`JavaScript, React, Project Management, Leadership...`
    },
    experience: {
      label: t`Professional Experience`,
      type: 'textarea',
      placeholder: t`Senior Developer at Tech Corp (2020-Present): Led team of 5 developers...`
    },
    achievements: {
      label: t`Achievements & Awards`,
      type: 'textarea',
      placeholder: t`Employee of the Year 2022, Best Project Award...`
    },
    professionalSummary: {
      label: t`Professional Summary`,
      type: 'textarea',
      placeholder: t`Experienced professional with expertise in...`
    },
    // Academic Information
    academicLevel: {
      label: t`Academic Level`,
      type: 'text',
      placeholder: t`e.g., Undergraduate, Graduate, PhD Candidate`
    },
    relevantCoursework: {
      label: t`Relevant Coursework`,
      type: 'textarea',
      placeholder: t`List relevant courses separated by commas`
    },
    careerGoals: {
      label: t`Career Goals`,
      type: 'textarea',
      placeholder: t`Describe your career aspirations and goals`
    },
    academicAchievements: {
      label: t`Academic Achievements`,
      type: 'textarea',
      placeholder: t`Honors, awards, publications, research experience`
    },
    researchInterests: {
      label: t`Research Interests`,
      type: 'textarea',
      placeholder: t`Your specific research interests and focus areas`
    },
    academicGoals: {
      label: t`Academic Goals`,
      type: 'textarea',
      placeholder: t`Your educational objectives and plans`
    },
    futurePlans: {
      label: t`Future Plans`,
      type: 'textarea',
      placeholder: t`Your long-term career or academic plans`
    },
    // Professional & Business - ADD THESE MISSING FIELDS
    company: {
      label: t`Your Company/Organization`,
      type: 'text',
      placeholder: t`Your current company or organization`
    },
    partnershipType: {
      label: t`Partnership Type`,
      type: 'text',
      placeholder: t`e.g., Strategic Alliance, Joint Venture, Collaboration`
    },
    collaborationDetails: {
      label: t`Collaboration Details`,
      type: 'textarea',
      placeholder: t`Specific details about the proposed collaboration`
    },
    currentOffer: {
      label: t`Current Offer Details`,
      type: 'textarea',
      placeholder: t`Details of the current contract or offer`
    },
    negotiationPoints: {
      label: t`Negotiation Points`,
      type: 'textarea',
      placeholder: t`Key points you want to negotiate`
    },
    // Recommendation & Relationships
    relationship: {
      label: t`Relationship`,
      type: 'text',
      placeholder: t`e.g., Former Manager, Professor, Colleague`
    },
    purpose: {
      label: t`Purpose`,
      type: 'textarea',
      placeholder: t`Purpose of this request or letter`
    },
    keyPoints: {
      label: t`Key Points to Highlight`,
      type: 'textarea',
      placeholder: t`Important points you want emphasized`
    },
    // Apology & Complaint
    situation: {
      label: t`Situation Description`,
      type: 'textarea',
      placeholder: t`Describe what happened`
    },
    impact: {
      label: t`Impact`,
      type: 'textarea',
      placeholder: t`Describe the impact or consequences`
    },
    resolution: {
      label: t`Proposed Resolution`,
      type: 'textarea',
      placeholder: t`How you plan to resolve the situation`
    },
    // Appreciation & Personal
    recipient: {
      label: t`Recipient`,
      type: 'text',
      placeholder: t`Name of the person or organization`
    },
    reason: {
      label: t`Reason for Appreciation`,
      type: 'textarea',
      placeholder: t`Why you are expressing appreciation`
    },
    // Personal/Family Letters
    personalContext: {
      label: t`Personal Context`,
      type: 'textarea',
      placeholder: t`Background information or context`
    },
    familyUpdates: {
      label: t`Family Updates`,
      type: 'textarea',
      placeholder: t`Recent family news or updates`
    },
    personalNews: {
      label: t`Personal News`,
      type: 'textarea',
      placeholder: t`Your personal updates and news`
    },
    emotionalTone: {
      label: t`Emotional Tone`,
      type: 'text',
      placeholder: t`e.g., Warm and caring, Formal, Casual`
    },
    // Visa & Travel
    travelPurpose: {
      label: t`Travel Purpose`,
      type: 'textarea',
      placeholder: t`Reason for travel or visa application`
    },
    destination: {
      label: t`Destination`,
      type: 'text',
      placeholder: t`Country and city you are traveling to`
    },
    duration: {
      label: t`Duration of Stay`,
      type: 'text',
      placeholder: t`e.g., 2 weeks, 6 months, 1 year`
    },
    supportingDocs: {
      label: t`Supporting Documents`,
      type: 'textarea',
      placeholder: t`Documents you are submitting with application`
    },
    accommodation: {
      label: t`Accommodation Details`,
      type: 'textarea',
      placeholder: t`Where you will be staying`
    },
    financialSupport: {
      label: t`Financial Support`,
      type: 'textarea',
      placeholder: t`How your trip will be funded`
    },
    returnPlans: {
      label: t`Return Plans`,
      type: 'textarea',
      placeholder: t`Your plans to return home`
    },
    // Complaint & Resolution
    issue: {
      label: t`Issue Description`,
      type: 'textarea',
      placeholder: t`Detailed description of the problem`
    },
    productService: {
      label: t`Product/Service`,
      type: 'text',
      placeholder: t`Product or service involved`
    },
    desiredResolution: {
      label: t`Desired Resolution`,
      type: 'textarea',
      placeholder: t`What you would like to happen`
    },
    // General Correspondence
    keyInformation: {
      label: t`Key Information`,
      type: 'textarea',
      placeholder: t`Main points or information to include`
    },
    // Job Specific
    position: {
      label: t`Position/Role`,
      type: 'text',
      placeholder: t`eg: Software Engineer, Marketing Manager, Research Assistant...`
    },
    hiringManager: {
      label: t`Hiring Manager/Recipient Name`,
      type: 'text',
      placeholder: t`Name of the hiring manager or recipient`
    },
    jobDescription: {
      label: t`Job Description/Requirements`,
      type: 'textarea',
      placeholder: t`Key requirements and responsibilities from job description`
    },
    programName: {
      label: t`Program Name`,
      type: 'text',
      placeholder: t`Name of the program or opportunity`
    },
    institution: {
      label: t`Institution/Organization`,
      type: 'text',
      placeholder: t`Name of the institution or organization`
    },
    fieldOfStudy: {
      label: t`Field of Study`,
      type: 'text',
      placeholder: t`Your academic or professional field`
    },
    department: {
      label: t`Department`,
      type: 'text',
      placeholder: t`Specific department or division`
    }
  };
  
  const fieldInfo = fieldConfig[field] || {
    label: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
    type: 'text',
    placeholder: t`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`
  };
  
  // Fields that should be stored as arrays (comma-separated lists)
  // These are typically short, discrete items like skills or coursework
  const arrayStorageFields = ['skills', 'relevantCoursework', 'negotiationPoints', 'keyPoints'];
  
  // Fields that should remain as strings with all formatting preserved
  // These are longer text fields where users need full formatting control
  const textStorageFields = [
    'experience', 'achievements', 'careerGoals', 
    'academicAchievements', 'researchInterests', 'professionalSummary',
    'collaborationDetails', 'currentOffer', 'jobDescription',
    'situation', 'impact', 'resolution', 'reason',
    'personalContext', 'familyUpdates', 'personalNews',
    'travelPurpose', 'supportingDocs', 'accommodation',
    'financialSupport', 'returnPlans', 'issue',
    'desiredResolution', 'keyInformation', 'purpose',
     // New business partnership textarea fields
    'proposalPurpose', 'proposedBenefits', 'partnershipScope',
    'proposedTimeline', 'rolesAndResponsibilities', 'financialTerms',
    'confidentialityClause', 'disputeResolution', 'exitTerms'
  ];
  
  // Rest of your renderField code remains the same...
  if (fieldInfo.type === 'textarea') {
    const shouldStoreAsArray = arrayStorageFields.includes(field);
    const shouldStoreAsText = textStorageFields.includes(field);
    
    // For ALL textareas, we want to display the value exactly as it should appear
    // No transformation for display - just show what's stored
    let displayValue = '';
    
    if (shouldStoreAsArray && Array.isArray(value)) {
      // If it's stored as an array, join with commas for display
      displayValue = value.join(', ');
    } else if (typeof value === 'string') {
      // If it's stored as a string, show it directly (preserves all commas, spaces, newlines)
      displayValue = value;
    } else if (Array.isArray(value)) {
      // Fallback for any other arrays
      displayValue = value.join(', ');
    } else {
      displayValue = '';
    }
    
    return (
      <div key={field}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {fieldInfo.label} {fieldInfo.required && '*'}
          {shouldStoreAsArray && (
            <span className="text-xs text-gray-500 ml-2">
              {t`(Separate items with commas)`}
            </span>
          )}
          {shouldStoreAsText && (
            <span className="text-xs text-gray-500 ml-2">
              {t`(Spaces, commas, and line breaks are preserved)`}
            </span>
          )}
        </label>
        <textarea
          value={displayValue}
          onChange={(e) => {
            const newValue = e.target.value;
            
            if (shouldStoreAsArray) {
              // For array-stored fields: only split on commas when saving
              if (newValue.includes(',')) {
                const arrayValue = newValue
                  .split(',')
                  .map(item => item.trim())
                  .filter(Boolean);
                onChange(field, arrayValue);
              } else {
                // If no commas, store as single-item array
                onChange(field, newValue.trim() ? [newValue] : []);
              }
            } else {
              // For text-stored fields: store exactly as typed
              // This preserves ALL characters: spaces, commas, newlines, etc.
              onChange(field, newValue);
            }
          }}
          onBlur={(e) => {
            // Only clean up array fields on blur
            if (shouldStoreAsArray) {
              const currentValue = e.target.value;
              if (currentValue.includes(',')) {
                const cleanArray = currentValue
                  .split(',')
                  .map(item => item.trim())
                  .filter(Boolean);
                onChange(field, cleanArray);
                // Update display to show clean comma-separated format
                e.target.value = cleanArray.join(', ');
              } else {
                const singleItem = currentValue.trim();
                onChange(field, singleItem ? [singleItem] : []);
                e.target.value = singleItem;
              }
            }
            // For text fields: NO TRANSFORMATION on blur
            // This preserves all user formatting
          }}
          rows={4}
          className="w-full text-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder={fieldInfo.placeholder}
        />
        {shouldStoreAsArray && Array.isArray(value) && value.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {value.length} {t`item${value.length !== 1 ? 's' : ''}`} {t`entered`}
          </div>
        )}
      </div>
    );
  }
  
  // For regular input fields
  const shouldStoreAsArray = arrayStorageFields.includes(field);
  
  return (
    <div key={field}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {fieldInfo.label} {fieldInfo.required && '*'}
        {shouldStoreAsArray && (
          <span className="text-xs text-gray-500 ml-2">
            {t`(Separate with commas)`}
          </span>
        )}
      </label>
      <input
        type={fieldInfo.type}
        required={fieldInfo.required}
        value={Array.isArray(value) ? value.join(', ') : value || ''}
        onChange={(e) => {
          if (shouldStoreAsArray) {
            const newValue = e.target.value;
            if (newValue.includes(',')) {
              const arrayValue = newValue
                .split(',')
                .map(item => item.trim())
                .filter(Boolean);
              onChange(field, arrayValue);
            } else {
              onChange(field, newValue.trim() ? [newValue] : []);
            }
          } else {
            onChange(field, e.target.value);
          }
        }}
        onBlur={(e) => {
          if (shouldStoreAsArray) {
            const currentValue = e.target.value;
            if (currentValue.includes(',')) {
              const cleanArray = currentValue
                .split(',')
                .map(item => item.trim())
                .filter(Boolean);
              onChange(field, cleanArray);
              e.target.value = cleanArray.join(', ');
            } else {
              const singleItem = currentValue.trim();
              onChange(field, singleItem ? [singleItem] : []);
              e.target.value = singleItem;
            }
          }
        }}
        className="w-full px-4 py-3 text-gray-700 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={fieldInfo.placeholder}
      />
      {shouldStoreAsArray && Array.isArray(value) && value.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          {value.length} {t`item${value.length !== 1 ? 's' : ''}`} {t`entered`}
        </div>
      )}
    </div>
  );
};
 // Step 1: Welcome Screen
if (currentStep === 'welcome') {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center space-y-12 py-16">
        {/* Hero Section with Animated Elements */}
        <div className="relative">
          {/* Floating Background Elements */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -top-10 -right-20 w-60 h-60 bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/4 w-32 h-32 bg-indigo-200/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
         
        
          {/* Main Heading */}
          <CardTitle className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
            {t`Craft Letters That`}
            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t`Open Doors`}
            </span>
          </CardTitle>
          {/* Subtitle */}
          <CardDescription className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
            {t`Transform your communication with AI-powered precision. From job applications to professional correspondence, create letters that make`} <span className="font-semibold text-purple-600 dark:text-purple-400">{t`lasting impressions`}</span>.
          </CardDescription>
        </div>
        {/* CTA Section */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t`Ready to Make Your Mark?`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t`Join thousands of professionals who've transformed their communication with our AI-powered platform.`}
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
                {t`Start Creating Now`}
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
           <Button
              variant="outline"
              size="lg"
              onClick={() => {
                onCancel(); // Call the existing onCancel function if needed
                navigate('/docs/#letter-builder'); // Navigate to the letter builder docs
              }}
              className="px-8 py-6 text-lg rounded-2xl border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            >
              {t`Get Help`}
            </Button>
          </div>
          {/* Security Badge */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400 pt-4">
            <Shield className="w-4 h-4 text-green-500" />
            <span>{t`Secure & Confidential • No Spam`}</span>
          </div>
        </div>
        {/* Value Proposition Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {[
            {
              icon: <Zap className="w-8 h-8" />,
              title: t`Lightning Fast`,
              description: t`Generate professional letters in minutes, not hours`,
              stats: t`Save 80% time`,
              color: "from-yellow-500 to-orange-500"
            },
            {
              icon: <Target className="w-8 h-8" />,
              title: t`Precision Crafted`,
              description: t`Tailored content for every scenario and audience`,
              stats: t`12+ categories`,
              color: "from-green-500 to-teal-500"
            },
            {
              icon: <Award className="w-8 h-8" />,
              title: t`Professional Quality`,
              description: t`Industry-standard templates that impress recruiters`,
              stats: t`98% success rate`,
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
              { number: "10K+", label: t`Letters Generated` },
              { number: "95%", label: t`User Satisfaction` },
              { number: "12+", label: t`Letter Categories` },
              { number: "2min", label: t`Average Creation Time` }
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
    <div className="max-w-7xl mx-auto py-8">
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
        <span>{t`Back to Welcome`}</span>
      </Button>
    </div>
   
    {/* Main title and description */}
    <div className="text-center space-y-3">
      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        {t`Choose Your Letter Type`}
      </CardTitle>
      <CardDescription className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
        {t`Select the category that best matches your purpose. We'll customize the experience and templates specifically for your needs.`}
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
                    {t`Select`}
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
      <div className="max-w-7xl mx-auto">
        {/* <Card className="border-0 shadow-xl"> */}
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep('category')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t`Back`}
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
                      {t`How would you like to provide your information?`}
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
                      {t`Enter Details Manually`}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                      {t`Fill in the specific information needed for your ${selectedCategory.toLowerCase()}. We'll show you only the relevant fields.`}
                    </p>
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 text-left w-full">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>{t`Category-specific fields only`}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>{t`Full control over content`}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>{t`Optimized for ${selectedCategory.toLowerCase()}`}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Edit3 className="w-4 h-4 mr-2" />
                      {t`Start Filling Details`}
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
                    toast.error(t`Resume service is currently unavailable.`);
                  } else {
                    toast.error(t`No resumes found. Please create a resume first.`);
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
                      {t`Import from Resume`}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                      {t`Quickly import your information from an existing resume and review the imported data.`}
                    </p>
                   
                    {isLoadingResumes ? (
                      <div className="w-full py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">{t`Loading resumes...`}</p>
                      </div>
                    ) : hasResumes ? (
                      <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 text-left w-full">
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>{t`Auto-fill from ${resumes.length} resume${resumes.length !== 1 ? 's' : ''}`}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>{t`Edit imported data before generating`}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>{t`Quick setup with full control`}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-orange-600 dark:text-orange-400 w-full py-4">
                        <FileText className="w-6 h-6 mx-auto mb-2" />
                        <p>{t`No resumes found`}</p>
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
                      {hasResumes ? t`Import from Resume` : t`No Resumes Available`}
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
      <div className="max-w-7xl mx-auto">
        {/* <Card className="border-0 shadow-xl"> */}
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep('input-method')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t`Back`}
                </Button>
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 bg-${config.color}-100 dark:bg-${config.color}-900 rounded-full flex items-center justify-center`}>
                    {getCategoryIcon(selectedCategory)}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedCategory} {t`Details`}
                    </CardTitle>
                    <CardDescription>
                      {inputMethod === 'manual'
                        ? t`Provide the information needed for your ${selectedCategory.toLowerCase()}`
                        : t`Review and edit your imported information`
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
                  {showImportedData ? t`Hide Preview Data` : t`Show Preview Data`}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Resume Selection (only for resume mode) */}
              {inputMethod === 'resume' && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                    {t`Select Resume to Import From`}
                  </h3>
                  {isLoadingResumes ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-2"></div>
                      <p className="text-gray-600 dark:text-gray-400">{t`Loading your resumes...`}</p>
                    </div>
                  ) : (
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800"
                    >
                      <option value="">{t`Choose a resume to import from...`}</option>
                      {resumes?.map(resume => {
                        const resumeData = resume.data as any;
                        const basics = resumeData.basics || {};
                        return (
                          <option key={resume.id} value={resume.id}>
                            {basics.name || t`Untitled`} - {resume.title}
                            {resumeData.skills?.length > 0 && ` • ${resumeData.skills.length} ${t`skills`}`}
                            {resumeData.work?.length > 0 && ` • ${resumeData.work.length} ${t`positions`}`}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              )}
              {/* Resume Data Preview */}
              {inputMethod === 'resume' && selectedResumeId && showImportedData && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-1">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                      {t`Imported Resume Data Preview`}
                    </h3>
                    <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">{t`Data Imported`}</span>
                    </div>
                  </div>
                 
                  {/* Resume-like Structured Layout */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800 overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-green-50 dark:bg-green-900/30 px-6 py-4 border-b border-green-200 dark:border-green-700">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {formData.userData.name || t`Your Name`}
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
                            {t`Skills & Qualifications`}
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
                            {t`Professional Experience`}
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
                            {t`Achievements & Projects`}
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
                          <div className="text-xs text-gray-500 dark:text-gray-400">{t`Skills`}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formData.userData.experience?.length || 0}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{t`Experiences`}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formData.userData.achievements?.length || 0}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{t`Achievements`}</div>
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
                          <div className="text-xs text-gray-500 dark:text-gray-400">{t`Contact Info`}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center">
                      <Edit3 className="w-4 h-4 mr-2" />
                      <strong>{t`Tip:`}</strong> {t`You can edit any of the imported data in the fields below before generating your letter.`}
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
                      {t`Your Information`}
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
                        ? t`Job Information`
                        : selectedCategory.includes('Recommendation') || selectedCategory.includes('Appreciation')
                        ? t`Recipient Information`
                        : t`Letter Details`
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
                    {t`Additional Instructions (Optional)`}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {t`Provide specific guidance to tailor your letter exactly how you want it.`}
                  </p>
                  
                  <textarea
                    value={formData.customInstructions}
                    onChange={(e) => handleInputChange('customInstructions', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-white dark:bg-gray-800"
                    placeholder={t`Specific guidance for your ${selectedCategory.toLowerCase()}... Address particular requirements or concerns`}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {t`Please here you make sure to specify all the requirements.`}
                  </p>
                </div>
              </div>
              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={() => setCurrentStep('input-method')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t`Back`}
                </Button>
                <Button
                  onClick={() => setCurrentStep('configuration')}
                  disabled={!formData.userData.name.trim()}
                >
                  {t`Continue to Configuration`}
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
       <div className="max-w-7xl mx-auto py-8">
        {/* <Card className="border-0 shadow-xl"> */}
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep('data-input')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t`Back`}
                </Button>
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 bg-${config.color}-100 dark:bg-${config.color}-900 rounded-full flex items-center justify-center`}>
                    {getCategoryIcon(selectedCategory)}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      {t`Final Configuration`}
                    </CardTitle>
                    <CardDescription>
                      {t`Review your settings and generate your ${selectedCategory.toLowerCase()}`}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Letter Configuration */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  {t`Letter Configuration`}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t`Letter Title *`}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={`w-full px-4 py-3 border text-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={`e.g., ${selectedCategory} for ${formData.jobData.company || t`Target Company`}`}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Palette className="w-4 h-4 inline mr-1" />
                        {t`Writing Style`}
                      </label>
                      <select
                        value={formData.style}
                        onChange={(e) => handleInputChange('style', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                      >
                        <option value="Professional">{t`Professional`}</option>
                        <option value="Modern">{t`Modern`}</option>
                        <option value="Traditional">{t`Traditional`}</option>
                        <option value="Executive">{t`Executive`}</option>
                        <option value="Creative">{t`Creative`}</option>
                        <option value="Minimalist">{t`Minimalist`}</option>
                        <option value="Academic">{t`Academic`}</option>
                        <option value="Technical">{t`Technical`}</option>
                      </select>
                    </div>
                   {/* Template Selection Button */}
                    {/* Template Selection - Simple Button */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Layout className="w-4 h-4 inline mr-1" />
                        {t`Letter Template`}
                      </label>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowTemplateSelector(true)}
                        className="w-full justify-between px-4 py-3 h-auto"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center flex-shrink-0">
                            <Layout className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">
                              {formData.layout 
                                ? templates.find(t => t.id === formData.layout)?.name || t`Selected Template`
                                : t`Choose a template...`
                              }
                            </div>
                            {formData.layout && (
                              <div className="text-xs text-gray-500">
                                {templates.find(t => t.id === formData.layout)?.style || ''}
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </Button>
                      
                      {formData.layout && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-500" />
                          {t`Template selected`} • {t`Click to change`}
                        </div>
                      )}
                    </div>

                  </div>

                  {/*LANGUAGE OVERRIDE HERE */}
                  <div className="lg:col-span-2 mt-4">
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center flex-shrink-0">
                          <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t`Language Override (Optional)`}
                          </label>
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={languageOverride}
                              onChange={(e) => setLanguageOverride(e.target.value)}
                              placeholder={t`e.g., Spanish, French, German (leave empty for auto-detection)`}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
                            />
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                              <p className="flex items-center">
                                <Info className="w-3 h-3 mr-1" />
                                {t`By default, the system auto-detects language from your inputs.`}
                              </p>
                              <p className="flex items-center">
                                <Zap className="w-3 h-3 mr-1 text-green-500" />
                                {t`Examples: "Spanish", "French", "German", "Italian"`}
                              </p>
                              <p className="flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1 text-amber-500" />
                                {t`Use this only if you want to override the auto-detection.`}
                              </p>
                            </div>
                            
                            {/* Show current language detection hint */}
                            {!languageOverride && (
                              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  <strong>{t`Auto-detection active:`}</strong> {t`The letter will be generated in the same language as your inputs.`}
                                </p>
                              </div>
                            )}
                            
                            {/* Show override confirmation */}
                            {languageOverride && (
                              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
                                <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                                  {t`✓ Language override set to:`} <span className="font-bold">{languageOverride}</span>
                                </p>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                                  {t`The letter will be generated in ${languageOverride}, regardless of input language.`}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
           

                </div>
              </div>
              {/* Preview Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t`Ready to Generate!`}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>{t`Category:`}</strong> {selectedCategory}
                  </div>
                  <div>
                    <strong>{t`Style:`}</strong> {formData.style}
                  </div>
                  <div>
                    <strong>{t`Template:`}</strong> {templates.find(t => t.layout === formData.layout)?.name || t`Professional`}
                  </div>
                  <div>
                    <strong>{t`Input Method:`}</strong> {inputMethod === 'manual' ? t`Manual Entry` : t`Resume Import`}
                  </div>
                </div>
              </div>


              {/* Submit Button */}
                <StatusDisplay />

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={() => setCurrentStep('data-input')} className="w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t`Back to Details`}
                </Button>
                
                {/* Coin Balance Display */}
                <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {balance} <span className="text-gray-500 dark:text-gray-400">coins</span>
                  </span>
                  <Crown className="w-4 h-4 text-yellow-400" />
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button variant="outline" onClick={onCancel} disabled={processStatus.state === 'processing' || processStatus.state === 'reserving'} className="flex-1 sm:flex-none">
                    {t`Cancel`}
                  </Button>
                  
                  <Button
                    type="submit"
                    ref={generateButtonRef}
                    disabled={processStatus.state === 'processing' || processStatus.state === 'reserving' || processStatus.state === 'checking' || isGenerating}
                    onClick={handleSubmit}
                    className="w-full sm:w-auto py-3 px-4 sm:px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {processStatus.state === 'processing' || processStatus.state === 'reserving' || isGenerating ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span className="whitespace-nowrap text-sm sm:text-base">
                          {processStatus.state === 'reserving' ? t`Processing...` : t`Generating...`}
                        </span>
                      </span>
                    ) : processStatus.state === 'checking' ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="whitespace-nowrap text-sm sm:text-base">
                          {t`Checking...`}
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <Wand2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="font-bold text-sm sm:text-base">
                          {t`Generate Letter`}
                        </span>
                        <span className="text-xs sm:text-sm bg-white/20 px-2 py-0.5 rounded-full">
                          {GENERATE_COST} coins
                        </span>
                      </span>
                    )}
                  </Button>
                </div>
              </div>
        </form>
      </CardContent>
    {/* </Card> */}

      <CoinConfirmPopover
      open={showCoinPopover}
      onClose={() => {
        setShowCoinPopover(false);
        setPendingAction(null);
        setProcessStatus({ state: 'idle' });
      }}
      required={GENERATE_COST}
      balance={balance}
      onConfirm={handleCoinConfirm}
      onBuyCoins={handleBuyCoins}
      title={t`Generate ${selectedCategory}`}
      description={t`Generate your professional ${selectedCategory?.toLowerCase()} with AI-powered customization. ${GENERATE_COST} coins will be deducted from your balance.`}
      actionType="generate"
      triggerRef={generateButtonRef}
    />

        {/* Template Selector Modal */}
{showTemplateSelector && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t`Select a Template`}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t`Choose a design for your ${selectedCategory?.toLowerCase() || 'letter'}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplateSelector(false)}
            className="rounded-full"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Template Grid - Scrollable */}
      <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
        {isLoadingTemplates ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {t`Loading templates...`}
            </p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <Layout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t`No Templates Available`}
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              {t`No templates found for ${selectedCategory}. Try a different category.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => {
              const isSelected = formData.layout === template.id;
              const imageUrl = `/templates/jpg/letters/${template.id}.jpg`;

              return (
                <div
                  key={template.id}
                  onClick={() => {
                    handleInputChange('layout', template.id);
                    setShowTemplateSelector(false);
                  }}
                  className={`group cursor-pointer rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg'
                  }`}
                >
                  {/* Template Image */}
                  <div className="relative aspect-[1/1.4142] overflow-hidden rounded-t-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                    <img
                      src={imageUrl}
                      alt={template.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.opacity = "0";
                        const parent = img.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                              <Layout class="w-12 h-12 text-gray-400 mb-3" />
                              <div class="text-lg font-bold text-gray-600">${template.name}</div>
                              <div class="text-sm text-gray-500 mt-1">${template.style}</div>
                              <div class="text-xs text-gray-400 mt-2">Preview not available</div>
                            </div>
                          `;
                        }
                      }}
                    />
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-blue-600 text-white rounded-full p-2 shadow-lg">
                          <Check className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {template.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {template.description || `${template.style} style template`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full ${
                          template.style === 'Professional' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          template.style === 'Creative' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          template.style === 'Modern' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {template.style}
                        </span>
                        {template.premium && (
                          <span className="text-xs px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                            ⭐ Premium
                          </span>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant={isSelected ? "primary" : "outline"}
                        className={isSelected ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        {isSelected ? t`Selected` : t`Choose`}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formData.layout ? (
              <span>
                {t`Selected:`}{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {templates.find(t => t.id === formData.layout)?.name}
                </span>
              </span>
            ) : (
              t`No template selected`
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowTemplateSelector(false)}
            >
              {t`Cancel`}
            </Button>
            <Button
              onClick={() => {
                if (formData.layout) {
                  setShowTemplateSelector(false);
                }
              }}
              disabled={!formData.layout}
            >
              {t`Confirm Selection`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      </div>

      
    );

    
  }
  return null;
};