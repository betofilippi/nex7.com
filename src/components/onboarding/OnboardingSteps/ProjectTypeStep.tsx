'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import {
  Globe,
  Smartphone,
  ShoppingCart,
  Briefcase,
  Gamepad,
  Brain,
  Image,
  Server,
} from 'lucide-react';
import Nexy from '../Nexy';
import { OnboardingData } from '../OnboardingWizard';

interface ProjectTypeStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const ProjectTypeStep: React.FC<ProjectTypeStepProps> = ({ data, updateData, onNext }) => {
  const [selectedType, setSelectedType] = useState(data.projectType);

  const projectTypes = [
    {
      id: 'web-app',
      title: 'Web Application',
      description: 'Modern web apps with React/Next.js',
      icon: Globe,
      color: 'from-blue-500 to-cyan-600',
      tags: ['React', 'Next.js', 'TypeScript'],
      popular: true,
    },
    {
      id: 'mobile-app',
      title: 'Mobile App',
      description: 'Cross-platform mobile applications',
      icon: Smartphone,
      color: 'from-green-500 to-teal-600',
      tags: ['React Native', 'Expo', 'Mobile'],
    },
    {
      id: 'e-commerce',
      title: 'E-commerce',
      description: 'Online stores and marketplaces',
      icon: ShoppingCart,
      color: 'from-purple-500 to-pink-600',
      tags: ['Commerce', 'Payments', 'Inventory'],
      popular: true,
    },
    {
      id: 'saas',
      title: 'SaaS Platform',
      description: 'Software as a Service applications',
      icon: Briefcase,
      color: 'from-orange-500 to-red-600',
      tags: ['Multi-tenant', 'Subscriptions', 'Analytics'],
    },
    {
      id: 'game',
      title: 'Game',
      description: 'Browser-based games and experiences',
      icon: Gamepad,
      color: 'from-yellow-500 to-orange-600',
      tags: ['Canvas', 'WebGL', 'Physics'],
    },
    {
      id: 'ai-app',
      title: 'AI Application',
      description: 'AI-powered applications',
      icon: Brain,
      color: 'from-indigo-500 to-purple-600',
      tags: ['Machine Learning', 'LLMs', 'Computer Vision'],
    },
    {
      id: 'portfolio',
      title: 'Portfolio',
      description: 'Personal or business portfolio',
      icon: Image,
      color: 'from-pink-500 to-rose-600',
      tags: ['Gallery', 'Blog', 'Resume'],
    },
    {
      id: 'api',
      title: 'API Service',
      description: 'Backend API or microservice',
      icon: Server,
      color: 'from-gray-500 to-gray-700',
      tags: ['REST', 'GraphQL', 'WebSockets'],
    },
  ];

  const handleSelect = (typeId: string) => {
    setSelectedType(typeId);
    updateData({ projectType: typeId });
    setTimeout(onNext, 300);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-6">
        <Nexy size={60} emotion="thinking" className="mx-auto mb-3" />
        <h2 className="text-2xl font-bold mb-2">What are you building?</h2>
        <p className="text-muted-foreground">
          Choose a project type to get started with the right template
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto flex-1">
        {projectTypes.map((type) => (
          <motion.div
            key={type.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: projectTypes.indexOf(type) * 0.05 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-300 h-full relative ${
                selectedType === type.id
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleSelect(type.id)}
            >
              {type.popular && (
                <Badge className="absolute -top-2 -right-2 bg-primary">Popular</Badge>
              )}
              <CardContent className="p-4 text-center">
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center mb-3 mx-auto`}
                >
                  <type.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{type.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{type.description}</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {type.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {selectedType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted-foreground mt-4"
        >
          Excellent choice! Let's customize your {selectedType} project.
        </motion.div>
      )}
    </div>
  );
};

export default ProjectTypeStep;