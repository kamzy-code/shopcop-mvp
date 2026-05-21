import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PersonalInfo {
  first_name: string;
  last_name: string;
  middle_name?: string;
  gender: 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY';
  date_of_birth: string;
  phone_number: string;
}

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
  personalInfo: PersonalInfo | null;
  businessInfo: BusinessInfo | null;
  ninData: NinData | null;
  setPersonalInfo: (data: PersonalInfo) => void;
  setBusinessInfo: (data: BusinessInfo) => void;
  setNinData: (data: NinData) => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      personalInfo: null,
      businessInfo: null,
      ninData: null,

      setPersonalInfo: (data) => set({ personalInfo: data, currentStep: 2 }),
      setBusinessInfo: (data) => set({ businessInfo: data, currentStep: 3 }),
      setNinData: (data) => set({ ninData: data, currentStep: 4 }),
      goToStep: (step) => set({ currentStep: step }),

      reset: () =>
        set({ currentStep: 1, personalInfo: null, businessInfo: null, ninData: null }),
    }),
    { name: 'onboarding-storage' }
  )
);
