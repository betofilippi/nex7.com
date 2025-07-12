'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Users } from 'lucide-react';
import { Agent, getAllAgents } from '../../lib/agents/definitions';
import { AgentAvatar } from './AgentAvatar';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface AgentSelectorProps {
  activeAgentId: string;
  onSelectAgent: (agentId: string) => void;
  showLabels?: boolean;
  variant?: 'grid' | 'list' | 'compact';
}

const AgentCard: React.FC<{
  agent: Agent;
  isActive: boolean;
  onSelect: () => void;
  variant: 'grid' | 'list' | 'compact';
}> = ({ agent, isActive, onSelect, variant }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AgentAvatar
          agent={agent}
          size="md"
          isActive={isActive}
          mood={isHovered ? 'happy' : 'neutral'}
          onClick={onSelect}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`
        relative p-4 rounded-xl cursor-pointer transition-all
        ${isActive 
          ? 'ring-2 ring-offset-2' 
          : 'hover:shadow-lg'
        }
        ${variant === 'grid' ? 'text-center' : 'flex items-center space-x-4'}
      `}
      style={{
        backgroundColor: isActive ? agent.color + '10' : 'white',
        borderColor: agent.color,
        borderWidth: isActive ? '2px' : '1px',
        borderStyle: 'solid'
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AgentAvatar
        agent={agent}
        size={variant === 'grid' ? 'lg' : 'md'}
        mood={isHovered ? 'happy' : 'neutral'}
        showName={variant === 'grid'}
      />
      
      {variant === 'list' && (
        <div className="flex-1">
          <h3 className="font-semibold text-lg" style={{ color: agent.color }}>
            {agent.name}
          </h3>
          <p className="text-sm text-gray-600">{agent.role}</p>
          <p className="text-xs text-gray-500 mt-1">
            {agent.personality.primaryGoal}
          </p>
        </div>
      )}
      
      {variant === 'list' && (
        <ChevronRight 
          className="w-5 h-5 text-gray-400"
          style={{ color: isActive ? agent.color : undefined }}
        />
      )}
      
      {isActive && (
        <motion.div
          className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          Active
        </motion.div>
      )}
    </motion.div>
  );
};

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  activeAgentId,
  onSelectAgent,
  showLabels = true,
  variant = 'grid'
}) => {
  const agents = getAllAgents();
  const [isOpen, setIsOpen] = useState(false);
  const activeAgent = agents.find(a => a.id === activeAgentId);

  const handleSelectAgent = (agentId: string) => {
    onSelectAgent(agentId);
    setIsOpen(false);
  };

  if (variant === 'compact') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="w-4 h-4" />
            Switch Agent
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose Your Assistant</DialogTitle>
            <DialogDescription>
              Each agent has unique capabilities and personality to help you better.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isActive={agent.id === activeAgentId}
                onSelect={() => handleSelectAgent(agent.id)}
                variant="grid"
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Choose Your Assistant</h2>
          {activeAgent && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Currently talking to:</span>
              <span className="font-medium" style={{ color: activeAgent.color }}>
                {activeAgent.name}
              </span>
            </div>
          )}
        </div>
      )}
      
      <AnimatePresence mode="wait">
        <motion.div
          className={
            variant === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'
              : 'space-y-3'
          }
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isActive={agent.id === activeAgentId}
              onSelect={() => handleSelectAgent(agent.id)}
              variant={variant}
            />
          ))}
        </motion.div>
      </AnimatePresence>
      
      {/* Agent capabilities summary */}
      {activeAgent && showLabels && (
        <motion.div
          className="mt-6 p-4 rounded-lg bg-gray-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-medium mb-2" style={{ color: activeAgent.color }}>
            {activeAgent.name} can help you with:
          </h3>
          <div className="flex flex-wrap gap-2">
            {activeAgent.capabilities.map((cap) => (
              <span
                key={cap.name}
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: activeAgent.color + '20',
                  color: activeAgent.color
                }}
              >
                {cap.description}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};