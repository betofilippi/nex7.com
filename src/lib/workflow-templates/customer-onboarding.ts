import { WorkflowTemplate, CustomNode, CustomEdge } from '@/components/canvas/types';

const nodes: CustomNode[] = [
  {
    id: '1',
    type: 'webhook',
    position: { x: 100, y: 100 },
    data: {
      label: 'New User Signup',
      description: 'Triggered when a new user signs up',
      webhookUrl: 'https://api.example.com/webhooks/user-signup',
      events: ['user.created'],
      method: 'POST'
    }
  },
  {
    id: '2',
    type: 'database',
    position: { x: 400, y: 100 },
    data: {
      label: 'Create User Profile',
      description: 'Create detailed user profile in database',
      database: 'postgresql',
      operation: 'insert',
      query: 'INSERT INTO user_profiles (user_id, onboarding_stage, created_at) VALUES ($1, \'welcome\', NOW())'
    }
  },
  {
    id: '3',
    type: 'email',
    position: { x: 700, y: 100 },
    data: {
      label: 'Welcome Email',
      description: 'Send personalized welcome email',
      to: ['{{user.email}}'],
      subject: 'Welcome to {{company.name}}, {{user.firstName}}!',
      template: 'welcome-email',
      attachments: ['onboarding-guide.pdf']
    }
  },
  {
    id: '4',
    type: 'conditional',
    position: { x: 100, y: 300 },
    data: {
      label: 'Has Company Info?',
      description: 'Check if user provided company information',
      condition: 'user.company !== null',
      trueOutput: 'enterprise_flow',
      falseOutput: 'individual_flow'
    }
  },
  {
    id: '5',
    type: 'ai-task',
    position: { x: 400, y: 300 },
    data: {
      label: 'Personalize Experience',
      description: 'Use AI to customize onboarding based on user profile',
      model: 'claude-3-sonnet',
      task: 'Analyze user profile and industry to recommend personalized onboarding steps and features',
      temperature: 0.3
    }
  },
  {
    id: '6',
    type: 'api',
    position: { x: 700, y: 300 },
    data: {
      label: 'Setup Trial Account',
      description: 'Configure trial account with appropriate features',
      url: 'https://api.example.com/accounts/setup-trial',
      method: 'POST',
      authentication: 'bearer'
    }
  },
  {
    id: '7',
    type: 'schedule',
    position: { x: 100, y: 500 },
    data: {
      label: 'Day 3 Follow-up',
      description: 'Schedule follow-up email for day 3',
      cronExpression: '0 10 * * *',
      timezone: 'user_timezone',
      enabled: true
    }
  },
  {
    id: '8',
    type: 'email',
    position: { x: 400, y: 500 },
    data: {
      label: 'Progress Check Email',
      description: 'Check user progress and offer help',
      to: ['{{user.email}}'],
      subject: 'How are you finding {{product.name}}?',
      template: 'progress-check'
    }
  },
  {
    id: '9',
    type: 'conditional',
    position: { x: 700, y: 500 },
    data: {
      label: 'User Active?',
      description: 'Check if user has been active',
      condition: 'user.lastLoginDays < 3',
      trueOutput: 'continue_onboarding',
      falseOutput: 're_engagement'
    }
  },
  {
    id: '10',
    type: 'notification',
    position: { x: 100, y: 700 },
    data: {
      label: 'Notify Sales Team',
      description: 'Alert sales team for high-value prospects',
      channel: 'slack',
      recipients: ['#sales'],
      title: 'New Enterprise Lead',
      priority: 'high'
    }
  },
  {
    id: '11',
    type: 'api',
    position: { x: 400, y: 700 },
    data: {
      label: 'Add to CRM',
      description: 'Create lead in CRM system',
      url: 'https://api.crm.com/leads',
      method: 'POST',
      authentication: 'api-key'
    }
  }
];

const edges: CustomEdge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'default' },
  { id: 'e2-3', source: '2', target: '3', type: 'default' },
  { id: 'e3-4', source: '3', target: '4', type: 'default' },
  { id: 'e4-5', source: '4', target: '5', type: 'default', sourceHandle: 'true' },
  { id: 'e4-6', source: '4', target: '6', type: 'default', sourceHandle: 'false' },
  { id: 'e5-6', source: '5', target: '6', type: 'default' },
  { id: 'e6-7', source: '6', target: '7', type: 'default' },
  { id: 'e7-8', source: '7', target: '8', type: 'default' },
  { id: 'e8-9', source: '8', target: '9', type: 'default' },
  { id: 'e5-10', source: '5', target: '10', type: 'default' },
  { id: 'e10-11', source: '10', target: '11', type: 'default' }
];

export const customerOnboardingTemplate: WorkflowTemplate = {
  id: 'customer-onboarding',
  name: 'Customer Onboarding Pipeline',
  description: 'Automated customer onboarding with personalized experiences and follow-ups',
  category: 'Customer Success',
  nodes,
  edges,
  variables: {
    trialDuration: 14,
    followUpDays: [3, 7, 14],
    enterpriseThreshold: 100,
    onboardingSteps: [
      'welcome',
      'profile_setup',
      'first_action',
      'integration',
      'success'
    ]
  },
  tags: ['onboarding', 'customer-success', 'automation', 'email', 'crm'],
  author: 'System',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  downloads: 720,
  rating: 4.5
};