// // import { t } from "@lingui/macro";

// // export const LetterBuilderSection = () => {
// //   return (
// //     <section
// //       id="letter-builder"
// //       className="scroll-mt-28 space-y-10 text-foreground"
// //     >
// //       {/* ===================== */}
// //       {/* Title & Overview */}
// //       {/* ===================== */}
// //       <header className="space-y-3">
// //         <h2 className="text-3xl font-bold">
// //           {t`Letter Builder`}
// //         </h2>
// //         <p className="max-w-3xl opacity-85 leading-relaxed">
// //           {t`The Letter Builder empowers you to craft compelling, professional letters for job applications, networking, and formal communication. With guided steps, AI-powered suggestions, and customizable templates, you can create letters that stand out and match your goals.`}
// //         </p>
// //       </header>

// //       {/* ===================== */}
// //       {/* How It Works */}
// //       {/* ===================== */}
// //       <div className="space-y-4">
// //         <h3 className="text-xl font-semibold">
// //           {t`How the Letter Builder Works`}
// //         </h3>
// //         <ul className="list-disc space-y-2 pl-5 opacity-85">
// //           <li>{t`Select the type of letter you need: cover letter, reference, inquiry, or custom.`}</li>
// //           <li>{t`Fill in guided fields—recipient, subject, your background, and the purpose of your letter.`}</li>
// //           <li>{t`Use AI tools to generate, rewrite, or enhance your letter content for clarity and impact.`}</li>
// //           <li>{t`Preview your letter in real time with your chosen template and style.`}</li>
// //           <li>{t`Export your letter as PDF, DOCX, or copy it for online applications.`}</li>
// //         </ul>
// //       </div>

// //       {/* ===================== */}
// //       {/* Key Features */}
// //       {/* ===================== */}
// //       <div className="space-y-4">
// //         <h3 className="text-xl font-semibold">
// //           {t`Key Features`}</h3>
// //         <ul className="list-disc space-y-2 pl-5 opacity-85">
// //           <li>{t`Guided wizard: Step-by-step prompts ensure you include all essential details.`}</li>
// //           <li>{t`Template selection: Choose from modern, classic, or creative letter templates.`}</li>
// //           <li>{t`AI assistance: Instantly improve tone, fix grammar, or tailor your letter to a specific job or company.`}</li>
// //           <li>{t`Live preview: See exactly how your letter will look before exporting.`}</li>
// //           <li>{t`Auto-save: Your progress is saved automatically as you write.`}</li>
// //         </ul>
// //       </div>

// //       {/* ===================== */}
// //       {/* Creating a Letter */}
// //       {/* ===================== */}
// //       <div className="space-y-4">
// //         <h3 className="text-xl font-semibold">
// //           {t`Creating a Letter`}</h3>
// //         <ol className="list-decimal space-y-2 pl-5 opacity-85">
// //           <li>{t`Open the Letter Builder from your dashboard or sidebar.`}</li>
// //           <li>{t`Choose the letter type and template.`}</li>
// //           <li>{t`Complete the guided fields with your information and the recipient’s details.`}</li>
// //           <li>{t`Edit and enhance your letter using AI tools as needed.`}</li>
// //           <li>{t`Preview and export your finished letter.`}</li>
// //         </ol>
// //       </div>

// //       {/* ===================== */}
// //       {/* Practical Tips */}
// //       {/* ===================== */}
// //       <div className="rounded-lg border border-border bg-muted/40 p-5 text-sm opacity-80 space-y-2">
// //         <h4 className="font-semibold">{t`Tips for Effective Letters`}</h4>
// //         <ul className="list-disc pl-5 space-y-1">
// //           <li>{t`Personalize each letter for the recipient and role.`}</li>
// //           <li>{t`Keep your message clear, concise, and focused on your strengths.`}</li>
// //           <li>{t`Use the preview to ensure formatting and tone are professional.`}</li>
// //           <li>{t`Leverage AI suggestions to polish your writing and stand out.`}</li>
// //         </ul>
// //       </div>
// //     </section>
// //   );
// // };



// import { t, Trans } from "@lingui/macro";
// import { useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   ChevronRight, 
//   ChevronDown, 
//   FileText, 
//   Sparkles, 
//   Globe, 
//   Layout, 
//   Download,
//   Zap,
//   Type,
//   Settings,
//   BarChart3,
//   Info,
//   BookOpen,
//   Target,
//   Award,
//   Shield,
//   Clock,
//   Users,
//   Search,
//   Link as LinkIcon,
//   Copy,
//   CheckCircle2,
//   XCircle,
//   AlertCircle,
//   Lightbulb,
//   Rocket,
//   Briefcase,
//   Mail,
//   Phone,
//   ExternalLink,
//   ArrowLeft,
//   Home,
//   Menu,
//   X,
//   Star,
//   Coins,
//   Crown,
//   Languages,
//   Palette,
//   Grid3x3,
//   Edit3,
//   Eye,
//   EyeOff,
//   Save,
//   Printer,
//   Share2,
//   FolderOpen,
//   FolderPlus,
//   Trash2,
//   RefreshCw,
//   Wand2,
//   Bot,
//   MessageCircle,
//   Calendar,
//   User,
//   Building,
//   School,
//   Heart,
//   Plane,
//   Handshake,
//   ThumbsUp,
//   AlertTriangle,
//   Check,
//   Hash,
//   HashIcon,
//   FileQuestion,
//   HelpCircle,
//   Book,
//   Video,
//   MessageSquare,
//   Users as UsersIcon,
//   TrendingUp,
//   Lock,
//   Unlock,
//   ShieldCheck,
//   Eye as EyeIcon,
//   DownloadCloud,
//   UploadCloud,
//   Cloud,
//   Database,
//   Server,
//   Cpu,
//   Wifi,
//   WifiOff,
//   Battery,
//   BatteryCharging,
//   Smartphone,
//   Monitor,
//   Tablet,
//   Laptop,
//   Headphones,
//   Mic,
//   Camera,
//   VideoIcon,
//   Volume2,
//   Bell,
//   BellOff,
//   Moon,
//   Sun,
//   Palette as PaletteIcon,
//   Contrast,
//   ZoomIn,
//   ZoomOut,
//   Maximize2,
//   Minimize2,
//   RotateCcw,
//   RotateCw,
//   Crop,
//   Scissors,
//   Type as TypeIcon,
//   Bold,
//   Italic,
//   Underline,
//   AlignLeft,
//   AlignCenter,
//   AlignRight,
//   AlignJustify,
//   List,
//   ListOrdered,
//   Indent,
//   Outdent,
//   Paperclip,
//   Image,
//   Film,
//   Music,
//   File,
//   Folder,
//   HardDrive,
//   Key,
//   CreditCard,
//   DollarSign,
//   Euro,
//   PoundSterling,
//   Bitcoin,
//   Gift,
//   Ticket,
//   Tag,
//   ShoppingCart,
//   ShoppingBag,
//   Package,
//   Truck,
//   Home as HomeIcon,
//   MapPin,
//   Navigation,
//   Compass,
//   Globe as GlobeIcon,
//   Map,
//   Flag,
//   Navigation2,
//   MapPinned,
//   Send,
//   Inbox,
//   Archive,
//   Bookmark,
//   Heart as HeartIcon,
//   ThumbsDown,
//   Star as StarIcon,
//   Flag as FlagIcon,
//   AlertOctagon,
//   AlertTriangle as AlertTriangleIcon,
//   Info as InfoIcon,
//   CheckCircle,
//   XCircle as XCircleIcon,
//   HelpCircle as HelpCircleIcon,
//   MinusCircle,
//   PlusCircle,
//   PlayCircle,
//   PauseCircle,
//   StopCircle,
//   SkipBack,
//   SkipForward,
//   Play,
//   Pause,

//   FastForward,
//   Rewind,
//   Repeat,
//   Shuffle,
//   VolumeX,
//   Volume1,
//   Volume as VolumeIcon,
//   MicOff,
//   CameraOff,
//   VideoOff,
//   Airplay,
//   Cast,
//   Bluetooth,
//   Wifi as WifiIcon,
//   Radio,
//   Tv,
//   Speaker,
//   Headphones as HeadphonesIcon,
//   Mic as MicIcon,

//   Film as FilmIcon,
//   Music as MusicIcon,
//   Disc,
//   Album,
//   RadioTower,
//   Satellite,
//   SatelliteDish,
//   Signal,
//   SignalHigh,
//   SignalMedium,
//   SignalLow,
//   SignalZero,
//   BatteryFull,
//   BatteryMedium,
//   BatteryLow,
//   BatteryWarning,
//   Power,
//   Cpu as CpuIcon,
//   HardDrive as HardDriveIcon,
//   MemoryStick,
//   Server as ServerIcon,
//   Database as DatabaseIcon,
//   Cloud as CloudIcon,
//   CloudOff,
//   CloudRain,
//   CloudSnow,
//   CloudLightning,
//   CloudDrizzle,
//   CloudFog,
//   CloudHail,
//   CloudSun,
//   CloudMoon,
//   Sun as SunIcon,
//   Moon as MoonIcon,
//   Sunrise,
//   Sunset,
//   Thermometer,
//   Droplets,
//   Umbrella,
//   Wind,
//   Tornado,

//   Snowflake,
//   Cloudy,

//   CloudSunRain,
//   CloudMoonRain,

// } from "lucide-react";
// import {
//   Workflow,
//   GitBranch,
//   Wrench,
//   Gauge,
//   Brain,
//   LayoutTemplate,
//   Activity,
//   Code,
//   Webhook as WebhookIcon,
//   Keyboard,
//   FolderTree,
//   ChevronLeft
// } from "lucide-react";
// import { Button } from "@reactive-resume/ui";
// import { cn } from "@reactive-resume/utils";
// import { Link, useNavigate, useLocation } from "react-router";
// import { toast } from "sonner";

// // Copy to clipboard utility
// const copyToClipboard = async (text: string) => {
//   try {
//     await navigator.clipboard.writeText(text);
//     toast.success(t`Link copied to clipboard!`);
//   } catch (err) {
//     toast.error(t`Failed to copy link`);
//   }
// };

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

// // Feature Card Component
// interface FeatureCardProps {
//   title: string;
//   description: string;
//   icon: React.ReactNode;
//   color?: string;
//   link?: string;
// }

// const FeatureCard = ({ title, description, icon, color = "blue", link }: FeatureCardProps) => {
//   const colorClasses = {
//     blue: "from-blue-500 to-cyan-500",
//     purple: "from-purple-500 to-pink-500",
//     green: "from-green-500 to-emerald-500",
//     amber: "from-amber-500 to-orange-500",
//     red: "from-red-500 to-rose-500",
//     indigo: "from-indigo-500 to-blue-500",
//   }[color];

//   return (
//     <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
//       <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses} rounded-lg flex items-center justify-center mb-4`}>
//         {icon}
//       </div>
//       <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
//         {title}
//       </h3>
//       <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
//         {description}
//       </p>
//       {link && (
//         <Link to={link} className="inline-flex items-center gap-1 mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
//           Learn more <ChevronRight className="w-3 h-3" />
//         </Link>
//       )}
//     </div>
//   );
// };

// // QuickLink Component
// interface QuickLinkProps {
//   title: string;
//   description: string;
//   icon: React.ReactNode;
//   href: string;
//   external?: boolean;
// }

// const QuickLink = ({ title, description, icon, href, external }: QuickLinkProps) => {
//   return (
//     <Link
//       to={href}
//       target={external ? "_blank" : undefined}
//       className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all bg-white dark:bg-gray-800"
//     >
//       <div className="flex items-start gap-3">
//         <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
//           {icon}
//         </div>
//         <div className="flex-1">
//           <div className="flex items-center justify-between">
//             <h4 className="font-semibold text-gray-900 dark:text-white">
//               {title}
//             </h4>
//             {external && <ExternalLink className="w-4 h-4 text-gray-400" />}
//           </div>
//           <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
//             {description}
//           </p>
//         </div>
//       </div>
//     </Link>
//   );
// };

// // Code Example Component
// interface CodeExampleProps {
//   title: string;
//   code: string;
//   language?: string;
// }

// const CodeExample = ({ title, code, language = "typescript" }: CodeExampleProps) => {
//   const [copied, setCopied] = useState(false);

//   const handleCopy = async () => {
//     await copyToClipboard(code);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   return (
//     <div className="bg-gray-900 rounded-lg overflow-hidden">
//       <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
//         <div className="flex items-center gap-2">
//           <div className="w-3 h-3 rounded-full bg-red-500"></div>
//           <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
//           <div className="w-3 h-3 rounded-full bg-green-500"></div>
//           <span className="ml-2 text-sm text-gray-400">{title}</span>
//         </div>
//         <Button
//           variant="ghost"
//           size="sm"
//           onClick={handleCopy}
//           className="h-7 text-xs text-gray-400 hover:text-white"
//         >
//           {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
//           {copied ? t`Copied` : t`Copy`}
//         </Button>
//       </div>
//       <pre className="p-4 overflow-x-auto text-sm text-gray-200">
//         <code>{code}</code>
//       </pre>
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

// // Warning Component
// const Warning = ({ children }: { children: React.ReactNode }) => (
//   <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800">
//     <div className="flex items-start gap-3">
//       <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
//       <div className="flex-1">
//         <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">{t`Important Note`}</p>
//         <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">{children}</p>
//       </div>
//     </div>
//   </div>
// );

// // Success Component
// const Success = ({ children }: { children: React.ReactNode }) => (
//   <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800">
//     <div className="flex items-start gap-3">
//       <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
//       <div className="flex-1">
//         <p className="text-sm text-green-800 dark:text-green-300 font-medium">{t`Best Practice`}</p>
//         <p className="text-sm text-green-700 dark:text-green-400 mt-1">{children}</p>
//       </div>
//     </div>
//   </div>
// );

// // Main Documentation Component
// export const LetterBuilderSection  = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [activeSection, setActiveSection] = useState("overview");
//   const [showMobileTOC, setShowMobileTOC] = useState(false);
  
  
//   // Scroll to section handler
//   const scrollToSection = (sectionId: string) => {
//     const element = document.getElementById(sectionId);
//     if (element) {
//       const offset = 80; // Header height
//       const elementPosition = element.getBoundingClientRect().top;
//       const offsetPosition = elementPosition + window.pageYOffset - offset;

//       window.scrollTo({
//         top: offsetPosition,
//         behavior: "smooth"
//       });

//       setActiveSection(sectionId);
//       setShowMobileTOC(false);
      
//       // Update URL hash
//       navigate(`#${sectionId}`, { replace: true });
//     }
//   };


//   // Feature cards data
//   const features = [
//     {
//       title: t`AI Assistant`,
//       description: t`Intelligent writing suggestions, translations, and content enhancements powered by advanced AI.`,
//       icon: <Sparkles className="w-6 h-6 text-white" />,
//       color: "purple",
//       link: "#ai-assistant"
//     },
//     {
//       title: t`Smart Templates`,
//       description: t`12+ professionally designed templates for different letter categories and purposes.`,
//       icon: <Layout className="w-6 h-6 text-white" />,
//       color: "blue",
//       link: "#templates"
//     },
//     {
//       title: t`Multi-language`,
//       description: t`Translate letters into 15 languages while preserving formatting and structure.`,
//       icon: <Globe className="w-6 h-6 text-white" />,
//       color: "green",
//       link: "#translation"
//     },
//     {
//       title: t`Content Blocks`,
//       description: t`Modular editing system with 11 different block types for flexible content creation.`,
//       icon: <Grid3x3 className="w-6 h-6 text-white" />,
//       color: "amber",
//       link: "#content-blocks"
//     },
//     {
//       title: t`Auto-save`,
//       description: t`Real-time saving with version history and recovery options for peace of mind.`,
//       icon: <Save className="w-6 h-6 text-white" />,
//       color: "indigo",
//       link: "#auto-save"
//     },
//     {
//       title: t`Export System`,
//       description: t`Professional PDF export with preview mode and quality assurance features.`,
//       icon: <Download className="w-6 h-6 text-white" />,
//       color: "red",
//       link: "#export-system"
//     },
//   ];

//   // Quick access links
//   const quickLinks = [
//     {
//       title: t`Letter Dashboard`,
//       description: t`View and manage all your letters`,
//       icon: <FolderOpen className="w-5 h-5" />,
//       href: "/dashboard/cover-letters"
//     },
//     {
//       title: t`Create New Letter`,
//       description: t`Start with the guided wizard`,
//       icon: <FolderPlus className="w-5 h-5" />,
//       href: "/dashboard/cover-letters/wizard"
//     },
//     {
//       title: t`Browse Templates`,
//       description: t`Explore 12+ letter categories`,
//       icon: <Layout className="w-5 h-5" />,
//       href: "/dashboard/cover-letters#templates"
//     },
//     {
//       title: t`AI Assistant Guide`,
//       description: t`Learn AI enhancement techniques`,
//       icon: <Sparkles className="w-5 h-5" />,
//       href: "#ai-assistant"
//     },
//     {
//       title: t`Coin System`,
//       description: t`Understand costs and purchases`,
//       icon: <Coins className="w-5 h-5" />,
//       href: "#coin-system"
//     },
//     {
//       title: t`Support Center`,
//       description: t`Get help and contact support`,
//       icon: <HelpCircle className="w-5 h-5" />,
//       href: "/docs/support"
//     },
//   ];

//   // Code examples
//   const codeExamples = {
//     aiInstructions: `// Good AI instructions:
// "Make this more achievement-oriented with metrics"
// "Add 2-3 specific examples of leadership"
// "Adjust tone for academic audience"
// "Make more concise while keeping key points"

// // Less effective instructions:
// "Make it better" // Too vague
// "Write it for me" // Too broad
// "Improve everything" // No direction`,
    
   
    
//     apiExample: `// Cover letter service methods
// coverLetterService.findAll()           // List all letters
// coverLetterService.findOne(id)         // Get specific letter
// coverLetterService.create(data)        // Create new letter
// coverLetterService.update(id, data)    // Update letter
// coverLetterService.delete(id)          // Delete letter
// coverLetterService.duplicate(id, name) // Duplicate letter
// coverLetterService.translateLetterEnhanced() // AI translation
// coverLetterService.enhanceBlock()      // AI enhancement
// coverLetterService.regenerateBlock()   // AI regeneration`,
//   };

//   // Cost reference data
//   const costReference = [
//     { feature: t`Quick Enhance`, coins: 1, description: t`Instant style fixes` },
//     { feature: t`Regenerate Block`, coins: 2, description: t`Rewrite selected block` },
//     { feature: t`Custom Enhance`, coins: 3, description: t`AI enhancement with instructions` },
//     { feature: t`Translate Letter`, coins: 4, description: t`Multi-language support` },
//     { feature: t`Regenerate Complete`, coins: 5, description: t`Full letter rewrite` },
//     { feature: t`Generate New Letter`, coins: 5, description: t`Wizard creation` },
//     { feature: t`Export PDF`, coins: 10, description: t`Professional export` },
//   ];

//   // Common categories reference
//   const commonCategories = [
//     { useCase: t`Job Application`, template: t`Modern Professional`, icon: <Briefcase className="w-4 h-4" /> },
//     { useCase: t`Internship`, template: t`Academic Modern`, icon: <School className="w-4 h-4" /> },
//     { useCase: t`Business Proposal`, template: t`Executive`, icon: <Building className="w-4 h-4" /> },
//     { useCase: t`Personal Letter`, template: t`Warm Traditional`, icon: <Heart className="w-4 h-4" /> },
//     { useCase: t`Formal Request`, template: t`Classic Formal`, icon: <FileText className="w-4 h-4" /> },
//     { useCase: t`Visa Application`, template: t`Official Embassy`, icon: <Plane className="w-4 h-4" /> },
//     { useCase: t`Partnership Proposal`, template: t`Business Collaboration`, icon: <Handshake className="w-4 h-4" /> },
//     { useCase: t`Recommendation Request`, template: t`Professional Reference`, icon: <ThumbsUp className="w-4 h-4" /> },
//     { useCase: t`Apology Letter`, template: t`Formal Apology`, icon: <AlertTriangle className="w-4 h-4" /> },
//     { useCase: t`Appreciation Letter`, template: t`Heartfelt Thanks`, icon: <Heart className="w-4 h-4" /> },
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
//       {/* Mobile TOC Toggle */}
//       <div className="lg:hidden fixed top-4 left-4 z-50">
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => setShowMobileTOC(!showMobileTOC)}
//           className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
//         >
//           {showMobileTOC ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
//           <span className="ml-2">{t`Contents`}</span>
//         </Button>
//       </div>

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
//                       {t`Inlirah Letter Builder Documentation`}
//                     </h1>
//                     <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
//                       {t`Complete guide to creating professional letters with AI assistance, smart templates, and powerful editing tools.`}
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
//                 description={t`The Inlirah Letter Builder is a comprehensive platform for creating professional letters with AI-powered tools and smart templates.`}
//                 icon={<FileText className="w-6 h-6" />}
//               />

//               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//                 {features.map((feature, index) => (
//                   <FeatureCard key={index} {...feature} />
//                 ))}
//               </div>

//               <div className="prose prose-gray dark:prose-invert max-w-none">
//                 <p>
//                   {t`The Letter Builder empowers you to create compelling, professional letters for various purposes including job applications, business correspondence, personal communications, and formal requests. With guided steps, AI-powered suggestions, and customizable templates, you can create letters that stand out and match your goals.`}
//                 </p>

//                 <Tip>
//                   {t`All features are available through the intuitive interface. No technical knowledge required!`}
//                 </Tip>
//               </div>
//             </section>

//             {/* Quick Start Guide */}
//             <section id="quick-start" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="quick-start"
//                 title={t`Quick Start Guide`}
//                 description={t`Get started with your first letter in minutes`}
//                 icon={<Rocket className="w-6 h-6" />}
//               />

//               <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
//                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//                   {t`Two Ways to Start`}
//                 </h3>
//                 <div className="grid md:grid-cols-2 gap-6">
//                   <div className="space-y-3">
//                     <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
//                       <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
//                         1
//                       </span>
//                       {t`Using the Wizard (Recommended)`}
//                     </h4>
//                     <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
//                       <li className="flex items-start gap-2">
//                         <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
//                         <span>{t`Navigate to Dashboard → Cover Letters → Create New`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
//                         <span>{t`Select your letter category (12+ categories available)`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
//                         <span>{t`Choose input method: Manual or Resume Import`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
//                         <span>{t`Fill in guided fields`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
//                         <span>{t`Select template and style`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
//                         <span>{t`Generate letter with AI assistance`}</span>
//                       </li>
//                     </ol>
//                   </div>

//                   <div className="space-y-3">
//                     <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
//                       <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
//                         2
//                       </span>
//                       {t`Starting from Template`}
//                     </h4>
//                     <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
//                       <li className="flex items-start gap-2">
//                         <ChevronRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                         <span>{t`Go to Dashboard → Cover Letters`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <ChevronRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                         <span>{t`Click "Browse Templates"`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <ChevronRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                         <span>{t`Select category-specific template`}</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <ChevronRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                         <span>{t`Start editing directly`}</span>
//                       </li>
//                     </ol>
//                   </div>
//                 </div>
//               </div>

//               <div className="mb-6">
//                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//                   {t`Basic Workflow`}
//                 </h3>
//                 <CodeExample
//                   title="Typical Workflow Sequence"
//                   code="Create Letter → Add Content → Apply Template → Enhance with AI → Export"
//                 />
//               </div>

//               <Success>
//                 {t`New users typically create their first professional letter in under 5 minutes using the guided wizard.`}
//               </Success>
//             </section>

//             {/* Creating a Letter */}
//             <section id="creating-letter" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="creating-letter"
//                 title={t`Creating a Letter`}
//                 description={t`Step-by-step guide to letter creation`}
//                 icon={<Edit3 className="w-6 h-6" />}
//               />

//               <div className="prose prose-gray dark:prose-invert max-w-none mb-6">
//                 <p>
//                   {t`The letter creation process is designed to be intuitive and guided. Here's what happens at each step:`}
//                 </p>

//                 <h4>{t`Step 1: Category Selection`}</h4>
//                 <p>
//                   {t`Choose from 12+ letter categories. Each category has optimized templates and suggested content:`}
//                 </p>

//                 <div className="grid md:grid-cols-2 gap-4 my-4">
//                   {commonCategories.slice(0, 6).map((category, index) => (
//                     <div
//                       key={index}
//                       className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
//                     >
//                       {category.icon}
//                       <div>
//                         <div className="font-medium text-gray-900 dark:text-white">
//                           {category.useCase}
//                         </div>
//                         <div className="text-sm text-gray-600 dark:text-gray-400">
//                           {category.template}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <h4>{t`Step 2: Input Method`}</h4>
//                 <p>
//                   {t`Choose how to provide your information:`}
//                 </p>
//                 <ul>
//                   <li>
//                     <strong>{t`Manual Entry`}</strong>: {t`Fill in category-specific fields`}
//                   </li>
//                   <li>
//                     <strong>{t`Resume Import`}</strong>: {t`Auto-fill from existing resume (80% faster)`}
//                   </li>
//                 </ul>

//                 <h4>{t`Step 3: Template Selection`}</h4>
//                 <p>
//                   {t`Preview and select from professionally designed templates. Each template includes:`}
//                 </p>
//                 <ul>
//                   <li>{t`Structure optimization for the category`}</li>
//                   <li>{t`Professional formatting`}</li>
//                   <li>{t`Mobile-responsive design`}</li>
//                   <li>{t`Export-ready layout`}</li>
//                 </ul>

//                 <h4>{t`Step 4: AI Enhancement`}</h4>
//                 <p>
//                   {t`Use AI tools to improve your letter:`}
//                 </p>
//                 <ul>
//                   <li>{t`Quick fixes for tone and clarity`}</li>
//                   <li>{t`Custom instructions for specific improvements`}</li>
//                   <li>{t`Translation into 15 languages`}</li>
//                   <li>{t`Complete regeneration if needed`}</li>
//                 </ul>

//                 <h4>{t`Step 5: Final Review & Export`}</h4>
//                 <p>
//                   {t`Preview your letter and export in professional formats:`}
//                 </p>
//                 <ul>
//                   <li>{t`PDF (recommended for formal use)`}</li>
//                   <li>{t`Preview mode to hide editing UI`}</li>
//                   <li>{t`Quality assurance checks`}</li>
//                   <li>{t`Version saving`}</li>
//                 </ul>
//               </div>
//             </section>

//             {/* Basic Workflow */}
//             <section id="basic-workflow" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="basic-workflow"
//                 title={t`Basic Workflow`}
//                 description={t`Standard process for letter creation and management`}
//                 icon={<Workflow className="w-6 h-6" />}
//               />

//               <div className="mb-6">
//                 <div className="relative">
//                   {/* Workflow Steps */}
//                   <div className="space-y-8">
//                     {[
//                       {
//                         step: 1,
//                         title: t`Planning & Setup`,
//                         description: t`Define letter purpose, select category, and gather necessary information`,
//                         icon: <Target className="w-5 h-5" />,
//                         tasks: [
//                           t`Choose letter category`,
//                           t`Gather recipient information`,
//                           t`Collect supporting details`,
//                           t`Determine tone and style`
//                         ]
//                       },
//                       {
//                         step: 2,
//                         title: t`Content Creation`,
//                         description: t`Write or import content, structure your message, and add key points`,
//                         icon: <Edit3 className="w-5 h-5" />,
//                         tasks: [
//                           t`Write or import content`,
//                           t`Add relevant blocks`,
//                           t`Structure information`,
//                           t`Include required elements`
//                         ]
//                       },
//                       {
//                         step: 3,
//                         title: t`Design & Formatting`,
//                         description: t`Apply template, customize formatting, and ensure professional appearance`,
//                         icon: <Palette className="w-5 h-5" />,
//                         tasks: [
//                           t`Select and apply template`,
//                           t`Adjust typography`,
//                           t`Customize colors`,
//                           t`Check formatting`
//                         ]
//                       },
//                       {
//                         step: 4,
//                         title: t`AI Enhancement`,
//                         description: t`Use AI tools to improve content quality, tone, and effectiveness`,
//                         icon: <Sparkles className="w-5 h-5" />,
//                         tasks: [
//                           t`Apply quick enhancements`,
//                           t`Use custom AI instructions`,
//                           t`Check translations if needed`,
//                           t`Review AI suggestions`
//                         ]
//                       },
//                       {
//                         step: 5,
//                         title: t`Review & Export`,
//                         description: t`Final proofreading, preview, and export in desired format`,
//                         icon: <Eye className="w-5 h-5" />,
//                         tasks: [
//                           t`Preview final version`,
//                           t`Proofread content`,
//                           t`Export to PDF`,
//                           t`Save and organize`
//                         ]
//                       }
//                     ].map((step) => (
//                       <div key={step.step} className="flex gap-4">
//                         <div className="flex flex-col items-center">
//                           <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
//                             {step.step}
//                           </div>
//                           {step.step < 5 && (
//                             <div className="flex-1 w-0.5 bg-gradient-to-b from-blue-600 to-purple-600 my-2"></div>
//                           )}
//                         </div>
//                         <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
//                           <div className="flex items-center gap-3 mb-2">
//                             {step.icon}
//                             <h4 className="font-semibold text-gray-900 dark:text-white">
//                               {step.title}
//                             </h4>
//                           </div>
//                           <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
//                             {step.description}
//                           </p>
//                           <div className="grid grid-cols-2 gap-2">
//                             {step.tasks.map((task, index) => (
//                               <div key={index} className="flex items-center gap-2 text-sm">
//                                 <CheckCircle2 className="w-3 h-3 text-green-500" />
//                                 <span className="text-gray-700 dark:text-gray-300">{task}</span>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               <Tip>
//                 {t`Save time by using resume import for job application letters - it automatically fills in your experience, skills, and contact information.`}
//               </Tip>
//             </section>

//             {/* Features Section */}
//             <section id="features" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="features"
//                 title={t`Detailed Features`}
//                 description={t`Explore the powerful features of the Letter Builder`}
//                 icon={<Sparkles className="w-6 h-6" />}
//               />

//               <div className="mb-8">
//                 <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                   {t`Core Capabilities`}
//                 </h3>
//                 <div className="grid md:grid-cols-2 gap-6">
//                   <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
//                     <div className="flex items-center gap-3 mb-4">
//                       <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
//                         <Zap className="w-6 h-6 text-white" />
//                       </div>
//                       <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
//                         {t`Speed & Efficiency`}
//                       </h4>
//                     </div>
//                     <ul className="space-y-2">
//                       <li className="flex items-center gap-2">
//                         <CheckCircle2 className="w-4 h-4 text-green-500" />
//                         <span>{t`Create letters in under 5 minutes`}</span>
//                       </li>
//                       <li className="flex items-center gap-2">
//                         <CheckCircle2 className="w-4 h-4 text-green-500" />
//                         <span>{t`80% faster with resume import`}</span>
//                       </li>
//                       <li className="flex items-center gap-2">
//                         <CheckCircle2 className="w-4 h-4 text-green-500" />
//                         <span>{t`One-click template application`}</span>
//                       </li>
//                       <li className="flex items-center gap-2">
//                         <CheckCircle2 className="w-4 h-4 text-green-500" />
//                         <span>{t`Instant AI enhancements`}</span>
//                       </li>
//                     </ul>
//                   </div>

//                   <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
//                     <div className="flex items-center gap-3 mb-4">
//                       <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
//                         <Award className="w-6 h-6 text-white" />
//                       </div>
//                       <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
//                         {t`Professional Quality`}
//                       </h4>
//                     </div>
//                     <ul className="space-y-2">
//                       <li className="flex items-center gap-2">
//                         <CheckCircle2 className="w-4 h-4 text-green-500" />
//                         <span>{t`Industry-standard formatting`}</span>
//                       </li>
//                       <li className="flex items-center gap-2">
//                         <CheckCircle2 className="w-4 h-4 text-green-500" />
//                         <span>{t`Professional templates`}</span>
//                       </li>
//                       <li className="flex items-center gap-2">
//                         <CheckCircle2 className="w-4 h-4 text-green-500" />
//                         <span>{t`Export-ready PDFs`}</span>
//                       </li>
//                       <li className="flex items-center gap-2">
//                         <CheckCircle2 className="w-4 h-4 text-green-500" />
//                         <span>{t`Multi-language support`}</span>
//                       </li>
//                     </ul>
//                   </div>
//                 </div>
//               </div>

//               <Warning>
//                 {t`Always review AI-generated content before finalizing. While AI is powerful, human judgment ensures the best results.`}
//               </Warning>
//             </section>

//             {/* AI Assistant Section */}
//             <section id="ai-assistant" className="scroll-mt-24 mb-12">
//               <SectionHeader
//                 id="ai-assistant"
//                 title={t`AI Assistant`}
//                 description={t`Intelligent writing assistance powered by advanced AI`}
//                 icon={<Bot className="w-6 h-6" />}
//               />

//               <div className="mb-6">
//                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//                   {t`Quick Enhancements`}
//                 </h3>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
//                   {[
//                     { key: 'professional', label: t`Professional`, icon: <Briefcase className="w-4 h-4" /> },
//                     { key: 'concise', label: t`Concise`, icon: <MessageCircle className="w-4 h-4" /> },
//                     { key: 'impactful', label: t`Impactful`, icon: <Zap className="w-4 h-4" /> },
//                     { key: 'friendly', label: t`Friendly`, icon: <Users className="w-4 h-4" /> },
//                     { key: 'formal', label: t`Formal`, icon: <Award className="w-4 h-4" /> },
//                     { key: 'modern', label: t`Modern`, icon: <Sparkles className="w-4 h-4" /> },
//                     { key: 'persuasive', label: t`Persuasive`, icon: <Target className="w-4 h-4" /> },
//                     { key: 'confident', label: t`Confident`, icon: <Shield className="w-4 h-4" /> },
//                   ].map((enhancement) => (
//                     <div
//                       key={enhancement.key}
//                       className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center"
//                     >
//                       <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
//                         {enhancement.icon}
//                       </div>
//                       <span className="text-sm font-medium text-gray-900 dark:text-white">
//                         {enhancement.label}
//                       </span>
//                     </div>
//                   ))}
//                 </div>

//                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//                   {t`Custom AI Instructions`}
//                 </h3>
//                 <CodeExample
//                   title="Example AI Instructions"
//                   code={codeExamples.aiInstructions}
//                 />

//                 <div className="mt-6">
//                   <Success>
//                     {t`Be specific with AI instructions. Instead of "make it better", try "add 2-3 specific achievement metrics" or "adjust tone for academic audience".`}
//                   </Success>
//                 </div>
//               </div>
//             </section>

            
            
//           </main>
//         </div>

//         {/* Mobile Table of Contents Overlay Background */}
//         <AnimatePresence>
//           {showMobileTOC && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="lg:hidden fixed inset-0 bg-black/50 z-30"
//               onClick={() => setShowMobileTOC(false)}
//             />
//           )}
//         </AnimatePresence>
//       </div>

//       {/* Fixed Action Buttons for Mobile */}
//       <div className="lg:hidden fixed bottom-6 right-6 z-50">
//         <div className="flex flex-col gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
//             className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg"
//             title={t`Scroll to top`}
//           >
//             <ChevronUp className="w-4 h-4" />
//           </Button>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => setShowMobileTOC(true)}
//             className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg"
//             title={t`Table of Contents`}
//           >
//             <Menu className="w-4 h-4" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Add missing icon components at the end of the file if not already imported
// const ChevronUp = (props: React.SVGProps<SVGSVGElement>) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     width="24"
//     height="24"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//     {...props}
//   >
//     <path d="m18 15-6-6-6 6" />
//   </svg>
// );

















import { t, Trans } from "@lingui/macro";
import { 
  FileText, 
  Layout, 
  Palette, 
  Download, 
  Save,
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
  Mail,
  Workflow,
  ArrowUp,
  Trash2,
  Edit3,
  RefreshCw,
  Globe,
  Settings,
  Shield,
  PanelLeft,
  Languages,
  Eye,
  Copy,
  Target,
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

export const LetterBuilderSection = () => {
  return (
    <div id="letter-builder" className="scroll-mt-28 space-y-16">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {t`Letter Builder`}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
                {t`The Letter Builder empowers you to craft compelling, professional letters for job applications, networking, and formal communication. With guided steps, AI-powered suggestions, and customizable templates, you can create letters that stand out and match your goals.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <section id="letter-getting-started" className="scroll-mt-24">
        <SectionHeader
          id="letter-getting-started"
          title={t`Getting Started`}
          description={t`Create your first professional letter in minutes`}
          icon={<Zap className="w-6 h-6" />}
        />

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t`Two Ways to Start`}
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: t`Using the Wizard (Recommended)`,
                steps: [
                  t`Navigate to Dashboard → Cover Letters → Create New`,
                  t`Select your letter category (12+ categories)`,
                  t`Choose input method: Manual or Resume Import`,
                  t`Fill in guided fields`,
                  t`Select template and style`,
                  t`Generate letter with AI assistance`
                ],
                icon: <Workflow className="w-5 h-5" />,
                color: "blue"
              },
              {
                title: t`Starting from Template`,
                steps: [
                  t`Go to Dashboard → Cover Letters`,
                  t`Click "Browse Templates"`,
                  t`Select category-specific template`,
                  t`Start editing directly`,
                  t`Use AI tools to enhance`,
                  t`Export when ready`
                ],
                icon: <Layout className="w-5 h-5" />,
                color: "green"
              }
            ].map((method, index) => (
              <div key={index} className="space-y-4">
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  method.color === "blue" && "bg-blue-50 dark:bg-blue-900/20",
                  method.color === "green" && "bg-green-50 dark:bg-green-900/20"
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    method.color === "blue" && "bg-blue-100 dark:bg-blue-900/30",
                    method.color === "green" && "bg-green-100 dark:bg-green-900/30"
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
         <Tip>
          {t`Save time by using resume import for job application letters - it automatically fills in your experience, skills, and contact information.`}
        </Tip>
      </section>

      {/* Letter Writing System */}
<section id="letter-categories" className="scroll-mt-24">
  <SectionHeader
    id="letter-categories"
    title={t`Letter Writing System`}
    description={t`AI-powered letter creation with extensive post-generation customization`}
    icon={<FileText className="w-6 h-6" />}
  />

  {/* Post-Generation Enhancement Section */}
  <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-xl border border-purple-200 dark:border-purple-800">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
          {t`Post-Generation Customization`}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t`Fine-tune your AI-generated letter with advanced editing tools`}
        </p>
      </div>
    </div>
    
    <div className="space-y-6">
      {/* Content Enhancement Features */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">{t`Block-Level Editing`}</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Edit3 className="w-4 h-4 text-blue-500" />
              <div className="font-medium text-gray-900 dark:text-white">{t`Live Content Editing`}</div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t`Edit any block's content directly in the sidebar with auto-save (800ms delay). Use Ctrl+Enter for immediate save, Esc to revert changes.`}
            </p>
          </div>
          
          <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="w-4 h-4 text-green-500" />
              <div className="font-medium text-gray-900 dark:text-white">{t`AI Enhancement`}</div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t`Select any block and use AI to rewrite, improve, or enhance specific sections with custom instructions.`}
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Formatting Controls */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">{t`Advanced Styling Controls`}</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Type className="w-4 h-4 text-purple-500" />
                <div className="font-medium text-gray-900 dark:text-white">{t`Typography Controls`}</div>
              </div>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li>• {t`11+ font families with preview`}</li>
                <li>• {t`8 font sizes from XS to Title`}</li>
                <li>• {t`9 font weights from Thin to Black`}</li>
                <li>• {t`7 line height options`}</li>
              </ul>
            </div>
            
            <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-amber-500" />
                <div className="font-medium text-gray-900 dark:text-white">{t`Visual Customization`}</div>
              </div>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li>• {t`Text and background color pickers`}</li>
                <li>• {t`8 border radius options`}</li>
                <li>• {t`Custom padding controls`}</li>
                <li>• {t`Quick style reset`}</li>
              </ul>
            </div>
          </div>
          
          <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-red-500" />
              <div className="font-medium text-gray-900 dark:text-white">{t`Quick Formatting Tools`}</div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t`One-click formatting: Bold, Italic, Underline with toggle states. Real-time preview of all changes.`}
            </div>
          </div>
        </div>
      </div>

      {/* Block Management Features */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">{t`Block Management`}</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-2 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
            <Copy className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <div className="text-xs font-medium text-gray-900 dark:text-white">{t`Duplicate`}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t`Make copies`}</div>
          </div>
          <div className="p-2 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-green-200 dark:border-green-800 text-center">
            <ArrowUp className="w-4 h-4 mx-auto mb-1 text-green-500" />
            <div className="text-xs font-medium text-gray-900 dark:text-white">{t`Reorder`}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t`Move up/down`}</div>
          </div>
          <div className="p-2 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-red-200 dark:border-red-800 text-center">
            <Trash2 className="w-4 h-4 mx-auto mb-1 text-red-500" />
            <div className="text-xs font-medium text-gray-900 dark:text-white">{t`Delete`}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t`Remove blocks`}</div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {t`Double-click block names to rename. Visual indicators show active and modified blocks.`}
        </p>
      </div>
    </div>
  </div>

  {/* Available Block Types */}
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t`Available Block Types`}</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {[
        { type: t`Header`, icon: '📝', desc: t`Main title section` },
        { type: t`Content`, icon: '📄', desc: t`Regular text paragraph` },
        { type: t`Bullet List`, icon: '•', desc: t`Unordered list with bullets` },
        { type: t`Numbered List`, icon: '1.', desc: t`Ordered list with numbers` },
        { type: t`Quote`, icon: '❝', desc: t`Highlighted quotation` },
        { type: t`Divider`, icon: '―', desc: t`Visual separation line` },
        { type: t`Contact Info`, icon: '📧', desc: t`Name, email, phone details` },
        { type: t`Greeting`, icon: '👋', desc: t`Opening salutation` },
        { type: t`Closing`, icon: '✍️', desc: t`Ending and signature` },
        { type: t`Signature`, icon: '🖊️', desc: t`Name and title` },
        { type: t`Subheader`, icon: '🔸', desc: t`Secondary heading` },
      ].map((block, index) => (
        <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{block.icon}</span>
            <div className="font-medium text-sm text-gray-900 dark:text-white">{block.type}</div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{block.desc}</div>
        </div>
      ))}
    </div>
  </div>

  {/* Tips & Best Practices */}
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
    <div className="flex items-center gap-3 mb-4">
      <Lightbulb className="w-6 h-6 text-green-600 dark:text-green-400" />
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{t`Enhancement Tips`}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t`Make the most of post-generation editing`}
        </p>
      </div>
    </div>
    
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {t`Start with AI generation, then fine-tune individual blocks for personalization`}
        </p>
      </div>
      <div className="flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {t`Use consistent formatting across similar blocks (headers, content) for professional appearance`}
        </p>
      </div>
      <div className="flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {t`Take advantage of auto-save feature while typing - changes are saved automatically`}
        </p>
      </div>
      <div className="flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {t`Use AI enhancement for sections that need improvement while keeping the rest intact`}
        </p>
      </div>
    </div>
  </div>
</section>

      {/* Features */}
      <section id="letter-features" className="scroll-mt-24">
        <SectionHeader
          id="letter-features"
          title={t`Key Features`}
          description={t`Powerful tools for professional letter writing`}
          icon={<Sparkles className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Workflow className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`Guided Wizard`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Step-by-step letter creation`}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t`Features:`}
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 pl-4">
                <li>• {t`Category-specific guidance`}</li>
                <li>• {t`Smart field suggestions`}</li>
                <li>• {t`Resume import option`}</li>
                <li>• {t`Template recommendations`}</li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`Multi-language Support`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Write in 15+ languages`}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t`Supported languages:`}
              </div>
              <div className="flex flex-wrap gap-2">
                {["English", "Spanish", "French", "German", "Chinese", "Japanese", "Arabic"].map((lang, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`AI Enhancement`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Intelligent writing assistance`}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t`AI capabilities:`}
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 pl-4">
                <li>• {t`Tone adjustment`}</li>
                <li>• {t`Grammar correction`}</li>
                <li>• {t`Content enhancement`}</li>
                <li>• {t`Translation`}</li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                <Save className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`Auto-save & Versioning`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Never lose your work`}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t`Features:`}
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 pl-4">
                <li>• {t`Real-time auto-save`}</li>
                <li>• {t`Version history`}</li>
                <li>• {t`Recovery options`}</li>
                <li>• {t`Cloud backup`}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      
      {/* AI-Powered Letter Enhancement */}
      <section id="letter-ai-features" className="scroll-mt-24">
        <SectionHeader
          id="letter-ai-features"
          title={t`AI-Powered Letter Enhancement`}
          description={t`Select any text block and transform it with AI tools`}
          icon={<Sparkles className="w-6 h-6" />}
        />

        <div className="space-y-8">
          {/* How to Use AI Enhancement */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {t`Enhance Any Text Block`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Click a block, then use these AI tools`}
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <h4 className="font-medium text-gray-900 dark:text-white">{t`Quick Enhance`}</h4>
                </div>
                <ul className="space-y-2">
                  {[
                    t`Make more professional`,
                    t`Make more concise`,
                    t`Add impact`,
                    t`Make friendly`,
                    t`Make formal`,
                    t`Update with modern language`,
                    t`Make persuasive`,
                    t`Make confident`
                  ].map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{action}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  {t`One-click style transformations`}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Edit3 className="w-5 h-5 text-blue-500" />
                  <h4 className="font-medium text-gray-900 dark:text-white">{t`Custom Instructions`}</h4>
                </div>
                <div className="space-y-2">
                  {[
                    t`"Rewrite with more persuasive language"`,
                    t`"Add specific examples of leadership"`,
                    t`"Tailor for tech company culture"`,
                    t`"Make more results-oriented"`,
                    t`"Add industry-specific keywords"`
                  ].map((instruction, index) => (
                    <div key={index} className="p-2 bg-white/70 dark:bg-gray-800/70 rounded border border-blue-200 dark:border-blue-800">
                      <p className="text-sm italic text-blue-700 dark:text-blue-300">{instruction}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  {t`Write exactly what you want changed`}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-5 h-5 text-green-500" />
                  <h4 className="font-medium text-gray-900 dark:text-white">{t`Advanced Features`}</h4>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">{t`AI Regeneration`}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t`Completely rewrite selected block with improved wording`}
                    </p>
                  </div>
                  <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">{t`Complete Letter Regeneration`}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t`Create new version of entire letter with "(Regenerated)" suffix`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Multilingual Translation */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {t`Multilingual Translation`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Translate your letter to 16+ languages while preserving formatting`}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">{t`How to Translate`}</h4>
                <ol className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">1</span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t`Select target language from 16+ options with flags`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">2</span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t`Choose translation method: Preserve Structure, Section-by-Section, or Complete`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">3</span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t`Configure what to preserve: names, dates, numbers, URLs, specific terms`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">4</span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t`Choose to create new version or update current letter`}
                    </span>
                  </li>
                </ol>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">{t`Supported Languages`}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { flag: '🇺🇸', lang: 'English', code: 'EN' },
                    { flag: '🇪🇸', lang: 'Spanish', code: 'ES' },
                    { flag: '🇫🇷', lang: 'French', code: 'FR' },
                    { flag: '🇩🇪', lang: 'German', code: 'DE' },
                    { flag: '🇮🇹', lang: 'Italian', code: 'IT' },
                    { flag: '🇵🇹', lang: 'Portuguese', code: 'PT' },
                    { flag: '🇷🇺', lang: 'Russian', code: 'RU' },
                    { flag: '🇨🇳', lang: 'Chinese', code: 'ZH' },
                    { flag: '🇯🇵', lang: 'Japanese', code: 'JA' },
                    { flag: '🇰🇷', lang: 'Korean', code: 'KO' },
                    { flag: '🇸🇦', lang: 'Arabic', code: 'AR' },
                    { flag: '🇮🇳', lang: 'Hindi', code: 'HI' }
                  ].map((language, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-white/70 dark:bg-gray-800/70 rounded border border-emerald-200 dark:border-emerald-800">
                      <span className="text-lg">{language.flag}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{language.lang}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{language.code}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-blue-900 dark:text-blue-300 mb-1">
                    {t`Smart Translation Features`}
                  </div>
                  <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                    <li>• {t`Preserves all block formatting and layout`}</li>
                    <li>• {t`Keeps names, dates, numbers intact if configured`}</li>
                    <li>• {t`Maintains professional tone and style`}</li>
                    <li>• {t`Creates separate version for each language`}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Controls */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t`Advanced Translation Controls`}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t`Fine-tune how translations work`}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white mb-2">{t`Translation Methods`}</div>
                  <div className="space-y-2">
                    {[
                      {
                        method: t`Preserve Structure`,
                        desc: t`Perfect layout retention - best for professional letters`,
                        icon: <Shield className="w-4 h-4" />
                      },
                      {
                        method: t`Section-by-Section`,
                        desc: t`Translates each block independently`,
                        icon: <PanelLeft className="w-4 h-4" />
                      },
                      {
                        method: t`Complete Translation`,
                        desc: t`Translates entire letter as one piece`,
                        icon: <FileText className="w-4 h-4" />
                      }
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                          {item.icon}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{item.method}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-medium text-gray-900 dark:text-white mb-2">{t`Preservation Options`}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      t`Names (John, Company Inc.)`,
                      t`Dates (2024, January 15)`,
                      t`Numbers (5 years, $100K)`,
                      t`URLs (example.com)`,
                      t`Email addresses`,
                      t`Custom terms`
                    ].map((option, index) => (
                      <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Languages className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t`Manage Language Versions`}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t`Switch between translated versions`}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-amber-500" />
                    <div className="font-medium text-gray-900 dark:text-white">{t`View All Translations`}</div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t`See all available language versions of your letter with flags and status indicators`}
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-4 h-4 text-green-500" />
                    <div className="font-medium text-gray-900 dark:text-white">{t`Instant Switching`}</div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t`Click "Switch" on any translation to instantly view and edit that version`}
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Copy className="w-4 h-4 text-blue-500" />
                    <div className="font-medium text-gray-900 dark:text-white">{t`Independent Editing`}</div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t`Each language version maintains its own content, formatting, and AI enhancement history`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t`AI Enhancement Best Practices`}
              </h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white mb-2">{t`Be Specific`}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Instead of "make it better", try "make more professional for banking industry"`}
                </p>
              </div>
              <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white mb-2">{t`Test Different Styles`}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Try Professional, Concise, and Impactful on the same text to see which works best`}
                </p>
              </div>
              <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white mb-2">{t`Use Complete Regeneration`}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`When stuck, regenerate entire letter for fresh perspective while keeping original`}
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {t`Pro Tip: For international job applications, translate your cover letter to the local language using Preserve Structure method for perfect formatting.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Export & Sharing */}
      <section id="letter-export" className="scroll-mt-24">
        <SectionHeader
          id="letter-export"
          title={t`Export & Sharing`}
          description={t`Save, share, and distribute your letters`}
          icon={<Download className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`PDF Export`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Professional export with coin system`}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t`Features:`}
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
                <li>• {t`Print-ready format`}</li>
                <li>• {t`High quality 300 DPI`}</li>
                <li>• {t`Professional formatting`}</li>
                <li>• {t`Automatic download`}</li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`Sharing Options`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Share your letters with recipients`}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t`Methods:`}
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 pl-4">
                <li>• {t`Export PDF and email`}</li>
                <li>• {t`Download and share file`}</li>
                <li>• {t`Print physical copies`}</li>
                <li>• {t`Copy as plain text`}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section id="letter-best-practices" className="scroll-mt-24">
        <SectionHeader
          id="letter-best-practices"
          title={t`Best Practices`}
          description={t`Tips for creating effective letters`}
          icon={<Award className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`Writing Tips`}
            </h3>
            <div className="space-y-3">
              {[
                t`Personalize for the recipient`,
                t`Keep message clear and concise`,
                t`Focus on your strengths`,
                t`Use professional tone`,
                t`Include specific examples`,
                t`Proofread multiple times`
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
              {t`Before Sending Checklist`}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { check: t`Recipient correct`, icon: <User className="w-4 h-4" /> },
                { check: t`No spelling errors`, icon: <Type className="w-4 h-4" /> },
                { check: t`Formatting consistent`, icon: <Layout className="w-4 h-4" /> },
                { check: t`Tone appropriate`, icon: <Sparkles className="w-4 h-4" /> },
                { check: t`Contact info included`, icon: <Mail className="w-4 h-4" /> },
                { check: t`Proofread complete`, icon: <Eye className="w-4 h-4" /> }
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
          to="/dashboard/cover-letters" 
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <PlusCircle className="w-6 h-6" />
            <h3 className="font-semibold text-lg">
              {t`Create Letter`}
            </h3>
          </div>
          <p className="text-blue-100 text-sm">
            {t`Start writing your professional letter now`}
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