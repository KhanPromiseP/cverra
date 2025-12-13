// cover-letter/templates/template.registry.ts
import { CoverLetterStyle } from '@prisma/client';

export interface TemplateStructure {
  // headerAlignment: 'left' | 'center' | 'right';
  // contactInfoPosition: 'header' | 'sidebar' | 'footer' | 'separate' | 'minimal' | 'detailed';
  contactInfoPosition: 'left' | 'center' | 'right' | 'none'; 
  datePosition: 'left' | 'right' | 'none';
  greetingAlignment: 'left' | 'center' | 'right';
  paragraphSpacing: 'compact' | 'balanced' | 'generous' | 'creative' | 'minimal' | 'traditional' | 'academic' | 'technical';
  signatureAlignment: 'left' | 'center' | 'right';
  
  // Make these optional since not all templates need them
  recipientInfoPosition?: 'left' | 'center' | 'right' | 'none';  
  subjectLinePosition?: 'left' | 'center' | 'right' | 'none';   
  
  includeAddress?: boolean;
  showSubjectLine?: boolean;
  includeAddresseeInfo?: boolean;
  showCompanyLogo?: boolean;
  lineHeight?: 'tight' | 'normal' | 'relaxed';
  marginSize?: 'small' | 'medium' | 'large';
  fontStyle?: 'serif' | 'sans-serif' | 'modern' | 'classic';

  subjectLineStyle?: {
    textTransform?: 'uppercase' | 'capitalize' | 'lowercase' | 'none';
    textDecoration?: 'underline' | 'bold' | 'italic' | 'none';
    fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter';
    fontSize?: 'small' | 'normal' | 'large' | 'x-large';
    textAlign?: 'left' | 'center' | 'right';
  };

  borderStyle?: {
    enabled?: boolean;
    type?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    width?: 'thin' | 'medium' | 'thick' | 'custom';
    color?: string;
    radius?: 'none' | 'small' | 'medium' | 'large';
    sides?: 'all' | 'top-bottom' | 'left-right' | 'top' | 'bottom';
    // NEW: Margin from the edge of the page
    margin?: number; // pixels from edge
    padding?: number; // internal padding
  };

  backgroundStyle?: {
    type?: 'solid' | 'gradient' | 'pattern' | 'none';
    color?: string;
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      direction?: 'to right' | 'to bottom' | 'to bottom right' | '45deg';
    };
    opacity?: number;
  };
  
}

export interface CoverLetterTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  style: CoverLetterStyle;
  description: string;
  premium: boolean;
  layout: string;
  structure: TemplateStructure;
  recommendedFor?: string[];
  tags?: string[];
  idealFor?: string[];
  features?: string[];
  isFeatured?: boolean;
  isPopular?: boolean;
  usageCount?: number;
  
}

export type TemplateCategory = 
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

export class TemplateRegistry {
  private static readonly templates: CoverLetterTemplate[] = [
    // ==================== JOB APPLICATION TEMPLATES ====================
    {
      id: 'modern-professional',
      name: 'Modern Professional',
      category: 'Job Application',
      style: CoverLetterStyle.Modern,
      description: 'Clean, contemporary design optimized for tech and corporate job applications',
      premium: false,
      layout: 'modern',
      structure: {
        // headerAlignment: 'right',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
         subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'underline',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Technology', 'Corporate', 'Startups', 'Professional Services'],
      tags: ['modern', 'professional', 'tech', 'corporate'],
      idealFor: ['Software Engineers', 'Marketing Professionals', 'Project Managers'],
      features: ['Clean lines', 'Professional spacing', 'Modern typography'],
      isFeatured: true, 
      isPopular: true, 
      usageCount: 50

    },

    
    {
  id: 'executive-leadership',
  name: 'Executive Leadership',
  category: 'Job Application',
  style: CoverLetterStyle.Executive,
  description: 'Sophisticated layout for executive-level positions with premium styling',
  premium: true,
  layout: 'executive',
  structure: {
    contactInfoPosition: 'right',
    datePosition: 'right',
    greetingAlignment: 'left',
    paragraphSpacing: 'balanced',
    signatureAlignment: 'left',
    subjectLinePosition: 'center',
    recipientInfoPosition: 'left',
    includeAddress: true,
    includeAddresseeInfo: true,
    showSubjectLine: true,
    lineHeight: 'normal',
    marginSize: 'large',
    fontStyle: 'serif',
    
    // Subject line styling - UPPERCASE and underlined
    subjectLineStyle: {
      textTransform: 'uppercase',
      textDecoration: 'underline',
      fontWeight: 'bold',
      fontSize: 'normal',
      textAlign: 'center'
    },
    
    // Border - full border around page
    borderStyle: {
      enabled: true,
      type: 'solid',
      width: 'medium',
      color: '#000000',
      radius: 'medium',
      sides: 'all',
      margin: 10,
      padding: 5
    },
    
    // Background - subtle gradient
    backgroundStyle: {
      type: 'gradient',
      gradient: {
        type: 'linear',
        colors: ['white', '#e4e8f0'],
        direction: "45deg"
      },
      opacity: 1
  },
  
  },
  recommendedFor: ['Executives', 'Senior Management', 'Leadership Roles'],
  tags: ['executive', 'leadership', 'sophisticated', 'premium'],
  idealFor: ['CEOs', 'Directors', 'Senior Managers'],
  features: ['Sophisticated design', 'Executive appeal', 'Premium styling'],
  isFeatured: true,
  isPopular: true,
  usageCount: 500

},

    {
      id: 'creative-showcase',
      name: 'Creative Showcase',
      category: 'Job Application',
      style: CoverLetterStyle.Creative,
      description: 'Innovative layout perfect for creative roles and design positions',
      premium: false,
      layout: 'creative',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Design', 'Marketing', 'Creative Industries', 'Advertising'],
      tags: ['creative', 'innovative', 'design', 'modern'],
      idealFor: ['Graphic Designers', 'Content Creators', 'Marketing Managers'],
      features: ['Creative layout', 'Visual appeal', 'Modern design elements'],
      isFeatured: true, 
      isPopular: true, 
      usageCount: 50

    },
    {
      id: 'technical-expert',
      name: 'Technical Expert',
      category: 'Job Application',
      style: CoverLetterStyle.Technical,
      description: 'Structured layout emphasizing technical skills, projects, and certifications',
      premium: false,
      layout: 'technical',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Engineering', 'IT', 'Data Science', 'Technical Roles'],
      tags: ['technical', 'structured', 'detailed', 'engineering'],
      idealFor: ['Software Developers', 'Data Scientists', 'IT Specialists'],
      features: ['Technical focus', 'Structured sections', 'Skill emphasis'],
      isFeatured: true, 
      isPopular: true, 
      usageCount: 50
    },

    // ==================== INTERNSHIP APPLICATION TEMPLATES ====================
    {
      id: 'student-enthusiast',
      name: 'Student Enthusiast',
      category: 'Internship Application',
      style: CoverLetterStyle.Modern,
      description: 'Youthful yet professional layout optimized for student internship applications',
      premium: false,
      layout: 'student',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'left',
        datePosition: 'left',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['College Students', 'Recent Graduates', 'Entry-level Positions'],
      tags: ['student', 'enthusiastic', 'modern', 'youthful'],
      idealFor: ['College Students', 'Recent Graduates', 'First-time Applicants'],
      features: ['Student-friendly', 'Modern appeal', 'Professional yet approachable'],
      isFeatured: true, 
      isPopular: true, 
      usageCount: 50

    },
    {
      id: 'academic-achiever',
      name: 'Academic Achiever',
      category: 'Internship Application',
      style: CoverLetterStyle.Academic,
      description: 'Formal layout highlighting academic achievements and research experience',
      premium: false,
      layout: 'academic',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Research Internships', 'Academic Programs', 'Laboratory Positions'],
      tags: ['academic', 'research', 'formal', 'detailed'],
      idealFor: ['Research Assistants', 'Lab Interns', 'Academic Researchers'],
      features: ['Academic focus', 'Research emphasis', 'Formal structure'],
      isFeatured: true, 
      isPopular: false,
      usageCount: 50

    },

    // ==================== SCHOLARSHIP/ACADEMIC REQUEST TEMPLATES ====================
    {
      id: 'scholarship-formal',
      name: 'Scholarship Formal',
      category: 'Scholarship/Academic Request',
      style: CoverLetterStyle.Academic,
      description: 'Highly formal layout for scholarship applications and academic funding requests',
      premium: false,
      layout: 'scholarship',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Scholarships', 'Grants', 'Research Funding', 'Academic Awards'],
      tags: ['scholarship', 'academic', 'formal', 'funding'],
      idealFor: ['Scholarship Applicants', 'Research Grant Seekers', 'Academic Award Candidates'],
      features: ['Formal academic style', 'Professional presentation', 'Funding focus']
    },
    {
      id: 'research-proposal',
      name: 'Research Proposal',
      category: 'Scholarship/Academic Request',
      style: CoverLetterStyle.Technical,
      description: 'Structured layout for research proposals and academic project funding',
      premium: true,
      layout: 'research',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Research Proposals', 'Academic Projects', 'Scientific Funding'],
      tags: ['research', 'technical', 'proposal', 'academic'],
      idealFor: ['Researchers', 'PhD Candidates', 'Academic Project Leaders'],
      features: ['Research-focused', 'Technical details', 'Project emphasis']
    },

    // ==================== BUSINESS PARTNERSHIP PROPOSAL TEMPLATES ====================
    {
      id: 'corporate-partnership',
      name: 'Corporate Partnership',
      category: 'Business Partnership Proposal',
      style: CoverLetterStyle.Executive,
      description: 'Professional business layout for corporate partnership proposals and collaborations',
      premium: true,
      layout: 'corporate',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Business Partnerships', 'Corporate Collaborations', 'Strategic Alliances'],
      tags: ['corporate', 'partnership', 'executive', 'professional'],
      idealFor: ['Business Owners', 'Executives', 'Partnership Managers'],
      features: ['Corporate professionalism', 'Partnership focus', 'Executive appeal']
    },
    {
      id: 'startup-collaboration',
      name: 'Startup Collaboration',
      category: 'Business Partnership Proposal',
      style: CoverLetterStyle.Modern,
      description: 'Modern, dynamic layout for startup collaborations and innovative partnerships',
      premium: false,
      layout: 'startup',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Startups', 'Innovative Companies', 'Tech Partnerships'],
      tags: ['startup', 'modern', 'collaboration', 'innovative'],
      idealFor: ['Startup Founders', 'Innovation Managers', 'Tech Entrepreneurs'],
      features: ['Modern startup vibe', 'Innovation focus', 'Dynamic layout']
    },

    // ==================== CONTRACT / OFFER NEGOTIATION TEMPLATES ====================
    {
      id: 'negotiation-professional',
      name: 'Negotiation Professional',
      category: 'Contract / Offer Negotiation',
      style: CoverLetterStyle.Professional,
      description: 'Balanced, professional layout for contract negotiations and offer discussions',
      premium: false,
      layout: 'negotiation',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Contract Negotiations', 'Salary Discussions', 'Offer Letters'],
      tags: ['negotiation', 'professional', 'balanced', 'formal'],
      idealFor: ['Job Candidates', 'Contractors', 'Freelancers'],
      features: ['Professional negotiation tone', 'Balanced structure', 'Formal yet approachable']
    },
    {
      id: 'executive-negotiation',
      name: 'Executive Negotiation',
      category: 'Contract / Offer Negotiation',
      style: CoverLetterStyle.Executive,
      description: 'Sophisticated layout for high-level contract negotiations and executive offers',
      premium: true,
      layout: 'executive-negotiation',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'relaxed',
        marginSize: 'large',
        fontStyle: 'serif'
      },
      recommendedFor: ['Executive Contracts', 'High-level Negotiations', 'Board Positions'],
      tags: ['executive', 'negotiation', 'premium', 'formal'],
      idealFor: ['Executives', 'Senior Managers', 'Board Members'],
      features: ['Executive presence', 'Premium negotiation style', 'Formal authority']
    },

    // ==================== RECOMMENDATION REQUEST TEMPLATES ====================
    {
      id: 'professional-recommendation',
      name: 'Professional Recommendation',
      category: 'Recommendation Request',
      style: CoverLetterStyle.Professional,
      description: 'Polite, professional layout for requesting recommendations from colleagues and supervisors',
      premium: false,
      layout: 'recommendation',
      structure: {
        //  headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Professional References', 'Job Applications', 'Academic Programs'],
      tags: ['recommendation', 'professional', 'request', 'polite'],
      idealFor: ['Job Seekers', 'Graduate Applicants', 'Professional Candidates'],
      features: ['Polite tone', 'Professional request', 'Clear structure']
    },
    {
      id: 'academic-reference',
      name: 'Academic Reference',
      category: 'Recommendation Request',
      style: CoverLetterStyle.Academic,
      description: 'Formal academic layout for requesting references from professors and academic mentors',
      premium: false,
      layout: 'academic-reference',
      structure: {
        //  headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'serif'
      },
      recommendedFor: ['Academic References', 'Graduate School', 'Research Positions'],
      tags: ['academic', 'reference', 'formal', 'educational'],
      idealFor: ['Students', 'Researchers', 'Academic Applicants'],
      features: ['Academic formality', 'Respectful tone', 'Educational focus']
    },

    // ==================== APOLOGY LETTER TEMPLATES ====================
    {
      id: 'sincere-apology',
      name: 'Sincere Apology',
      category: 'Apology Letter',
      style: CoverLetterStyle.Traditional,
      description: 'Formal yet sincere layout for professional apology letters',
      premium: false,
      layout: 'apology',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'relaxed',
        marginSize: 'medium',
        fontStyle: 'serif'
      },
      recommendedFor: ['Professional Apologies', 'Customer Service', 'Business Communications'],
      tags: ['apology', 'sincere', 'formal', 'professional'],
      idealFor: ['Customer Service', 'Business Professionals', 'Service Providers'],
      features: ['Sincere tone', 'Professional apology', 'Appropriate spacing']
    },
    {
      id: 'personal-apology',
      name: 'Personal Apology',
      category: 'Apology Letter',
      style: CoverLetterStyle.Minimalist,
      description: 'Simple, heartfelt layout for personal apology letters',
      premium: false,
      layout: 'personal-apology',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Personal Relationships', 'Informal Apologies', 'Friendly Communications'],
      tags: ['personal', 'apology', 'simple', 'heartfelt'],
      idealFor: ['Personal Use', 'Friendly Apologies', 'Informal Situations'],
      features: ['Personal tone', 'Simple structure', 'Heartfelt approach']
    },

    // ==================== APPRECIATION LETTER TEMPLATES ====================
    {
      id: 'heartfelt-appreciation',
      name: 'Heartfelt Appreciation',
      category: 'Appreciation Letter',
      style: CoverLetterStyle.Traditional,
      description: 'Warm, traditional layout for expressing genuine appreciation and gratitude',
      premium: false,
      layout: 'appreciation',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'relaxed',
        marginSize: 'medium',
        fontStyle: 'serif'
      },
      recommendedFor: ['Thank You Notes', 'Professional Gratitude', 'Personal Appreciation'],
      tags: ['appreciation', 'gratitude', 'warm', 'traditional'],
      idealFor: ['Professional Thanks', 'Personal Appreciation', 'Gratitude Expressions'],
      features: ['Warm tone', 'Generous spacing', 'Heartfelt structure']
    },
    {
      id: 'professional-thanks',
      name: 'Professional Thanks',
      category: 'Appreciation Letter',
      style: CoverLetterStyle.Professional,
      description: 'Professional layout for business appreciation and corporate thank you letters',
      premium: false,
      layout: 'professional-thanks',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Business Relationships', 'Corporate Thanks', 'Professional Networks'],
      tags: ['professional', 'thanks', 'business', 'corporate'],
      idealFor: ['Business Partners', 'Colleagues', 'Professional Contacts'],
      features: ['Professional gratitude', 'Business-appropriate', 'Corporate tone']
    },

    // ==================== LETTER TO PARENT/RELATIVE TEMPLATES ====================
    {
      id: 'family-warmth',
      name: 'Family Warmth',
      category: 'Letter to Parent/Relative',
      style: CoverLetterStyle.Traditional,
      description: 'Warm, traditional layout for heartfelt letters to family members',
      premium: false,
      layout: 'family',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'relaxed',
        marginSize: 'large',
        fontStyle: 'serif'
      },
      recommendedFor: ['Family Communications', 'Personal Letters', 'Heartfelt Messages'],
      tags: ['family', 'warm', 'personal', 'traditional'],
      idealFor: ['Parents', 'Relatives', 'Close Family Friends'],
      features: ['Warm family tone', 'Generous spacing', 'Traditional appeal']
    },
    {
      id: 'modern-family',
      name: 'Modern Family',
      category: 'Letter to Parent/Relative',
      style: CoverLetterStyle.Modern,
      description: 'Contemporary layout for modern family communications and updates',
      premium: false,
      layout: 'modern-family',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Modern Families', 'Contemporary Communications', 'Casual Updates'],
      tags: ['modern', 'family', 'contemporary', 'casual'],
      idealFor: ['Younger Relatives', 'Modern Family Dynamics', 'Casual Family Updates'],
      features: ['Modern style', 'Casual yet respectful', 'Contemporary design']
    },

    // ==================== VISA REQUEST / EMBASSY LETTER TEMPLATES ====================
    {
      id: 'official-visa',
      name: 'Official Visa Request',
      category: 'Visa Request / Embassy Letter',
      style: CoverLetterStyle.Traditional,
      description: 'Highly formal layout for official visa applications and embassy correspondence',
      premium: false,
      layout: 'visa-official',
      structure: {
        //  headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'large',
        fontStyle: 'serif'
      },
      recommendedFor: ['Visa Applications', 'Embassy Correspondence', 'Official Government Requests'],
      tags: ['visa', 'official', 'formal', 'government'],
      idealFor: ['Visa Applicants', 'International Travelers', 'Official Requests'],
      features: ['Government formal', 'Official tone', 'Traditional structure']
    },
    {
      id: 'business-visa',
      name: 'Business Visa',
      category: 'Visa Request / Embassy Letter',
      style: CoverLetterStyle.Professional,
      description: 'Professional layout for business visa applications and corporate travel requests',
      premium: true,
      layout: 'business-visa',
      structure: {
        //  headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Business Travel', 'Corporate Visa Applications', 'Professional Visits'],
      tags: ['business', 'visa', 'professional', 'corporate'],
      idealFor: ['Business Travelers', 'Corporate Employees', 'Professional Visitors'],
      features: ['Business professional', 'Corporate appeal', 'Professional visa approach']
    },

    // ==================== COMPLAINT LETTER TEMPLATES ====================
    {
      id: 'professional-complaint',
      name: 'Professional Complaint',
      category: 'Complaint Letter',
      style: CoverLetterStyle.Professional,
      description: 'Professional, firm layout for formal complaints and service issues',
      premium: false,
      layout: 'complaint',
      structure: {
        //  headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Customer Complaints', 'Service Issues', 'Formal Grievances'],
      tags: ['complaint', 'professional', 'formal', 'firm'],
      idealFor: ['Customers', 'Clients', 'Service Users'],
      features: ['Professional complaint tone', 'Clear structure', 'Appropriate firmness']
    },
    {
      id: 'executive-complaint',
      name: 'Executive Complaint',
      category: 'Complaint Letter',
      style: CoverLetterStyle.Executive,
      description: 'Sophisticated layout for high-level complaints and executive communications',
      premium: true,
      layout: 'executive-complaint',
      structure: {
        //  headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'relaxed',
        marginSize: 'large',
        fontStyle: 'serif'
      },
      recommendedFor: ['Executive Complaints', 'High-level Issues', 'Corporate Grievances'],
      tags: ['executive', 'complaint', 'premium', 'corporate'],
      idealFor: ['Executives', 'Senior Managers', 'Corporate Leaders'],
      features: ['Executive authority', 'Premium complaint style', 'Corporate professionalism']
    },

    // ==================== GENERAL OFFICIAL CORRESPONDENCE TEMPLATES ====================
    {
      id: 'universal-professional',
      name: 'Universal Professional',
      category: 'General Official Correspondence',
      style: CoverLetterStyle.Professional,
      description: 'Versatile professional layout for various official communications and business correspondence',
      premium: false,
      layout: 'universal',
      structure: {
        //  headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['General Business', 'Official Communications', 'Professional Correspondence'],
      tags: ['universal', 'professional', 'versatile', 'business'],
      idealFor: ['General Use', 'Business Communications', 'Official Letters'],
      features: ['Versatile application', 'Professional tone', 'Balanced structure']
    },
    {
      id: 'minimalist-official',
      name: 'Minimalist Official',
      category: 'General Official Correspondence',
      style: CoverLetterStyle.Minimalist,
      description: 'Clean, minimalist layout for straightforward official communications',
      premium: false,
      layout: 'minimalist-official',
      structure: {
        //  headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'tight',
        marginSize: 'small',
        fontStyle: 'sans-serif'
      },
      recommendedFor: ['Simple Communications', 'Direct Messages', 'Minimalist Correspondence'],
      tags: ['minimalist', 'simple', 'direct', 'clean'],
      idealFor: ['Quick Communications', 'Direct Messages', 'Simple Official Letters'],
      features: ['Minimalist design', 'Clean lines', 'Direct approach']
    },
    {
      id: 'traditional-formal',
      name: 'Traditional Formal',
      category: 'General Official Correspondence',
      style: CoverLetterStyle.Traditional,
      description: 'Classic traditional layout for formal official correspondence and traditional communications',
      premium: false,
      layout: 'traditional-formal',
      structure: {
        // headerAlignment: 'left',
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left', // Added for formal letters
        subjectLinePosition: 'center', // Added for formal letters
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true, // Critical for formal letters
        showSubjectLine: true, // New field
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'serif'
      },
      recommendedFor: ['Traditional Communications', 'Formal Letters', 'Classic Correspondence'],
      tags: ['traditional', 'formal', 'classic', 'time-honored'],
      idealFor: ['Traditional Organizations', 'Formal Communications', 'Classic Business'],
      features: ['Traditional elegance', 'Formal structure', 'Classic appeal']
    }
  ];

  static getAllTemplates(): CoverLetterTemplate[] {
    return this.templates;
  }

  static getTemplateById(id: string): CoverLetterTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  static getTemplatesByCategory(category: TemplateCategory): CoverLetterTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  static getTemplatesByStyle(style: CoverLetterStyle): CoverLetterTemplate[] {
    return this.templates.filter(template => template.style === style);
  }

  static getTemplatesByTag(tag: string): CoverLetterTemplate[] {
    return this.templates.filter(template => 
      template.tags?.includes(tag.toLowerCase())
    );
  }

  static getCategories(): TemplateCategory[] {
    return Array.from(new Set(this.templates.map(template => template.category)));
  }

  static getPremiumTemplates(): CoverLetterTemplate[] {
    return this.templates.filter(template => template.premium);
  }

  static getFreeTemplates(): CoverLetterTemplate[] {
    return this.templates.filter(template => !template.premium);
  }

  static getTemplatesForPurpose(purpose: string): CoverLetterTemplate[] {
    return this.templates.filter(template => 
      template.recommendedFor?.some(rec => 
        rec.toLowerCase().includes(purpose.toLowerCase())
      ) ||
      template.idealFor?.some(ideal => 
        ideal.toLowerCase().includes(purpose.toLowerCase())
      ) ||
      template.tags?.some(tag => 
        tag.toLowerCase().includes(purpose.toLowerCase())
      )
    );
  }

  static getFeaturedTemplates(): CoverLetterTemplate[] {
    return this.templates.filter(template => 
      ['modern-professional', 'executive-leadership', 'universal-professional'].includes(template.id)
    );
  }

  

  static getPopularTemplates(): CoverLetterTemplate[] {
    // These are commonly used templates across categories
    return this.templates.filter(template => 
      ['modern-professional', 'student-enthusiast', 'professional-recommendation', 'universal-professional'].includes(template.id)
    );
  }

  static searchTemplates(query: string): CoverLetterTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.category.toLowerCase().includes(lowerQuery) ||
      template.style.toLowerCase().includes(lowerQuery) ||
      template.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      template.recommendedFor?.some(rec => rec.toLowerCase().includes(lowerQuery)) ||
      template.idealFor?.some(ideal => ideal.toLowerCase().includes(lowerQuery)) ||
      template.features?.some(feature => feature.toLowerCase().includes(lowerQuery))
    );
  }

  static validateTemplateStructure(structure: TemplateStructure): boolean {
    const requiredFields = ['headerAlignment', 'contactInfoPosition', 'datePosition', 'greetingAlignment', 'paragraphSpacing', 'signatureAlignment'];
    return requiredFields.every(field => field in structure);
  }

  static getTemplateStats() {
    const total = this.templates.length;
    const byCategory = this.getCategories().reduce((acc, category) => {
      acc[category] = this.getTemplatesByCategory(category).length;
      return acc;
    }, {} as Record<string, number>);
    
    const premiumCount = this.getPremiumTemplates().length;
    const freeCount = this.getFreeTemplates().length;

    return {
      total,
      byCategory,
      premiumCount,
      freeCount,
      premiumPercentage: Math.round((premiumCount / total) * 100)
    };
  }
}