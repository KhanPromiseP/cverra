export const templatesList = [
  // "azurill",
 
  // "bronzor",
  // "chikorita",
  // "ditto",
  // "gengar",
  // "glalie",
  // "kakuna",
  // "leafish",
  // "nosepass",
  // "onyx",
  // "pikachu",
  // "rhyhorn",

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
