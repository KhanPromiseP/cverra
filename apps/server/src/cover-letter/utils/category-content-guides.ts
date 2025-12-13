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

  // BUSINESS PARTNERSHIP
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
  }
};