import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BusinessInfo {
  businessName: string;
  categories: string[];
  address: string;
  description: string;
}

interface BvnData {
  bvn: string;
  verified: boolean;
  status: 'PENDING' | 'VERIFIED' | 'FAILED';
}

interface NinData {
  fullName: string;
  nin: string;
  governmentIdUrl?: string;
  verified: boolean;
  status: 'PENDING' | 'VERIFIED' | 'FAILED';
}

interface OnboardingState {
  currentStep: number;
  businessInfo: BusinessInfo | null;
  bvnData: BvnData | null;
  ninData: NinData | null;
  setBusinessInfo: (data: BusinessInfo) => void;
  setBvnData: (data: BvnData) => void;
  setNinData: (data: NinData) => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      businessInfo: null,
      bvnData: null,
      ninData: null,

      setBusinessInfo: (data) => set({ businessInfo: data, currentStep: 2 }),
      setBvnData: (data) => set({ bvnData: data, currentStep: 3 }),
      setNinData: (data) => set({ ninData: data, currentStep: 4 }),
      goToStep: (step) => set({ currentStep: step }),

      reset: () =>
        set({ currentStep: 1, businessInfo: null, bvnData: null, ninData: null }),
    }),
    { name: 'onboarding-storage' }
  )
);
