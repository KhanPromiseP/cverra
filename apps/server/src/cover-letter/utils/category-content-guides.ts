// server/cover-letter/utils/category-content-guides.ts
export const CATEGORY_CONTENT_GUIDES: Record<string, Record<string, string>> = {
  // JOB APPLICATION
  'Job Application': {
    RECIPIENT_INFO: `Hiring Manager's full name and title
Company Name 
Company Address (if applicable)
City, State ZIP Code (if applicable)

If unknown: "Hiring Manager" and company address only`,

    SUBJECT_LINE: `Application for [Position Name] Position`,

    GREETING: `Dear [Mr./Ms./Mx.] [Last Name], or "Dear Hiring Manager,"`,

    INTRO_PARAGRAPH: `Express enthusiasm for position, mention where you saw posting if provided, briefly state key qualifications with alignment with the skills and experience`,

    BODY_PARAGRAPH: `Highlight relevant experience, specific achievements, skills matching job requirements, and why you're interested in this company and maybe job as well`,

    CLOSING_PARAGRAPH: `Reiterate interest, mention availability for interview, thank for consideration professionally`
  },

  // INTERNSHIP APPLICATION
  'Internship Application': {
    RECIPIENT_INFO: `Internship Coordinator or Department Head
Company/Organization Name
Department Name (if applicable)
Address`,

    SUBJECT_LINE: `Internship Application for [Position/Department]`,

    GREETING: `Dear [Mr./Ms./Mx.] [Last Name], or "Dear Internship Coordinator,"`,

    INTRO_PARAGRAPH: `Express interest in internship, mention your academic status and field of study, state what attracts you to this opportunity`,

    BODY_PARAGRAPH: `Discuss relevant coursework, projects, skills you want to develop, how this aligns with your career goals`,

    CLOSING_PARAGRAPH: `Express eagerness to learn, mention how you can contribute despite being a student`
  },

  // BUSINESS PARTNERSHIP PROPOSAL
  'Business Partnership Proposal': {
    RECIPIENT_INFO: `[Full Name], [Title]
[Company Name]
[Address]`,

    SUBJECT_LINE: `Partnership Proposal: [Brief Description of Collaboration]`,

    GREETING: `Dear [Mr./Ms./Mx.] [Last Name],`,

    INTRO_PARAGRAPH: `Introduce yourself/company, state purpose of letter, mention mutual acquaintance or research that led to contact`,

    BODY_PARAGRAPH: `Outline proposed collaboration, benefits for both parties, your unique value proposition, suggested next steps`,

    CLOSING_PARAGRAPH: `Express enthusiasm for potential partnership, suggest meeting or call to discuss further`
  },

  // LETTER TO PARENT/RELATIVE (INFORMAL)
  'Letter to Parent/Relative': {
    GREETING: `Dear [Mom/Dad/Aunt/Uncle/First Name],`,

    BODY_PARAGRAPH: `Share personal updates, feelings, ask about their life, include specific memories or shared experiences, express care and connection`,

    CLOSING_PHRASE: `With love, or Love always, or Thinking of you, or Can't wait to see you soon,`,

    SIGNATURE: `[Your First Name or Family Nickname]`
  },

  // APPRECIATION LETTER
  'Appreciation Letter': {
    RECIPIENT_INFO: `[Full Name]
[Title/Relationship]
[Address - if formal]`,

    SUBJECT_LINE: `Thank You for [Specific Reason]`,

    GREETING: `Dear [First Name/Full Name based on relationship],`,

    INTRO_PARAGRAPH: `Express gratitude immediately, mention specific act or help you're thankful for`,

    BODY_PARAGRAPH: `Describe impact of their actions, specific details about what meant most to you, how it helped you`,

    CLOSING_PARAGRAPH: `Reiterate thanks, mention looking forward to reciprocating or continuing relationship`
  },

  // VISA/EMBASSY LETTER
  'Visa Request / Embassy Letter': {
    RECIPIENT_INFO: `Consular Officer
[Embassy/Consulate Name]
[Official Address]`,

    SUBJECT_LINE: `Visa Application for [Purpose]: [Your Full Name]`,

    GREETING: `Dear Consular Officer,`,

    INTRO_PARAGRAPH: `Formally state purpose of letter, reference your visa application number if applicable`,

    BODY_PARAGRAPH: `Provide required information: travel purpose, duration, accommodation arrangements, financial support, return plans`,

    CLOSING_PARAGRAPH: `Express respect for process, assurance of compliance with regulations, appreciation for consideration`
  },

  // ===== ADDED MISSING CATEGORIES =====

  // SCHOLARSHIP/ACADEMIC REQUEST
  'Scholarship/Academic Request': {
    RECIPIENT_INFO: `[Scholarship Name] Selection Committee
[Department Name]
[Institution Name]
[Address]`,

    SUBJECT_LINE: `Scholarship Application: [Scholarship Name] - [Your Full Name]`,

    GREETING: `Dear [Scholarship Name] Selection Committee,`,

    INTRO_PARAGRAPH: `Introduce yourself, state the scholarship you're applying for, mention your current academic status and field of study`,

    BODY_PARAGRAPH: `Highlight academic achievements, research experience, extracurricular involvement, and why you're deserving of this scholarship. Connect your goals to the scholarship's mission.`,

    CLOSING_PARAGRAPH: `Express gratitude for consideration, mention willingness to provide additional information, reaffirm your commitment to your field of study`
  },

  // COMPLAINT LETTER
  'Complaint Letter': {
    RECIPIENT_INFO: `Customer Service Department
[Company Name]
[Company Address]

If known: [Name], [Title]`,

    SUBJECT_LINE: `Complaint Regarding [Product/Service] - Order/Reference #[Number]`,

    GREETING: `Dear Customer Service Team, or "To Whom It May Concern,"`,

    INTRO_PARAGRAPH: `State the purpose clearly - you are writing to complain about a specific product or service. Include purchase date and reference numbers.`,

    BODY_PARAGRAPH: `Describe the issue in detail: what happened, when, and the impact it had. Include previous attempts to resolve the issue if applicable. Stick to facts.`,

    CLOSING_PARAGRAPH: `State your desired resolution (refund, replacement, compensation), provide a reasonable timeframe for response, and thank them for their attention`
  },

  // RECOMMENDATION REQUEST
  'Recommendation Request': {
    RECIPIENT_INFO: `[Full Name]
[Title]
[Organization]
[Address]`,

    SUBJECT_LINE: `Request for Recommendation Letter - [Your Full Name]`,

    GREETING: `Dear [Mr./Ms./Dr.] [Last Name],`,

    INTRO_PARAGRAPH: `Warm greeting, remind them who you are and your connection (e.g., "I was a student in your X class in Y year" or "I worked under your supervision at Z")`,

    BODY_PARAGRAPH: `State what you're applying for (job, graduate school, scholarship), deadline, why you're asking them specifically, and provide details about the opportunity`,

    CLOSING_PARAGRAPH: `Offer to provide any materials they need (resume, personal statement, deadline reminders), express gratitude, and give them an easy way to decline if they're unable`
  },

  // APOLOGY LETTER
  'Apology Letter': {
    RECIPIENT_INFO: `[Full Name]
[Title/Relationship]
[Address - if formal]`,

    SUBJECT_LINE: `Apology Regarding [Situation]`,

    GREETING: `Dear [Name],`,

    INTRO_PARAGRAPH: `Apologize immediately and sincerely for your specific action or mistake. No excuses or justifications.`,

    BODY_PARAGRAPH: `Acknowledge the impact of your actions on the recipient, take full responsibility, and explain (briefly and without blame) what led to the situation if context is helpful`,

    CLOSING_PARAGRAPH: `State what you'll do to make amends or prevent recurrence, humbly ask for forgiveness, and express hope for moving forward`
  },

  // CONTRACT/OFFER NEGOTIATION
  'Contract / Offer Negotiation': {
    RECIPIENT_INFO: `[Full Name], [Title]
[Company Name]
[Address]`,

    SUBJECT_LINE: `Discussion Regarding [Position] Offer - [Your Name]`,

    GREETING: `Dear [Mr./Ms./Mx.] [Last Name], or "Dear [First Name] if on first-name basis"`,

    INTRO_PARAGRAPH: `Express gratitude for the offer and enthusiasm for the role/opportunity. Set a positive, collaborative tone.`,

    BODY_PARAGRAPH: `Politely raise specific points for discussion (salary, benefits, start date, flexibility). Justify your requests with market research, experience, or specific circumstances.`,

    CLOSING_PARAGRAPH: `Reiterate your interest in the position, express confidence in reaching a mutually agreeable solution, and suggest next steps (call, meeting, further discussion)`
  },

  // GENERAL OFFICIAL CORRESPONDENCE
  'General Official Correspondence': {
    RECIPIENT_INFO: `[Full Name], [Title]
[Organization Name]
[Full Address]`,

    SUBJECT_LINE: `RE: [Brief Description of Purpose]`,

    GREETING: `Dear [Mr./Ms./Mx.] [Last Name], or "To Whom It May Concern,"`,

    INTRO_PARAGRAPH: `Clearly state the purpose of your letter: inquiry, request, response, notification, or confirmation`,

    BODY_PARAGRAPH: `Provide all relevant details, context, or information in a logical, organized manner. Use bullet points if helpful for clarity.`,

    CLOSING_PARAGRAPH: `Summarize your request or next steps, provide your contact information, thank the recipient, and indicate any expected response timeframe`
  }
};