'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Sparkles, Info } from 'lucide-react';
import Nexy from '../Nexy';
import { OnboardingData } from '../OnboardingWizard';

interface ProjectDetailsStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const ProjectDetailsStep: React.FC<ProjectDetailsStepProps> = ({
  data,
  updateData,
  onNext,
}) => {
  const [projectName, setProjectName] = useState(data.projectName || '');
  const [projectDescription, setProjectDescription] = useState(
    data.projectDescription || ''
  );
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    data.selectedFeatures || []
  );
  const [showAISuggestion, setShowAISuggestion] = useState(false);

  const getFeaturesByType = () => {
    const featureMap: Record<string, string[]> = {
      'web-app': [
        'User Authentication',
        'Database Integration',
        'Real-time Updates',
        'SEO Optimization',
        'Analytics Dashboard',
        'Dark Mode',
      ],
      'mobile-app': [
        'Push Notifications',
        'Offline Support',
        'Camera Access',
        'Location Services',
        'Social Sharing',
        'Biometric Auth',
      ],
      'e-commerce': [
        'Product Catalog',
        'Shopping Cart',
        'Payment Processing',
        'Order Management',
        'Customer Reviews',
        'Inventory Tracking',
      ],
      'saas': [
        'Multi-tenancy',
        'Subscription Billing',
        'User Roles & Permissions',
        'API Access',
        'Usage Analytics',
        'Team Collaboration',
      ],
      'game': [
        'Multiplayer Support',
        'Leaderboards',
        'Achievements',
        'Save Game Progress',
        'Sound Effects',
        'Touch Controls',
      ],
      'ai-app': [
        'Chat Interface',
        'Model Selection',
        'Data Processing',
        'API Integration',
        'Result Visualization',
        'Export Options',
      ],
      'portfolio': [
        'Project Gallery',
        'Blog/Articles',
        'Contact Form',
        'Resume Download',
        'Social Links',
        'Testimonials',
      ],
      'api': [
        'REST Endpoints',
        'GraphQL Schema',
        'Authentication',
        'Rate Limiting',
        'Documentation',
        'Webhooks',
      ],
    };

    return featureMap[data.projectType || 'web-app'] || featureMap['web-app'];
  };

  const features = getFeaturesByType();

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const handleSubmit = () => {
    updateData({
      projectName,
      projectDescription,
      selectedFeatures,
    });
    onNext();
  };

  const generateAISuggestion = () => {
    setShowAISuggestion(true);
    const suggestions = [
      'TaskMaster Pro - A smart task management system',
      'DevConnect Hub - Developer collaboration platform',
      'LearnFlow Academy - Interactive learning platform',
      'DataViz Studio - Data visualization dashboard',
    ];
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    const [name, desc] = randomSuggestion.split(' - ');
    setProjectName(name);
    setProjectDescription(desc);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-6">
        <Nexy size={60} emotion="happy" className="mx-auto mb-3" />
        <h2 className="text-2xl font-bold mb-2">Customize Your Project</h2>
        <p className="text-muted-foreground">
          Tell me about your project and select the features you need
        </p>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto">
        {/* Project Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="project-name">Project Name</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateAISuggestion}
              className="gap-1"
            >
              <Sparkles className="w-3 h-3" />
              AI Suggest
            </Button>
          </div>
          <Input
            id="project-name"
            placeholder="Enter your project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="transition-all"
          />
        </div>

        {/* Project Description */}
        <div className="space-y-2">
          <Label htmlFor="project-description">
            Project Description (Natural Language)
          </Label>
          <textarea
            id="project-description"
            placeholder="Describe your project in your own words. For example: 'I want to build a social platform where developers can share code snippets and collaborate on projects'"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="w-full min-h-[100px] p-3 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="w-3 h-3 mt-0.5" />
            <span>
              Describe your vision naturally. I&apos;ll help configure everything based on your
              description.
            </span>
          </div>
        </div>

        {/* Feature Selection */}
        <div className="space-y-2">
          <Label>Select Features</Label>
          <div className="grid grid-cols-2 gap-2">
            {features.map((feature) => (
              <motion.div
                key={feature}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer"
                onClick={() => toggleFeature(feature)}
              >
                <Badge
                  variant={selectedFeatures.includes(feature) ? 'default' : 'outline'}
                  className="w-full py-2 justify-center transition-all hover:shadow-sm"
                >
                  {feature}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {showAISuggestion && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted-foreground mt-2"
        >
          AI suggestion applied! Feel free to customize it.
        </motion.div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!projectName}
        className="mt-4"
        size="lg"
      >
        Continue to Setup
      </Button>
    </div>
  );
};

export default ProjectDetailsStep;