'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialTour {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
}

interface TutorialProgress {
  completedTours: string[];
  currentTour?: string;
  currentStep: number;
  startedAt?: Date;
  completedAt?: Date;
}

interface TutorialContextType {
  progress: TutorialProgress;
  activeTour: TutorialTour | null;
  currentStep: TutorialStep | null;
  isActive: boolean;
  isCompleted: (tourId: string) => boolean;
  startTour: (tourId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  endTour: () => void;
  skipTour: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// Mock tours for demonstration
const mockTours: TutorialTour[] = [
  {
    id: 'dashboard-overview',
    title: 'Dashboard Overview',
    description: 'Learn about the main interface and navigation',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to NEX7!',
        content: 'This is your main dashboard where you can access all features.',
        target: '.dashboard-container'
      },
      {
        id: 'navigation',
        title: 'Navigation Tabs',
        content: 'Use these tabs to switch between different features.',
        target: '[role="tablist"]'
      },
      {
        id: 'stats',
        title: 'Dashboard Stats',
        content: 'Monitor your projects, deployments, and activity here.',
        target: '.grid'
      }
    ]
  },
  {
    id: 'visual-canvas',
    title: 'Visual Canvas',
    description: 'Create workflows with drag-and-drop',
    steps: [
      {
        id: 'canvas-intro',
        title: 'Visual Canvas',
        content: 'Design automation workflows using drag-and-drop nodes.',
        target: '[value="canvas"]'
      }
    ]
  },
  {
    id: 'ai-agents',
    title: 'AI Agents',
    description: 'Chat with intelligent assistants',
    steps: [
      {
        id: 'agents-intro',
        title: 'AI Agents',
        content: 'Chat with specialized AI assistants to help with your work.',
        target: '[value="agents"]'
      }
    ]
  },
  {
    id: 'project-deployment',
    title: 'Project Deployment',
    description: 'Deploy your projects with one click',
    steps: [
      {
        id: 'deploy-intro',
        title: 'Deployment',
        content: 'Deploy your projects to Vercel with just one click.',
        target: '[value="deploy"]'
      }
    ]
  },
  {
    id: 'project-management',
    title: 'Project Management',
    description: 'Organize and collaborate on projects',
    steps: [
      {
        id: 'projects-intro',
        title: 'Project Management',
        content: 'Organize your projects and collaborate with your team.',
        target: '[value="projects"]'
      }
    ]
  }
];

interface TutorialProviderProps {
  children: ReactNode;
  onEvent?: (event: string, data?: any) => void;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ 
  children, 
  onEvent 
}) => {
  const [progress, setProgress] = useState<TutorialProgress>({
    completedTours: [],
    currentStep: 0
  });
  const [activeTour, setActiveTour] = useState<TutorialTour | null>(null);

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nex7-tutorial-progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProgress(parsed);
      } catch (error) {
        console.warn('Failed to load tutorial progress:', error);
      }
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nex7-tutorial-progress', JSON.stringify(progress));
  }, [progress]);

  const currentStep = activeTour ? activeTour.steps[progress.currentStep] : null;
  const isActive = activeTour !== null;

  const isCompleted = (tourId: string): boolean => {
    return progress.completedTours.includes(tourId);
  };

  const startTour = (tourId: string) => {
    const tour = mockTours.find(t => t.id === tourId);
    if (!tour) return;

    setActiveTour(tour);
    setProgress(prev => ({
      ...prev,
      currentTour: tourId,
      currentStep: 0,
      startedAt: new Date()
    }));

    onEvent?.('tutorial_started', { tourId, title: tour.title });
  };

  const nextStep = () => {
    if (!activeTour) return;

    const nextStepIndex = progress.currentStep + 1;
    
    if (nextStepIndex >= activeTour.steps.length) {
      // Tour completed
      setProgress(prev => ({
        ...prev,
        completedTours: [...prev.completedTours.filter(id => id !== activeTour.id), activeTour.id],
        currentTour: undefined,
        currentStep: 0,
        completedAt: new Date()
      }));
      setActiveTour(null);
      onEvent?.('tutorial_completed', { tourId: activeTour.id, title: activeTour.title });
    } else {
      setProgress(prev => ({
        ...prev,
        currentStep: nextStepIndex
      }));
      onEvent?.('tutorial_step_completed', { 
        tourId: activeTour.id, 
        step: progress.currentStep + 1,
        total: activeTour.steps.length 
      });
    }
  };

  const previousStep = () => {
    if (!activeTour || progress.currentStep <= 0) return;

    setProgress(prev => ({
      ...prev,
      currentStep: prev.currentStep - 1
    }));
  };

  const endTour = () => {
    if (!activeTour) return;

    setActiveTour(null);
    setProgress(prev => ({
      ...prev,
      currentTour: undefined,
      currentStep: 0
    }));

    onEvent?.('tutorial_ended', { tourId: activeTour.id });
  };

  const skipTour = () => {
    if (!activeTour) return;

    setProgress(prev => ({
      ...prev,
      completedTours: [...prev.completedTours.filter(id => id !== activeTour.id), activeTour.id],
      currentTour: undefined,
      currentStep: 0
    }));
    setActiveTour(null);

    onEvent?.('tutorial_skipped', { tourId: activeTour.id });
  };

  const value: TutorialContextType = {
    progress,
    activeTour,
    currentStep,
    isActive,
    isCompleted,
    startTour,
    nextStep,
    previousStep,
    endTour,
    skipTour
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};