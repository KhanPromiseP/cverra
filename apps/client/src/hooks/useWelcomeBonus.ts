// @/client/hooks/useWelcomeBonus.ts - FIXED VERSION
import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/client/services/user';
import { axios } from '@/client/libs/axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

import { useMemo } from 'react';

// Storage keys
const WELCOME_CHECKED_KEY = 'Inlirah_welcome_checked';
const WELCOME_CLAIMED_KEY = 'Inlirah_welcome_claimed';
const WELCOME_SHOWN_KEY = 'Inlirah_welcome_shown';
const BONUS_BALANCE_KEY = 'Inlirah_bonus_balance';
const BONUS_FLAG_VISIBLE = 'Inlirah_bonus_flag_visible';

export const useWelcomeBonus = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  
  // Use refs for values that don't need to trigger re-renders
  const hasCheckedRef = useRef<Set<string>>(new Set());
  const lastFetchTimeRef = useRef<number>(0);
  const FETCH_COOLDOWN = 30000; // 30 seconds
  
  // State that triggers re-renders
  const [showWelcome, setShowWelcome] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [userName, setUserName] = useState('');
  const [bonusBalance, setBonusBalance] = useState<number>(0);
  const [showBonusFlag, setShowBonusFlag] = useState(false);
  const [bonusFinished, setBonusFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Start with false

  // Initialize state from localStorage - ONLY ONCE per user
  useEffect(() => {
    if (!user?.id) {
      // Reset when no user
      setBonusBalance(0);
      setShowBonusFlag(false);
      setBonusFinished(false);
      setShowWelcome(false);
      setUserName('');
      return;
    }

    // Skip if we already checked this user recently
    const now = Date.now();
    if (hasCheckedRef.current.has(user.id) && (now - lastFetchTimeRef.current) < FETCH_COOLDOWN) {
      return;
    }

    const initializeBonus = async () => {
      setIsLoading(true);
      
      try {
        // Load from localStorage first (fast)
        const savedBalance = localStorage.getItem(`${BONUS_BALANCE_KEY}_${user.id}`);
        const savedFlag = localStorage.getItem(`${BONUS_FLAG_VISIBLE}_${user.id}`);
        const savedClaimed = localStorage.getItem(`${WELCOME_CLAIMED_KEY}_${user.id}`);
        
        if (savedBalance) {
          const balance = parseInt(savedBalance, 10);
          setBonusBalance(balance);
          setShowBonusFlag(balance > 0 && savedFlag !== 'false');
          setBonusFinished(balance <= 0);
        }
        
        // If already claimed, we're done
        if (savedClaimed === 'true') {
          hasCheckedRef.current.add(user.id);
          lastFetchTimeRef.current = now;
          setIsLoading(false);
          return;
        }
        
        // Fetch from API only if needed
        const response = await axios.get(`/welcome/status?userId=${user.id}`);
        const data = response.data;
        
        if (data.userName) setUserName(data.userName);
        
        if (data.shouldShowWelcome && !data.hasReceived) {
          localStorage.setItem(`${WELCOME_SHOWN_KEY}_${user.id}`, new Date().toISOString());
          
          // Delay popup
          setTimeout(() => {
            setShowWelcome(true);
          }, 3000);
        }
        
        if (data.hasReceived) {
          localStorage.setItem(`${WELCOME_CLAIMED_KEY}_${user.id}`, 'true');
          localStorage.setItem(`${WELCOME_CHECKED_KEY}_${user.id}`, 'true');
          
          if (!savedBalance) {
            localStorage.setItem(`${BONUS_BALANCE_KEY}_${user.id}`, '100');
            localStorage.setItem(`${BONUS_FLAG_VISIBLE}_${user.id}`, 'true');
            setBonusBalance(100);
            setShowBonusFlag(true);
            setBonusFinished(false);
          }
        }
        
        hasCheckedRef.current.add(user.id);
        lastFetchTimeRef.current = now;
      } catch (error) {
        console.error('Failed to check welcome status:', error);
        // Mark as checked even on error
        localStorage.setItem(`${WELCOME_CHECKED_KEY}_${user.id}`, 'true');
        hasCheckedRef.current.add(user.id);
      } finally {
        setIsLoading(false);
      }
    };

    initializeBonus();
  }, [user?.id]); // ONLY depend on user.id, not the entire user object

  // Use bonus coins - memoized to prevent re-renders
  const useBonusCoins = useCallback((amount: number): boolean => {
    if (!user?.id || bonusBalance < amount) return false;
    
    const newBalance = bonusBalance - amount;
    
    setBonusBalance(newBalance);
    localStorage.setItem(`${BONUS_BALANCE_KEY}_${user.id}`, newBalance.toString());
    
    if (newBalance <= 0) {
      setBonusFinished(true);
      setShowBonusFlag(false);
      localStorage.setItem(`${BONUS_FLAG_VISIBLE}_${user.id}`, 'false');
      toast.success('🎯 Your welcome bonus has been fully used!');
    }
    
    return true;
  }, [user?.id, bonusBalance]);

  // Claim bonus - memoized
  const claimBonus = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    setIsClaiming(true);
    try {
      const response = await axios.post('/welcome/bonus');
      
      if (response.data.success) {
        localStorage.setItem(`${WELCOME_CLAIMED_KEY}_${user.id}`, 'true');
        localStorage.setItem(`${WELCOME_CHECKED_KEY}_${user.id}`, 'true');
        localStorage.setItem(`${BONUS_BALANCE_KEY}_${user.id}`, '100');
        localStorage.setItem(`${BONUS_FLAG_VISIBLE}_${user.id}`, 'true');
        
        setBonusBalance(100);
        setShowBonusFlag(true);
        setBonusFinished(false);
        setShowWelcome(false);
        
        toast.success('🎉 Welcome bonus claimed! You received 100 coins.');
        return true;
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        localStorage.setItem(`${WELCOME_CLAIMED_KEY}_${user.id}`, 'true');
        localStorage.setItem(`${WELCOME_CHECKED_KEY}_${user.id}`, 'true');
        
        const savedBalance = localStorage.getItem(`${BONUS_BALANCE_KEY}_${user.id}`);
        if (!savedBalance) {
          localStorage.setItem(`${BONUS_BALANCE_KEY}_${user.id}`, '100');
          setBonusBalance(100);
          setShowBonusFlag(true);
        }
        
        setShowWelcome(false);
        toast.info('Welcome bonus already claimed');
      } else {
        toast.error('Failed to claim welcome bonus. Please try again.');
      }
    } finally {
      setIsClaiming(false);
    }
    return false;
  }, [user?.id]);

  // Other functions - memoized
  const closePopup = useCallback(() => {
    setShowWelcome(false);
    if (user?.id) {
      localStorage.setItem(`${WELCOME_CHECKED_KEY}_${user.id}`, 'true');
    }
  }, [user?.id]);

  const hideBonusFlag = useCallback(() => {
    setShowBonusFlag(false);
    if (user?.id) {
      localStorage.setItem(`${BONUS_FLAG_VISIBLE}_${user.id}`, 'false');
    }
  }, [user?.id]);

  const viewPricingPage = useCallback(() => {
    navigate('/dashboard/pricing');
  }, [navigate]);

  // Only return stable references
  return useMemo(() => ({
  showWelcome,
  setShowWelcome: closePopup,
  claimBonus,
  isClaiming,
  userName,
  bonusBalance,
  showBonusFlag,
  bonusFinished,
  useBonusCoins,
  hideBonusFlag,
  viewPricingPage,
  isLoading,
}), [
  showWelcome,
  closePopup,
  claimBonus,
  isClaiming,
  userName,
  bonusBalance,
  showBonusFlag,
  bonusFinished,
  useBonusCoins,
  hideBonusFlag,
  viewPricingPage,
  isLoading,
]);
};