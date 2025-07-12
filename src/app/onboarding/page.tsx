'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingWithAgents, OnboardingData } from '../../components/onboarding';
import { useToast } from '../../hooks/use-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleOnboardingComplete = (data: OnboardingData) => {
    console.log('Onboarding completed with data:', data);
    
    // Show success toast
    toast({
      title: 'Welcome aboard!',
      description: `Your project "${data.projectName}" has been set up successfully.`,
    });

    // In a real application, you would:
    // 1. Save the onboarding data to the user's profile
    // 2. Create the initial project structure
    // 3. Redirect to the dashboard or project workspace
    
    // For demo purposes, redirect to dashboard after a short delay
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  return <OnboardingWithAgents onComplete={handleOnboardingComplete} />;
}