import { CoverLetterStyle } from '@prisma/client';

export interface TemplateStructure {
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
  marginSize?: 'small' | 'medium' | 'large' | string;
  fontStyle?: 'serif' | 'sans-serif' | 'modern' | 'classic';

  subjectLineStyle?: {
    textTransform?: 'uppercase' | 'capitalize' | 'lowercase' | 'none';
    textDecoration?: 'underline' | 'bold' | 'italic' | 'none';
    fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter';
     fontSize?: 'small' | 'normal' | 'large' | 'large' | 'huge' | string;
    textAlign?: 'left' | 'center' | 'right';
  };

  borderStyle?: {
    enabled?: boolean;
    type?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    width?: 'thin' | 'medium' | 'thick' | 'custom' | string;
    color?: string;
    radius?: 'none' | 'small' | 'medium' | 'large' | string;
    sides?: 'all' | 'top-bottom' | 'left-right' | 'top' | 'bottom';
    margin?: number;
    padding?: number;
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
    // ==================== JOB APPLICATION TEMPLATES (6 Templates) ====================
    {
      id: 'modern-professional',
      name: 'Modern Professional',
      category: 'Job Application',
      style: CoverLetterStyle.Modern,
      description: 'Clean, contemporary design optimized for tech and corporate job applications',
      premium: false,
      layout: 'modern',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        subjectLineStyle: {
          textTransform: 'uppercase',
          // textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: false,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Subtle border at top and bottom
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#3498db',
          radius: 'none',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Clean white background
        backgroundStyle: {
          type: 'solid',
          color: '#ffffff',
          opacity: 1
        },
      },
      recommendedFor: ['Technology', 'Corporate', 'Startups', 'Professional Services'],
      tags: ['modern', 'professional', 'tech', 'corporate', 'clean'],
      idealFor: ['Software Engineers', 'Marketing Professionals', 'Project Managers'],
      features: ['Clean lines', 'Professional spacing', 'Modern typography', 'Subtle accent borders'],
      isFeatured: true, 
      isPopular: true, 
      usageCount: 1250
    },

    {
      id: 'executive-leadership',
      name: 'Executive Leadership',
      category: 'Job Application',
      style: CoverLetterStyle.Executive,
      description: 'Sophisticated layout for executive-level positions with premium styling and elegant borders',
      premium: true,
      layout: 'executive',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: false,
        lineHeight: 'relaxed',
        marginSize: 'small',
        fontStyle: 'serif',
        
        // Subject line styling - UPPERCASE with gold underline
        subjectLineStyle: {
          textTransform: 'uppercase',
          // textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Full border with gold accent and rounded corners
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'medium',
          color: '#c9a959',
          radius: '20px',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Premium gradient background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#fcf9f3', '#f5efe2'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Executives', 'Senior Management', 'Leadership Roles', 'Board Positions'],
      tags: ['executive', 'leadership', 'sophisticated', 'premium', 'elegant'],
      idealFor: ['CEOs', 'Directors', 'Senior Managers', 'VPs'],
      features: ['Sophisticated design', 'Executive appeal', 'Premium styling', 'Gold accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 850
    },

     {
      id: 'creative-showcase',
      name: 'Creative Portfolio',
      category: 'Job Application',
      style: CoverLetterStyle.Creative,
      description: 'Innovative, eye-catching layout perfect for creative roles with artistic flair',
      premium: false,
      layout: 'creative',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: false,
        lineHeight: 'normal',
        marginSize: 'small',
        fontStyle: 'serif',
        
        // Subject line styling - UPPERCASE with gold underline
        subjectLineStyle: {
          textTransform: 'uppercase',
          // textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'medium',
          textAlign: 'center'
        },
        
        // Full border with gold accent and rounded corners
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'medium',
          color: '#c9a959',
          radius: '20px',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Premium gradient background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#fcf9f3', '#f5efe2'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Executives', 'Senior Management', 'Leadership Roles', 'Board Positions'],
      tags: ['executive', 'leadership', 'sophisticated', 'premium', 'elegant'],
      idealFor: ['CEOs', 'Directors', 'Senior Managers', 'VPs'],
      features: ['Sophisticated design', 'Executive appeal', 'Premium styling', 'Gold accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 850
    },

 

    {
      id: 'technical-engineering',
      name: 'Technical Engineering',
      category: 'Job Application',
      style: CoverLetterStyle.Technical,
      description: 'Structured, precise layout emphasizing technical skills with blueprint-inspired design',
      premium: false,
      layout: 'technical',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'left',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'technical',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: false,
        lineHeight: 'tight',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Technical subject line styling
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },

         borderStyle: {
          enabled: false,
          type: 'double',
          width: 'medium',
          color: '#c9a959',
          radius: '20px',
          sides: 'all',
          margin: 0,
          padding: 0
        },
       
        // Technical blueprint background
        backgroundStyle: {
          type: 'solid',
          color: '#f5f8fa',
          opacity: 1
        },
      },
      recommendedFor: ['Engineering', 'IT', 'Data Science', 'Technical Roles', 'Architecture'],
      tags: ['technical', 'structured', 'detailed', 'engineering', 'precise'],
      idealFor: ['Software Developers', 'Data Scientists', 'IT Specialists', 'Engineers'],
      features: ['Technical focus', 'Structured sections', 'Skill emphasis', 'Blueprint design'],
      isFeatured: false, 
      isPopular: true, 
      usageCount: 680
    },

    {
      id: 'minimalist-clean',
      name: 'Minimalist Clean',
      category: 'Job Application',
      style: CoverLetterStyle.Minimalist,
      description: 'Ultra-clean, minimalist layout with subtle borders for a sophisticated, distraction-free presentation',
      premium: false,
      layout: 'minimalist',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'left',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'none',
        greetingAlignment: 'left',
        paragraphSpacing: 'minimal',
        signatureAlignment: 'center',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'tight',
        marginSize: 'large',
        fontStyle: 'sans-serif',
        
        // No subject line styling needed
        
    
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#dddddd',
          radius: 'none',
          sides: 'top',
          margin: 0,
          padding: 0
        },

        // Pure white background
        backgroundStyle: {
          type: 'solid',
          color: '#ffffff',
          opacity: 1
        },
      },
      recommendedFor: ['Any Industry', 'Professional Services', 'Consulting', 'Finance'],
      tags: ['minimalist', 'clean', 'simple', 'elegant', 'sophisticated'],
      idealFor: ['Consultants', 'Analysts', 'Professionals', 'Any Role'],
      features: ['Minimalist design', 'Clean lines', 'Distraction-free', 'Elegant simplicity'],
      isFeatured: false, 
      isPopular: false, 
      usageCount: 540
    },

    {
      id: 'traditional-classic',
      name: 'Traditional Classic',
      category: 'Job Application',
      style: CoverLetterStyle.Traditional,
      description: 'Timeless, formal layout with classic borders, perfect for traditional industries',
      premium: false,
      layout: 'traditional',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'traditional',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Traditional subject line styling
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Full classic border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#333333',
          radius: '6px',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Traditional cream background
        backgroundStyle: {
          type: 'solid',
          color: '#fefcf5',
          opacity: 1
        },
      },
      recommendedFor: ['Law', 'Finance', 'Government', 'Education', 'Traditional Industries'],
      tags: ['traditional', 'classic', 'formal', 'timeless', 'professional'],
      idealFor: ['Lawyers', 'Accountants', 'Educators', 'Government Officials'],
      features: ['Traditional elegance', 'Formal structure', 'Classic appeal', 'Timeless design'],
      isFeatured: true, 
      isPopular: true, 
      usageCount: 890
    },



    // ==================== INTERNSHIP APPLICATION TEMPLATES (6 Templates) ====================
    {
      id: 'internship-technical-aspirant',
      name: 'Technical Aspirant',
      category: 'Internship Application',
      style: CoverLetterStyle.Technical,
      description: 'Structured layout emphasizing technical skills, academic projects, and certifications for aspiring tech professionals',
      premium: false,
      layout: 'technical-intern',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'tight',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Technical subject line with blueprint style
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Blueprint-style border with tech accents
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#2c3e50',
          radius: 'none',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Technical grid-inspired background
        backgroundStyle: {
          type: 'solid',
          color: '#f0f4f8',
          opacity: 1
        },
      },
      recommendedFor: ['Engineering Internships', 'IT Internships', 'Data Science Internships', 'Technical Roles'],
      tags: ['technical', 'structured', 'detailed', 'engineering', 'internship'],
      idealFor: ['CS Students', 'Engineering Interns', 'Tech Interns', 'Developer Interns'],
      features: ['Technical focus', 'Project emphasis', 'Skill sections', 'Blueprint styling'],
      isFeatured: false, 
      isPopular: true, 
      usageCount: 320
    },

    {
      id: 'internship-executive-potential',
      name: 'Executive Potential',
      category: 'Internship Application',
      style: CoverLetterStyle.Executive,
      description: 'Sophisticated layout for high-potential students targeting competitive internships at top firms',
      premium: true,
      layout: 'executive-intern',
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
        
        // Executive subject line styling
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Professional border with gold accent - more subtle for interns
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#b8860b',
          radius: 'small',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },
        
        // Elegant light gradient
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#fdfaf5', '#f8f2e7'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Consulting Internships', 'Finance Internships', 'Leadership Programs', 'Competitive Roles'],
      tags: ['executive', 'leadership', 'sophisticated', 'premium', 'ambitious'],
      idealFor: ['Business Interns', 'Consulting Interns', 'Finance Interns', 'Leadership Candidates'],
      features: ['Sophisticated design', 'Executive appeal', 'Premium styling', 'Gold accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 280
    },

    {
      id: 'internship-modern-professional',
      name: 'Modern Professional Intern',
      category: 'Internship Application',
      style: CoverLetterStyle.Modern,
      description: 'Clean, contemporary design optimized for tech and corporate internship applications',
      premium: false,
      layout: 'modern-intern',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',

        // Modern accent border on left side
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#3498db',
          radius: 'none',
          sides: 'left-right',
          margin: 0,
          padding: 0
        },

        // Clean white background with slight blue tint
        backgroundStyle: {
          type: 'solid',
          color: '#ffffff',
          opacity: 1
        },
      },
      recommendedFor: ['Tech Internships', 'Corporate Internships', 'Startup Internships', 'Professional Services'],
      tags: ['modern', 'professional', 'tech', 'corporate', 'intern'],
      idealFor: ['Tech Interns', 'Business Interns', 'Marketing Interns', 'General Interns'],
      features: ['Clean lines', 'Professional spacing', 'Modern typography', 'Blue accent'],
      isFeatured: true, 
      isPopular: true, 
      usageCount: 410
    },

    // {
    //   id: 'internship-student-enthusiast',
    //   name: 'Student Enthusiast',
    //   category: 'Internship Application',
    //   style: CoverLetterStyle.Modern,
    //   description: 'Youthful yet professional layout optimized for student internship applications with motivational design',
    //   premium: false,
    //   layout: 'student-enthusiast',
    //   structure: {
    //     contactInfoPosition: 'left',
    //     datePosition: 'left',
    //     recipientInfoPosition: 'left',
    //     subjectLinePosition: 'center',
    //     greetingAlignment: 'left',
    //     paragraphSpacing: 'balanced',
    //     signatureAlignment: 'left',
    //     includeAddress: true,
    //     includeAddresseeInfo: true,
    //     showSubjectLine: true,
    //     lineHeight: 'normal',
    //     marginSize: 'medium',
    //     fontStyle: 'sans-serif',
        
    //     // Energetic subject line styling
    //     subjectLineStyle: {
    //       textTransform: 'capitalize',
    //       textDecoration: 'none',
    //       fontWeight: 'bold',
    //       fontSize: 'large',
    //       textAlign: 'center'
    //     },
        
    //     // Playful dotted border at bottom
    //     borderStyle: {
    //       enabled: false,
    //       type: 'dotted',
    //       width: 'medium',
    //       color: '#e67e22',
    //       radius: 'none',
    //       sides: 'bottom',
    //       margin: 0,
    //       padding: 0
    //     },

    //     // Fresh energetic background
    //     backgroundStyle: {
    //       type: 'gradient',
    //       gradient: {
    //         type: 'radial',
    //         colors: ['#fff9f0', '#ffe5d0'],
    //         direction: '45deg'
    //       },
    //       opacity: 1
    //     },
    //   },
    //   recommendedFor: ['College Students', 'Recent Graduates', 'Entry-level Positions', 'Internships'],
    //   tags: ['student', 'enthusiastic', 'modern', 'youthful', 'internship'],
    //   idealFor: ['College Students', 'Recent Graduates', 'First-time Applicants', 'Interns'],
    //   features: ['Student-friendly', 'Modern appeal', 'Professional yet approachable', 'Encouraging design'],
    //   isFeatured: true, 
    //   isPopular: true, 
    //   usageCount: 520
    // },

    {
      id: 'internship-academic-achiever',
      name: 'Academic Achiever',
      category: 'Internship Application',
      style: CoverLetterStyle.Academic,
      description: 'Formal academic layout highlighting GPA, research experience, and scholarly achievements',
      premium: false,
      layout: 'academic-intern',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'academic',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Formal academic subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Classic academic border - top and bottom
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'thin',
          color: '#8b4513',
          radius: 'none',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Classic paper background
        backgroundStyle: {
          type: 'solid',
          color: '#fcf8e8',
          opacity: 1
        },
      },
      recommendedFor: ['Research Internships', 'Academic Programs', 'Laboratory Positions', 'Graduate Prep'],
      tags: ['academic', 'research', 'formal', 'detailed', 'scholarly'],
      idealFor: ['Research Assistants', 'Lab Interns', 'Academic Researchers', 'Pre-grad Students'],
      features: ['Academic focus', 'Research emphasis', 'Formal structure', 'Scholarly appeal'],
      isFeatured: false, 
      isPopular: true,
      usageCount: 290
    },

    // {
    //   id: 'internship-creative-innovator',
    //   name: 'Creative Innovator',
    //   category: 'Internship Application',
    //   style: CoverLetterStyle.Creative,
    //   description: 'Innovative, eye-catching layout for creative internships in design, media, and marketing',
    //   premium: false,
    //   layout: 'creative-intern',
    //   structure: {
    //     contactInfoPosition: 'left',
    //     datePosition: 'right',
    //     recipientInfoPosition: 'left',
    //     subjectLinePosition: 'left',
    //     greetingAlignment: 'left',
    //     paragraphSpacing: 'creative',
    //     signatureAlignment: 'right',
    //     includeAddress: true,
    //     includeAddresseeInfo: true,
    //     showSubjectLine: true,
    //     lineHeight: 'normal',
    //     marginSize: 'small',
    //     fontStyle: 'modern',
        
    //     // Bold creative subject line
    //     subjectLineStyle: {
    //       textTransform: 'uppercase',
    //       textDecoration: 'none',
    //       fontWeight: 'bold',
    //       fontSize: 'large',
    //       textAlign: 'left'
    //     },
        
    //     // Asymmetrical creative border
    //     borderStyle: {
    //       enabled: true,
    //       type: 'dashed',
    //       width: 'medium',
    //       color: '#9b59b6',
    //       radius: 'large',
    //       sides: 'all',
    //       margin: 0,
    //       padding: 0
    //     },

    //     // Creative gradient background
    //     backgroundStyle: {
    //       type: 'gradient',
    //       gradient: {
    //         type: 'linear',
    //         colors: ['#f8f0ff', '#ecd9ff'],
    //         direction: 'to bottom right'
    //       },
    //       opacity: 1
    //     },
    //   },
    //   recommendedFor: ['Design Internships', 'Marketing Internships', 'Media Internships', 'Creative Roles'],
    //   tags: ['creative', 'innovative', 'design', 'artistic', 'portfolio'],
    //   idealFor: ['Design Interns', 'Marketing Interns', 'Content Creators', 'Media Interns'],
    //   features: ['Creative layout', 'Visual appeal', 'Modern design elements', 'Artistic borders'],
    //   isFeatured: true, 
    //   isPopular: false,
    //   usageCount: 210
    // },




        // ==================== SCHOLARSHIP/ACADEMIC REQUEST TEMPLATES (6 Templates) ====================
    {
      id: 'scholarship-academic-excellence',
      name: 'Academic Excellence',
      category: 'Scholarship/Academic Request',
      style: CoverLetterStyle.Academic,
      description: 'Highly formal layout emphasizing academic achievements and merit for prestigious scholarship applications',
      premium: false,
      layout: 'academic-excellence',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'academic',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'large',
        fontStyle: 'serif',
        
        // Formal academic subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Classic double border for formal academic feel
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'medium',
          color: '#2c3e50',
          radius: 'none',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Classic academic paper background
        backgroundStyle: {
          type: 'solid',
          color: '#fdf9f0',
          opacity: 1
        },
      },
      recommendedFor: ['Merit-based Scholarships', 'Academic Awards', 'Honors Programs', 'Prestigious Grants'],
      tags: ['scholarship', 'academic', 'formal', 'merit', 'prestigious'],
      idealFor: ['Honor Students', 'Valedictorians', 'Academic High-achievers', 'Merit Scholars'],
      features: ['Formal academic style', 'Merit emphasis', 'Professional presentation', 'Classic design'],
      isFeatured: true,
      isPopular: true,
      usageCount: 450
    },

    {
      id: 'scholarship-research-grant',
      name: 'Research Grant Proposal',
      category: 'Scholarship/Academic Request',
      style: CoverLetterStyle.Technical,
      description: 'Structured, detailed layout for research grant applications and scientific funding requests',
      premium: true,
      layout: 'research-grant',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'left',
        greetingAlignment: 'left',
        paragraphSpacing: 'technical',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'tight',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Technical proposal subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'left'
        },
        
        // Scientific journal-style border with left accent
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#1a5276',
          radius: 'none',
          sides: 'bottom',
          margin: 0,
          padding: 0
        },

        // Clean technical background
        backgroundStyle: {
          type: 'solid',
          color: '#f5f7fa',
          opacity: 1
        },
      },
      recommendedFor: ['Research Grants', 'Scientific Funding', 'Academic Projects', 'Laboratory Funding'],
      tags: ['research', 'technical', 'proposal', 'academic', 'scientific'],
      idealFor: ['PhD Candidates', 'Postdoctoral Researchers', 'Principal Investigators', 'Research Fellows'],
      features: ['Research-focused', 'Technical details', 'Project emphasis', 'Scientific credibility'],
      isFeatured: true,
      isPopular: true,
      usageCount: 320
    },

    {
      id: 'scholarship-need-based',
      name: 'Need-Based Scholarship',
      category: 'Scholarship/Academic Request',
      style: CoverLetterStyle.Traditional,
      description: 'Warm, personal layout for need-based scholarship applications emphasizing circumstances and potential',
      premium: false,
      layout: 'need-based',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'left',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'generous',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Personal, sincere subject line
        subjectLineStyle: {
          textTransform: 'capitalize',
          textDecoration: 'none',
          fontWeight: 'normal',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Soft, approachable border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#7f8c8d',
          radius: 'small',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Warm, approachable background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#fef9e7', '#fcf3cf'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Need-based Scholarships', 'Financial Aid Applications', 'Hardship Scholarships'],
      tags: ['need-based', 'personal', 'sincere', 'financial-aid', 'compassionate'],
      idealFor: ['First-generation Students', 'Low-income Students', 'Hardship Cases', 'Financial Aid Applicants'],
      features: ['Personal tone', 'Financial need emphasis', 'Compassionate design', 'Sincere presentation'],
      isFeatured: false,
      isPopular: true,
      usageCount: 380
    },

    {
      id: 'scholarship-graduate-fellowship',
      name: 'Graduate Fellowship',
      category: 'Scholarship/Academic Request',
      style: CoverLetterStyle.Executive,
      description: 'Sophisticated, premium layout for graduate fellowships and advanced academic funding',
      premium: true,
      layout: 'graduate-fellowship',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'large',
        fontStyle: 'serif',
        
        // Distinguished subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Elegant gold border for prestige
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'thin',
          color: '#b7950b',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Prestigious cream gradient
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#fef9e7', '#fae5d3'],
            direction: 'to bottom right'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Graduate Fellowships', 'Doctoral Funding', 'Masters Scholarships', 'Postgraduate Awards'],
      tags: ['graduate', 'fellowship', 'premium', 'advanced', 'prestigious'],
      idealFor: ['Graduate Students', 'PhD Candidates', 'Masters Students', 'Postgraduate Scholars'],
      features: ['Sophisticated design', 'Graduate focus', 'Premium styling', 'Gold accents'],
      isFeatured: true,
      isPopular: false,
      usageCount: 210
    },

    {
      id: 'scholarship-athletic',
      name: 'Athletic Scholarship',
      category: 'Scholarship/Academic Request',
      style: CoverLetterStyle.Modern,
      description: 'Dynamic, energetic layout for athletic scholarship applications highlighting sports achievements and academics',
      premium: false,
      layout: 'athletic-scholarship',
      structure: {
        contactInfoPosition: 'center',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Bold, energetic subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Dynamic double border - top and bottom
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#e67e22',
          radius: 'none',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Energetic gradient background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#fef5e7', '#fdebd0'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Athletic Scholarships', 'Sports Grants', 'Student-athlete Funding'],
      tags: ['athletic', 'sports', 'energetic', 'student-athlete', 'dynamic'],
      idealFor: ['Student Athletes', 'Sports Scholars', 'Athletic Recruits', 'Team Captains'],
      features: ['Athletic focus', 'Dynamic design', 'Sports achievements emphasis', 'Energetic presentation'],
      isFeatured: false,
      isPopular: true,
      usageCount: 190
    },

    {
      id: 'scholarship-international',
      name: 'International Scholarship',
      category: 'Scholarship/Academic Request',
      style: CoverLetterStyle.Professional,
      description: 'Professional, globally-oriented layout for international scholarships and study abroad funding',
      premium: false,
      layout: 'international-scholarship',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'left',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Clear, professional subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Global-inspired border with blue accents
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#2874a6',
          radius: 'medium',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Clean international background
        backgroundStyle: {
          type: 'solid',
          color: '#ebf5fb',
          opacity: 1
        },
      },
      recommendedFor: ['International Scholarships', 'Study Abroad Grants', 'Foreign Study Funding', 'Global Awards'],
      tags: ['international', 'global', 'study-abroad', 'cultural', 'worldwide'],
      idealFor: ['International Students', 'Study Abroad Applicants', 'Exchange Program Candidates', 'Global Scholars'],
      features: ['International focus', 'Global appeal', 'Professional presentation', 'Cross-cultural design'],
      isFeatured: true,
      isPopular: false,
      usageCount: 165
    },
        // ==================== BUSINESS PARTNERSHIP PROPOSAL TEMPLATES (6 Templates) ====================
    {
      id: 'partnership-corporate-alliance',
      name: 'Corporate Alliance',
      category: 'Business Partnership Proposal',
      style: CoverLetterStyle.Executive,
      description: 'Professional, authoritative layout for formal corporate partnership proposals and strategic alliances',
      premium: true,
      layout: 'corporate-alliance',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'large',
        fontStyle: 'serif',
        
        // Executive-level subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Strong corporate border - navy blue all around
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#1a237e',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Professional gradient background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#f5f5f5', '#e8eaf6'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Corporate Partnerships', 'Strategic Alliances', 'Joint Ventures', 'Mergers & Acquisitions'],
      tags: ['corporate', 'partnership', 'executive', 'professional', 'alliance'],
      idealFor: ['Corporate Executives', 'Business Development Managers', 'Strategic Partners', 'Board Members'],
      features: ['Corporate professionalism', 'Strategic focus', 'Executive appeal', 'Navy blue accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 380
    },

    {
      id: 'partnership-startup-collab',
      name: 'Startup Collaboration',
      category: 'Business Partnership Proposal',
      style: CoverLetterStyle.Modern,
      description: 'Modern, dynamic layout for startup collaborations and innovative tech partnerships',
      premium: false,
      layout: 'startup-collab',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Modern, bold subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Startup-style green accent border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thick',
          color: '#2e7d32',
          radius: 'none',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Fresh, innovative background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#ffffff', '#e8f5e9'],
            direction: 'to bottom right'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Startup Partnerships', 'Tech Collaborations', 'Innovation Projects', 'Venture Building'],
      tags: ['startup', 'modern', 'collaboration', 'innovative', 'tech'],
      idealFor: ['Startup Founders', 'Innovation Managers', 'Tech Entrepreneurs', 'Venture Builders'],
      features: ['Modern startup vibe', 'Innovation focus', 'Dynamic layout', 'Green tech accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 420
    },

    {
      id: 'partnership-joint-venture',
      name: 'Joint Venture',
      category: 'Business Partnership Proposal',
      style: CoverLetterStyle.Traditional,
      description: 'Balanced, formal layout for joint venture proposals and shared business initiatives',
      premium: false,
      layout: 'joint-venture',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'left',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Professional joint venture subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Balanced top and bottom border - purple for creativity
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'thin',
          color: '#6a1b9a',
          radius: 'none',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Neutral, professional background
        backgroundStyle: {
          type: 'solid',
          color: '#fafafa',
          opacity: 1
        },
      },
      recommendedFor: ['Joint Ventures', 'Co-ventures', 'Shared Business Initiatives', 'Partnership Agreements'],
      tags: ['joint-venture', 'partnership', 'balanced', 'collaborative', 'shared'],
      idealFor: ['Business Partners', 'Co-venturers', 'Collaborative Entrepreneurs', 'Business Developers'],
      features: ['Balanced design', 'Shared focus', 'Collaborative tone', 'Purple accents'],
      isFeatured: false,
      isPopular: true,
      usageCount: 210
    },

    {
      id: 'partnership-international',
      name: 'International Partnership',
      category: 'Business Partnership Proposal',
      style: CoverLetterStyle.Professional,
      description: 'Globally-oriented layout for international business partnerships and cross-border collaborations',
      premium: true,
      layout: 'international-partnership',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // International subject line with global appeal
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Global blue border all around
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#0277bd',
          radius: 'medium',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // International sky gradient
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#e1f5fe', '#b3e5fc'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['International Partnerships', 'Cross-border Collaborations', 'Global Alliances', 'Export Partnerships'],
      tags: ['international', 'global', 'cross-border', 'worldwide', 'export'],
      idealFor: ['International Business Developers', 'Global Partnership Managers', 'Export Managers', 'Multinational Companies'],
      features: ['Global focus', 'International appeal', 'Cross-cultural design', 'Sky blue accents'],
      isFeatured: true,
      isPopular: false,
      usageCount: 150
    },

    {
      id: 'partnership-investor',
      name: 'Investor Partnership',
      category: 'Business Partnership Proposal',
      style: CoverLetterStyle.Executive,
      description: 'Premium, sophisticated layout for investor partnership proposals and funding collaborations',
      premium: true,
      layout: 'investor-partnership',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'large',
        fontStyle: 'serif',
        
        // Investment-focused subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Premium gold border for investor appeal
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'medium',
          color: '#bf9b30',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Wealthy, premium background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#fff9e6', '#f5e6d3'],
            direction: 'to bottom right'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Investor Partnerships', 'Funding Collaborations', 'Venture Capital', 'Angel Investment'],
      tags: ['investor', 'funding', 'premium', 'capital', 'wealth'],
      idealFor: ['Startups Seeking Investment', 'Companies Seeking Funding', 'Entrepreneurs', 'Business Owners'],
      features: ['Investor focus', 'Premium styling', 'Gold accents', 'Wealth appeal'],
      isFeatured: true,
      isPopular: true,
      usageCount: 280
    },

    {
      id: 'partnership-strategic',
      name: 'Strategic Partnership',
      category: 'Business Partnership Proposal',
      style: CoverLetterStyle.Professional,
      description: 'Forward-thinking layout for strategic partnerships and long-term business collaborations',
      premium: false,
      layout: 'strategic-partnership',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'left',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Strategic, forward-looking subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Modern strategic border - teal with right accent
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#00897b',
          radius: 'small',
          sides: 'left-right',
          margin: 0,
          padding: 0
        },

        // Forward-thinking gradient
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#ffffff', '#e0f2f1'],
            direction: 'to right'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Strategic Partnerships', 'Long-term Collaborations', 'Business Alliances', 'Growth Partnerships'],
      tags: ['strategic', 'forward-thinking', 'long-term', 'growth', 'alliance'],
      idealFor: ['Strategy Managers', 'Business Developers', 'Growth Hackers', 'Partnership Directors'],
      features: ['Strategic focus', 'Forward-looking design', 'Growth emphasis', 'Teal accents'],
      isFeatured: false,
      isPopular: false,
      usageCount: 190
    },

      // ==================== CONTRACT / OFFER NEGOTIATION TEMPLATES (6 Templates) ====================
    {
      id: 'negotiation-professional',
      name: 'Professional Negotiator',
      category: 'Contract / Offer Negotiation',
      style: CoverLetterStyle.Professional,
      description: 'Balanced, professional layout for standard contract negotiations and offer discussions with a confident tone',
      premium: false,
      layout: 'professional-negotiator',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Clear, direct subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Professional blue border - trustworthy
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#2c3e50',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Clean, professional background
        backgroundStyle: {
          type: 'solid',
          color: '#f8f9fa',
          opacity: 1
        },
      },
      recommendedFor: ['Contract Negotiations', 'Salary Discussions', 'Offer Letters', 'Standard Agreements'],
      tags: ['negotiation', 'professional', 'balanced', 'formal', 'confident'],
      idealFor: ['Job Candidates', 'Contractors', 'Freelancers', 'Professionals'],
      features: ['Professional negotiation tone', 'Balanced structure', 'Formal yet approachable', 'Blue accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 520
    },

    {
      id: 'negotiation-executive',
      name: 'Executive Negotiation',
      category: 'Contract / Offer Negotiation',
      style: CoverLetterStyle.Executive,
      description: 'Sophisticated, authoritative layout for high-level contract negotiations and executive compensation packages',
      premium: true,
      layout: 'executive-negotiation',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'large',
        fontStyle: 'serif',
        
        // Commanding subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Premium border with gold accents
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'medium',
          color: '#b8860b',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Executive gradient background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#fcf9f3', '#f3ede2'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Executive Contracts', 'High-level Negotiations', 'Board Positions', 'C-Suite Offers'],
      tags: ['executive', 'negotiation', 'premium', 'formal', 'authoritative'],
      idealFor: ['Executives', 'Senior Managers', 'Board Members', 'Directors'],
      features: ['Executive presence', 'Premium negotiation style', 'Formal authority', 'Gold accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 380
    },

    {
      id: 'negotiation-salary',
      name: 'Salary Negotiation',
      category: 'Contract / Offer Negotiation',
      style: CoverLetterStyle.Modern,
      description: 'Focused, modern layout specifically designed for salary negotiations and compensation discussions',
      premium: false,
      layout: 'salary-negotiation',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Compensation-focused subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Green border for financial/growth connotations
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#27ae60',
          radius: 'none',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Fresh, growth-oriented background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#ffffff', '#e8f5e9'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Salary Negotiations', 'Compensation Discussions', 'Pay Raises', 'Benefits Negotiation'],
      tags: ['salary', 'compensation', 'pay', 'benefits', 'financial'],
      idealFor: ['Job Seekers', 'Employees Seeking Raises', 'New Hires', 'Promotion Candidates'],
      features: ['Salary focus', 'Compensation emphasis', 'Modern design', 'Green financial accents'],
      isFeatured: false,
      isPopular: true,
      usageCount: 410
    },

    {
      id: 'negotiation-freelance',
      name: 'Freelance Contract',
      category: 'Contract / Offer Negotiation',
      style: CoverLetterStyle.Modern,
      description: 'Flexible, modern layout for freelance contract negotiations and independent contractor agreements',
      premium: false,
      layout: 'freelance-negotiation',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'left',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'left',
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'tight',
        marginSize: 'small',
        fontStyle: 'sans-serif',
        
        // Direct freelance subject line
        subjectLineStyle: {
          textTransform: 'capitalize',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'left'
        },
        
        // Creative purple border for freelancers
        borderStyle: {
          enabled: false,
          type: 'dashed',
          width: 'medium',
          color: '#8e44ad',
          radius: 'medium',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Creative professional background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'radial',
            colors: ['#ffffff', '#f3e5f5'],
            direction: '45deg'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Freelance Contracts', 'Independent Contractor Agreements', 'Project-based Negotiations'],
      tags: ['freelance', 'contractor', 'independent', 'project-based', 'flexible'],
      idealFor: ['Freelancers', 'Contractors', 'Consultants', 'Gig Workers'],
      features: ['Freelance focus', 'Flexible structure', 'Project emphasis', 'Purple creative accents'],
      isFeatured: false,
      isPopular: true,
      usageCount: 350
    },

    {
      id: 'negotiation-legal',
      name: 'Legal Contract Review',
      category: 'Contract / Offer Negotiation',
      style: CoverLetterStyle.Traditional,
      description: 'Formal, precise layout for legal contract reviews and formal agreement negotiations',
      premium: true,
      layout: 'legal-negotiation',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'academic',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Legal-style subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Formal legal border - burgundy
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#7b241c',
          radius: 'none',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Legal document background
        backgroundStyle: {
          type: 'solid',
          color: '#fdf2e9',
          opacity: 1
        },
      },
      recommendedFor: ['Legal Contracts', 'Formal Agreements', 'Terms Review', 'Legal Negotiations'],
      tags: ['legal', 'contract', 'formal', 'precise', 'binding'],
      idealFor: ['Legal Professionals', 'Business Owners', 'Contract Reviewers', 'Lawyers'],
      features: ['Legal precision', 'Formal structure', 'Binding tone', 'Burgundy accents'],
      isFeatured: true,
      isPopular: false,
      usageCount: 180
    },

    {
      id: 'negotiation-partnership',
      name: 'Partnership Agreement',
      category: 'Contract / Offer Negotiation',
      style: CoverLetterStyle.Professional,
      description: 'Collaborative layout for negotiating business partnership agreements and joint venture terms',
      premium: false,
      layout: 'partnership-negotiation',
      structure: {
        contactInfoPosition: 'center',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'center',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Partnership-focused subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Teal border - balance and collaboration
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#0e6251',
          radius: 'small',
          sides: 'left-right',
          margin: 0,
          padding: 0
        },

        // Collaborative background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#ffffff', '#d0ece7'],
            direction: 'to right'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Partnership Agreements', 'Joint Venture Terms', 'Business Collaborations', 'Co-founder Contracts'],
      tags: ['partnership', 'agreement', 'collaborative', 'joint-venture', 'balanced'],
      idealFor: ['Business Partners', 'Co-founders', 'Joint Venture Participants', 'Collaborative Businesses'],
      features: ['Partnership focus', 'Collaborative tone', 'Balanced structure', 'Teal accents'],
      isFeatured: false,
      isPopular: false,
      usageCount: 160
    },
        // ==================== RECOMMENDATION REQUEST TEMPLATES (6 Templates) ====================
    {
      id: 'recommendation-professional',
      name: 'Professional Reference Request',
      category: 'Recommendation Request',
      style: CoverLetterStyle.Professional,
      description: 'Polite, professional layout for requesting recommendations from colleagues, supervisors, and professional contacts',
      premium: false,
      layout: 'professional-reference',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Clear, respectful subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Professional blue border - trustworthy and respectful
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#2980b9',
          radius: 'small',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Clean, professional background
        backgroundStyle: {
          type: 'solid',
          color: '#f8faff',
          opacity: 1
        },
      },
      recommendedFor: ['Professional References', 'Job Applications', 'Career Advancement', 'Professional Networking'],
      tags: ['recommendation', 'professional', 'request', 'polite', 'reference'],
      idealFor: ['Job Seekers', 'Career Changers', 'Professionals', 'Networkers'],
      features: ['Polite tone', 'Professional request', 'Clear structure', 'Blue accents'],
      isFeatured: true, 
      isPopular: true, 
      usageCount: 580
    },

    {
      id: 'recommendation-academic',
      name: 'Academic Reference Request',
      category: 'Recommendation Request',
      style: CoverLetterStyle.Academic,
      description: 'Formal, respectful academic layout for requesting references from professors, advisors, and academic mentors',
      premium: false,
      layout: 'academic-reference',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'academic',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Formal academic subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Classic academic border - burgundy for scholarly tradition
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'thin',
          color: '#8b4513',
          radius: 'none',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Classic paper background
        backgroundStyle: {
          type: 'solid',
          color: '#fcf9f0',
          opacity: 1
        },
      },
      recommendedFor: ['Academic References', 'Graduate School', 'Research Positions', 'Scholarship Applications'],
      tags: ['academic', 'reference', 'formal', 'educational', 'scholarly'],
      idealFor: ['Students', 'Researchers', 'Graduate Applicants', 'Academic Candidates'],
      features: ['Academic formality', 'Respectful tone', 'Educational focus', 'Burgundy accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 420
    },

    {
      id: 'recommendation-graduate',
      name: 'Graduate School Request',
      category: 'Recommendation Request',
      style: CoverLetterStyle.Academic,
      description: 'Specialized layout for requesting letters of recommendation specifically for graduate school applications',
      premium: true,
      layout: 'graduate-reference',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Graduate-focused subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Prestige purple border for graduate level
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#6a1b9a',
          radius: 'small',
          sides: 'left-right',
          margin: 0,
          padding: 0
        },

        // Sophisticated gradient for graduate level
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#f5f0ff', '#e9d9ff'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Graduate School Applications', 'Masters Programs', 'PhD Applications', 'Fellowship References'],
      tags: ['graduate', 'masters', 'phd', 'fellowship', 'advanced-degree'],
      idealFor: ['Graduate Applicants', 'Masters Candidates', 'PhD Applicants', 'Fellowship Seekers'],
      features: ['Graduate focus', 'Advanced academic tone', 'Prestige styling', 'Purple accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 310
    },

    {
      id: 'recommendation-close-mentor',
      name: 'Mentor Request',
      category: 'Recommendation Request',
      style: CoverLetterStyle.Traditional,
      description: 'Warm, personal layout for requesting recommendations from close mentors and trusted advisors',
      premium: false,
      layout: 'mentor-reference',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'left',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'left',
        greetingAlignment: 'left',
        paragraphSpacing: 'generous',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Warm, personal subject line
        subjectLineStyle: {
          textTransform: 'capitalize',
          textDecoration: 'none',
          fontWeight: 'normal',
          fontSize: 'large',
          textAlign: 'left'
        },
        
        // Soft, warm border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#e67e22',
          radius: 'medium',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Warm, inviting background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'radial',
            colors: ['#fff5e6', '#ffe4cc'],
            direction: '45deg'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Mentor References', 'Close Advisors', 'Personal Recommendations', 'Long-term Relationships'],
      tags: ['mentor', 'personal', 'warm', 'trusted', 'advisor'],
      idealFor: ['Students', 'Mentees', 'Advisees', 'Long-time Colleagues'],
      features: ['Personal tone', 'Warm design', 'Respectful approach', 'Orange accents'],
      isFeatured: false,
      isPopular: true,
      usageCount: 250
    },

    {
      id: 'recommendation-urgent',
      name: 'Urgent Request',
      category: 'Recommendation Request',
      style: CoverLetterStyle.Modern,
      description: 'Direct, time-sensitive layout for requesting recommendations with approaching deadlines',
      premium: false,
      layout: 'urgent-reference',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'tight',
        marginSize: 'small',
        fontStyle: 'sans-serif',
        
        // Urgent, attention-grabbing subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'bold',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Attention-grabbing red border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thick',
          color: '#c0392b',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // High-contrast background for urgency
        backgroundStyle: {
          type: 'solid',
          color: '#fff9f9',
          opacity: 1
        },
      },
      recommendedFor: ['Urgent Deadlines', 'Last-minute Requests', 'Time-sensitive Applications', 'Emergency References'],
      tags: ['urgent', 'deadline', 'time-sensitive', 'emergency', 'quick'],
      idealFor: ['Last-minute Applicants', 'Deadline Approaching', 'Emergency Situations'],
      features: ['Urgent tone', 'Time-sensitive design', 'Attention-grabbing', 'Red accents'],
      isFeatured: false,
      isPopular: false,
      usageCount: 140
    },

    {
      id: 'recommendation-follow-up',
      name: 'Follow-up Request',
      category: 'Recommendation Request',
      style: CoverLetterStyle.Professional,
      description: 'Polite follow-up layout for gently reminding contacts about recommendation requests',
      premium: false,
      layout: 'followup-reference',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Gentle follow-up subject line
        subjectLineStyle: {
          textTransform: 'capitalize',
          textDecoration: 'none',
          fontWeight: 'normal',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Gentle, non-intrusive border
        borderStyle: {
          enabled: false,
          type: 'dotted',
          width: 'thin',
          color: '#7f8c8d',
          radius: 'small',
          sides: 'bottom',
          margin: 0,
          padding: 0
        },

        // Soft, gentle background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#ffffff', '#f2f4f4'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Follow-up Reminders', 'Gentle Nudges', 'Second Requests', 'Deadline Reminders'],
      tags: ['follow-up', 'reminder', 'gentle', 'polite', 'nudge'],
      idealFor: ['Applicants Following Up', 'Gentle Reminders', 'Second-time Requesters'],
      features: ['Gentle tone', 'Non-intrusive design', 'Polite follow-up', 'Gray accents'],
      isFeatured: false,
      isPopular: false,
      usageCount: 110
    },

      // ==================== APPRECIATION LETTER TEMPLATES (6 Templates) ====================
    {
      id: 'appreciation-heartfelt',
      name: 'Heartfelt Appreciation',
      category: 'Appreciation Letter',
      style: CoverLetterStyle.Traditional,
      description: 'Warm, sincere layout for expressing genuine gratitude and appreciation',
      premium: false,
      layout: 'heartfelt-appreciation',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'generous',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Warm appreciation subject line
        subjectLineStyle: {
          textTransform: 'capitalize',
          textDecoration: 'none',
          fontWeight: 'normal',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Warm gold border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#d4ac0d',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Warm, grateful background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'radial',
            colors: ['#fffcf0', '#fff3d6'],
            direction: '45deg'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Personal Thanks', 'Gratitude Letters', 'Appreciation Notes', 'Thank You Cards'],
      tags: ['appreciation', 'gratitude', 'warm', 'sincere', 'gold'],
      idealFor: ['Friends', 'Family', 'Mentors', 'Helpers'],
      features: ['Warm tone', 'Generous spacing', 'Heartfelt structure', 'Gold accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 520
    },

    {
      id: 'appreciation-professional',
      name: 'Professional Thanks',
      category: 'Appreciation Letter',
      style: CoverLetterStyle.Professional,
      description: 'Professional layout for business appreciation and corporate thank you letters',
      premium: false,
      layout: 'professional-thanks',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Professional thanks subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Professional blue border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#2980b9',
          radius: 'small',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Professional background
        backgroundStyle: {
          type: 'solid',
          color: '#f8faff',
          opacity: 1
        },
      },
      recommendedFor: ['Business Relationships', 'Corporate Thanks', 'Professional Networks', 'Workplace Gratitude'],
      tags: ['professional', 'thanks', 'business', 'corporate', 'blue'],
      idealFor: ['Business Partners', 'Colleagues', 'Professional Contacts', 'Clients'],
      features: ['Professional gratitude', 'Business-appropriate', 'Corporate tone', 'Blue accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 480
    },

    {
      id: 'appreciation-employee',
      name: 'Employee Recognition',
      category: 'Appreciation Letter',
      style: CoverLetterStyle.Modern,
      description: 'Modern layout for recognizing and appreciating employee contributions and achievements',
      premium: false,
      layout: 'employee-recognition',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Recognition-focused subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Recognition green border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#27ae60',
          radius: 'small',
          sides: 'bottom',
          margin: 0,
          padding: 0
        },

        // Positive, growth-oriented background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#ffffff', '#e8f8f5'],
            direction: 'to right'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Employee Recognition', 'Staff Appreciation', 'Team Thanks', 'Performance Acknowledgment'],
      tags: ['employee', 'recognition', 'staff', 'team', 'green'],
      idealFor: ['Managers', 'Team Leaders', 'HR Professionals', 'Business Owners'],
      features: ['Employee focus', 'Recognition tone', 'Positive structure', 'Green accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 350
    },

    {
      id: 'appreciation-mentor',
      name: 'Mentor Appreciation',
      category: 'Appreciation Letter',
      style: CoverLetterStyle.Traditional,
      description: 'Respectful, grateful layout for thanking mentors, teachers, and guides',
      premium: false,
      layout: 'mentor-appreciation',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'left',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'left',
        greetingAlignment: 'left',
        paragraphSpacing: 'generous',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Respectful mentor subject line
        subjectLineStyle: {
          textTransform: 'capitalize',
          textDecoration: 'none',
          fontWeight: 'normal',
          fontSize: 'large',
          textAlign: 'left'
        },
        
        // Respectful purple border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#8e44ad',
          radius: 'medium',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Wise, thoughtful background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#faf5ff', '#f0e5ff'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Mentor Thanks', 'Teacher Appreciation', 'Guide Gratitude', 'Influence Acknowledgment'],
      tags: ['mentor', 'teacher', 'guide', 'respectful', 'purple'],
      idealFor: ['Students', 'Mentees', 'Advisees', 'Learners'],
      features: ['Respectful tone', 'Grateful approach', 'Mentor focus', 'Purple accents'],
      isFeatured: false,
      isPopular: true,
      usageCount: 290
    },

    {
      id: 'appreciation-client',
      name: 'Client Appreciation',
      category: 'Appreciation Letter',
      style: CoverLetterStyle.Professional,
      description: 'Professional layout for thanking clients and maintaining strong business relationships',
      premium: true,
      layout: 'client-appreciation',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Client-focused subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Premium gold border for valuable clients
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'thin',
          color: '#bf9b30',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Premium, appreciative background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#fef9e7', '#fae5d3'],
            direction: 'to bottom right'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Client Thanks', 'Customer Appreciation', 'Business Partners', 'Key Accounts'],
      tags: ['client', 'customer', 'business', 'premium', 'gold'],
      idealFor: ['Account Managers', 'Sales Professionals', 'Business Owners', 'Client Relations'],
      features: ['Client focus', 'Premium tone', 'Relationship-building', 'Gold accents'],
      isFeatured: true,
      isPopular: false,
      usageCount: 210
    },

    {
      id: 'appreciation-volunteer',
      name: 'Volunteer Appreciation',
      category: 'Appreciation Letter',
      style: CoverLetterStyle.Modern,
      description: 'Warm, community-focused layout for thanking volunteers and community contributors',
      premium: false,
      layout: 'volunteer-appreciation',
      structure: {
        contactInfoPosition: 'center',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'center',
        paragraphSpacing: 'generous',
        signatureAlignment: 'center',
        includeAddress: false,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Community-focused subject line
        subjectLineStyle: {
          textTransform: 'capitalize',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Community orange border
        borderStyle: {
          enabled: false,
          type: 'dotted',
          width: 'medium',
          color: '#e67e22',
          radius: 'large',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Warm community background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'radial',
            colors: ['#fff4e6', '#ffe5cc'],
            direction: '45deg'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Volunteer Thanks', 'Community Recognition', 'Non-profit Gratitude', 'Service Acknowledgment'],
      tags: ['volunteer', 'community', 'non-profit', 'service', 'orange'],
      idealFor: ['Non-profit Organizations', 'Community Leaders', 'Volunteer Coordinators', 'Charity Workers'],
      features: ['Community focus', 'Warm tone', 'Inclusive structure', 'Orange accents'],
      isFeatured: false,
      isPopular: false,
      usageCount: 160
    },

      // ==================== LETTER TO PARENT/RELATIVE TEMPLATES (6 Templates) ====================
    {
      id: 'family-traditional-warmth',
      name: 'Traditional Family Warmth',
      category: 'Letter to Parent/Relative',
      style: CoverLetterStyle.Traditional,
      description: 'Warm, classic layout for heartfelt letters to parents and older relatives with a timeless feel',
      premium: false,
      layout: 'traditional-family',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'generous',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'large',
        fontStyle: 'serif',
        
        // Warm, traditional subject line
        subjectLineStyle: {
          textTransform: 'capitalize',
          textDecoration: 'none',
          fontWeight: 'normal',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Warm, homey border - soft brown
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#8b5a2b',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Warm, cozy background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'radial',
            colors: ['#fdf8f0', '#f5e6d3'],
            direction: '45deg'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Parents', 'Grandparents', 'Elderly Relatives', 'Traditional Family Letters'],
      tags: ['family', 'warm', 'traditional', 'parents', 'cozy'],
      idealFor: ['Parents', 'Grandparents', 'Aunts', 'Uncles', 'Elderly Relatives'],
      features: ['Warm family tone', 'Generous spacing', 'Traditional appeal', 'Brown accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 620
    },

    {
      id: 'family-modern-connect',
      name: 'Modern Family Connect',
      category: 'Letter to Parent/Relative',
      style: CoverLetterStyle.Modern,
      description: 'Contemporary, fresh layout for connecting with younger relatives and modern family communications',
      premium: false,
      layout: 'modern-family',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Modern, casual subject line
        subjectLineStyle: {
          textTransform: 'capitalize',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Modern teal border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#00897b',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Fresh, modern background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#ffffff', '#e0f2f1'],
            direction: 'to right'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Younger Relatives', 'Siblings', 'Cousins', 'Casual Family Updates'],
      tags: ['modern', 'family', 'contemporary', 'casual', 'teal'],
      idealFor: ['Siblings', 'Cousins', 'Nephews', 'Nieces', 'Younger Relatives'],
      features: ['Modern style', 'Casual yet respectful', 'Contemporary design', 'Teal accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 450
    },

    {
      id: 'family-special-occasion',
      name: 'Special Occasion Family Letter',
      category: 'Letter to Parent/Relative',
      style: CoverLetterStyle.Traditional,
      description: 'Celebratory layout for family letters marking special occasions like birthdays, anniversaries, and holidays',
      premium: false,
      layout: 'special-occasion',
      structure: {
        contactInfoPosition: 'center',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'center',
        paragraphSpacing: 'generous',
        signatureAlignment: 'center',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Celebratory subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Festive gold border
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'medium',
          color: '#bf9b30',
          radius: 'medium',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Celebratory gradient background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'radial',
            colors: ['#fff9e6', '#ffe4b5'],
            direction: '45deg'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Birthday Letters', 'Anniversary Messages', 'Holiday Greetings', 'Family Celebrations'],
      tags: ['special-occasion', 'celebration', 'birthday', 'anniversary', 'gold'],
      idealFor: ['Birthday Wishes', 'Anniversary Letters', 'Holiday Cards', 'Family Celebrations'],
      features: ['Celebratory tone', 'Festive design', 'Special occasion focus', 'Gold accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 380
    },

    {
      id: 'family-difficult-times',
      name: 'Comfort & Support',
      category: 'Letter to Parent/Relative',
      style: CoverLetterStyle.Traditional,
      description: 'Gentle, comforting layout for reaching out to family members during difficult times',
      premium: true,
      layout: 'comfort-support',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'left',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'left',
        greetingAlignment: 'left',
        paragraphSpacing: 'generous',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'large',
        fontStyle: 'serif',
        
        // Gentle, supportive subject line
        subjectLineStyle: {
          textTransform: 'capitalize',
          textDecoration: 'none',
          fontWeight: 'normal',
          fontSize: 'large',
          textAlign: 'left'
        },
        
        // Soft, comforting blue border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#5d6d7e',
          radius: 'large',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Calm, soothing background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#f2f4f4', '#e6e9ed'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Condolence Letters', 'Get Well Messages', 'Support Letters', 'Difficult Times'],
      tags: ['comfort', 'support', 'sympathy', 'condolence', 'gentle'],
      idealFor: ['Family in Grief', 'Ill Relatives', 'Going Through Hard Times', 'Needing Support'],
      features: ['Comforting tone', 'Gentle design', 'Supportive structure', 'Soft blue accents'],
      isFeatured: false,
      isPopular: true,
      usageCount: 280
    },

    {
      id: 'family-news-update',
      name: 'Family News & Updates',
      category: 'Letter to Parent/Relative',
      style: CoverLetterStyle.Modern,
      description: 'Clean, organized layout for sharing family news, updates, and announcements with relatives',
      premium: false,
      layout: 'news-update',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // News-focused subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Clean, organized green border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#27ae60',
          radius: 'none',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Fresh, newsy background
        backgroundStyle: {
          type: 'solid',
          color: '#f8f9f9',
          opacity: 1
        },
      },
      recommendedFor: ['Family Newsletters', 'Life Updates', 'Announcements', 'Sharing Milestones'],
      tags: ['news', 'update', 'announcement', 'family-news', 'green'],
      idealFor: ['Distant Relatives', 'Family Groups', 'Sharing Achievements', 'Life Events'],
      features: ['News-focused', 'Organized structure', 'Clear updates', 'Green accents'],
      isFeatured: false,
      isPopular: true,
      usageCount: 320
    },

    {
      id: 'family-distance',
      name: 'Letters to Distant Relatives',
      category: 'Letter to Parent/Relative',
      style: CoverLetterStyle.Traditional,
      description: 'Warm, connecting layout for reaching out to relatives who live far away',
      premium: false,
      layout: 'distant-relative',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'generous',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Connecting subject line
        subjectLineStyle: {
          textTransform: 'capitalize',
          textDecoration: 'none',
          fontWeight: 'normal',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Bridge-like purple border - connecting
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#8e44ad',
          radius: 'small',
          sides: 'left-right',
          margin: 0,
          padding: 0
        },

        // Warm, connecting background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#f5f0ff', '#e9d9ff'],
            direction: 'to right'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Distant Relatives', 'Long-distance Family', 'Staying Connected', 'Reconnecting'],
      tags: ['distant', 'long-distance', 'connecting', 'reconnecting', 'purple'],
      idealFor: ['Relatives Abroad', 'Far-away Family', 'Lost Contact Relatives', 'Keeping in Touch'],
      features: ['Connecting tone', 'Bridge design', 'Distance-spanning', 'Purple accents'],
      isFeatured: false,
      isPopular: false,
      usageCount: 190
    },

        // ==================== VISA REQUEST / EMBASSY LETTER TEMPLATES (6 Templates) ====================
    {
      id: 'visa-official-government',
      name: 'Official Government Visa Request',
      category: 'Visa Request / Embassy Letter',
      style: CoverLetterStyle.Traditional,
      description: 'Highly formal, government-standard layout for official visa applications and embassy correspondence',
      premium: false,
      layout: 'official-visa',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'academic',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'large',
        fontStyle: 'serif',
        
        // Official government-style subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Official navy blue border - government standard
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#1a237e',
          radius: 'none',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Official document background
        backgroundStyle: {
          type: 'solid',
          color: '#ffffff',
          opacity: 1
        },
      },
      recommendedFor: ['Visa Applications', 'Embassy Correspondence', 'Official Government Requests', 'Consulate Letters'],
      tags: ['visa', 'official', 'government', 'embassy', 'consulate'],
      idealFor: ['Visa Applicants', 'International Travelers', 'Official Requests', 'Embassy Communications'],
      features: ['Government formal', 'Official tone', 'Traditional structure', 'Navy accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 580
    },

    {
      id: 'visa-business-corporate',
      name: 'Corporate Business Visa',
      category: 'Visa Request / Embassy Letter',
      style: CoverLetterStyle.Professional,
      description: 'Professional, corporate layout for business visa applications and company-sponsored travel',
      premium: true,
      layout: 'business-visa',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Corporate subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Corporate blue border with company letterhead feel
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#1976d2',
          radius: 'none',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Corporate professional background
        backgroundStyle: {
          type: 'solid',
          color: '#f8faff',
          opacity: 1
        },
      },
      recommendedFor: ['Business Travel', 'Corporate Visa Applications', 'Professional Visits', 'Company-sponsored Travel'],
      tags: ['business', 'visa', 'corporate', 'professional', 'company'],
      idealFor: ['Business Travelers', 'Corporate Employees', 'Professional Visitors', 'Company Representatives'],
      features: ['Business professional', 'Corporate appeal', 'Professional visa approach', 'Blue accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 520
    },

    {
      id: 'visa-tourist',
      name: 'Tourist Visa Application',
      category: 'Visa Request / Embassy Letter',
      style: CoverLetterStyle.Professional,
      description: 'Clear, straightforward layout for tourist visa applications and travel purpose explanations',
      premium: false,
      layout: 'tourist-visa',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Clear tourist visa subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Friendly yet formal green border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#2e7d32',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Welcoming background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#ffffff', '#e8f5e9'],
            direction: 'to right'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Tourist Visas', 'Holiday Travel', 'Vacation Applications', 'Personal Travel'],
      tags: ['tourist', 'travel', 'holiday', 'vacation', 'green'],
      idealFor: ['Tourists', 'Holiday Travelers', 'Vacationers', 'Personal Travelers'],
      features: ['Clear purpose', 'Travel focus', 'Friendly formal', 'Green accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 450
    },

    {
      id: 'visa-student',
      name: 'Student Visa Application',
      category: 'Visa Request / Embassy Letter',
      style: CoverLetterStyle.Academic,
      description: 'Academic-focused layout for student visa applications and educational purpose letters',
      premium: true,
      layout: 'student-visa',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'academic',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Academic subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Academic purple border
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'thin',
          color: '#6a1b9a',
          radius: 'none',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Academic parchment background
        backgroundStyle: {
          type: 'solid',
          color: '#fcf5e8',
          opacity: 1
        },
      },
      recommendedFor: ['Student Visas', 'Study Abroad', 'Educational Travel', 'Academic Programs'],
      tags: ['student', 'academic', 'study-abroad', 'education', 'purple'],
      idealFor: ['International Students', 'Study Abroad Applicants', 'Exchange Students', 'Academic Travelers'],
      features: ['Academic focus', 'Educational tone', 'Student-friendly', 'Purple accents'],
      isFeatured: false,
      isPopular: true,
      usageCount: 380
    },

    {
      id: 'visa-family-sponsorship',
      name: 'Family Sponsorship Visa',
      category: 'Visa Request / Embassy Letter',
      style: CoverLetterStyle.Traditional,
      description: 'Warm, personal layout for family reunion visas and relative sponsorship applications',
      premium: false,
      layout: 'family-visa',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'left',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'generous',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'medium',
        fontStyle: 'serif',
        
        // Family-focused subject line
        subjectLineStyle: {
          textTransform: 'capitalize',
          textDecoration: 'none',
          fontWeight: 'normal',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Warm family orange border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#e67e22',
          radius: 'small',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Warm, family-oriented background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#fff4e6', '#ffe5cc'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Family Reunion Visas', 'Relative Sponsorship', 'Dependent Visas', 'Family-based Applications'],
      tags: ['family', 'sponsorship', 'reunion', 'dependent', 'orange'],
      idealFor: ['Family Sponsors', 'Relatives Abroad', 'Dependent Visa Applicants', 'Family Reunification'],
      features: ['Family focus', 'Warm tone', 'Personal approach', 'Orange accents'],
      isFeatured: false,
      isPopular: false,
      usageCount: 260
    },

    {
      id: 'visa-transit',
      name: 'Transit Visa Request',
      category: 'Visa Request / Embassy Letter',
      style: CoverLetterStyle.Professional,
      description: 'Concise, efficient layout for transit visa applications and airport transfer requests',
      premium: false,
      layout: 'transit-visa',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'tight',
        marginSize: 'small',
        fontStyle: 'sans-serif',
        
        // Concise transit subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Efficient gray border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#546e7a',
          radius: 'none',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Neutral, efficient background
        backgroundStyle: {
          type: 'solid',
          color: '#f5f7fa',
          opacity: 1
        },
      },
      recommendedFor: ['Transit Visas', 'Airport Transfers', 'Layover Applications', 'Short-stay Transit'],
      tags: ['transit', 'airport', 'layover', 'short-stay', 'gray'],
      idealFor: ['Transit Passengers', 'Airport Transfers', 'Layover Travelers', 'Short-stay Visitors'],
      features: ['Concise format', 'Efficient structure', 'Transit focus', 'Gray accents'],
      isFeatured: false,
      isPopular: false,
      usageCount: 170
    },

      // ==================== COMPLAINT LETTER TEMPLATES (6 Templates) ====================
    {
      id: 'complaint-professional',
      name: 'Professional Complaint',
      category: 'Complaint Letter',
      style: CoverLetterStyle.Professional,
      description: 'Professional, firm yet respectful layout for formal complaints about products, services, or issues',
      premium: false,
      layout: 'professional-complaint',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Clear, direct complaint subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Professional red border - attention-grabbing but not aggressive
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#c0392b',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Clean, professional background
        backgroundStyle: {
          type: 'solid',
          color: '#fef9f9',
          opacity: 1
        },
      },
      recommendedFor: ['Customer Complaints', 'Service Issues', 'Product Problems', 'Formal Grievances'],
      tags: ['complaint', 'professional', 'formal', 'firm', 'red'],
      idealFor: ['Customers', 'Clients', 'Service Users', 'Consumers'],
      features: ['Professional complaint tone', 'Clear structure', 'Appropriate firmness', 'Red accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 680
    },

    {
      id: 'complaint-executive',
      name: 'Executive Complaint',
      category: 'Complaint Letter',
      style: CoverLetterStyle.Executive,
      description: 'Sophisticated, authoritative layout for high-level complaints directed at senior management or executives',
      premium: true,
      layout: 'executive-complaint',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'large',
        fontStyle: 'serif',
        
        // Commanding executive subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Premium burgundy border - serious and authoritative
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'medium',
          color: '#7b241c',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Executive-grade background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#fdf2e9', '#f9e0d6'],
            direction: 'to bottom'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Executive Complaints', 'High-level Issues', 'Corporate Grievances', 'Board-level Concerns'],
      tags: ['executive', 'complaint', 'premium', 'corporate', 'burgundy'],
      idealFor: ['Executives', 'Senior Managers', 'Corporate Leaders', 'Board Members'],
      features: ['Executive authority', 'Premium complaint style', 'Corporate professionalism', 'Burgundy accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 420
    },

    {
      id: 'complaint-formal-legal',
      name: 'Formal Legal Complaint',
      category: 'Complaint Letter',
      style: CoverLetterStyle.Traditional,
      description: 'Highly formal, legally-oriented layout for serious complaints with potential legal implications',
      premium: true,
      layout: 'legal-complaint',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'academic',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'large',
        fontStyle: 'serif',
        
        // Legal-style subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Formal legal border - dark gray
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#2c3e50',
          radius: 'none',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Legal document background
        backgroundStyle: {
          type: 'solid',
          color: '#faf9f8',
          opacity: 1
        },
      },
      recommendedFor: ['Legal Complaints', 'Formal Grievances', 'Serious Issues', 'Potential Litigation'],
      tags: ['legal', 'formal', 'serious', 'grievance', 'dark-gray'],
      idealFor: ['Legal Matters', 'Serious Complaints', 'Formal Disputes', 'Official Grievances'],
      features: ['Legal formality', 'Serious tone', 'Precise structure', 'Dark gray accents'],
      isFeatured: false,
      isPopular: false,
      usageCount: 230
    },

    {
      id: 'complaint-customer-service',
      name: 'Customer Service Complaint',
      category: 'Complaint Letter',
      style: CoverLetterStyle.Professional,
      description: 'Constructive layout for customer service complaints focused on resolution and improvement',
      premium: false,
      layout: 'customer-service-complaint',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Resolution-focused subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Constructive orange border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#e67e22',
          radius: 'small',
          sides: 'left-right',
          margin: 0,
          padding: 0
        },

        // Constructive background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#ffffff', '#fef5e7'],
            direction: 'to right'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Customer Service Issues', 'Service Recovery', 'Quality Concerns', 'Feedback Complaints'],
      tags: ['customer-service', 'resolution', 'constructive', 'orange', 'feedback'],
      idealFor: ['Service Users', 'Customers', 'Clients', 'Consumers'],
      features: ['Resolution focus', 'Constructive tone', 'Service improvement', 'Orange accents'],
      isFeatured: false,
      isPopular: true,
      usageCount: 540
    },

    {
      id: 'complaint-workplace',
      name: 'Workplace Complaint',
      category: 'Complaint Letter',
      style: CoverLetterStyle.Professional,
      description: 'Confidential, professional layout for workplace complaints to HR or management',
      premium: false,
      layout: 'workplace-complaint',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'left',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Confidential subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Confidential purple border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#8e44ad',
          radius: 'small',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Confidential background
        backgroundStyle: {
          type: 'solid',
          color: '#faf5ff',
          opacity: 1
        },
      },
      recommendedFor: ['Workplace Issues', 'HR Complaints', 'Colleague Concerns', 'Employment Grievances'],
      tags: ['workplace', 'hr', 'confidential', 'employment', 'purple'],
      idealFor: ['Employees', 'Staff Members', 'Workers', 'HR Situations'],
      features: ['Confidential tone', 'Professional approach', 'Workplace focus', 'Purple accents'],
      isFeatured: false,
      isPopular: true,
      usageCount: 360
    },

    {
      id: 'complaint-product-quality',
      name: 'Product Quality Complaint',
      category: 'Complaint Letter',
      style: CoverLetterStyle.Professional,
      description: 'Detailed layout for product quality complaints with specifications and defect descriptions',
      premium: false,
      layout: 'product-complaint',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'technical',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'tight',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Product-focused subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Technical blue border for product details
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#2874a6',
          radius: 'none',
          sides: 'top-bottom',
          margin: 0,
          padding: 0
        },

        // Detailed, technical background
        backgroundStyle: {
          type: 'solid',
          color: '#f0f7fb',
          opacity: 1
        },
      },
      recommendedFor: ['Product Defects', 'Quality Issues', 'Manufacturing Complaints', 'Warranty Claims'],
      tags: ['product', 'quality', 'defect', 'warranty', 'blue'],
      idealFor: ['Product Buyers', 'Consumers', 'Warranty Claimants', 'Quality Assurance'],
      features: ['Product focus', 'Detailed structure', 'Quality emphasis', 'Blue accents'],
      isFeatured: false,
      isPopular: false,
      usageCount: 290
    },
      // ==================== GENERAL OFFICIAL CORRESPONDENCE TEMPLATES (6 Templates) ====================
    {
      id: 'official-universal',
      name: 'Universal Professional',
      category: 'General Official Correspondence',
      style: CoverLetterStyle.Professional,
      description: 'Versatile, all-purpose professional layout for various official communications and business correspondence',
      premium: false,
      layout: 'universal-official',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // Clear, professional subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Versatile blue border - works for any situation
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#2c3e50',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Clean, professional background
        backgroundStyle: {
          type: 'solid',
          color: '#f8f9fa',
          opacity: 1
        },
      },
      recommendedFor: ['General Business', 'Official Communications', 'Professional Correspondence', 'Everyday Use'],
      tags: ['universal', 'professional', 'versatile', 'business', 'blue'],
      idealFor: ['General Use', 'Business Communications', 'Official Letters', 'Professional Documents'],
      features: ['Versatile application', 'Professional tone', 'Balanced structure', 'Blue accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 850
    },

    {
      id: 'official-minimalist',
      name: 'Minimalist Official',
      category: 'General Official Correspondence',
      style: CoverLetterStyle.Minimalist,
      description: 'Clean, distraction-free minimalist layout for straightforward official communications',
      premium: false,
      layout: 'minimalist-official',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'minimal',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'tight',
        marginSize: 'small',
        fontStyle: 'sans-serif',
        
        // Minimalist subject line - clean and simple
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'normal',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Subtle gray border - barely there
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#bdc3c7',
          radius: 'none',
          sides: 'top',
          margin: 0,
          padding: 0
        },

        // Pure white background
        backgroundStyle: {
          type: 'solid',
          color: '#ffffff',
          opacity: 1
        },
      },
      recommendedFor: ['Simple Communications', 'Direct Messages', 'Minimalist Correspondence', 'Quick Letters'],
      tags: ['minimalist', 'simple', 'direct', 'clean', 'gray'],
      idealFor: ['Quick Communications', 'Direct Messages', 'Simple Official Letters', 'Internal Memos'],
      features: ['Minimalist design', 'Clean lines', 'Direct approach', 'Subtle accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 580
    },

    {
      id: 'official-traditional',
      name: 'Traditional Formal',
      category: 'General Official Correspondence',
      style: CoverLetterStyle.Traditional,
      description: 'Classic, time-honored layout for formal official correspondence and traditional communications',
      premium: false,
      layout: 'traditional-official',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'traditional',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'large',
        fontStyle: 'serif',
        
        // Traditional formal subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Classic brown border
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'thin',
          color: '#8b4513',
          radius: 'none',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Traditional parchment background
        backgroundStyle: {
          type: 'solid',
          color: '#fcf5e8',
          opacity: 1
        },
      },
      recommendedFor: ['Traditional Communications', 'Formal Letters', 'Classic Correspondence', 'Official Documents'],
      tags: ['traditional', 'formal', 'classic', 'time-honored', 'brown'],
      idealFor: ['Traditional Organizations', 'Formal Communications', 'Classic Business', 'Government Bodies'],
      features: ['Traditional elegance', 'Formal structure', 'Classic appeal', 'Brown accents'],
      isFeatured: true,
      isPopular: true,
      usageCount: 620
    },

    {
      id: 'official-executive',
      name: 'Executive Official',
      category: 'General Official Correspondence',
      style: CoverLetterStyle.Executive,
      description: 'Premium, sophisticated layout for high-level official communications and executive correspondence',
      premium: true,
      layout: 'executive-official',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'relaxed',
        marginSize: 'large',
        fontStyle: 'serif',
        
        // Executive-level subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Premium gold border
        borderStyle: {
          enabled: false,
          type: 'double',
          width: 'medium',
          color: '#bf9b30',
          radius: 'small',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Executive gold-tinted background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#fef9e7', '#f5e6d3'],
            direction: 'to bottom right'
          },
          opacity: 1
        },
      },
      recommendedFor: ['Executive Communications', 'High-level Official Letters', 'Board Correspondence', 'VIP Communications'],
      tags: ['executive', 'premium', 'sophisticated', 'high-level', 'gold'],
      idealFor: ['Executives', 'Senior Management', 'Board Members', 'VIP Communications'],
      features: ['Executive presence', 'Premium styling', 'Sophisticated design', 'Gold accents'],
      isFeatured: true,
      isPopular: false,
      usageCount: 340
    },

    {
      id: 'official-government',
      name: 'Government Official',
      category: 'General Official Correspondence',
      style: CoverLetterStyle.Traditional,
      description: 'Highly formal, government-standard layout for official communications with public sector entities',
      premium: true,
      layout: 'government-official',
      structure: {
        contactInfoPosition: 'right',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'academic',
        signatureAlignment: 'left',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'large',
        fontStyle: 'serif',
        
        // Government-style subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'large',
          textAlign: 'center'
        },
        
        // Official navy government border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'medium',
          color: '#1a237e',
          radius: 'none',
          sides: 'all',
          margin: 0,
          padding: 0
        },

        // Official document background
        backgroundStyle: {
          type: 'solid',
          color: '#ffffff',
          opacity: 1
        },
      },
      recommendedFor: ['Government Communications', 'Public Sector Letters', 'Agency Correspondence', 'Official Forms'],
      tags: ['government', 'public-sector', 'official', 'agency', 'navy'],
      idealFor: ['Government Agencies', 'Public Officials', 'Civil Servants', 'Official Departments'],
      features: ['Government standard', 'Official format', 'Public sector focus', 'Navy accents'],
      isFeatured: false,
      isPopular: true,
      usageCount: 410
    },

    {
      id: 'official-international',
      name: 'International Official',
      category: 'General Official Correspondence',
      style: CoverLetterStyle.Professional,
      description: 'Globally-oriented layout for international official communications and cross-border correspondence',
      premium: false,
      layout: 'international-official',
      structure: {
        contactInfoPosition: 'left',
        datePosition: 'right',
        recipientInfoPosition: 'left',
        subjectLinePosition: 'center',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'right',
        includeAddress: true,
        includeAddresseeInfo: true,
        showSubjectLine: true,
        lineHeight: 'normal',
        marginSize: 'medium',
        fontStyle: 'sans-serif',
        
        // International subject line
        subjectLineStyle: {
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 'normal',
          textAlign: 'center'
        },
        
        // Global teal border
        borderStyle: {
          enabled: false,
          type: 'solid',
          width: 'thin',
          color: '#00897b',
          radius: 'medium',
          sides: 'left-right',
          margin: 0,
          padding: 0
        },

        // International sky background
        backgroundStyle: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            colors: ['#ffffff', '#e0f2f1'],
            direction: 'to right'
          },
          opacity: 1
        },
      },
      recommendedFor: ['International Communications', 'Cross-border Letters', 'Global Correspondence', 'Foreign Affairs'],
      tags: ['international', 'global', 'cross-border', 'worldwide', 'teal'],
      idealFor: ['International Organizations', 'Foreign Affairs', 'Global Communications', 'Cross-border Business'],
      features: ['International focus', 'Global appeal', 'Cross-cultural design', 'Teal accents'],
      isFeatured: false,
      isPopular: false,
      usageCount: 280
    },
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