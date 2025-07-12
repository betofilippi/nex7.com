'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import {
  CheckCircle2,
  Rocket,
  BookOpen,
  Users,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Nexy from '../Nexy';
import { OnboardingData } from '../OnboardingWizard';

interface SetupCompleteStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const SetupCompleteStep: React.FC<SetupCompleteStepProps> = ({ data, onNext }) => {
  const [, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti after component mounts
    const timer = setTimeout(() => {
      setShowConfetti(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const nextSteps = [
    {
      icon: Rocket,
      title: 'Start Building',
      description: 'Jump into your project and start coding',
      action: 'Open Project',
      primary: true,
    },
    {
      icon: BookOpen,
      title: 'View Tutorials',
      description: 'Learn best practices and tips',
      action: 'Browse Tutorials',
    },
    {
      icon: Users,
      title: 'Join Community',
      description: 'Connect with other developers',
      action: 'Join Discord',
    },
  ];

  const getExperienceLevelMessage = () => {
    const messages = {
      beginner: "Perfect for beginners! I'll guide you every step of the way.",
      intermediate: "Great! I'll help you level up your skills.",
      advanced: "Excellent! You'll have access to all our advanced features.",
    };
    return messages[data.experienceLevel || 'beginner'];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center text-center h-full"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        className="mb-6"
      >
        <div className="relative">
          <Nexy size={100} emotion="excited" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -right-2 -top-2"
          >
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </motion.div>
        </div>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold mb-2"
      >
        All Set! 🎉
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg text-muted-foreground mb-6"
      >
        Your project &ldquo;{data.projectName}&rdquo; is ready to go!
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-muted/50 rounded-lg p-4 mb-6 max-w-md"
      >
        <p className="text-sm mb-2">{getExperienceLevelMessage()}</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {data.selectedFeatures?.slice(0, 3).map((feature) => (
            <Badge key={feature} variant="secondary">
              {feature}
            </Badge>
          ))}
          {data.selectedFeatures && data.selectedFeatures.length > 3 && (
            <Badge variant="secondary">+{data.selectedFeatures.length - 3} more</Badge>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid gap-4 w-full max-w-lg mb-6"
      >
        {nextSteps.map((step, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="cursor-pointer hover:shadow-md transition-all">
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    step.primary
                      ? 'bg-gradient-to-br from-primary to-purple-600'
                      : 'bg-muted'
                  }`}
                >
                  <step.icon
                    className={`w-6 h-6 ${step.primary ? 'text-white' : 'text-primary'}`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-auto"
      >
        <Button size="lg" onClick={onNext} className="gap-2">
          <Sparkles className="w-5 h-5" />
          Start Building
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default SetupCompleteStep;