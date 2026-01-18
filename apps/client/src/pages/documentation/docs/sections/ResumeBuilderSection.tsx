// // import { t } from "@lingui/macro";

// // export const ResumeBuilderSection = () => {
// //   return (
// //     <section
// //       id="resume-builder"
// //       className="scroll-mt-28 space-y-10 text-foreground"
// //     >
// //       <h2 className="text-3xl font-bold">
// //         {t`Resume Builder`}
// //       </h2>

// //       <p className="max-w-3xl opacity-85">
// //         {t`The Resume Builder is your workspace for crafting a professional, modern resume. Every action is designed to be intuitive, flexible, and powerful—so you can focus on your story, not the formatting.`}
// //       </p>

// //       {/* Step-by-step instructions */}
// //       <div className="space-y-8">
// //         <div>
// //           <h4 className="font-semibold">
// //             {t`How to Create and Manage Your Resume`}
// //           </h4>
// //           <ol className="mt-2 list-decimal space-y-2 pl-5 opacity-85">
// //             <li>
// //               {t`Go to your Dashboard and click "Create Resume".`}
// //               <ul className="list-disc pl-6 mt-1 text-sm opacity-80">
// //                 <li>{t`You can also import an existing resume or duplicate a previous one.`}</li>
// //               </ul>
// //             </li>
// //             <li>
// //               {t`Choose a template that fits your style or industry.`}
// //               <ul className="list-disc pl-6 mt-1 text-sm opacity-80">
// //                 <li>{t`Preview templates before selecting. You can switch templates anytime.`}</li>
// //               </ul>
// //             </li>
// //             <li>
// //               {t`Name your resume and set its visibility (public or private).`}
// //             </li>
// //             <li>
// //               {t`Add, remove, or reorder sections using the left sidebar.`}
// //               <ul className="list-disc pl-6 mt-1 text-sm opacity-80">
// //                 <li>{t`Drag and drop sections to change their order.`}</li>
// //                 <li>{t`Click "Add Section" to include new categories like Projects, Certifications, or Custom Sections.`}</li>
// //                 <li>{t`Hide sections you don't want to display—your data is saved for later.`}</li>
// //               </ul>
// //             </li>
// //             <li>
// //               {t`Edit each section by clicking on it. Fill in details using simple forms.`}
// //               <ul className="list-disc pl-6 mt-1 text-sm opacity-80">
// //                 <li>{t`Use the rich text editor for summaries and descriptions.`}</li>
// //                 <li>{t`Add bullet points, links, and formatting as needed.`}</li>
// //                 <li>{t`Reorder items within a section (e.g., move jobs up or down).`}</li>
// //               </ul>
// //             </li>
// //             <li>
// //               {t`See your changes instantly in the live preview panel.`}
// //               <ul className="list-disc pl-6 mt-1 text-sm opacity-80">
// //                 <li>{t`Switch between preview and edit modes at any time.`}</li>
// //               </ul>
// //             </li>
// //             <li>
// //               {t`Customize fonts, colors, and layout in the right sidebar.`}
// //               <ul className="list-disc pl-6 mt-1 text-sm opacity-80">
// //                 <li>{t`Adjust column layouts for supported templates.`}</li>
// //                 <li>{t`Fine-tune margins, spacing, and section alignment.`}</li>
// //               </ul>
// //             </li>
// //             <li>
// //               {t`Your work is auto-saved as you go. You can close and return anytime.`}
// //             </li>
// //             <li>
// //               {t`When ready, click "Export" to download your resume as PDF, DOCX, or JSON.`}
// //               <ul className="list-disc pl-6 mt-1 text-sm opacity-80">
// //                 <li>{t`Some export options or premium templates may require coins.`}</li>
// //                 <li>{t`Preview your export before finalizing.`}</li>
// //               </ul>
// //             </li>
// //             <li>
// //               {t`Duplicate, rename, or delete resumes from your dashboard.`}
// //             </li>
// //           </ol>
// //         </div>

// //         {/* All available sections */}
// //         <div>
// //           <h4 className="font-semibold">
// //             {t`Available Resume Sections & Actions`}
// //           </h4>
// //           <ul className="mt-2 list-disc space-y-2 pl-5 opacity-85">
// //             <li>
// //               <span className="font-medium">{t`Personal Information:`}</span> {t`Name, headline, contact details, location, links, and profile photo.`}
// //             </li>
// //             <li>
// //               <span className="font-medium">{t`Summary:`}</span> {t`Write a brief professional summary or objective.`}
// //             </li>
// //             <li>
// //               <span className="font-medium">{t`Work Experience:`}</span> {t`Add jobs, internships, or freelance roles. Include company, position, dates, location, and achievements.`}
// //             </li>
// //             <li>
// //               <span className="font-medium">{t`Education:`}</span> {t`Schools, degrees, dates, and honors.`}
// //             </li>
// //             <li>
// //               <span className="font-medium">{t`Skills:`}</span> {t`List technical, soft, and language skills. Rate proficiency if desired.`}
// //             </li>
// //             <li>
// //               <span className="font-medium">{t`Projects:`}</span> {t`Highlight key projects with descriptions and links.`}
// //             </li>
// //             <li>
// //               <span className="font-medium">{t`Certifications & Awards:`}</span> {t`Add credentials, licenses, and recognitions.`}
// //             </li>
// //             <li>
// //               <span className="font-medium">{t`Volunteer Experience:`}</span> {t`Show community involvement and leadership.`}
// //             </li>
// //             <li>
// //               <span className="font-medium">{t`Interests & Hobbies:`}</span> {t`Personalize your resume with relevant interests.`}
// //             </li>
// //             <li>
// //               <span className="font-medium">{t`Languages:`}</span> {t`List spoken languages and proficiency levels.`}
// //             </li>
// //             <li>
// //               <span className="font-medium">{t`References:`}</span> {t`Optionally add references or note "Available on request".`}
// //             </li>
// //             <li>
// //               <span className="font-medium">{t`Custom Sections:`}</span> {t`Create your own section for anything unique (e.g., Publications, Patents, Extracurriculars).`}
// //             </li>
// //           </ul>
// //         </div>

// //         {/* Tiny actions and tips */}
// //         <div>
// //           <h4 className="font-semibold">
// //             {t`Everyday Actions & Pro Tips`}
// //           </h4>
// //           <ul className="mt-2 list-disc space-y-2 pl-5 opacity-85">
// //             <li>{t`Click any section or item to edit it instantly.`}</li>
// //             <li>{t`Use drag handles to reorder sections or items.`}</li>
// //             <li>{t`Hide a section with the eye icon—restore it anytime.`}</li>
// //             <li>{t`Duplicate a section or item to save time.`}</li>
// //             <li>{t`Delete unwanted sections or items with the trash icon.`}</li>
// //             <li>{t`Use the AI tools to improve grammar, rewrite, or enhance your summary and achievements.`}</li>
// //             <li>{t`Switch templates or color themes at any time—your content stays safe.`}</li>
// //             <li>{t`Preview your resume on desktop and mobile for best results.`}</li>
// //             <li>{t`Export as PDF for job applications, DOCX for editing, or JSON for backup.`}</li>
// //             <li>{t`Restore previous versions or undo changes if needed.`}</li>
// //             <li>{t`Access help and tips from the right sidebar or documentation.`}</li>
// //           </ul>
// //         </div>

// //         {/* Final tip */}
// //         <div className="rounded-lg border border-border bg-muted/40 p-5 text-sm opacity-80">
// //           {t`Tip: Focus on clarity, relevance, and impact. Keep your resume updated and tailor it for each opportunity. The Resume Builder saves your progress automatically, so you can build your career story at your own pace.`}
// //         </div>
// //       </div>
// //     </section>
// //   );
// // };


// import { t, Trans } from "@lingui/macro";
// import { useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   FileText, 
//   Layout, 
//   Palette, 
//   Download, 
//   Save,
//   Eye,
//   EyeOff,
//   Grid3x3,
//   Sparkles,
//   Coins,
//   Wand2,
//   Settings,
//   Type,
//   Share2,
//   Printer,
//   FolderOpen,
//   PlusCircle,
//   Upload,
//   Brain,
//   Zap,
//   ChevronRight,
//   ChevronDown,
//   Link as LinkIcon,
//   Copy,
//   CheckCircle2,
//   AlertCircle,
//   Lightbulb,
//   Award,
//   Shield,
//   Smartphone,
//   Wrench,
//   HelpCircle,
//   BookOpen,
//   Home,
//   ArrowLeft,
//   Menu,
//   X,
//   ExternalLink,
//   AlertTriangle,
//   Briefcase,
//   GraduationCap,
//   ShoppingCart,
//   Crown,
//   User,
//   Search,
//   Edit3,
//   Hand

// } from "lucide-react";
// import { Button } from "@reactive-resume/ui";
// import { cn } from "@reactive-resume/utils";
// import { Link, useNavigate, useLocation } from "react-router";
// import { toast } from "sonner";

// // Table of Contents Item Component
// interface TOCItemProps {
//   id: string;
//   title: string;
//   icon?: React.ReactNode;
//   level?: number;
//   onClick?: () => void;
//   isActive?: boolean;
// }

// const TOCItem = ({ id, title, icon, level = 1, onClick, isActive }: TOCItemProps) => {
//   const paddingLeft = level === 1 ? "pl-0" : level === 2 ? "pl-4" : "pl-8";
  
//   return (
//     <button
//       onClick={onClick}
//       className={cn(
//         "flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800",
//         paddingLeft,
//         isActive && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
//       )}
//     >
//       {icon && <span className="text-gray-500 dark:text-gray-400">{icon}</span>}
//       <span className="flex-1 truncate">{title}</span>
//       {isActive && <ChevronRight className="w-4 h-4" />}
//     </button>
//   );
// };

// // Section Header Component
// interface SectionHeaderProps {
//   id: string;
//   title: string;
//   description?: string;
//   icon?: React.ReactNode;
// }

// const SectionHeader = ({ id, title, description, icon }: SectionHeaderProps) => {
//   const location = useLocation();
//   const fullUrl = `${window.location.origin}${location.pathname}#${id}`;
  
//   return (
//     <div className="relative group">
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex items-center gap-3">
//           {icon && (
//             <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
//               {icon}
//             </div>
//           )}
//           <div>
//             <h2 id={id} className="text-2xl font-bold text-gray-900 dark:text-white">
//               {title}
//             </h2>
//             {description && (
//               <p className="text-gray-600 dark:text-gray-400 mt-1">
//                 {description}
//               </p>
//             )}
//           </div>
//         </div>
//         <Button
//           variant="ghost"
//           size="sm"
//           onClick={() => copyToClipboard(fullUrl)}
//           className="opacity-0 group-hover:opacity-100 transition-opacity"
//           title={t`Copy link to this section`}
//         >
//           <LinkIcon className="w-4 h-4" />
//         </Button>
//       </div>
//     </div>
//   );
// };

// // Tip Component
// const Tip = ({ children }: { children: React.ReactNode }) => (
//   <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-800">
//     <div className="flex items-start gap-3">
//       <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
//       <div className="flex-1">
//         <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{t`Pro Tip`}</p>
//         <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">{children}</p>
//       </div>
//     </div>
//   </div>
// );

// // Copy to clipboard utility
// const copyToClipboard = async (text: string) => {
//   try {
//     await navigator.clipboard.writeText(text);
//     toast.success(t`Link copied to clipboard!`);
//   } catch (err) {
//     toast.error(t`Failed to copy link`);
//   }
// };

// // Main Documentation Component
// export const ResumeBuilderSection = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [activeSection, setActiveSection] = useState("overview");
//   const [showMobileTOC, setShowMobileTOC] = useState(false);
  
  
//   // Scroll to section handler
//   const scrollToSection = (sectionId: string) => {
//     const element = document.getElementById(sectionId);
//     if (element) {
//       const offset = 80;
//       const elementPosition = element.getBoundingClientRect().top;
//       const offsetPosition = elementPosition + window.pageYOffset - offset;

//       window.scrollTo({
//         top: offsetPosition,
//         behavior: "smooth"
//       });

//       setActiveSection(sectionId);
//       setShowMobileTOC(false);
//       navigate(`#${sectionId}`, { replace: true });
//     }
//   };



//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      

//       {/* Back to Dashboard */}
//       <div className="fixed top-4 right-4 z-50">
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => navigate("/dashboard")}
//           className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
//         >
//           <ArrowLeft className="w-4 h-4 mr-2" />
//           {t`Back to Dashboard`}
//         </Button>
//       </div>

//       <div className="container mx-auto px-4 py-8 max-w-7xl">
//         <div className="flex gap-8">
          
          

//           {/* Main Content */}
//           <main className="flex-1">
//             {/* Hero Section */}
//             <section className="mb-12">
//               <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
//                 <div className="flex items-start gap-4">
//                   <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
//                     <FileText className="w-8 h-8 text-white" />
//                   </div>
//                   <div>
//                     <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
//                       {t`Inlirah Resume Builder Documentation`}
//                     </h1>
//                     <p className="text-lg text-gray-600 dark:text-gray-300">
//                       {t`Complete guide to creating professional resumes with AI assistance, smart templates, and powerful editing tools.`}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </section>

//             {/* Overview Section */}
//             <section id="overview" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="overview"
//                 title={t`Overview`}
//                 description={t`Professional resume creation platform with AI-powered tools and smart templates`}
//                 icon={<FileText className="w-6 h-6" />}
//               />

//               <div className="prose prose-gray dark:prose-invert max-w-none">
//                 <p>
//                   {t`The Inlirah Resume Builder is a comprehensive platform designed to help you create professional, ATS-friendly resumes that stand out to recruiters. With intuitive editing tools, AI-powered enhancements, and professionally designed templates, you can craft resumes that effectively showcase your skills and experience.`}
//                 </p>

//                 <div className="grid md:grid-cols-3 gap-6 my-8">
//                   <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
//                     <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
//                       <Layout className="w-6 h-6 text-white" />
//                     </div>
//                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
//                       {t`Professional Templates`}
//                     </h3>
//                     <p className="text-gray-600 dark:text-gray-400">
//                       {t`12+ professionally designed templates optimized for different industries and career levels.`}
//                     </p>
//                   </div>

//                   <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
//                     <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
//                       <Sparkles className="w-6 h-6 text-white" />
//                     </div>
//                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
//                       {t`AI-Powered Enhancements`}
//                     </h3>
//                     <p className="text-gray-600 dark:text-gray-400">
//                       {t`Intelligent suggestions for content improvement, formatting, and ATS optimization.`}
//                     </p>
//                   </div>

//                   <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
//                     <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4">
//                       <Download className="w-6 h-6 text-white" />
//                     </div>
//                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
//                       {t`Professional Export`}
//                     </h3>
//                     <p className="text-gray-600 dark:text-gray-400">
//                       {t`Export to PDF, JSON, and shareable links with full formatting preservation.`}
//                     </p>
//                   </div>
//                 </div>

//                 <Tip>
//                   {t`All features are available through the intuitive interface. No technical knowledge required!`}
//                 </Tip>
//               </div>
//             </section>

//             {/* Getting Started */}
//             <section id="getting-started" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="getting-started"
//                 title={t`Getting Started`}
//                 description={t`Create your first resume in minutes`}
//                 icon={<Zap className="w-6 h-6" />}
//               />

//               <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
//                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//                   {t`Three Ways to Start`}
//                 </h3>
//                 <div className="grid md:grid-cols-3 gap-6">
//                   {[
//                     {
//                       title: t`Create from Scratch`,
//                       steps: [
//                         t`Navigate to Dashboard → Resumes`,
//                         t`Click "Create New Resume"`,
//                         t`Choose a template`,
//                         t`Start editing sections`
//                       ],
//                       icon: <PlusCircle className="w-5 h-5" />,
//                       color: "blue"
//                     },
//                     {
//                       title: t`Import Existing Resume`,
//                       steps: [
//                         t`Click "Import Resume"`,
//                         t`Upload PDF or JSON file`,
//                         t`Review imported content`,
//                         t`Make adjustments as needed`
//                       ],
//                       icon: <Upload className="w-5 h-5" />,
//                       color: "green"
//                     },
//                     {
//                       title: t`AI Resume Builder`,
//                       steps: [
//                         t`Click "AI Builder"`,
//                         t`Provide basic information`,
//                         t`Let AI generate content`,
//                         t`Review and customize`
//                       ],
//                       icon: <Brain className="w-5 h-5" />,
//                       color: "purple"
//                     }
//                   ].map((method, index) => (
//                     <div key={index} className="space-y-4">
//                       <div className={`flex items-center gap-3 p-3 rounded-lg bg-${method.color}-50 dark:bg-${method.color}-900/20`}>
//                         <div className={`w-10 h-10 rounded-lg bg-${method.color}-100 dark:bg-${method.color}-900/30 flex items-center justify-center`}>
//                           {method.icon}
//                         </div>
//                         <h4 className="font-semibold text-gray-900 dark:text-white">
//                           {method.title}
//                         </h4>
//                       </div>
//                       <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 pl-2">
//                         {method.steps.map((step, stepIndex) => (
//                           <li key={stepIndex} className="flex items-start gap-2">
//                             <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium">
//                               {stepIndex + 1}
//                             </span>
//                             <span>{step}</span>
//                           </li>
//                         ))}
//                       </ol>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </section>

//             {/* Interface Guide */}
//             <section id="interface" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="interface"
//                 title={t`Interface Guide`}
//                 description={t`Understanding the resume builder layout`}
//                 icon={<Layout className="w-6 h-6" />}
//               />

//               <div className="space-y-6">
//                 {/* Left Sidebar */}
//                 <div id="left-sidebar">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Left Sidebar (Content Editor)`}
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-400 mb-4">
//                     {t`The left sidebar contains all content editing tools and resume sections:`}
//                   </p>
//                   <div className="grid grid-cols-2 gap-4 mb-4">
//                     {[
//                       { name: t`Basics`, desc: t`Personal info, contact details, photo` },
//                       { name: t`Summary`, desc: t`Professional summary with rich text editor` },
//                       { name: t`Experience`, desc: t`Work history with detailed entries` },
//                       { name: t`Education`, desc: t`Educational background` },
//                       { name: t`Skills`, desc: t`Skills with proficiency levels` },
//                       { name: t`Projects`, desc: t`Portfolio projects showcase` },
//                       { name: t`Custom Sections`, desc: t`Add any additional sections` }
//                     ].map((section, index) => (
//                       <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
//                         <div className="font-medium text-gray-900 dark:text-white mb-1">
//                           {section.name}
//                         </div>
//                         <div className="text-sm text-gray-600 dark:text-gray-400">
//                           {section.desc}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Right Sidebar */}
//                 <div id="right-sidebar">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Right Sidebar (Design Settings)`}
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-400 mb-4">
//                     {t`Control the appearance and export settings of your resume:`}
//                   </p>
//                   <div className="grid grid-cols-2 gap-4">
//                     {[
//                       { name: t`Template`, desc: t`Choose from 12+ professional templates` },
//                       { name: t`Layout`, desc: t`Adjust column layout and spacing` },
//                       { name: t`Typography`, desc: t`Font family, size, and spacing` },
//                       { name: t`Theme`, desc: t`Color scheme customization` },
//                       { name: t`Custom CSS`, desc: t`Advanced styling options` },
//                       { name: t`Page Settings`, desc: t`Margin, format, page options` },
//                       { name: t`Export`, desc: t`PDF export with coin system` },
//                       { name: t`Sharing`, desc: t`Generate shareable links` }
//                     ].map((section, index) => (
//                       <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
//                         <div className="font-medium text-gray-900 dark:text-white mb-1">
//                           {section.name}
//                         </div>
//                         <div className="text-sm text-gray-600 dark:text-gray-400">
//                           {section.desc}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Main Canvas */}
//                 <div id="main-canvas">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Main Canvas`}
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-400">
//                     {t`Live preview of your resume with real-time updates. All changes are reflected immediately as you edit.`}
//                   </p>
//                 </div>

//                 {/* Toolbar */}
//                 <div id="toolbar">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Toolbar`}
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-400">
//                     {t`Floating toolbar with essential controls:`}
//                   </p>
//                   <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 mt-2 space-y-1">
//                     <li>{t`Undo/Redo actions`}</li>
//                     <li>{t`Zoom controls`}</li>
//                     <li>{t`View options`}</li>
//                     <li>{t`Page break toggles`}</li>
//                     <li>{t`Copy shareable link`}</li>
//                     <li>{t`Export to PDF`}</li>
//                   </ul>
//                 </div>
//               </div>
//             </section>

//             {/* Resume Sections */}
//             <section id="sections" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="sections"
//                 title={t`Resume Sections`}
//                 description={t`Detailed guide to each resume section`}
//                 icon={<Grid3x3 className="w-6 h-6" />}
//               />

//               <div className="space-y-8">
//                 {/* Basics Section */}
//                 <div id="basics">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Basics Section`}
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-400 mb-4">
//                     {t`Contains your essential personal and contact information:`}
//                   </p>
//                   <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
//                     <li>{t`Full Name (required)`}</li>
//                     <li>{t`Professional Headline`}</li>
//                     <li>{t`Email Address (validated)`}</li>
//                     <li>{t`Phone Number`}</li>
//                     <li>{t`Location`}</li>
//                     <li>{t`Website/Portfolio URL`}</li>
//                     <li>{t`Profile Picture`}</li>
//                     <li>{t`Custom Fields`}</li>
//                   </ul>
//                 </div>

//                 {/* Summary Section */}
//                 <div id="summary">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Summary Section`}
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-400 mb-4">
//                     {t`Professional summary with rich text editing capabilities:`}
//                   </p>
//                   <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
//                     <li>{t`Rich text editor with formatting options`}</li>
//                     <li>{t`AI enhancement suggestions`}</li>
//                     <li>{t`Real-time preview`}</li>
//                     <li>{t`Import from existing content`}</li>
//                   </ul>
//                 </div>

//                 {/* Experience Section */}
//                 <div id="experience">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Experience Section`}
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-400 mb-4">
//                     {t`Detailed work history with achievements:`}
//                   </p>
//                   <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
//                     <li>{t`Company name and location`}</li>
//                     <li>{t`Job title/position`}</li>
//                     <li>{t`Employment dates`}</li>
//                     <li>{t`Detailed responsibilities`}</li>
//                     <li>{t`Achievements with metrics`}</li>
//                     <li>{t`Multiple entries support`}</li>
//                   </ul>
//                 </div>

//                 {/* Custom Sections */}
//                 <div id="custom-sections">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Custom Sections`}
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-400">
//                     {t`Add any additional sections to customize your resume for specific industries or roles:`}
//                   </p>
//                   <Tip>
//                     {t`Use custom sections for certifications, publications, languages, volunteer work, or any other relevant information.`}
//                   </Tip>
//                 </div>
//               </div>
//             </section>

//             // Continue from where we left off...

//             {/* Design & Templates */}
//             <section id="design" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="design"
//                 title={t`Design & Templates`}
//                 description={t`Customize the visual appearance of your resume`}
//                 icon={<Palette className="w-6 h-6" />}
//               />

//               <div className="space-y-6">
//                 {/* Template Selection */}
//                 <div id="templates">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Choosing the Right Template`}
//                   </h3>
                  
//                   <div className="mb-6">
//                     <p className="text-gray-600 dark:text-gray-400 mb-4">
//                       {t`Select a template that matches your industry and career level:`}
//                     </p>
                    
//                     <div className="grid md:grid-cols-2 gap-4 mb-6">
//                       {[
//                         {
//                           category: t`Professional/Corporate`,
//                           templates: ["Vertex", "Meridian", "Clarity"],
//                           bestFor: t`Business, Finance, Consulting`,
//                           icon: <Briefcase className="w-4 h-4" />
//                         },
//                         {
//                           category: t`Creative/Design`,
//                           templates: ["Apex", "Vanguard", "Ascend"],
//                           bestFor: t`Design, Marketing, Tech`,
//                           icon: <Palette className="w-4 h-4" />
//                         },
//                         {
//                           category: t`Academic/Research`,
//                           templates: ["Legacy", "Prestige", "Imperial"],
//                           bestFor: t`Education, Research, PhD`,
//                           icon: <GraduationCap className="w-4 h-4" />
//                         },
//                         {
//                           category: t`Executive Level`,
//                           templates: ["Sovereign", "Regal", "Noble"],
//                           bestFor: t`Senior Management, C-level`,
//                           icon: <Award className="w-4 h-4" />
//                         }
//                       ].map((group, index) => (
//                         <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
//                           <div className="flex items-center gap-2 mb-3">
//                             {group.icon}
//                             <h4 className="font-semibold text-gray-900 dark:text-white">
//                               {group.category}
//                             </h4>
//                           </div>
//                           <div className="space-y-2">
//                             <div className="text-sm">
//                               <span className="text-gray-600 dark:text-gray-400">{t`Templates:`} </span>
//                               <span className="font-medium text-gray-900 dark:text-white">
//                                 {group.templates.join(", ")}
//                               </span>
//                             </div>
//                             <div className="text-sm text-gray-600 dark:text-gray-400">
//                               {group.bestFor}
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
                    
//                     <Tip>
//                       {t`Preview different templates before deciding. You can switch templates anytime without losing your content.`}
//                     </Tip>
//                   </div>
//                 </div>

//                 {/* Typography */}
//                 <div id="typography">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Typography Settings`}
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-400 mb-4">
//                     {t`Adjust font settings for optimal readability:`}
//                   </p>
                  
//                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//                     {[
//                       { setting: t`Font Size`, values: "11-14px", tip: t`12-13px optimal for printing` },
//                       { setting: t`Line Height`, values: "1.4-1.6", tip: t`Higher = more spacing` },
//                       { setting: t`Font Family`, values: "Inter, Roboto", tip: t`Sans-serif for modern look` },
//                       { setting: t`Icon Visibility`, values: "On/Off", tip: t`Hide icons for cleaner look` }
//                     ].map((item, index) => (
//                       <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
//                         <div className="font-medium text-gray-900 dark:text-white mb-1">
//                           {item.setting}
//                         </div>
//                         <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
//                           {item.values}
//                         </div>
//                         <div className="text-xs text-blue-600 dark:text-blue-400">
//                           {item.tip}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Theme Colors */}
//                 <div id="theme">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Color Theme Customization`}
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-400 mb-4">
//                     {t`Match your resume colors to your personal brand:`}
//                   </p>
                  
//                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
//                     {[
//                       {
//                         name: t`Professional Blue`,
//                         colors: ["#2563eb", "#1e40af"],
//                         use: t`Corporate, Tech, Finance`
//                       },
//                       {
//                         name: t`Modern Gray`,
//                         colors: ["#4b5563", "#1f2937"],
//                         use: t`Consulting, Law, Academia`
//                       },
//                       {
//                         name: t`Creative Purple`,
//                         colors: ["#7c3aed", "#5b21b6"],
//                         use: t`Design, Marketing, Creative`
//                       },
//                       {
//                         name: t`Bold Green`,
//                         colors: ["#059669", "#047857"],
//                         use: t`Sustainability, Education`
//                       },
//                       {
//                         name: t`Classic Black`,
//                         colors: ["#000000", "#374151"],
//                         use: t`Executive, Formal`
//                       },
//                       {
//                         name: t`Custom Colors`,
//                         colors: ["Your choice", "Pick any"],
//                         use: t`Personal branding`
//                       }
//                     ].map((theme, index) => (
//                       <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
//                         <div className="flex items-center gap-2 mb-3">
//                           <div className="flex gap-1">
//                             {theme.colors.map((color, i) => (
//                               <div 
//                                 key={i}
//                                 className="w-6 h-6 rounded-full border"
//                                 style={{ backgroundColor: color }}
//                               />
//                             ))}
//                           </div>
//                           <div className="font-medium text-gray-900 dark:text-white">
//                             {theme.name}
//                           </div>
//                         </div>
//                         <div className="text-sm text-gray-600 dark:text-gray-400">
//                           {theme.use}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </section>

//             {/* Export & Sharing */}
//             <section id="export" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="export"
//                 title={t`Export & Sharing`}
//                 description={t`Save, share, and distribute your resume`}
//                 icon={<Download className="w-6 h-6" />}
//               />

//               <div className="space-y-6">
//                 {/* PDF Export */}
//                 <div id="pdf-export">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Exporting to PDF`}
//                   </h3>
                  
//                   <div className="mb-6">
//                     <p className="text-gray-600 dark:text-gray-400 mb-4">
//                       {t`Export professional PDFs for job applications:`}
//                     </p>
                    
//                     <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-6">
//                       <div className="flex items-center gap-3 mb-4">
//                         <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
//                           <Printer className="w-6 h-6 text-white" />
//                         </div>
//                         <div>
//                           <h4 className="font-semibold text-gray-900 dark:text-white">
//                             {t`PDF Export Process`}
//                           </h4>
//                           <p className="text-sm text-gray-600 dark:text-gray-400">
//                             {t`Simple 2-step process using coins`}
//                           </p>
//                         </div>
//                       </div>
                      
//                       <ol className="space-y-3 pl-2">
//                         <li className="flex items-start gap-3">
//                           <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
//                             <span className="text-sm font-medium text-blue-700 dark:text-blue-300">1</span>
//                           </div>
//                           <div>
//                             <div className="font-medium text-gray-900 dark:text-white">
//                               {t`Click Export PDF Button`}
//                             </div>
//                             <div className="text-sm text-gray-600 dark:text-gray-400">
//                               {t`Located in toolbar (cost: 10 coins)`}
//                             </div>
//                           </div>
//                         </li>
//                         <li className="flex items-start gap-3">
//                           <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
//                             <span className="text-sm font-medium text-blue-700 dark:text-blue-300">2</span>
//                           </div>
//                           <div>
//                             <div className="font-medium text-gray-900 dark:text-white">
//                               {t`Confirm & Download`}
//                             </div>
//                             <div className="text-sm text-gray-600 dark:text-gray-400">
//                               {t`PDF automatically downloads to your device`}
//                             </div>
//                           </div>
//                         </li>
//                       </ol>
//                     </div>
                    
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//                       {[
//                         { feature: t`Print-Ready`, desc: t`Optimized for A4 paper` },
//                         { feature: t`High Quality`, desc: t`300 DPI resolution` },
//                         { feature: t`ATS Friendly`, desc: t`Text selectable` },
//                         { feature: t`Fast Export`, desc: t`< 30 seconds` }
//                       ].map((item, index) => (
//                         <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
//                           <div className="font-medium text-gray-900 dark:text-white mb-1">
//                             {item.feature}
//                           </div>
//                           <div className="text-sm text-gray-600 dark:text-gray-400">
//                             {item.desc}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
                    
//                     <Tip>
//                       {t`Always preview your resume before exporting. Check for formatting issues and page breaks.`}
//                     </Tip>
//                   </div>
//                 </div>

//                 {/* Sharing Options */}
//                 <div id="sharing">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Sharing Your Resume`}
//                   </h3>
                  
//                   <div className="grid md:grid-cols-2 gap-6">
//                     <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
//                       <div className="flex items-center gap-3 mb-4">
//                         <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
//                           <Share2 className="w-6 h-6 text-white" />
//                         </div>
//                         <div>
//                           <h4 className="font-semibold text-gray-900 dark:text-white">
//                             {t`Public Sharing`}
//                           </h4>
//                           <p className="text-sm text-gray-600 dark:text-gray-400">
//                             {t`Generate a shareable link`}
//                           </p>
//                         </div>
//                       </div>
                      
//                       <div className="space-y-3">
//                         <div className="flex items-center justify-between">
//                           <span className="text-sm text-gray-600 dark:text-gray-400">
//                             {t`How to share:`}
//                           </span>
//                           <Button size="sm" variant="outline" className="text-xs">
//                             1. {t`Set visibility to public`}
//                           </Button>
//                         </div>
//                         <div className="flex items-center justify-between">
//                           <span className="text-sm text-gray-600 dark:text-gray-400">
//                             {t`Copy link:`}
//                           </span>
//                           <Button size="sm" variant="outline" className="text-xs">
//                             2. {t`Click copy link button`}
//                           </Button>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
//                       <div className="flex items-center gap-3 mb-4">
//                         <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
//                           <Eye className="w-6 h-6 text-white" />
//                         </div>
//                         <div>
//                           <h4 className="font-semibold text-gray-900 dark:text-white">
//                             {t`Private Sharing`}
//                           </h4>
//                           <p className="text-sm text-gray-600 dark:text-gray-400">
//                             {t`Share with specific people`}
//                           </p>
//                         </div>
//                       </div>
                      
//                       <div className="space-y-2">
//                         <div className="text-sm text-gray-600 dark:text-gray-400">
//                           {t`Options:`}
//                         </div>
//                         <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
//                           <li>• {t`Export PDF and email`}</li>
//                           <li>• {t`Download and share file`}</li>
//                           <li>• {t`Print physical copies`}</li>
//                         </ul>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </section>

//             {/* AI Features */}
//             <section id="ai-features" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="ai-features"
//                 title={t`AI Features`}
//                 description={t`Enhance your resume with artificial intelligence`}
//                 icon={<Sparkles className="w-6 h-6" />}
//               />

//               <div className="space-y-6">
//                 {/* AI Assistant */}
//                 <div id="ai-assistant">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`AI Writing Assistant`}
//                   </h3>
                  
//                   <div className="mb-6">
//                     <p className="text-gray-600 dark:text-gray-400 mb-4">
//                       {t`Improve your resume content with AI suggestions:`}
//                     </p>
                    
//                     <div className="grid md:grid-cols-2 gap-6 mb-6">
//                       <div className="space-y-4">
//                         <h4 className="font-semibold text-gray-900 dark:text-white">
//                           {t`Quick Actions (1 coin)`}
//                         </h4>
//                         <div className="space-y-2">
//                           {[
//                             t`Improve grammar & spelling`,
//                             t`Make more professional`,
//                             t`Add action verbs`,
//                             t`Increase impact`,
//                             t`Make more concise`,
//                             t`Adjust tone`
//                           ].map((action, index) => (
//                             <div key={index} className="flex items-center gap-2">
//                               <Zap className="w-4 h-4 text-amber-500" />
//                               <span className="text-sm text-gray-700 dark:text-gray-300">
//                                 {action}
//                               </span>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
                      
//                       <div className="space-y-4">
//                         <h4 className="font-semibold text-gray-900 dark:text-white">
//                           {t`Custom Instructions (3 coins)`}
//                         </h4>
//                         <div className="space-y-2">
//                           {[
//                             t`"Add metrics to achievements"`,
//                             t`"Make it more technical"`,
//                             t`"Focus on leadership skills"`,
//                             t`"Tailor for marketing role"`,
//                             t`"Add industry keywords"`,
//                             t`"Make it ATS-optimized"`
//                           ].map((instruction, index) => (
//                             <div key={index} className="flex items-center gap-2">
//                               <Wand2 className="w-4 h-4 text-purple-500" />
//                               <span className="text-sm text-gray-700 dark:text-gray-300 italic">
//                                 {instruction}
//                               </span>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     </div>
                    
//                     <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl p-6 border border-purple-200 dark:border-purple-800 mb-6">
//                       <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
//                         {t`How to Use AI Enhancement`}
//                       </h4>
//                       <ol className="space-y-3 pl-2">
//                         <li className="flex items-start gap-3">
//                           <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
//                             <span className="text-sm font-medium text-purple-700 dark:text-purple-300">1</span>
//                           </div>
//                           <div>
//                             <div className="font-medium text-gray-900 dark:text-white">
//                               {t`Select text to enhance`}
//                             </div>
//                             <div className="text-sm text-gray-600 dark:text-gray-400">
//                               {t`Highlight any section or bullet point`}
//                             </div>
//                           </div>
//                         </li>
//                         <li className="flex items-start gap-3">
//                           <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
//                             <span className="text-sm font-medium text-purple-700 dark:text-purple-300">2</span>
//                           </div>
//                           <div>
//                             <div className="font-medium text-gray-900 dark:text-white">
//                               {t`Choose AI action`}
//                             </div>
//                             <div className="text-sm text-gray-600 dark:text-gray-400">
//                               {t`Quick fix or custom instructions`}
//                             </div>
//                           </div>
//                         </li>
//                         <li className="flex items-start gap-3">
//                           <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
//                             <span className="text-sm font-medium text-purple-700 dark:text-purple-300">3</span>
//                           </div>
//                           <div>
//                             <div className="font-medium text-gray-900 dark:text-white">
//                               {t`Review & apply changes`}
//                             </div>
//                             <div className="text-sm text-gray-600 dark:text-gray-400">
//                               {t`Accept, modify, or reject AI suggestions`}
//                             </div>
//                           </div>
//                         </li>
//                       </ol>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Coin System */}
//                 <div id="coin-system">
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Coin System`}
//                   </h3>
                  
//                   <div className="grid md:grid-cols-2 gap-6">
//                     <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
//                       <div className="flex items-center gap-3 mb-4">
//                         <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center">
//                           <Coins className="w-6 h-6 text-white" />
//                         </div>
//                         <div>
//                           <h4 className="font-semibold text-gray-900 dark:text-white">
//                             {t`Cost Reference`}
//                           </h4>
//                           <p className="text-sm text-gray-600 dark:text-gray-400">
//                             {t`AI feature pricing`}
//                           </p>
//                         </div>
//                       </div>
                      
//                       <div className="space-y-3">
//                         {[
//                           { action: t`Quick Enhance`, coins: 1, desc: t`Instant fixes` },
//                           { action: t`Custom Enhancement`, coins: 3, desc: t`With instructions` },
//                           { action: t`Regenerate Section`, coins: 5, desc: t`Complete rewrite` },
//                           { action: t`PDF Export`, coins: 10, desc: t`Professional PDF` },
//                           { action: t`AI Resume Builder`, coins: 15, desc: t`Full resume creation` }
//                         ].map((item, index) => (
//                           <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
//                             <div>
//                               <div className="font-medium text-gray-900 dark:text-white">
//                                 {item.action}
//                               </div>
//                               <div className="text-sm text-gray-600 dark:text-gray-400">
//                                 {item.desc}
//                               </div>
//                             </div>
//                             <div className="flex items-center gap-1">
//                               <Coins className="w-4 h-4 text-amber-500" />
//                               <span className="font-bold text-amber-600 dark:text-amber-400">
//                                 {item.coins}
//                               </span>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>

//                     <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
//                       <div className="flex items-center gap-3 mb-4">
//                         <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
//                           <Award className="w-6 h-6 text-white" />
//                         </div>
//                         <div>
//                           <h4 className="font-semibold text-gray-900 dark:text-white">
//                             {t`Getting More Coins`}
//                           </h4>
//                           <p className="text-sm text-gray-600 dark:text-gray-400">
//                             {t`Ways to earn and purchase`}
//                           </p>
//                         </div>
//                       </div>
                      
//                       <div className="space-y-4">
//                         <div>
//                           <div className="font-medium text-gray-900 dark:text-white mb-2">
//                             {t`Free Methods`}
//                           </div>
//                           <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
//                             <li className="flex items-center gap-2">
//                               <CheckCircle2 className="w-4 h-4 text-green-500" />
//                               <span>{t`Daily login bonus`}</span>
//                             </li>
//                             <li className="flex items-center gap-2">
//                               <CheckCircle2 className="w-4 h-4 text-green-500" />
//                               <span>{t`Complete profile setup`}</span>
//                             </li>
//                             <li className="flex items-center gap-2">
//                               <CheckCircle2 className="w-4 h-4 text-green-500" />
//                               <span>{t`Refer friends`}</span>
//                             </li>
//                           </ul>
//                         </div>
                        
//                         <div>
//                           <div className="font-medium text-gray-900 dark:text-white mb-2">
//                             {t`Purchase Options`}
//                           </div>
//                           <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
//                             <li className="flex items-center gap-2">
//                               <ShoppingCart className="w-4 h-4 text-blue-500" />
//                               <span>{t`Coin packs (50, 100, 500)`}</span>
//                             </li>
//                             <li className="flex items-center gap-2">
//                               <Crown className="w-4 h-4 text-purple-500" />
//                               <span>{t`Premium subscription`}</span>
//                             </li>
//                           </ul>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </section>

//             {/* Best Practices */}
//             <section id="best-practices" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="best-practices"
//                 title={t`Best Practices`}
//                 description={t`Tips for creating effective resumes`}
//                 icon={<Award className="w-6 h-6" />}
//               />

//               <div className="space-y-6">
//                 <div className="grid md:grid-cols-2 gap-6">
//                   <div className="space-y-4">
//                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
//                       {t`Content Tips`}
//                     </h3>
//                     <div className="space-y-3">
//                       {[
//                         t`Use action verbs (Managed, Created, Improved)`,
//                         t`Include specific metrics and numbers`,
//                         t`Tailor content for each job application`,
//                         t`Keep descriptions concise and impactful`,
//                         t`Focus on achievements, not just duties`,
//                         t`Use industry-specific keywords`,
//                         t`Proofread multiple times`,
//                         t`Keep length to 1-2 pages maximum`
//                       ].map((tip, index) => (
//                         <div key={index} className="flex items-start gap-2">
//                           <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                           <span className="text-sm text-gray-700 dark:text-gray-300">
//                             {tip}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>

//                   <div className="space-y-4">
//                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
//                       {t`Design Tips`}
//                     </h3>
//                     <div className="space-y-3">
//                       {[
//                         t`Choose template matching industry`,
//                         t`Use consistent formatting throughout`,
//                         t`Ensure proper margins (0.5-1 inch)`,
//                         t`Maintain clear visual hierarchy`,
//                         t`Use bullet points for readability`,
//                         t`Keep colors professional`,
//                         t`Ensure text is easily scannable`,
//                         t`Test print before final export`
//                       ].map((tip, index) => (
//                         <div key={index} className="flex items-start gap-2">
//                           <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                           <span className="text-sm text-gray-700 dark:text-gray-300">
//                             {tip}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
//                   <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
//                     {t`Before You Apply Checklist`}
//                   </h3>
//                   <div className="grid md:grid-cols-2 gap-4">
//                     {[
//                       { check: t`Contact info up-to-date`, icon: <User className="w-4 h-4" /> },
//                       { check: t`No spelling/grammar errors`, icon: <Type className="w-4 h-4" /> },
//                       { check: t`ATS keywords included`, icon: <Search className="w-4 h-4" /> },
//                       { check: t`Formatting consistent`, icon: <Layout className="w-4 h-4" /> },
//                       { check: t`File size under 2MB`, icon: <FileText className="w-4 h-4" /> },
//                       { check: t`Mobile view checked`, icon: <Smartphone className="w-4 h-4" /> },
//                       { check: t`Print preview verified`, icon: <Printer className="w-4 h-4" /> },
//                       { check: t`Shareable link tested`, icon: <LinkIcon className="w-4 h-4" /> }
//                     ].map((item, index) => (
//                       <div key={index} className="flex items-center gap-3">
//                         <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
//                           {item.icon}
//                         </div>
//                         <span className="text-sm text-gray-700 dark:text-gray-300">
//                           {item.check}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </section>

//             {/* Mobile Usage */}
//             <section id="mobile" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="mobile"
//                 title={t`Mobile Usage`}
//                 description={t`Using the resume builder on mobile devices`}
//                 icon={<Smartphone className="w-6 h-6" />}
//               />

//               <div className="grid md:grid-cols-2 gap-6">
//                 <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
//                   <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Mobile Interface`}
//                   </h3>
                  
//                   <div className="space-y-4">
//                     {[
//                       {
//                         feature: t`Collapsible Sidebars`,
//                         desc: t`Tap to open/close editing panels`,
//                         icon: <Menu className="w-4 h-4" />
//                       },
//                       {
//                         feature: t`Mobile-Optimized Forms`,
//                         desc: t`Larger touch targets for easy input`,
//                         icon: <Edit3 className="w-4 h-4" />
//                       },
//                       {
//                         feature: t`Gesture Support`,
//                         desc: t`Pinch to zoom, swipe to navigate`,
//                         icon: <Hand className="w-4 h-4" />
//                       },
//                       {
//                         feature: t`Auto-Save`,
//                         desc: t`Changes saved automatically`,
//                         icon: <Save className="w-4 h-4" />
//                       }
//                     ].map((item, index) => (
//                       <div key={index} className="flex items-start gap-3">
//                         <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5">
//                           {item.icon}
//                         </div>
//                         <div>
//                           <div className="font-medium text-gray-900 dark:text-white">
//                             {item.feature}
//                           </div>
//                           <div className="text-sm text-gray-600 dark:text-gray-400">
//                             {item.desc}
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
//                   <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//                     {t`Mobile Tips`}
//                   </h3>
                  
//                   <div className="space-y-3">
//                     {[
//                       t`Use landscape mode for better editing`,
//                       t`Tap and hold to select text`,
//                       t`Use voice input for faster typing`,
//                       t`Preview on phone before exporting`,
//                       t`Save frequently when on mobile data`,
//                       t`Download PDFs to phone storage`
//                     ].map((tip, index) => (
//                       <div key={index} className="flex items-start gap-2">
//                         <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
//                         <span className="text-sm text-gray-700 dark:text-gray-300">
//                           {tip}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
                  
//                   <Tip className="mt-4">
//                     {t`For complex editing, use desktop. For quick updates and previews, mobile works great.`}
//                   </Tip>
//                 </div>
//               </div>
//             </section>

//             {/* Troubleshooting */}
//             <section id="troubleshooting" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="troubleshooting"
//                 title={t`Troubleshooting`}
//                 description={t`Common issues and solutions`}
//                 icon={<Wrench className="w-6 h-6" />}
//               />

//               <div className="space-y-6">
//                 <div className="grid md:grid-cols-2 gap-6">
//                   {[
//                     {
//                       issue: t`PDF export failing`,
//                       solutions: [
//                         t`Check coin balance`,
//                         t`Try different browser`,
//                         t`Clear browser cache`,
//                         t`Wait 30 seconds and retry`
//                       ]
//                     },
//                     {
//                       issue: t`Formatting looks wrong`,
//                       solutions: [
//                         t`Switch template and back`,
//                         t`Check custom CSS`,
//                         t`Reset font settings`,
//                         t`Preview in print mode`
//                       ]
//                     },
//                     {
//                       issue: t`AI not working`,
//                       solutions: [
//                         t`Refresh the page`,
//                         t`Check internet connection`,
//                         t`Ensure enough coins`,
//                         t`Try smaller text selection`
//                       ]
//                     },
//                     {
//                       issue: t`Changes not saving`,
//                       solutions: [
//                         t`Check auto-save icon`,
//                         t`Refresh page`,
//                         t`Clear browser cache`,
//                         t`Try different browser`
//                       ]
//                     }
//                   ].map((item, index) => (
//                     <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
//                       <div className="flex items-center gap-2 mb-4">
//                         <AlertCircle className="w-5 h-5 text-amber-500" />
//                         <h3 className="font-semibold text-gray-900 dark:text-white">
//                           {item.issue}
//                         </h3>
//                       </div>
//                       <div className="space-y-2">
//                         {item.solutions.map((solution, i) => (
//                           <div key={i} className="flex items-start gap-2">
//                             <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                             <span className="text-sm text-gray-700 dark:text-gray-300">
//                               {solution}
//                             </span>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/10 dark:to-rose-900/10 rounded-xl p-6 border border-red-200 dark:border-red-800">
//                   <div className="flex items-center gap-3 mb-4">
//                     <AlertTriangle className="w-6 h-6 text-red-500" />
//                     <div>
//                       <h3 className="font-semibold text-gray-900 dark:text-white">
//                         {t`Need More Help?`}
//                       </h3>
//                       <p className="text-sm text-gray-600 dark:text-gray-400">
//                         {t`Contact support if issues persist`}
//                       </p>
//                     </div>
//                   </div>
                  
//                   <div className="space-y-3">
//                     <div className="flex items-center justify-between">
//                       <span className="text-sm text-gray-700 dark:text-gray-300">
//                         {t`Email Support:`}
//                       </span>
//                       <a 
//                         href="mailto:support@Inlirah.com" 
//                         className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
//                       >
//                         support@Inlirah.com
//                       </a>
//                     </div>
//                     <div className="flex items-center justify-between">
//                       <span className="text-sm text-gray-700 dark:text-gray-300">
//                         {t`Response Time:`}
//                       </span>
//                       <span className="text-sm text-gray-600 dark:text-gray-400">
//                         24-48 hours
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </section>

//             {/* FAQ */}
//             <section id="faq" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="faq"
//                 title={t`Frequently Asked Questions`}
//                 description={t`Quick answers to common questions`}
//                 icon={<HelpCircle className="w-6 h-6" />}
//               />

//               <div className="space-y-4">
//                 {[
//                   {
//                     q: t`How many resumes can I create?`,
//                     a: t`Unlimited resumes with free account. Premium features require coins or subscription.`
//                   },
//                   {
//                     q: t`Can I import from LinkedIn?`,
//                     a: t`Yes, export your LinkedIn profile as PDF and use our import feature.`
//                   },
//                   {
//                     q: t`Is my data secure?`,
//                     a: t`Yes, all data is encrypted and we never share your information with third parties.`
//                   },
//                   {
//                     q: t`Can I collaborate with others?`,
//                     a: t`Currently single-user only. Team features coming soon.`
//                   },
//                   {
//                     q: t`Do you offer resume review services?`,
//                     a: t`Yes, through our premium subscription which includes professional reviews.`
//                   },
//                   {
//                     q: t`Can I use custom fonts?`,
//                     a: t`Yes, through Custom CSS feature in design settings.`
//                   },
//                   {
//                     q: t`What's the difference between templates?`,
//                     a: t`Templates vary in layout, color schemes, and industry focus. All are ATS-friendly.`
//                   },
//                   {
//                     q: t`How do I get more coins?`,
//                     a: t`Purchase coin packs, subscribe to premium, or earn through referrals and daily bonuses.`
//                   }
//                 ].map((faq, index) => (
//                   <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
//                     <div className="flex items-start gap-3">
//                       <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
//                         <span className="font-semibold text-blue-700 dark:text-blue-300">Q</span>
//                       </div>
//                       <div>
//                         <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
//                           {faq.q}
//                         </h3>
//                         <p className="text-gray-600 dark:text-gray-400">
//                           {faq.a}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </section>

//             {/* Quick Action Links */}
//             <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
//               <div className="grid md:grid-cols-3 gap-6">
//                 <Link 
//                   to="/dashboard/resumes" 
//                   className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
//                 >
//                   <div className="flex items-center gap-3 mb-3">
//                     <PlusCircle className="w-6 h-6" />
//                     <h3 className="font-semibold text-lg">
//                       {t`Create Resume`}
//                     </h3>
//                   </div>
//                   <p className="text-blue-100 text-sm">
//                     {t`Start building your professional resume now`}
//                   </p>
//                 </Link>

//                 <Link 
//                   to="/dashboard/pricing" 
//                   className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
//                 >
//                   <div className="flex items-center gap-3 mb-3">
//                     <Coins className="w-6 h-6" />
//                     <h3 className="font-semibold text-lg">
//                       {t`Get Coins`}
//                     </h3>
//                   </div>
//                   <p className="text-green-100 text-sm">
//                     {t`Purchase coins for AI features and PDF exports`}
//                   </p>
//                 </Link>

//                 <Link 
//                   to="/docs/support" 
//                   className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
//                 >
//                   <div className="flex items-center gap-3 mb-3">
//                     <HelpCircle className="w-6 h-6" />
//                     <h3 className="font-semibold text-lg">
//                       {t`Get Help`}
//                     </h3>
//                   </div>
//                   <p className="text-amber-100 text-sm">
//                     {t`Contact support or browse help articles`}
//                   </p>
//                 </Link>
//               </div>
//             </section>
//           </main>
//         </div>
//       </div>

      
            
         
//     </div>
 


//   );
// };


import { t, Trans } from "@lingui/macro";
import { 
  FileText, 
  Layout, 
  Palette, 
  Download, 
  Save,
  Eye,
  Grid3x3,
  Sparkles,
  Coins,
  Wand2,
  Type,
  Share2,
  Printer,
  PlusCircle,
  Upload,
  Brain,
  Zap,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Award,
  Smartphone,
  Wrench,
  HelpCircle,
  Briefcase,
  GraduationCap,
  ShoppingCart,
  Crown,
  User,
  Search,
  Plus,
  Columns,
  Pencil,
  Trash2,
  RotateCcw,
  Link as LinkIcon, 
  File,
  CheckCircle,
  Globe,
  History,
  Badge,
  ArrowRight

} from "lucide-react";
import { Button } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { Link } from "react-router";

// Tip Component
const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-800 my-6">
    <div className="flex items-start gap-3">
      <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{t`Pro Tip`}</p>
        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">{children}</p>
      </div>
    </div>
  </div>
);

// Section Header Component
interface SectionHeaderProps {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

const SectionHeader = ({ id, title, description, icon }: SectionHeaderProps) => {
  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h2 id={id} className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ResumeBuilderSection = () => {
  return (
    <div id="resume-builder" className="scroll-mt-28 space-y-16">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {t`Resume Builder`}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
                {t`The Resume Builder is your workspace for crafting a professional, modern resume. Every action is designed to be intuitive, flexible, and powerful—so you can focus on your story, not the formatting.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <section id="resume-getting-started" className="scroll-mt-24">
        <SectionHeader
          id="resume-getting-started"
          title={t`Getting Started`}
          description={t`Create your first resume in minutes`}
          icon={<Zap className="w-6 h-6" />}
        />

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t`Three Ways to Start`}
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: t`Create from Scratch`,
                steps: [
                  t`Navigate to Dashboard → Resumes`,
                  t`Click "Create New Resume"`,
                  t`Choose a template`,
                  t`Start editing sections`
                ],
                icon: <PlusCircle className="w-5 h-5" />,
                color: "blue"
              },
              {
                title: t`Import Existing Resume`,
                steps: [
                  t`Click "Import Resume"`,
                  t`Upload JSON file or linkedin`,
                  t`Review imported content`,
                  t`Make adjustments as needed`
                ],
                icon: <Upload className="w-5 h-5" />,
                color: "green"
              },
              {
                title: t`AI Resume Builder`,
                steps: [
                  t`Click "AI Builder"`,
                  t`upload pdf/word or paste text`,
                  t`Let AI generate resume`,
                  t`Review and customize`
                ],
                icon: <Brain className="w-5 h-5" />,
                color: "purple"
              }
            ].map((method, index) => (
              <div key={index} className="space-y-4">
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  method.color === "blue" && "bg-blue-50 dark:bg-blue-900/20",
                  method.color === "green" && "bg-green-50 dark:bg-green-900/20",
                  method.color === "purple" && "bg-purple-50 dark:bg-purple-900/20"
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    method.color === "blue" && "bg-blue-100 dark:bg-blue-900/30",
                    method.color === "green" && "bg-green-100 dark:bg-green-900/30",
                    method.color === "purple" && "bg-purple-100 dark:bg-purple-900/30"
                  )}>
                    {method.icon}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {method.title}
                  </h4>
                </div>
                <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 pl-2">
                  {method.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium">
                        {stepIndex + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interface Guide */}
      <section id="resume-interface" className="scroll-mt-24">
        <SectionHeader
          id="resume-interface"
          title={t`Interface Guide`}
          description={t`Understanding the resume builder layout`}
          icon={<Layout className="w-6 h-6" />}
        />

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t`Left Sidebar (Content Editor)`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t`The left sidebar contains all content editing tools and resume sections:`}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: t`Basics`, desc: t`Personal info, contact details, photo` },
                  { name: t`Summary`, desc: t`Professional summary` },
                  { name: t`Experience`, desc: t`Work history with details` },
                  { name: t`Education`, desc: t`Educational background` },
                  { name: t`Skills`, desc: t`Skills with proficiency` },
                  { name: t`Projects`, desc: t`Portfolio showcase` },
                  { name: t`More Sections`, desc: t`other sections` },
                  { name: t`Custom Sections`, desc: t`Add any additional sections` }
                ].map((section, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      {section.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {section.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t`Right Sidebar (Design Settings)`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t`Control the appearance and export settings:`}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: t`Template`, desc: t`12+ professional templates` },
                  { name: t`Typography`, desc: t`Font family, size, spacing` },
                  { name: t`Theme`, desc: t`Color scheme customization` },
                  { name: t`Custom CSS`, desc: t`Advanced styling` },
                  { name: t`Page Settings`, desc: t`Margin, format, options` },
                  { name: t`Export/translate`, desc: t`PDF export, one click translation` },
                  { name: t`Informartion`, desc: t`Important Information` },
                  { name: t`Others`, desc: t`More Other sections...` }
                ].map((section, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      {section.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {section.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resume Sections */}
     {/* Resume Sections */}
<section id="resume-sections" className="scroll-mt-24">
  <SectionHeader
    id="resume-sections"
    title={t`Resume Sections`}
    description={t`Customize and manage different sections of your resume`}
    icon={<Grid3x3 className="w-6 h-6" />}
  />

  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      {t`Section Management`}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-6">
      {t`Resume sections can be customized individually. Each section offers various configuration options accessible through the section menu Icon visible on the section top left.`}
    </p>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          {t`Section Actions`}
        </h4>
        <div className="space-y-3">
          {[
            {
              action: t`Add Items`,
              description: t`Insert new items into any section This give you the posibility to add information orderly in a particular sections. e.g: Adding a new skill to the skill section of your resume`,
              icon: <Plus className="w-4 h-4" />
            },
            {
              action: t`Show/Hide`,
              description: t`Toggle section visibility on your resume. Best when you do not what a particular section to appear on your resume but still love to use it after in thesame resume for other purposes.`,
              icon: <Eye className="w-4 h-4" />
            },
            {
              action: t`Rename`,
              description: t`Customize section titles to your preference`,
              icon: <Pencil className="w-4 h-4" />
            },
            {
              action: t`Configure Columns`,
              description: t`Set layout from 1 to 5 columns( e.g: setting to 2 columns display for education section). this will display the information of that particular section on your resume in the editor the number of columns set`,
              icon: <Columns className="w-4 h-4" />
            }
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{item.action}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          {t`Advanced Options`}
        </h4>
        <div className="space-y-3">
          {[
            {
              action: t`Separate Links`,
              description: t`Isolate URLs from other content in sections`,
              icon: <LinkIcon className="w-4 h-4" />
            },
            {
              action: t`Reset Section`,
              description: t`Clear all items while keeping section structure`,
              icon: <RotateCcw className="w-4 h-4" />
            },
            {
              action: t`Remove Section`,
              description: t`Delete custom sections (not available for default sections)`,
              icon: <Trash2 className="w-4 h-4" />
            },
            {
              action: t`Others`,
              description: t`Other functionalities such as ai enhancement, manual editing`,
              icon: <Brain className="w-4 h-4" />
            }
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{item.action}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>

  <Tip>
    {t`Use the section menu (≡ icon) on any resume section to access all customization options. Default sections cannot be removed, only customized.`}
  </Tip>
</section>

      {/* Design & Templates */}
      <section id="resume-design" className="scroll-mt-24">
        <SectionHeader
          id="resume-design"
          title={t`Design & Templates`}
          description={t`Customize the visual appearance of your resume`}
          icon={<Palette className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`Template Selection Guide`}
            </h3>
            <div className="space-y-4">
              {[
                {
                  category: t`Professional/Corporate`,
                  templates: ["Vertex", "Meridian", "Clarity"],
                  bestFor: t`Business, Finance, Consulting`
                },
                {
                  category: t`Creative/Design`,
                  templates: ["Apex", "Vanguard", "Ascend"],
                  bestFor: t`Design, Marketing, Tech`
                },
                {
                  category: t`Academic/Research`,
                  templates: ["Legacy", "Prestige", "Imperial"],
                  bestFor: t`Education, Research, PhD`
                },
                {
                  category: t`Executive Level`,
                  templates: ["Sovereign", "Regal", "Noble"],
                  bestFor: t`Senior Management, C-level`
                }
              ].map((group, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {group.category}
                  </h4>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t`Templates:`} </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {group.templates.join(", ")}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {group.bestFor}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`Design Customization`}
            </h3>
            {/* Typography */}
                <div id="typography">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                   {t`Typography Settings`}
                </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t`Adjust font settings for optimal readability:`}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { setting: t`Font Size`, values: "11-14px", tip: t`12-13px optimal for printing` },
                      { setting: t`Line Height`, values: "1.4-1.6", tip: t`Higher = more spacing` },
                      { setting: t`Font Family`, values: "Inter, Roboto", tip: t`Sans-serif for modern look` },
                      { setting: t`Icon Visibility`, values: "On/Off", tip: t`Hide icons for cleaner look` }
                    ].map((item, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="font-medium text-gray-900 dark:text-white mb-1">
                          {item.setting}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {item.values}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {item.tip}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Theme Colors */}
                <div id="theme">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {t`Color Theme Customization`}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t`Match your resume colors to your personal brand:`}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {[
                      {
                        name: t`Professional Blue`,
                        colors: ["#2563eb", "#1e40af"],
                        use: t`Corporate, Tech, Finance`
                      },
                      {
                        name: t`Modern Gray`,
                        colors: ["#4b5563", "#1f2937"],
                        use: t`Consulting, Law, Academia`
                      },
                      {
                        name: t`Creative Purple`,
                        colors: ["#7c3aed", "#5b21b6"],
                        use: t`Design, Marketing, Creative`
                      },
                      {
                       name: t`Bold Green`,
                       colors: ["#059669", "#047857"],
                       use: t`Sustainability, Education`
                     },
                     {
                       name: t`Classic Black`,
                       colors: ["#000000", "#374151"],
                       use: t`Executive, Formal`
                     },
                     {
                       name: t`Custom Colors`,
                       colors: ["Your choice", "Pick any"],
                       use: t`Personal branding`
                     }
                   ].map((theme, index) => (
                     <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                       <div className="flex items-center gap-2 mb-3">
                         <div className="flex gap-1">
                           {theme.colors.map((color, i) => (
                             <div
                               key={i}
                               className="w-6 h-6 rounded-full border"
                               style={{ backgroundColor: color }}
                             />
                           ))}
                         </div>
                         <div className="font-medium text-gray-900 dark:text-white">
                           {theme.name}
                         </div>
                       </div>
                       <div className="text-sm text-gray-600 dark:text-gray-400">
                         {theme.use}
                       </div>
                     </div>
                   ))}
                 </div>
            </div>
          </div>
        </div>

        <Tip>
          {t`Preview different templates before deciding. You can switch templates anytime without losing your content.`}
        </Tip>
      </section>

     {/* Export, Translation & Sharing */}
<section id="export" className="scroll-mt-24 mb-12">
  <SectionHeader
    id="export"
    title={t`Export, Translation & Sharing`}
    description={t`Save, translate, share, and distribute your resume worldwide`}
    icon={<Download className="w-6 h-6" />}
  />

  <div className="space-y-8">
    <div className="space-y-6">
        {/* PDF Export */}
        <div id="pdf-export">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t`Exporting to PDF`}
          </h3>
          
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t`Export professional PDFs for job applications:`}
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Printer className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {t`PDF Export Process`}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t`Simple 2-places you can export your resume`}
                  </p>
                </div>
              </div>
              
              <ol className="space-y-3 pl-2">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">1</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t`Click Export PDF Button on the right sidebar. Here, you can also export your resume as Json for other use`}
                    </div>
                 
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">2</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t`Click the last right button on the flooting toolbar to export your resume as well as pdf`}
                    </div>
                  
                  </div>
                </li>
              </ol>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { feature: t`Print-Ready`, desc: t`Optimized for A4 paper` },
                { feature: t`High Quality`, desc: t`300 DPI resolution` },
                { feature: t`ATS Friendly`, desc: t`Text selectable` },
                { feature: t`Fast Export`, desc: t`< 30 seconds` }
              ].map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    {item.feature}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
            
            <Tip>
              {t`Always preview your resume before exporting. Check for formatting issues and page breaks.`}
            </Tip>
          </div>
        </div>
      </div>

    {/* AI Resume Translation */}
    <div id="ai-translation" className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {t`AI Resume Translation`}
      </h3>
      
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-xl p-6 border border-purple-200 dark:border-purple-800 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {t`AI-Powered Translation`}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t`Translate your resume into 27+ languages using advanced AI`}
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">{t`How Translation Works`}</h5>
            <ol className="space-y-3 pl-2">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">1</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {t`Select target language`}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t`Choose from popular languages or browse 27+ options in the dropdown`}
                  </p>
                </div>
              </li>
            
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">2</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {t`AI processing (15-30 seconds)`}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t`Advanced neural network translates while preserving formatting`}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">3</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {t`Save as new resume`}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t`Translated resume saved in your workspace with success notifications`}
                  </p>
                </div>
              </li>
            </ol>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div className="font-medium text-gray-900 dark:text-white">{t`Smart Formatting`}</div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t`Preserves resume structure, dates, and professional formatting`}
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <div className="font-medium text-gray-900 dark:text-white">{t`Cultural Adaptation`}</div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t`Adapts content for different cultures and professional contexts`}
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-amber-500" />
                <div className="font-medium text-gray-900 dark:text-white">{t`Review Recommended`}</div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t`Always review translations for accuracy before professional use`}
              </p>
            </div>
          </div>
        
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {t`JSON Export`}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t`Low-cost backup option`}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {t`Download a JSON snapshot of your resume data for backup, sharing, or future imports.`}
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• {t`Complete resume structure and content`}</li>
            <li>• {t`Can be imported back into Inlirah`}</li>
            <li>• {t`Ideal for version control and backups`}</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {t`Template Pricing`}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t`PDF export cost varies by template`}
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>{t`Simple Templates (Clarity)`}</span>
              
            </div>
            <div className="flex justify-between">
              <span>{t`Professional Templates (Vertex)`}</span>
             
            </div>
            <div className="flex justify-between">
              <span>{t`Executive Templates (Sovereign)`}</span>
            
            </div>
          </div>
        </div>
      </div>
      
      <Tip>
        {t`For international job applications, translate your resume to the local language. Review AI translations carefully for cultural appropriateness and technical accuracy.`}
      </Tip>
    </div>

   

    {/* Recently Translated */}
    <div id="recent-translations" className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {t`Recently Translated Resumes`}
      </h3>
      
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {t`Translation History`}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t`Access your recently translated resumes`}
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-900 dark:text-white">{t`Quick Access`}</div>
              <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                {t`Auto-saved`}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {t`Successfully translated resumes appear here with quick actions:`}
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" />
                <span>{t`Open translated resume for editing`}</span>
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-500" />
                <span>{t`Go to workspace to manage all resumes`}</span>
              </li>
              <li className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-500" />
                <span>{t`Export translated version as PDF`}</span>
              </li>
            </ul>
          </div>
          
          <Tip>
            {t`Each translation creates a new resume in your workspace. You can edit, customize, and export each translated version independently.`}
          </Tip>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* AI Features */}
      <section id="resume-ai-features" className="scroll-mt-24">
        <SectionHeader
          id="resume-ai-features"
          title={t`AI Enhancement`}
          description={t`Enhance your resume with artificial intelligence`}
          icon={<Sparkles className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`AI Assistant (Quick Actions)`}
            </h3>
            <div className="space-y-4">
              <div>
               
                <div className="grid grid-cols-2 gap-2">
                  {[
                    t`Improve grammar`,
                    t`Make professional`,
                    t`Make concise`,
                    t`Adjust tone, ...`
                  ].map((action, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                      <span className="text-xs text-gray-700 dark:text-gray-300">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`Tips`}
            </h3>
            <div className="space-y-4">
              <div>
                <div className="font-medium text-gray-900 dark:text-white mb-2">
                  {t`This in no way replaces manual work. Instead;`}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2"></div>
                    {t`-> It help refactor users input in a much better way`},
                </div>
                 <div className="flex items-center gap-2"></div>
                    {t`-> Give them a best desired tone`},
                </div>
             
              
              
            </div>
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section id="resume-best-practices" className="scroll-mt-24">
        <SectionHeader
          id="resume-best-practices"
          title={t`Best Practices`}
          description={t`Tips for creating effective resumes`}
          icon={<Award className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`Content Tips`}
            </h3>
            <div className="space-y-3">
              {[
                t`Use action verbs (Managed, Created, Improved)`,
                t`Tailor content for each job application`,
                t`Keep descriptions concise and impactful`,
                t`Focus on achievements, not just duties`,
                t`Use industry-specific keywords`
              ].map((tip, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`Before You Apply Checklist`}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { check: t`Contact info up-to-date`, icon: <User className="w-4 h-4" /> },
                { check: t`No spelling errors`, icon: <Type className="w-4 h-4" /> },
                { check: t`ATS keywords included`, icon: <Search className="w-4 h-4" /> },
                { check: t`Formatting consistent`, icon: <Layout className="w-4 h-4" /> },
                { check: t`All information is accurate`, icon: <FileText className="w-4 h-4" /> },
                { check: t`Ensure best typography`, icon: <Printer className="w-4 h-4" /> }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.check}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <Link 
          to="/dashboard/resumes" 
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <PlusCircle className="w-6 h-6" />
            <h3 className="font-semibold text-lg">
              {t`Create Resume`}
            </h3>
          </div>
          <p className="text-blue-100 text-sm">
            {t`Start building your professional resume now`}
          </p>
        </Link>

        <Link 
          to="/dashboard/pricing" 
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <Coins className="w-6 h-6" />
            <h3 className="font-semibold text-lg">
              {t`Get Coins`}
            </h3>
          </div>
          <p className="text-green-100 text-sm">
            {t`Purchase coins for AI features and PDF exports`}
          </p>
        </Link>

        <Link 
          to="/docs/support" 
          className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <HelpCircle className="w-6 h-6" />
            <h3 className="font-semibold text-lg">
              {t`Get Help`}
            </h3>
          </div>
          <p className="text-amber-100 text-sm">
            {t`Contact support or browse help articles`}
          </p>
        </Link>
      </div>
    </div>
  );
};