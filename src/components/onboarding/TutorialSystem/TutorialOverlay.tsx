'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useTutorial } from './TutorialContext';
import TutorialTooltip from './TutorialTooltip';
import TutorialNavigation from './TutorialNavigation';

interface TutorialOverlayProps {
  className?: string;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ className }) => {
  const { state, getCurrentStep, exitTutorial } = useTutorial();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetBounds, setTargetBounds] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Find and track the target element
  const updateTargetElement = useCallback(() => {
    const currentStep = getCurrentStep();
    if (!currentStep?.target || !state.isActive) {
      setTargetElement(null);
      setTargetBounds(null);
      return;
    }

    const element = document.querySelector(currentStep.target) as HTMLElement;
    if (element) {
      setTargetElement(element);
      setTargetBounds(element.getBoundingClientRect());
    } else {
      console.warn(`Tutorial target element not found: ${currentStep.target}`);
      setTargetElement(null);
      setTargetBounds(null);
    }
  }, [getCurrentStep, state.isActive, state.currentStep]);

  // Update target element when step changes
  useEffect(() => {
    updateTargetElement();
  }, [updateTargetElement]);

  // Handle window resize and scroll
  useEffect(() => {
    if (!targetElement) return;

    const updateBounds = () => {
      setTargetBounds(targetElement.getBoundingClientRect());
    };

    const handleResize = () => {
      updateBounds();
    };

    const handleScroll = () => {
      updateBounds();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    // Use ResizeObserver for more accurate tracking
    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(targetElement);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      resizeObserver.disconnect();
    };
  }, [targetElement]);

  // Handle escape key to exit tutorial
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.isActive) {
        exitTutorial();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.isActive, exitTutorial]);

  // Prevent body scroll when tutorial is active
  useEffect(() => {
    if (state.isActive) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [state.isActive]);

  const currentStep = getCurrentStep();

  if (!mounted || !state.isActive || !currentStep) {
    return null;
  }

  const shouldShowSpotlight = currentStep.spotlight !== false && targetBounds;

  // Calculate spotlight styles
  const getSpotlightClipPath = () => {
    if (!targetBounds || !shouldShowSpotlight) return '';
    
    const padding = 8;
    const borderRadius = 8;
    
    return `polygon(
      0% 0%,
      0% 100%,
      ${targetBounds.left - padding}px 100%,
      ${targetBounds.left - padding}px ${targetBounds.top - padding}px,
      ${targetBounds.right + padding}px ${targetBounds.top - padding}px,
      ${targetBounds.right + padding}px ${targetBounds.bottom + padding}px,
      ${targetBounds.left - padding}px ${targetBounds.bottom + padding}px,
      ${targetBounds.left - padding}px 100%,
      100% 100%,
      100% 0%
    )`;
  };

  const overlayVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const spotlightVariants = {
    hidden: {
      clipPath: 'polygon(0% 0%, 0% 100%, 50% 100%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 100%, 100% 100%, 100% 0%)',
    },
    visible: {
      clipPath: getSpotlightClipPath(),
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        ref={overlayRef}
        key="tutorial-overlay"
        className={`fixed inset-0 z-[9999] pointer-events-auto ${className || ''}`}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Main overlay backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          variants={shouldShowSpotlight ? spotlightVariants : undefined}
          onClick={exitTutorial}
        />

        {/* Spotlight highlight for target element */}
        {shouldShowSpotlight && targetBounds && (
          <motion.div
            className="absolute border-2 border-primary/80 bg-primary/10 rounded-lg pointer-events-none"
            style={{
              left: targetBounds.left - 4,
              top: targetBounds.top - 4,
              width: targetBounds.width + 8,
              height: targetBounds.height + 8,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          />
        )}

        {/* Pulsing indicator for target element */}
        {shouldShowSpotlight && targetBounds && (
          <motion.div
            className="absolute border-2 border-primary rounded-lg pointer-events-none"
            style={{
              left: targetBounds.left - 8,
              top: targetBounds.top - 8,
              width: targetBounds.width + 16,
              height: targetBounds.height + 16,
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Tutorial tooltip */}
        <TutorialTooltip
          step={currentStep}
          targetBounds={targetBounds}
          onClose={exitTutorial}
        />

        {/* Navigation controls */}
        <TutorialNavigation />

        {/* Progress indicator */}
        <motion.div
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Step {state.currentStep + 1}</span>
            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
            <span>{currentStep.title}</span>
            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
            <span className="text-primary">Press ESC to exit</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default TutorialOverlay;