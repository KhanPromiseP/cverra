// @/client/components/layout/BonusFlag.tsx - CSS hover version
import React, { memo } from 'react';
import { useWelcomeBonus } from '@/client/hooks/useWelcomeBonus';

export const BonusFlag = memo(() => {
  const { 
    bonusBalance, 
    showBonusFlag, 
    bonusFinished, 
    hideBonusFlag,
    isLoading
  } = useWelcomeBonus();
  
  // Only show if we have coins and flag is visible
  const shouldShow = !isLoading && 
                    showBonusFlag && 
                    !bonusFinished && 
                    bonusBalance > 0;
  
  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed top-16 right-4 z-40 animate-fadeIn">
      <div className="group flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
        {/* Coin icon */}
        <div className="w-4 h-4 flex items-center justify-center">
          <span className="text-xs">🎁</span>
        </div>
        
        {/* Balance - clean text */}
        <span className="text-xs font-semibold tracking-tight">
          {bonusBalance} bonus coins
        </span>
        
        {/* Close button - hidden by default, shows on group hover */}
        <button
          onClick={hideBonusFlag}
          className="w-3 h-3 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white/70 hover:text-white transition-all duration-200 ml-1"
          title="Hide bonus flag"
        >
          ×
        </button>
      </div>
    </div>
  );
});

BonusFlag.displayName = 'BonusFlag';