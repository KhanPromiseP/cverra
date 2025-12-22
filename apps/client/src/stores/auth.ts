import type { UserDto } from "@reactive-resume/dto";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Extended type with subscription support
interface UserDtoWithSubscription extends UserDto {
  subscription?: {
    status: 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PENDING';
    plan?: string;
    expiresAt?: string;
  };
}

// Helper type for our auth store
type AuthUser = UserDtoWithSubscription | null;

type AuthState = {
  user: AuthUser;
};

type AuthActions = {
  setUser: (user: AuthUser) => void;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => {
        set({ user });
      },
    }),
    { name: "auth" },
  ),
);

// Helper function to check premium status
export const checkPremiumStatus = (user: AuthUser): boolean => {
  if (!user) return false;
  return user.subscription?.status === 'ACTIVE';
};

// Optional: Helper to get subscription plan
export const getUserPlan = (user: AuthUser): string => {
  if (!user) return 'FREE';
  return user.subscription?.plan || 'FREE';
};