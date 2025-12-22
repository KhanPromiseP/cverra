// client/libs/resume-pricing.ts

// Resume template IDs mapped to their export costs
export const RESUME_TEMPLATE_COSTS: Record<string, number> = {
  // Executive / Authority Templates - Higher cost
  'sovereign': 35,
  'apex': 35,
  'imperial': 30,
  'vanguard': 30,
  
  // Modern / Professional Templates - Medium cost
  'vertex': 20,
  'meridian': 20,
  'ascend': 20,
  'clarity': 15,
  
  // Timeless / Trusted Templates - Standard cost
  'legacy': 25,
  'prestige': 25,
  'noble': 20,
  'regal': 20,
};

// JSON export cost (low cost)
export const JSON_EXPORT_COST = 5; // 5 coins for JSON export

// Translation costs based on resume length
export const TRANSLATION_COSTS: Record<string, number> = {
  'short': 20,    // < 500 characters
  'medium': 35,   // 500-1500 characters
  'long': 50,     // 1500-3000 characters
  'premium': 100, // > 3000 characters
};

// Calculate translation cost based on resume content
export const calculateTranslationCost = (resumeData: any): number => {
  if (!resumeData) return TRANSLATION_COSTS.medium;
  
  let totalChars = 0;
  const sections = ['basics', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'interests'];
  
  sections.forEach(section => {
    if (resumeData[section]) {
      if (typeof resumeData[section] === 'string') {
        totalChars += resumeData[section].length;
      } else if (Array.isArray(resumeData[section])) {
        resumeData[section].forEach((item: any) => {
          Object.values(item).forEach((value: any) => {
            if (typeof value === 'string') totalChars += value.length;
          });
        });
      }
    }
  });
  
  if (totalChars < 500) return TRANSLATION_COSTS.short;
  if (totalChars <= 1500) return TRANSLATION_COSTS.medium;
  if (totalChars <= 3000) return TRANSLATION_COSTS.long;
  
  return TRANSLATION_COSTS.premium;
};

// Calculate export cost based on template
export const calculateExportCost = (templateId: string): number => {
  return RESUME_TEMPLATE_COSTS[templateId] || RESUME_TEMPLATE_COSTS['vertex'];
};

// Get template display name
export const getTemplateDisplayName = (templateId: string): string => {
  const names: Record<string, string> = {
    'sovereign': 'Sovereign',
    'apex': 'Apex',
    'imperial': 'Imperial',
    'vanguard': 'Vanguard',
    'vertex': 'Vertex',
    'meridian': 'Meridian',
    'ascend': 'Ascend',
    'clarity': 'Clarity',
    'legacy': 'Legacy',
    'prestige': 'Prestige',
    'noble': 'Noble',
    'regal': 'Regal',
  };
  return names[templateId] || 'Professional';
};

// Get template category
export const getTemplateCategory = (templateId: string): string => {
  const categories: Record<string, string> = {
    'sovereign': 'Executive / Authority',
    'apex': 'Executive / Authority',
    'imperial': 'Executive / Authority',
    'vanguard': 'Executive / Authority',
    'vertex': 'Modern / Professional',
    'meridian': 'Modern / Professional',
    'ascend': 'Modern / Professional',
    'clarity': 'Modern / Professional',
    'legacy': 'Timeless / Trusted',
    'prestige': 'Timeless / Trusted',
    'noble': 'Timeless / Trusted',
    'regal': 'Timeless / Trusted',
  };
  return categories[templateId] || 'Professional';
};

// Get template description
export const getTemplateDescription = (templateId: string): string => {
  const descriptions: Record<string, string> = {
    'sovereign': 'Leadership, command, decision-makers',
    'apex': 'Top-tier, peak performance',
    'imperial': 'Senior, established professionals',
    'vanguard': 'Forward-thinking, high-impact careers',
    'vertex': 'Precision, structure, clarity',
    'meridian': 'Balance, alignment, global appeal',
    'ascend': 'Growth, progress, ambition',
    'clarity': 'Clean, ATS-friendly, recruiter-approved',
    'legacy': 'Experience, credibility, stability',
    'prestige': 'Excellence, refined presentation',
    'noble': 'Integrity, professionalism, respect',
    'regal': 'Confidence without arrogance',
  };
  return descriptions[templateId] || 'Professional template';
};