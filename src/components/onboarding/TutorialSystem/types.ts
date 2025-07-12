export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TutorialTour {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
}

export interface TutorialProgress {
  completedTours: string[];
  currentTour?: string;
  currentStep: number;
  startedAt?: Date;
  completedAt?: Date;
}