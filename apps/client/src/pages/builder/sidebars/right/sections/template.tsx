// import { t, Trans } from "@lingui/macro";
// import { AspectRatio } from "@reactive-resume/ui";
// import { cn, templatesList } from "@reactive-resume/utils";
// import { motion } from "framer-motion";
// import { useState } from "react";

// import { useResumeStore } from "@/client/stores/resume";

// import { SectionIcon } from "../shared/section-icon";

// // Define Template type based on templatesList
// type Template = (typeof templatesList)[number];

// // Template descriptions mapping
// const templateDescriptions: Record<Template, string> = {
//   sovereign: t`Leadership, command, decision-makers`,
//   apex: t`Top-tier, peak performance`,
//   imperial: t`Senior, established professionals`,
//   vanguard: t`Forward-thinking, high-impact careers`,
//   vertex: t`Precision, structure, clarity`,
//   meridian: t`Balance, alignment, global appeal`,
//   ascend: t`Growth, progress, ambition`,
//   clarity: t`Clean, ATS-friendly, recruiter-approved`,
//   legacy: t`Experience, credibility, stability`,
//   prestige: t`Excellence, refined presentation`,
//   noble: t`Integrity, professionalism, respect`,
//   regal: t`Confidence without arrogance`,
// } as const;

// // Template categories mapping
// const templateCategories: Record<Template, string> = {
//   sovereign: t`Executive / Authority`,
//   apex: t`Executive / Authority`,
//   imperial: t`Executive / Authority`,
//   vanguard: t`Executive / Authority`,
//   vertex: t`Modern / Professional`,
//   meridian: t`Modern / Professional`,
//   ascend: t`Modern / Professional`,
//   clarity: t`Modern / Professional`,
//   legacy: t`Timeless / Trusted`,
//   prestige: t`Timeless / Trusted`,
//   noble: t`Timeless / Trusted`,
//   regal: t`Timeless / Trusted`,
// } as const;

// // Template modal component
// const TemplateModal = ({
//   template,
//   isOpen,
//   onClose,
//   onSelectTemplate,
// }: {
//   template: Template;
//   isOpen: boolean;
//   onClose: () => void;
//   onSelectTemplate: (template: Template) => void;
// }) => {
//   if (!isOpen) return null;

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
//       onClick={onClose}
//     >
//       <motion.div
//         initial={{ scale: 0.9, opacity: 0, y: 20 }}
//         animate={{ scale: 1, opacity: 1, y: 0 }}
//         exit={{ scale: 0.9, opacity: 0, y: 20 }}
//         transition={{ type: "spring", damping: 25, stiffness: 300 }}
//         className="relative mx-auto max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-background p-4 shadow-2xl md:p-6"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <button
//           onClick={onClose}
//           className="absolute right-4 top-4 z-10 rounded-full bg-secondary/80 p-2 hover:bg-secondary"
//         >
//           <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//           </svg>
//         </button>

//         <div className="grid gap-8 md:grid-cols-2">
//           {/* Template Preview */}
//           <div className="space-y-4">
//             <div className="relative overflow-hidden rounded-lg border bg-secondary/20 p-4">
//               <img
//                 src={`/templates/jpg/resumes/${template}.jpg`}
//                 alt={template}
//                 className="w-full rounded-lg shadow-lg"
//               />
//               {useResumeStore.getState().resume.data.metadata.template === template && (
//                 <div className="absolute left-4 top-4 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
//                   {t`Currently Selected`}
//                 </div>
//               )}
//             </div>
//             <button
//               onClick={() => {
//                 onSelectTemplate(template);
//                 onClose();
//               }}
//               className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
//             >
//               {t`Use This Template`}
//             </button>
//           </div>

//           {/* Template Info */}
//           <div className="space-y-6">
//             <div className="space-y-2">
//               <div className="flex items-center gap-2">
//                 <div className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
//                   {templateCategories[template]}
//                 </div>
//                 <div className="text-sm text-muted-foreground">{t`Perfect for professionals`}</div>
//               </div>
//               <h2 className="text-3xl font-bold capitalize">{template}</h2>
//               <p className="text-lg text-muted-foreground">{templateDescriptions[template]}</p>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <h3 className="mb-3 text-xl font-semibold">{t`Best For`}</h3>
//                 <ul className="space-y-2">
//                   {template === "sovereign" && (
//                     <>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`C-level executives and directors`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Leadership positions requiring authority`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Decision-making roles in large organizations`}</span>
//                       </li>
//                     </>
//                   )}
//                   {template === "apex" && (
//                     <>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Top performers in competitive industries`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Showcasing peak achievements and awards`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Industries where excellence is measured`}</span>
//                       </li>
//                     </>
//                   )}
//                   {template === "imperial" && (
//                     <>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Senior professionals with 10+ years experience`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Established industry experts and consultants`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Advisory and board positions`}</span>
//                       </li>
//                     </>
//                   )}
//                   {template === "vanguard" && (
//                     <>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Innovators and disruptors in tech`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Startup founders and early employees`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Future-focused careers and emerging industries`}</span>
//                       </li>
//                     </>
//                   )}
//                   {template === "vertex" && (
//                     <>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Engineering and technical specialists`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Analysts, strategists, and planners`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Precision-focused professions`}</span>
//                       </li>
//                     </>
//                   )}
//                   {template === "meridian" && (
//                     <>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`International and global professionals`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Cross-functional and versatile roles`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Balanced career profiles with diverse skills`}</span>
//                       </li>
//                     </>
//                   )}
//                   {template === "ascend" && (
//                     <>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Career climbers and ambitious professionals`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Fast-track promotion candidates`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Growth-focused individuals`}</span>
//                       </li>
//                     </>
//                   )}
//                   {template === "clarity" && (
//                     <>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Maximizing ATS compatibility`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Traditional and conservative industries`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Clear, straightforward presentation`}</span>
//                       </li>
//                     </>
//                   )}
//                   {template === "legacy" && (
//                     <>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Seasoned professionals with deep experience`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Stability-focused roles in established firms`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Emphasizing credibility and track record`}</span>
//                       </li>
//                     </>
//                   )}
//                   {template === "prestige" && (
//                     <>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`High-end professional services`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Academic and research leadership roles`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Excellence-focused careers with awards`}</span>
//                       </li>
//                     </>
//                   )}
//                   {template === "noble" && (
//                     <>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Ethics-focused professions`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Government, NGO, and non-profit roles`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Trust-based positions requiring integrity`}</span>
//                       </li>
//                     </>
//                   )}
//                   {template === "regal" && (
//                     <>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Confident self-presentation without arrogance`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Professional poise and executive presence`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                         <span>{t`Assertive yet respectful communication`}</span>
//                       </li>
//                     </>
//                   )}
//                 </ul>
//               </div>

//               <div className="rounded-lg bg-secondary/30 p-4">
//                 <h4 className="mb-2 font-semibold">{t`Template Features`}</h4>
//                 <div className="grid grid-cols-2 gap-2 text-sm">
//                   <div className="flex items-center gap-2">
//                     <div className="h-2 w-2 rounded-full bg-primary" />
//                     <span>{t`ATS Optimized`}</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <div className="h-2 w-2 rounded-full bg-primary" />
//                     <span>{t`Fully Responsive`}</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <div className="h-2 w-2 rounded-full bg-primary" />
//                     <span>{t`Print Ready`}</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <div className="h-2 w-2 rounded-full bg-primary" />
//                     <span>{t`Clean Design`}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// };

// export const TemplateSection = () => {
//   const setValue = useResumeStore((state) => state.setValue);
//   const currentTemplate = useResumeStore((state) => state.resume.data.metadata.template);
//   const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

//   const handleSelectTemplate = (template: Template) => {
//     setValue("metadata.template", template);
//     // Close modal after selection
//     setSelectedTemplate(null);
//   };

//   return (
//     <>
//       <section id="template" className="grid gap-y-6">
//         <header className="flex items-center justify-between">
//           <div className="flex items-center gap-x-4">
//             <SectionIcon id="template" size={18} name={t`Template`} />
//             <h2 className="line-clamp-1 text-2xl font-bold lg:text-3xl">{t`Template`}</h2>
//           </div>
//         </header>

//         <main className="grid grid-cols-2 gap-6 @lg/right:grid-cols-3 @2xl/right:grid-cols-4">
//           {templatesList.map((template, index) => (
//             <motion.div
//               key={template}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
//               whileHover={{ scale: 1.03 }}
//               whileTap={{ scale: 0.98 }}
//               className="group relative cursor-pointer"
//               onClick={() => setSelectedTemplate(template)}
//             >
//               <AspectRatio ratio={1 / 1.4142}>
//                 <div
//                   className={cn(
//                     "relative h-full w-full overflow-hidden rounded-lg border-2 transition-all duration-300",
//                     currentTemplate === template
//                       ? "border-primary shadow-lg shadow-primary/20"
//                       : "border-transparent group-hover:border-primary/50"
//                   )}
//                 >
//                   {/* Template Image */}
//                   <img
//                     src={`/templates/jpg/resumes/${template}.jpg`}
//                     alt={template}
//                     className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
//                   />

//                   {/* Overlay with description */}
//                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
//                     <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
//                       <div className="mb-2 flex items-center gap-2">
//                         <div className="rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary-foreground">
//                           {templateCategories[template]}
//                         </div>
//                         {currentTemplate === template && (
//                           <div className="rounded-full bg-green-500/90 px-2 py-1 text-xs font-semibold">
//                             {t`Selected`}
//                           </div>
//                         )}
//                       </div>
//                       <h3 className="mb-2 text-xl font-bold capitalize">{template}</h3>
//                       <p className="text-sm text-white/90">{templateDescriptions[template]}</p>
//                       <button className="mt-3 w-full rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30">
//                         {t`View Details`}
//                       </button>
//                     </div>
//                   </div>

//                   {/* Selected indicator */}
//                   {currentTemplate === template && (
//                     <div className="absolute right-3 top-3 z-10">
//                       <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
//                         <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
//                           <path
//                             fillRule="evenodd"
//                             d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                             clipRule="evenodd"
//                           />
//                         </svg>
//                       </div>
//                     </div>
//                   )}

//                   {/* Bottom label (always visible) */}
//                   <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
//                     <p className="text-center font-semibold capitalize text-white">{template}</p>
//                   </div>
//                 </div>
//               </AspectRatio>
//             </motion.div>
//           ))}
//         </main>
//       </section>

//       {/* Modal for detailed view */}
//       <TemplateModal
//         template={selectedTemplate!}
//         isOpen={!!selectedTemplate}
//         onClose={() => setSelectedTemplate(null)}
//         onSelectTemplate={handleSelectTemplate}
//       />
//     </>
//   );
// };



import { t, Trans } from "@lingui/macro";
import { AspectRatio } from "@reactive-resume/ui";
import { cn, templatesList } from "@reactive-resume/utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

import { useResumeStore } from "@/client/stores/resume";

import { SectionIcon } from "../shared/section-icon";

// Define Template type based on templatesList
type Template = (typeof templatesList)[number];

// Template descriptions mapping
const templateDescriptions: Record<Template, string> = {
  sovereign: t`Leadership, command, decision-makers`,
  apex: t`Top-tier, peak performance`,
  imperial: t`Senior, established professionals`,
  vanguard: t`Forward-thinking, high-impact careers`,
  vertex: t`Precision, structure, clarity`,
  meridian: t`Balance, alignment, global appeal`,
  ascend: t`Growth, progress, ambition`,
  clarity: t`Clean, ATS-friendly, recruiter-approved`,
  legacy: t`Experience, credibility, stability`,
  prestige: t`Excellence, refined presentation`,
  noble: t`Integrity, professionalism, respect`,
  regal: t`Confidence without arrogance`,
} as const;

// Template categories mapping
const templateCategories: Record<Template, string> = {
  sovereign: t`Executive / Authority`,
  apex: t`Executive / Authority`,
  imperial: t`Executive / Authority`,
  vanguard: t`Executive / Authority`,
  vertex: t`Modern / Professional`,
  meridian: t`Modern / Professional`,
  ascend: t`Modern / Professional`,
  clarity: t`Modern / Professional`,
  legacy: t`Timeless / Trusted`,
  prestige: t`Timeless / Trusted`,
  noble: t`Timeless / Trusted`,
  regal: t`Timeless / Trusted`,
} as const;

// Template modal component
const TemplateModal = ({
  template,
  isOpen,
  onClose,
  onSelectTemplate,
}: {
  template: Template;
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container - Cross-browser centering */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div 
          className={cn(
            "relative mx-auto w-full max-w-6xl bg-background shadow-2xl rounded-xl overflow-hidden",
            isMobile ? "h-full max-h-full" : "max-h-[90vh]"
          )}
          onClick={(e) => e.stopPropagation()}
          style={{
            // Force modal positioning for Chrome
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            // Mobile full screen adjustments
            ...(isMobile ? {
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: 'none',
              borderRadius: 0,
              width: '100vw',
              height: '100vh',
              maxHeight: '100vh',
              margin: 0,
            } : {})
          }}
        >
          {/* Mobile header with close button */}
          {isMobile && (
            <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 backdrop-blur-sm p-4">
              <h2 className="text-lg font-semibold capitalize">{template}</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-secondary transition-colors"
                aria-label={t`Close`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Scrollable content */}
          <div className="h-full overflow-y-auto">
            <div className="grid gap-4 md:grid-cols-2 p-4 md:p-6">
              {/* Template Preview */}
              <div className="space-y-4 order-2 md:order-1">
                <div className="relative overflow-hidden rounded-lg border bg-secondary/20">
                  <div className="aspect-[1/1.414] relative">
                    <img
                      src={`/templates/jpg/resumes/${template}.jpg`}
                      alt={template}
                      className="absolute inset-0 h-full w-full object-contain rounded-lg"
                      loading="lazy"
                    />
                  </div>
                  
                  {useResumeStore.getState().resume.data.metadata.template === template && (
                    <div className="absolute left-2 top-2 sm:left-4 sm:top-4 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                      {t`Currently Selected`}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      onSelectTemplate(template);
                      onClose();
                    }}
                    className="flex-1 rounded-lg bg-primary px-4 sm:px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95"
                  >
                    {t`Use This Template`}
                  </button>
                  {!isMobile && (
                    <button
                      onClick={onClose}
                      className="px-4 sm:px-6 py-3 rounded-lg border hover:bg-secondary transition-colors"
                    >
                      {t`Cancel`}
                    </button>
                  )}
                </div>
              </div>

              {/* Template Info */}
              <div className="space-y-4 md:space-y-6 order-1 md:order-2">
                {!isMobile && (
                  <div className="flex justify-end">
                    <button
                      onClick={onClose}
                      className="rounded-full p-2 hover:bg-secondary transition-colors"
                      aria-label={t`Close`}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      {templateCategories[template]}
                    </div>
                    <div className="text-sm text-muted-foreground">{t`Perfect for professionals`}</div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold capitalize">{template}</h2>
                  <p className="text-base md:text-lg text-muted-foreground">{templateDescriptions[template]}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="mb-3 text-lg md:text-xl font-semibold">{t`Best For`}</h3>
                    <ul className="space-y-2">
                      {template === "sovereign" && (
                        <>
                          <li className="flex items-start gap-2">
                            <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                            <span className="text-sm md:text-base">{t`C-level executives and directors`}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                            <span className="text-sm md:text-base">{t`Leadership positions requiring authority`}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                            <span className="text-sm md:text-base">{t`Decision-making roles in large organizations`}</span>
                          </li>
                        </>
                      )}
                      {/* ... rest of template conditions ... */}
                    </ul>
                  </div>

                  <div className="rounded-lg bg-secondary/30 p-4">
                    <h4 className="mb-2 font-semibold">{t`Template Features`}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                        <span>{t`ATS Optimized`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                        <span>{t`Fully Responsive`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                        <span>{t`Print Ready`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                        <span>{t`Clean Design`}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export const TemplateSection = () => {
  const setValue = useResumeStore((state) => state.setValue);
  const currentTemplate = useResumeStore((state) => state.resume.data.metadata.template);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const handleSelectTemplate = (template: Template) => {
    setValue("metadata.template", template);
    setSelectedTemplate(null);
  };

  return (
    <>
      <section id="template" className="grid gap-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-x-4">
            <SectionIcon id="template" size={18} name={t`Template`} />
            <h2 className="line-clamp-1 text-2xl font-bold lg:text-3xl">{t`Template`}</h2>
          </div>
        </header>

        <main className="grid grid-cols-2 gap-3 sm:gap-4 @lg/right:grid-cols-3 @2xl/right:grid-cols-4">
          {templatesList.map((template, index) => (
            <motion.div
              key={template}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="group relative cursor-pointer"
              onClick={() => setSelectedTemplate(template)}
            >
              <AspectRatio ratio={1 / 1.4142}>
                <div
                  className={cn(
                    "relative h-full w-full overflow-hidden rounded-lg border-2 transition-all duration-300",
                    currentTemplate === template
                      ? "border-primary shadow-lg shadow-primary/20"
                      : "border-transparent group-hover:border-primary/50"
                  )}
                >
                  <img
                    src={`/templates/jpg/resumes/${template}.jpg`}
                    alt={template}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <div className="mb-2 flex flex-wrap items-center gap-1">
                        <div className="rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary-foreground">
                          {templateCategories[template]}
                        </div>
                        {currentTemplate === template && (
                          <div className="rounded-full bg-green-500/90 px-2 py-1 text-xs font-semibold">
                            {t`Selected`}
                          </div>
                        )}
                      </div>
                      <h3 className="mb-1 text-lg font-bold capitalize">{template}</h3>
                      <p className="text-xs text-white/90 line-clamp-2">{templateDescriptions[template]}</p>
                      <button className="mt-2 w-full rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30">
                        {t`View Details`}
                      </button>
                    </div>
                  </div>

                  {currentTemplate === template && (
                    <div className="absolute right-2 top-2 z-10">
                      <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary text-white">
                        <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-center text-sm font-semibold capitalize text-white">{template}</p>
                  </div>
                </div>
              </AspectRatio>
            </motion.div>
          ))}
        </main>
      </section>

      <TemplateModal
        template={selectedTemplate!}
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onSelectTemplate={handleSelectTemplate}
      />
    </>
  );
};