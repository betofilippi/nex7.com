'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingWizard, { OnboardingData } from './OnboardingWizard';
import { getAgent, findBestAgentForContext } from '../../lib/agents/definitions';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { MessageCircle, X } from 'lucide-react';

interface OnboardingWithAgentsProps {
  onComplete: (data: OnboardingData) => void;
}

const OnboardingWithAgents: React.FC<OnboardingWithAgentsProps> = ({ onComplete }) => {
  const [showAgentHelper, setShowAgentHelper] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(getAgent('nexy'));
  const [agentMessage, setAgentMessage] = useState('');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  useEffect(() => {
    // Show agent helper after a short delay
    const timer = setTimeout(() => {
      setShowAgentHelper(true);
      setAgentMessage(currentAgent?.greeting || '');
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentAgent]);

  const updateContextualAgent = (data: OnboardingData) => {
    setOnboardingData(data);
    
    // Choose agent based on context
    if (data.projectType) {
      let contextString = data.projectType;
      if (data.projectDescription) {
        contextString += ' ' + data.projectDescription;
      }
      
      const bestAgent = findBestAgentForContext(contextString);
      if (bestAgent.id !== currentAgent?.id) {
        setCurrentAgent(bestAgent);
        
        // Generate contextual message
        const messages: Record<string, string> = {
          'web-app': "I see you're building a web app! I can help you set up the perfect development environment.",
          'mobile-app': "Mobile development is exciting! Let me help you configure everything for cross-platform success.",
          'e-commerce': "E-commerce projects need special attention to payments and user experience. I'll guide you through it!",
          'ai-app': "AI applications are fascinating! I'll help you integrate the latest AI capabilities.",
          'game': "Game development is so creative! Let's set up your game engine and physics.",
          'api': "Building robust APIs is crucial. I'll help you design a scalable architecture.",
          'saas': "SaaS platforms need careful planning. Let's ensure your multi-tenant setup is perfect.",
          'portfolio': "Your portfolio should showcase your best work! I'll help make it shine.",
        };
        
        setAgentMessage(messages[data.projectType] || bestAgent.greeting);
      }
    }
    
    // Update message based on experience level
    if (data.experienceLevel && !data.projectType) {
      const levelMessages = {
        beginner: "Welcome! I'll make sure to explain everything clearly and provide lots of examples.",
        intermediate: "Great to have you here! I'll help you explore more advanced features.",
        advanced: "Excellent! You'll have full access to all our powerful tools and customizations.",
      };
      setAgentMessage(levelMessages[data.experienceLevel]);
    }
  };

  const handleComplete = (data: OnboardingData) => {
    // Store selected agent preference
    const finalData = {
      ...data,
      preferredAgent: currentAgent?.id,
    };
    onComplete(finalData);
  };

  return (
    <div className="relative">
      <OnboardingWizard
        onComplete={handleComplete}
        onDataUpdate={updateContextualAgent}
      />
      
      {/* Agent Helper Popup */}
      <AnimatePresence>
        {showAgentHelper && currentAgent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Card className="w-80 shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: currentAgent.color + '20' }}
                  >
                    {currentAgent.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{currentAgent.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAgentHelper(false)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {currentAgent.role}
                    </p>
                    <p className="text-sm">{agentMessage}</p>
                    
                    {onboardingData.projectType && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t"
                      >
                        <p className="text-xs text-muted-foreground mb-2">
                          Quick tips for your {onboardingData.projectType}:
                        </p>
                        <ul className="text-xs space-y-1">
                          {currentAgent.capabilities.slice(0, 2).map((cap, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-primary">•</span>
                              <span>{cap.description}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Floating Action Button to Show Agent */}
      {!showAgentHelper && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAgentHelper(true)}
          className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
};

export default OnboardingWithAgents;