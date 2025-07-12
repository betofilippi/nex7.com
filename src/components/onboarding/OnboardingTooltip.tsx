'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';

interface OnboardingTooltipProps {
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactNode;
  showOnce?: boolean;
}

const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  content,
  placement = 'top',
  delay = 1000,
  children,
  showOnce = true,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    if (showOnce && hasBeenShown) return;

    const timer = setTimeout(() => {
      setShowTooltip(true);
      setHasBeenShown(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, showOnce, hasBeenShown]);

  const placementStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1',
  };

  const arrowRotation = {
    top: 'rotate-180',
    bottom: '',
    left: 'rotate-90',
    right: '-rotate-90',
  };

  return (
    <div className="relative inline-block">
      {children}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute z-50 ${placementStyles[placement]}`}
          >
            <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg max-w-xs">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{content}</p>
                <button
                  onClick={() => setShowTooltip(false)}
                  className="ml-2 hover:opacity-70 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div
                className={`absolute w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-primary ${
                  arrowStyles[placement]
                } ${arrowRotation[placement]}`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingTooltip;