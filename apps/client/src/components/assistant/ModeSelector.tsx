// // components/assistant/ModeSelector.tsx
// import React from 'react';
// import { 
//   Brain, 
//   BookOpen, 
//   Briefcase, 
//   Sparkles, 
//   Scale, 
//   Heart, 
//   Network, 
//   LineChart,
//   Crown,
//   Lock
// } from 'lucide-react';
// import { AssistantMode } from '../../types/assistant';

// interface ModeSelectorProps {
//   selectedMode: AssistantMode;
//   onSelectMode: (mode: AssistantMode) => void;
//   canAccessPremium: boolean;
//   collapsed?: boolean;
// }

// export const ModeSelector: React.FC<ModeSelectorProps> = ({
//   selectedMode,
//   onSelectMode,
//   canAccessPremium,
//   collapsed = false
// }) => {
//   const modes = [
//     {
//       id: 'GENERAL_ASSISTANT' as AssistantMode,
//       label: 'General',
//       icon: <Brain className="w-4 h-4" />,
//       color: 'from-purple-500 to-indigo-600',
//       premium: false,
//     },
//     {
//       id: 'TUTOR' as AssistantMode,
//       label: 'Tutor',
//       icon: <BookOpen className="w-4 h-4" />,
//       color: 'from-emerald-500 to-teal-600',
//       premium: false,
//     },
//     {
//       id: 'CAREER_COACH' as AssistantMode,
//       label: 'Career',
//       icon: <Briefcase className="w-4 h-4" />,
//       color: 'from-blue-500 to-cyan-600',
//       premium: false,
//     },
//     {
//       id: 'CONTENT_GUIDE' as AssistantMode,
//       label: 'Content',
//       icon: <Sparkles className="w-4 h-4" />,
//       color: 'from-amber-500 to-orange-600',
//       premium: false,
//     },
//     {
//       id: 'DECISION_ARCHITECT' as AssistantMode,
//       label: 'Decision',
//       icon: <Scale className="w-4 h-4" />,
//       color: 'from-violet-500 to-purple-600',
//       premium: true,
//     },
//     {
//       id: 'LIFE_COACH' as AssistantMode,
//       label: 'Life Coach',
//       icon: <Heart className="w-4 h-4" />,
//       color: 'from-rose-500 to-pink-600',
//       premium: true,
//     },
//     {
//       id: 'SECOND_BRAIN' as AssistantMode,
//       label: 'Second Brain',
//       icon: <Network className="w-4 h-4" />,
//       color: 'from-sky-500 to-blue-600',
//       premium: true,
//     },
//     {
//       id: 'FUTURE_SIMULATOR' as AssistantMode,
//       label: 'Future',
//       icon: <LineChart className="w-4 h-4" />,
//       color: 'from-indigo-500 to-blue-600',
//       premium: true,
//     },
//   ];

//   if (collapsed) {
//     return (
//       <div className="space-y-1">
//         {modes.map(mode => {
//           const isLocked = mode.premium && !canAccessPremium;
//           return (
//             <button
//               key={mode.id}
//               onClick={() => !isLocked && onSelectMode(mode.id)}
//               disabled={isLocked}
//               className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition ${
//                 selectedMode === mode.id && !isLocked
//                   ? `bg-gradient-to-r ${mode.color} text-white`
//                   : isLocked
//                     ? 'opacity-50 cursor-not-allowed'
//                     : 'hover:bg-muted'
//               }`}
//             >
//               <div className={`p-1.5 rounded-lg ${
//                 selectedMode === mode.id && !isLocked ? 'bg-white/20' : 'bg-secondary'
//               }`}>
//                 {mode.icon}
//               </div>
//               <span className="flex-1">{mode.label}</span>
//               {mode.premium && !canAccessPremium && (
//                 <Lock className="w-3 h-3" />
//               )}
//               {mode.premium && canAccessPremium && (
//                 <Crown className="w-3 h-3 text-amber-500" />
//               )}
//             </button>
//           );
//         })}
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-2 gap-2">
//       {modes.map(mode => {
//         const isLocked = mode.premium && !canAccessPremium;
//         return (
//           <button
//             key={mode.id}
//             onClick={() => !isLocked && onSelectMode(mode.id)}
//             disabled={isLocked}
//             className={`relative p-3 rounded-lg text-left transition ${
//               selectedMode === mode.id && !isLocked
//                 ? `bg-gradient-to-r ${mode.color} text-white shadow-md`
//                 : isLocked
//                   ? 'bg-secondary/50 opacity-60 cursor-not-allowed'
//                   : 'bg-secondary hover:bg-secondary/80'
//             }`}
//           >
//             <div className="flex flex-col items-center text-center gap-2">
//               <div className={`p-2 rounded-lg ${
//                 selectedMode === mode.id && !isLocked ? 'bg-white/20' : 'bg-background'
//               }`}>
//                 {mode.icon}
//               </div>
//               <span className="text-xs font-medium">{mode.label}</span>
//             </div>
//             {mode.premium && !canAccessPremium && (
//               <Lock className="absolute top-1 right-1 w-3 h-3 text-muted-foreground" />
//             )}
//           </button>
//         );
//       })}
//     </div>
//   );
// };


// components/assistant/ModeSelector.tsx
import React from 'react';
import { 
  Brain, 
  BookOpen, 
  Briefcase, 
  Sparkles, 
  Scale, 
  Heart, 
  Network, 
  LineChart,
  Crown,
  Lock
} from 'lucide-react';
import { AssistantMode } from '../../types/assistant';

interface ModeSelectorProps {
  selectedMode: AssistantMode;
  onSelectMode: (mode: AssistantMode) => void;
  canAccessPremium?: boolean; // Make optional
  collapsed?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onSelectMode,
  canAccessPremium = true, // Default to true to show all modes
  collapsed = false
}) => {
  const modes = [
    {
      id: 'GENERAL_ASSISTANT' as AssistantMode,
      label: 'General',
      icon: <Brain className="w-4 h-4" />,
      color: 'from-purple-500 to-indigo-600',
      premium: false,
    },
    {
      id: 'TUTOR' as AssistantMode,
      label: 'Tutor',
      icon: <BookOpen className="w-4 h-4" />,
      color: 'from-emerald-500 to-teal-600',
      premium: false,
    },
    {
      id: 'CAREER_COACH' as AssistantMode,
      label: 'Career',
      icon: <Briefcase className="w-4 h-4" />,
      color: 'from-blue-500 to-cyan-600',
      premium: false,
    },
    {
      id: 'CONTENT_GUIDE' as AssistantMode,
      label: 'Content',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'from-amber-500 to-orange-600',
      premium: false,
    },
    {
      id: 'DECISION_ARCHITECT' as AssistantMode,
      label: 'Decision',
      icon: <Scale className="w-4 h-4" />,
      color: 'from-violet-500 to-purple-600',
      premium: true,
    },
    {
      id: 'LIFE_COACH' as AssistantMode,
      label: 'Life Coach',
      icon: <Heart className="w-4 h-4" />,
      color: 'from-rose-500 to-pink-600',
      premium: true,
    },
    {
      id: 'SECOND_BRAIN' as AssistantMode,
      label: 'Second Brain',
      icon: <Network className="w-4 h-4" />,
      color: 'from-sky-500 to-blue-600',
      premium: true,
    },
    {
      id: 'FUTURE_SIMULATOR' as AssistantMode,
      label: 'Future',
      icon: <LineChart className="w-4 h-4" />,
      color: 'from-indigo-500 to-blue-600',
      premium: true,
    },
  ];

  if (collapsed) {
    return (
      <div className="space-y-1">
        {modes.map(mode => {
          // REMOVE the premium check - always show all modes
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition ${
                selectedMode === mode.id
                  ? `bg-gradient-to-r ${mode.color} text-white`
                  : 'hover:bg-muted'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${
                selectedMode === mode.id ? 'bg-white/20' : 'bg-secondary'
              }`}>
                {mode.icon}
              </div>
              <span className="flex-1">{mode.label}</span>
              {mode.premium && (
                <Crown className="w-3 h-3 text-amber-500" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {modes.map(mode => {
        // REMOVE the premium check - always show all modes
        return (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className={`relative p-3 rounded-lg text-left transition ${
              selectedMode === mode.id
                ? `bg-gradient-to-r ${mode.color} text-white shadow-md`
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`p-2 rounded-lg ${
                selectedMode === mode.id ? 'bg-white/20' : 'bg-background'
              }`}>
                {mode.icon}
              </div>
              <span className="text-xs font-medium">{mode.label}</span>
            </div>
            {mode.premium && (
              <Crown className="absolute top-1 right-1 w-3 h-3 text-amber-500" />
            )}
          </button>
        );
      })}
    </div>
  );
};