'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  SkipForward, 
  Square, 
  RotateCcw,
  Play,
  Pause
} from 'lucide-react';
import { Button } from '../../ui/button';
import { useTutorial } from './TutorialContext';

const TutorialNavigation: React.FC = () => {
  const { 
    state, 
    nextStep, 
    previousStep, 
    skipStep, 
    skipTour, 
    restartTour, 
    exitTutorial,
    getCurrentTour 
  } = useTutorial();

  const tour = getCurrentTour();
  
  if (!state.isActive || !tour) {
    return null;
  }

  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === tour.steps.length - 1;
  const progress = ((state.currentStep + 1) / tour.steps.length) * 100;

  const navigationVariants = {
    hidden: {
      y: 20,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        delay: 0.4,
        duration: 0.3,
      },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  return (
    <motion.div
      className="fixed bottom-20 left-1/2 transform -translate-x-1/2"
      variants={navigationVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-background/95 backdrop-blur-sm border rounded-full shadow-lg p-2">
        <div className="flex items-center gap-2">
          {/* Previous button */}
          <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousStep}
              disabled={isFirstStep}
              className="h-10 w-10 p-0 rounded-full"
              title="Previous step"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Step indicators */}
          <div className="flex items-center gap-1 mx-2">
            {tour.steps.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === state.currentStep
                    ? 'w-6 bg-primary'
                    : index < state.currentStep
                    ? 'w-2 bg-primary/60'
                    : 'w-2 bg-muted'
                }`}
                initial={false}
                animate={{
                  scale: index === state.currentStep ? 1.2 : 1,
                }}
              />
            ))}
          </div>

          {/* Skip step button */}
          <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipStep}
              className="h-10 w-10 p-0 rounded-full"
              title="Skip this step"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Restart tour button */}
          <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
            <Button
              variant="ghost"
              size="sm"
              onClick={restartTour}
              className="h-10 w-10 p-0 rounded-full"
              title="Restart tour"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Divider */}
          <div className="w-px h-6 bg-border mx-1" />

          {/* Skip tour button */}
          <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="h-10 px-3 rounded-full text-muted-foreground hover:text-foreground"
              title="Skip entire tour"
            >
              <Square className="w-4 h-4 mr-1" />
              Skip Tour
            </Button>
          </motion.div>

          {/* Divider */}
          <div className="w-px h-6 bg-border mx-1" />

          {/* Next button */}
          <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
            <Button
              size="sm"
              onClick={nextStep}
              className="h-10 px-4 rounded-full gap-2"
              title={isLastStep ? 'Complete tour' : 'Next step'}
            >
              {isLastStep ? (
                <>
                  Complete
                  <Play className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Progress indicator */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Tour info */}
      <motion.div
        className="mt-3 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-xs text-muted-foreground">
          {tour.title} • {state.currentStep + 1} of {tour.steps.length}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default TutorialNavigation;