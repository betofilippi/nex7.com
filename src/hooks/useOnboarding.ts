import { useState, useEffect } from 'react';
import { OnboardingData } from '../components/onboarding';

const ONBOARDING_KEY = 'nex7_onboarding_data';
const ONBOARDING_COMPLETED_KEY = 'nex7_onboarding_completed';

export interface UseOnboardingReturn {
  isOnboardingCompleted: boolean;
  onboardingData: OnboardingData | null;
  saveOnboardingData: (data: OnboardingData) => void;
  resetOnboarding: () => void;
  shouldShowOnboarding: () => boolean;
}

export function useOnboarding(): UseOnboardingReturn {
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    // Check if onboarding has been completed
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
    setIsOnboardingCompleted(completed);

    // Load onboarding data if exists
    const savedData = localStorage.getItem(ONBOARDING_KEY);
    if (savedData) {
      try {
        setOnboardingData(JSON.parse(savedData));
      } catch (error) {
        console.error('Failed to parse onboarding data:', error);
      }
    }
  }, []);

  const saveOnboardingData = (data: OnboardingData) => {
    setOnboardingData(data);
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsOnboardingCompleted(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    setIsOnboardingCompleted(false);
    setOnboardingData(null);
  };

  const shouldShowOnboarding = () => {
    return !isOnboardingCompleted;
  };

  return {
    isOnboardingCompleted,
    onboardingData,
    saveOnboardingData,
    resetOnboarding,
    shouldShowOnboarding,
  };
}