'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Info, Lightbulb, Target, Zap } from 'lucide-react';
import { Button } from '../../ui/button';
import { TutorialStep } from './types';
import { useTutorial } from './TutorialContext';
import Nexy from '../Nexy';

interface TutorialTooltipProps {
  step: TutorialStep;
  targetBounds: DOMRect | null;
  onClose: () => void;
}

const TutorialTooltip: React.FC<TutorialTooltipProps> = ({
  step,
  targetBounds,
  onClose,
}) => {
  const { nextStep, previousStep, skipStep, state, getCurrentTour } = useTutorial();
  const tour = getCurrentTour();

  // Calculate tooltip position based on placement and target bounds
  const tooltipPosition = useMemo(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 400; // Approximate tooltip width
    const tooltipHeight = 300; // Approximate tooltip height
    const margin = 16;

    // Default center position if no target or placement is center
    if (!targetBounds || step.placement === 'center') {
      return {
        position: 'center' as const,
        style: {
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        },
      };
    }

    const { left, top, right, bottom, width, height } = targetBounds;
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    let position = step.placement || 'top';
    let style: React.CSSProperties = {};

    // Apply custom offset if provided
    const offsetX = step.offset?.x || 0;
    const offsetY = step.offset?.y || 0;

    switch (position) {
      case 'top':
        // Check if there's enough space above
        if (top - tooltipHeight - margin < 0) {
          position = 'bottom';
        } else {
          style = {
            left: Math.max(margin, Math.min(centerX - tooltipWidth / 2, viewportWidth - tooltipWidth - margin)) + offsetX,
            top: top - tooltipHeight - margin + offsetY,
          };
        }
        break;

      case 'bottom':
        // Check if there's enough space below
        if (bottom + tooltipHeight + margin > viewportHeight) {
          position = 'top';
          style = {
            left: Math.max(margin, Math.min(centerX - tooltipWidth / 2, viewportWidth - tooltipWidth - margin)) + offsetX,
            top: top - tooltipHeight - margin + offsetY,
          };
        } else {
          style = {
            left: Math.max(margin, Math.min(centerX - tooltipWidth / 2, viewportWidth - tooltipWidth - margin)) + offsetX,
            top: bottom + margin + offsetY,
          };
        }
        break;

      case 'left':
        // Check if there's enough space to the left
        if (left - tooltipWidth - margin < 0) {
          position = 'right';
        } else {
          style = {
            left: left - tooltipWidth - margin + offsetX,
            top: Math.max(margin, Math.min(centerY - tooltipHeight / 2, viewportHeight - tooltipHeight - margin)) + offsetY,
          };
        }
        break;

      case 'right':
        // Check if there's enough space to the right
        if (right + tooltipWidth + margin > viewportWidth) {
          position = 'left';
          style = {
            left: left - tooltipWidth - margin + offsetX,
            top: Math.max(margin, Math.min(centerY - tooltipHeight / 2, viewportHeight - tooltipHeight - margin)) + offsetY,
          };
        } else {
          style = {
            left: right + margin + offsetX,
            top: Math.max(margin, Math.min(centerY - tooltipHeight / 2, viewportHeight - tooltipHeight - margin)) + offsetY,
          };
        }
        break;
    }

    return { position, style };
  }, [step.placement, step.offset, targetBounds]);

  // Get arrow styles based on position
  const getArrowStyles = () => {
    if (tooltipPosition.position === 'center' || !targetBounds) {
      return null;
    }

    const arrowSize = 8;
    const { position } = tooltipPosition;

    switch (position) {
      case 'top':
        return {
          className: 'absolute left-1/2 transform -translate-x-1/2 -bottom-2',
          style: {
            borderLeft: `${arrowSize}px solid transparent`,
            borderRight: `${arrowSize}px solid transparent`,
            borderTop: `${arrowSize}px solid hsl(var(--background))`,
            width: 0,
            height: 0,
          },
        };
      case 'bottom':
        return {
          className: 'absolute left-1/2 transform -translate-x-1/2 -top-2',
          style: {
            borderLeft: `${arrowSize}px solid transparent`,
            borderRight: `${arrowSize}px solid transparent`,
            borderBottom: `${arrowSize}px solid hsl(var(--background))`,
            width: 0,
            height: 0,
          },
        };
      case 'left':
        return {
          className: 'absolute top-1/2 transform -translate-y-1/2 -right-2',
          style: {
            borderTop: `${arrowSize}px solid transparent`,
            borderBottom: `${arrowSize}px solid transparent`,
            borderLeft: `${arrowSize}px solid hsl(var(--background))`,
            width: 0,
            height: 0,
          },
        };
      case 'right':
        return {
          className: 'absolute top-1/2 transform -translate-y-1/2 -left-2',
          style: {
            borderTop: `${arrowSize}px solid transparent`,
            borderBottom: `${arrowSize}px solid transparent`,
            borderRight: `${arrowSize}px solid hsl(var(--background))`,
            width: 0,
            height: 0,
          },
        };
      default:
        return null;
    }
  };

  const arrowStyles = getArrowStyles();
  const isFirstStep = state.currentStep === 0;
  const isLastStep = tour && state.currentStep === tour.steps.length - 1;

  // Get action icon based on step action
  const getActionIcon = () => {
    switch (step.action) {
      case 'click':
        return <Target className="w-4 h-4" />;
      case 'hover':
        return <Zap className="w-4 h-4" />;
      case 'input':
        return <Info className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const tooltipVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: tooltipPosition.position === 'center' ? 20 : 0,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return (
    <motion.div
      className="fixed z-[10000] pointer-events-auto"
      style={tooltipPosition.style}
      variants={tooltipVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-background border border-border rounded-lg shadow-2xl max-w-md min-w-[320px] overflow-hidden">
        {/* Arrow */}
        {arrowStyles && (
          <div className={arrowStyles.className} style={arrowStyles.style} />
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/5">
          <div className="flex items-center gap-3">
            <Nexy size={32} emotion="happy" />
            <div>
              <h3 className="font-semibold text-sm">{step.title}</h3>
              {tour && (
                <p className="text-xs text-muted-foreground">
                  {tour.title} • Step {state.currentStep + 1} of {tour.steps.length}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 mt-0.5 text-primary">
              {getActionIcon()}
            </div>
            <p className="text-sm leading-relaxed">{step.content}</p>
          </div>

          {/* Action hint */}
          {step.action && step.action !== 'none' && (
            <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-md">
              <p className="text-xs text-primary font-medium">
                {step.action === 'click' && 'Try clicking on the highlighted element'}
                {step.action === 'hover' && 'Hover over the highlighted element to see it in action'}
                {step.action === 'input' && 'Try entering some text in the highlighted field'}
              </p>
            </div>
          )}

          {/* Progress bar */}
          {tour && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round(((state.currentStep + 1) / tour.steps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  className="bg-primary h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${((state.currentStep + 1) / tour.steps.length) * 100}%` 
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/5">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousStep}
              disabled={isFirstStep}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipStep}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip
            </Button>
          </div>

          <Button
            size="sm"
            onClick={nextStep}
            className="gap-2"
          >
            {isLastStep ? 'Complete' : 'Next'}
            {isLastStep && <Target className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default TutorialTooltip;