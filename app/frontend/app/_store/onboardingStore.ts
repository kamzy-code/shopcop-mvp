import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BusinessInfo {
  businessName: string;
  categories: string[];
  address: string;
  description: string;
}

interface NinData {
  nin_full_name: string;
  nin_number: string;
  verified: boolean;
  status: 'PENDING' | 'APPROVED' | 'FAILED';
}

interface OnboardingState {
  currentStep: number;
  businessInfo: BusinessInfo | null;
  ninData: NinData | null;
  setBusinessInfo: (data: BusinessInfo) => void;
  setNinData: (data: NinData) => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      businessInfo: null,
      ninData: null,

      setBusinessInfo: (data) => set({ businessInfo: data, currentStep: 2 }),
      setNinData: (data) => set({ ninData: data, currentStep: 3 }),
      goToStep: (step) => set({ currentStep: step }),

      reset: () =>
        set({ currentStep: 1, businessInfo: null, ninData: null }),
    }),
    { name: 'onboarding-storage' }
  )
);
