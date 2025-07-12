'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../ui/card';
import { Baby, Zap, Rocket } from 'lucide-react';
import Nexy from '../Nexy';
import { OnboardingData } from '../OnboardingWizard';
import OnboardingTooltip from '../OnboardingTooltip';

interface ExperienceLevelStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const ExperienceLevelStep: React.FC<ExperienceLevelStepProps> = ({
  data,
  updateData,
  onNext,
}) => {
  const [selectedLevel, setSelectedLevel] = useState(data.experienceLevel);
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);

  const levels = [
    {
      id: 'beginner',
      title: 'Beginner',
      description: "I'm new to development and want to learn",
      icon: Baby,
      color: 'from-green-500 to-emerald-600',
      features: ['Guided tutorials', 'Code explanations', 'Best practices tips'],
    },
    {
      id: 'intermediate',
      title: 'Intermediate',
      description: 'I have some experience and want to level up',
      icon: Zap,
      color: 'from-blue-500 to-indigo-600',
      features: ['Advanced features', 'Performance tips', 'Architecture guidance'],
    },
    {
      id: 'advanced',
      title: 'Advanced',
      description: "I'm experienced and want full control",
      icon: Rocket,
      color: 'from-purple-500 to-pink-600',
      features: ['Expert tools', 'Custom workflows', 'Enterprise features'],
    },
  ];

  const handleSelect = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setSelectedLevel(level);
    updateData({ experienceLevel: level });
    setTimeout(onNext, 300);
  };

  return (
    <div className="flex flex-col items-center h-full">
      <div className="text-center mb-8">
        <OnboardingTooltip
          content="I'll adapt to your skill level and provide appropriate guidance!"
          placement="bottom"
          delay={2000}
        >
          <Nexy
            size={80}
            emotion={hoveredLevel ? 'excited' : 'thinking'}
            className="mx-auto mb-4"
          />
        </OnboardingTooltip>
        <h2 className="text-2xl font-bold mb-2">What&apos;s your experience level?</h2>
        <p className="text-muted-foreground">
          This helps me customize your experience and provide the right level of guidance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
        {levels.map((level) => (
          <motion.div
            key={level.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setHoveredLevel(level.id)}
            onHoverEnd={() => setHoveredLevel(null)}
          >
            <Card
              className={`cursor-pointer transition-all duration-300 h-full ${
                selectedLevel === level.id
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleSelect(level.id as string)}
            >
              <CardContent className="p-6">
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center mb-4 mx-auto`}
                >
                  <level.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{level.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {level.description}
                </p>
                <ul className="space-y-2">
                  {level.features.map((feature, index) => (
                    <li
                      key={index}
                      className="text-xs text-muted-foreground flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {selectedLevel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted-foreground"
        >
          Great choice! You can always change this later in settings.
        </motion.div>
      )}
    </div>
  );
};

export default ExperienceLevelStep;