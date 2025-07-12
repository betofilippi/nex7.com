export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for the element to highlight
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  offset?: { x: number; y: number };
  spotlight?: boolean; // Whether to highlight the target element
  action?: 'click' | 'hover' | 'input' | 'none';
  validation?: () => boolean; // Optional validation function
  onEnter?: () => void; // Callback when step is entered
  onExit?: () => void; // Callback when step is exited
}

export interface TutorialTour {
  id: string;
  title: string;
  description: string;
  category: 'overview' | 'canvas' | 'agents' | 'deploy' | 'projects';
  icon: string;
  estimatedTime: string;
  steps: TutorialStep[];
  prerequisites?: string[];
}

export interface TutorialState {
  currentTour: string | null;
  currentStep: number;
  isActive: boolean;
  completedTours: string[];
  skippedSteps: string[];
  userProgress: Record<string, number>; // tour_id -> step_index
}

export interface TutorialContextType {
  state: TutorialState;
  startTour: (tourId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipStep: () => void;
  skipTour: () => void;
  restartTour: () => void;
  exitTutorial: () => void;
  markTourComplete: (tourId: string) => void;
  isStepCompleted: (tourId: string, stepIndex: number) => boolean;
  getCurrentTour: () => TutorialTour | null;
  getCurrentStep: () => TutorialStep | null;
}

export type TutorialEventType = 
  | 'tour_started'
  | 'tour_completed'
  | 'tour_skipped'
  | 'step_completed'
  | 'step_skipped'
  | 'tutorial_exited';

export interface TutorialEvent {
  type: TutorialEventType;
  tourId: string;
  stepId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}