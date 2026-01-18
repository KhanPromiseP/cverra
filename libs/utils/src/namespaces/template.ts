// export const templatesList = [

//    "sovereign",
//    "apex",
//    "imperial",
//    "vanguard",
//    "vertex",
//    "meridian",
//    "ascend",
//    "clarity",
//    "legacy",
//    "prestige",
//    "noble",
//    "regal"
// ] as const;

// export type Template = (typeof templatesList)[number];



// templates-list.ts
export const templatesList = [
  "sovereign",
  "apex",
  "imperial",
  "vanguard",
  "vertex",
  "meridian",
  "ascend",
  "clarity",
  "legacy",
  "prestige",
  "noble",
  "regal"
] as const;

export type Template = (typeof templatesList)[number];

// Extended templates data with categories
export const templatesData = {
  resumes: templatesList.map(id => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    category: getCategory(id)
  })),
  
  letters: [
    { id: "professional", name: "Professional", category: "business" },
    { id: "modern", name: "Modern", category: "contemporary" },
    { id: "classic", name: "Classic", category: "traditional" },
    { id: "minimal", name: "Minimal", category: "clean" },
    { id: "executive", name: "Executive", category: "formal" },
  ] as const,
} as const;

// Helper function to categorize templates
function getCategory(id: string): string {
  const categories: Record<string, string> = {
    sovereign: "modern",
    apex: "modern", 
    imperial: "classic",
    vanguard: "modern",
    vertex: "creative",
    meridian: "classic",
    ascend: "modern",
    clarity: "minimal",
    legacy: "classic",
    prestige: "executive",
    noble: "executive",
    regal: "executive"
  };
  
  return categories[id] || "modern";
}

export type TemplateType = keyof typeof templatesData;
export type ResumeTemplate = (typeof templatesData.resumes)[number];
export type LetterTemplate = (typeof templatesData.letters)[number];