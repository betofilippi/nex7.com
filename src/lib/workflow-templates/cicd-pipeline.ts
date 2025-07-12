import { WorkflowTemplate, CustomNode, CustomEdge } from '@/components/canvas/types';

const nodes: CustomNode[] = [
  {
    id: '1',
    type: 'webhook',
    position: { x: 100, y: 100 },
    data: {
      label: 'GitHub Push',
      description: 'Triggered on push to main branch',
      webhookUrl: 'https://api.example.com/webhooks/github',
      events: ['push', 'pull_request'],
      method: 'POST'
    }
  },
  {
    id: '2',
    type: 'api',
    position: { x: 400, y: 100 },
    data: {
      label: 'Clone Repository',
      description: 'Clone the repository from GitHub',
      url: 'https://api.github.com/repos/{owner}/{repo}/zipball',
      method: 'GET',
      authentication: 'bearer'
    }
  },
  {
    id: '3',
    type: 'transform',
    position: { x: 700, y: 100 },
    data: {
      label: 'Extract Code',
      description: 'Extract and prepare code for building',
      transformType: 'custom',
      transformFunction: 'unzip(input) && prepare()'
    }
  },
  {
    id: '4',
    type: 'api',
    position: { x: 100, y: 300 },
    data: {
      label: 'Run Tests',
      description: 'Execute unit and integration tests',
      url: 'http://localhost:3000/api/test',
      method: 'POST',
      body: '{"command": "npm test"}'
    }
  },
  {
    id: '5',
    type: 'conditional',
    position: { x: 400, y: 300 },
    data: {
      label: 'Tests Passed?',
      description: 'Check if all tests passed',
      condition: 'results.testsPassed === true',
      trueOutput: 'continue',
      falseOutput: 'abort'
    }
  },
  {
    id: '6',
    type: 'api',
    position: { x: 700, y: 300 },
    data: {
      label: 'Build Application',
      description: 'Build the application for production',
      url: 'http://localhost:3000/api/build',
      method: 'POST',
      body: '{"command": "npm run build"}'
    }
  },
  {
    id: '7',
    type: 'api',
    position: { x: 100, y: 500 },
    data: {
      label: 'Deploy to Vercel',
      description: 'Deploy built application to Vercel',
      url: 'https://api.vercel.com/v13/deployments',
      method: 'POST',
      authentication: 'bearer'
    }
  },
  {
    id: '8',
    type: 'notification',
    position: { x: 400, y: 500 },
    data: {
      label: 'Notify Team',
      description: 'Send deployment notification to team',
      channel: 'slack',
      recipients: ['#deployments'],
      title: 'Deployment Complete',
      priority: 'normal'
    }
  },
  {
    id: '9',
    type: 'email',
    position: { x: 700, y: 500 },
    data: {
      label: 'Email Report',
      description: 'Send deployment report via email',
      to: ['team@example.com'],
      subject: 'Deployment Report - {{date}}',
      template: 'deployment-report'
    }
  }
];

const edges: CustomEdge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'default' },
  { id: 'e2-3', source: '2', target: '3', type: 'default' },
  { id: 'e3-4', source: '3', target: '4', type: 'default' },
  { id: 'e4-5', source: '4', target: '5', type: 'default' },
  { id: 'e5-6', source: '5', target: '6', type: 'default' },
  { id: 'e6-7', source: '6', target: '7', type: 'default' },
  { id: 'e7-8', source: '7', target: '8', type: 'default' },
  { id: 'e7-9', source: '7', target: '9', type: 'default' }
];

export const cicdTemplate: WorkflowTemplate = {
  id: 'cicd-pipeline',
  name: 'CI/CD Pipeline',
  description: 'Automated continuous integration and deployment pipeline for web applications',
  category: 'DevOps',
  nodes,
  edges,
  variables: {
    repository: '',
    branch: 'main',
    deploymentTarget: 'production',
    testCommand: 'npm test',
    buildCommand: 'npm run build'
  },
  tags: ['ci/cd', 'deployment', 'automation', 'devops', 'github', 'vercel'],
  author: 'System',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  downloads: 1250,
  rating: 4.8
};