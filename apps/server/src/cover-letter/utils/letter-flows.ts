// server/cover-letter/utils/letter-flows.ts
export enum LetterFlowType {
  FORMAL = 'formal',
  INFORMAL = 'informal'
}

export interface LetterFlow {
  type: LetterFlowType;
  sections: string[];
  sectionInstructions: Record<string, string>;
  formattingRules: string[];
}

export const CATEGORY_FLOW_MAPPING: Record<string, LetterFlowType> = {
  // Formal Letters
  'Job Application': LetterFlowType.FORMAL,
  'Internship Application': LetterFlowType.FORMAL,
  'Scholarship/Academic Request': LetterFlowType.FORMAL,
  'Business Partnership Proposal': LetterFlowType.FORMAL,
  'Contract / Offer Negotiation': LetterFlowType.FORMAL,
  'Recommendation Request': LetterFlowType.FORMAL,
  'Visa Request / Embassy Letter': LetterFlowType.FORMAL,
  'Complaint Letter': LetterFlowType.FORMAL,
  'General Official Correspondence': LetterFlowType.FORMAL,
  
  // Informal Letters
  'Letter to Parent/Relative': LetterFlowType.INFORMAL,
  'Appreciation Letter': LetterFlowType.INFORMAL,
  'Apology Letter': LetterFlowType.INFORMAL
};

export const FORMAL_LETTER_FLOW: LetterFlow = {
  type: LetterFlowType.FORMAL,
  sections: [
    // 'HEADER',
    'CONTACT_INFO', 
    'DATE',
    'RECIPIENT_INFO',
    'SUBJECT_LINE',
    'GREETING',
    'INTRO_PARAGRAPH',
    'BODY_PARAGRAPH',
    'CLOSING_PARAGRAPH',
    'SIGNATURE_BLOCK'
  ],
  sectionInstructions: {
    // HEADER: `Include full name in a prominent, professional format. Center or left-align based on template.`,
    
    CONTACT_INFO: `Include full name email, phone number, and optionally address/LinkedIn only if provided. Format professionally on multiple lines.`,
    
    DATE: `Use full date format: "Month Day, Year". Place based on template structure (left, right, or after recipient info).`,
    
    RECIPIENT_INFO: `Include recipient's full name, title, company/organization, and full address. Format in block style:
[Recipient Full Name]
[Title/Position]
[Company/Organization Name]
[Street Address]
[City, State ZIP Code]`,
    
    SUBJECT_LINE: `Brief, clear subject indicating purpose. Format: "Subject: [Brief Purpose Description]"`,
    
    GREETING: `Formal salutation: "Dear [Title] [Last Name]," or "Dear [Title] [Full Name]," if title or name is unknown use "Dear Hiring Manager," or "Dear Selection Committee,"`,
    
    INTRO_PARAGRAPH: `State purpose clearly, mention position/opportunity, and express interest. Keep it concise and professional.`,
    
    BODY_PARAGRAPH: `Present qualifications, experience, and value proposition. Use specific examples and achievements. Maintain professional tone.`,
    
    CLOSING_PARAGRAPH: `Express appreciation, reiterate interest, and include call to action. Professional and polite. It should not be too long.`,
    
    SIGNATURE_BLOCK: `Formal closing: "Sincerely," or "Respectfully," followed by printed name, and optionally title.`
  },
  formattingRules: [
    'Use professional, formal language or anylanguage that the user used for inputting requirements throughout',
    'Maintain consistent formatting and alignment',
    'Include all necessary formal elements',
    'Proofread for grammar and spelling',
    'Use appropriate business letter conventions'
  ]
};

export const INFORMAL_LETTER_FLOW: LetterFlow = {
  type: LetterFlowType.INFORMAL,
  sections: [
    'HEADER',
    'DATE',
    'GREETING', 
    'BODY_PARAGRAPH',
    'CLOSING_PHRASE',
    'SIGNATURE'
  ],
  sectionInstructions: {
    HEADER: `Optional. If included, use simple name or return address. Less formal than business header.`,
    
    DATE: `Can use simple format: "Month Day, Year" or even "Day/Month/Year". Place at top.`,
    
    GREETING: `Warm, personal salutation: "Dear [First Name]," or "Hi [First Name]," or even "Hello [First Name],"`,
    
    BODY_PARAGRAPH: `Conversational tone, personal updates, feelings, and shared experiences. Can be more emotional and personal.`,
    
    CLOSING_PHRASE: `Warm, personal closing: "With love," or "Thinking of you," or "Take care," or "Best wishes,"`,
    
    SIGNATURE: `Simple first name or nickname. No formal title needed.`
  },
  formattingRules: [
    'Use conversational, personal language',
    'Express emotions and personal connections',
    'Can use contractions and informal expressions',
    'Focus on relationship and personal updates',
    'Less strict about formal structure'
  ]
};

export const getLetterFlow = (category: string): LetterFlow => {
  const flowType = CATEGORY_FLOW_MAPPING[category] || LetterFlowType.FORMAL;
  return flowType === LetterFlowType.FORMAL ? FORMAL_LETTER_FLOW : INFORMAL_LETTER_FLOW;
};