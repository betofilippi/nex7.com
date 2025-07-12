'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../ui/button';
import { Sparkles, Rocket, Code2 } from 'lucide-react';
import Nexy from '../Nexy';
import { OnboardingData } from '../OnboardingWizard';

interface WelcomeStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
      },
    },
  };

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Development',
      description: 'Build faster with intelligent code assistance',
    },
    {
      icon: Rocket,
      title: 'Rapid Deployment',
      description: 'Deploy your projects with a single click',
    },
    {
      icon: Code2,
      title: 'Modern Stack',
      description: 'Built with the latest technologies',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center text-center h-full"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <Nexy size={120} emotion="waving" />
      </motion.div>

      <motion.h1
        variants={itemVariants}
        className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
      >
        Welcome to Nex7!
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="text-lg text-muted-foreground mb-8 max-w-md"
      >
        I&apos;m Nexy, your AI assistant. I&apos;ll help you set up your development environment
        and get you building amazing projects in no time!
      </motion.p>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 rounded-lg bg-muted/50 border border-muted-foreground/10"
          >
            <feature.icon className="w-8 h-8 mb-2 mx-auto text-primary" />
            <h3 className="font-semibold mb-1">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="mt-auto">
        <Button size="lg" onClick={onNext} className="gap-2">
          <Sparkles className="w-5 h-5" />
          Let&apos;s Get Started
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeStep;