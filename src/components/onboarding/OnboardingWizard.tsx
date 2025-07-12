'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import WelcomeStep from './OnboardingSteps/WelcomeStep';
import ExperienceLevelStep from './OnboardingSteps/ExperienceLevelStep';
import ProjectTypeStep from './OnboardingSteps/ProjectTypeStep';
import ProjectDetailsStep from './OnboardingSteps/ProjectDetailsStep';
import SetupCompleteStep from './OnboardingSteps/SetupCompleteStep';
import Nexy from './Nexy';

export interface OnboardingData {
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  projectType?: string;
  projectName?: string;
  projectDescription?: string;
  selectedFeatures?: string[];
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onDataUpdate?: (data: OnboardingData) => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onDataUpdate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({});
  const [direction, setDirection] = useState(0);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Nex7',
      component: WelcomeStep,
      milestone: 'Getting Started',
    },
    {
      id: 'experience',
      title: 'Experience Level',
      component: ExperienceLevelStep,
      milestone: 'Your Skills',
    },
    {
      id: 'project-type',
      title: 'Project Type',
      component: ProjectTypeStep,
      milestone: 'Project Selection',
    },
    {
      id: 'project-details',
      title: 'Project Details',
      component: ProjectDetailsStep,
      milestone: 'Customization',
    },
    {
      id: 'complete',
      title: 'Setup Complete',
      component: SetupCompleteStep,
      milestone: 'Ready to Build!',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(data);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const updateData = (newData: Partial<OnboardingData>) => {
    setData((prev) => {
      const updated = { ...prev, ...newData };
      onDataUpdate?.(updated);
      return updated;
    });
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep].component;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-card rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with Progress */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Nexy size={40} emotion="happy" />
                <div>
                  <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {steps[currentStep].milestone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Milestone badges */}
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-1 transition-all ${
                    index <= currentStep
                      ? 'opacity-100'
                      : 'opacity-40'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full transition-all ${
                      index <= currentStep
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                  />
                  {index === currentStep && (
                    <span className="text-xs font-medium hidden sm:inline">
                      {step.milestone}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="relative h-[500px] overflow-hidden">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0 p-8"
              >
                <CurrentStepComponent
                  data={data}
                  updateData={updateData}
                  onNext={handleNext}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          <div className="border-t p-6 flex justify-between items-center bg-muted/5">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentStep ? 1 : -1);
                    setCurrentStep(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-primary w-8'
                      : index < currentStep
                      ? 'bg-primary/50'
                      : 'bg-muted'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="gap-2"
              disabled={currentStep === steps.length - 1 && !data.projectName}
            >
              {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingWizard;