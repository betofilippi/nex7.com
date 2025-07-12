import { WorkflowTemplate, CustomNode, CustomEdge } from '@/components/canvas/types';

const nodes: CustomNode[] = [
  {
    id: '1',
    type: 'schedule',
    position: { x: 100, y: 100 },
    data: {
      label: 'Health Check Schedule',
      description: 'Check API health every 5 minutes',
      cronExpression: '*/5 * * * *',
      timezone: 'UTC',
      enabled: true
    }
  },
  {
    id: '2',
    type: 'loop',
    position: { x: 400, y: 100 },
    data: {
      label: 'Check Multiple Endpoints',
      description: 'Test multiple API endpoints',
      loopType: 'forEach',
      collection: 'endpoints',
      currentItem: 'endpoint'
    }
  },
  {
    id: '3',
    type: 'api',
    position: { x: 700, y: 100 },
    data: {
      label: 'API Health Check',
      description: 'Check endpoint health and response time',
      url: '{{endpoint.url}}',
      method: 'GET',
      headers: {
        'User-Agent': 'API-Monitor/1.0'
      }
    }
  },
  {
    id: '4',
    type: 'transform',
    position: { x: 100, y: 300 },
    data: {
      label: 'Analyze Response',
      description: 'Analyze response time and status',
      transformType: 'map',
      transformFunction: `
        response => ({
          endpoint: response.url,
          status: response.status,
          responseTime: response.time,
          healthy: response.status >= 200 && response.status < 300 && response.time < 5000
        })
      `
    }
  },
  {
    id: '5',
    type: 'conditional',
    position: { x: 400, y: 300 },
    data: {
      label: 'Is Healthy?',
      description: 'Check if endpoint is healthy',
      condition: 'response.healthy === true',
      trueOutput: 'log_success',
      falseOutput: 'alert_failure'
    }
  },
  {
    id: '6',
    type: 'database',
    position: { x: 700, y: 300 },
    data: {
      label: 'Log Metrics',
      description: 'Store response metrics in database',
      database: 'postgresql',
      operation: 'insert',
      query: 'INSERT INTO api_metrics (endpoint, status, response_time, timestamp) VALUES ($1, $2, $3, NOW())'
    }
  },
  {
    id: '7',
    type: 'notification',
    position: { x: 100, y: 500 },
    data: {
      label: 'Alert DevOps',
      description: 'Send alert for API failures',
      channel: 'slack',
      recipients: ['#devops', '#alerts'],
      title: 'API Endpoint Down',
      priority: 'high'
    }
  },
  {
    id: '8',
    type: 'email',
    position: { x: 400, y: 500 },
    data: {
      label: 'Email Alert',
      description: 'Send detailed alert via email',
      to: ['devops@example.com', 'oncall@example.com'],
      subject: 'URGENT: API Endpoint Failure - {{endpoint}}',
      template: 'api-failure-alert'
    }
  },
  {
    id: '9',
    type: 'ai-task',
    position: { x: 700, y: 500 },
    data: {
      label: 'Analyze Patterns',
      description: 'Use AI to analyze failure patterns',
      model: 'claude-3-sonnet',
      task: 'Analyze the API failure patterns and suggest potential causes',
      temperature: 0.3
    }
  }
];

const edges: CustomEdge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'default' },
  { id: 'e2-3', source: '2', target: '3', type: 'default' },
  { id: 'e3-4', source: '3', target: '4', type: 'default' },
  { id: 'e4-5', source: '4', target: '5', type: 'default' },
  { id: 'e5-6', source: '5', target: '6', type: 'default', sourceHandle: 'true' },
  { id: 'e5-7', source: '5', target: '7', type: 'default', sourceHandle: 'false' },
  { id: 'e7-8', source: '7', target: '8', type: 'default' },
  { id: 'e7-9', source: '7', target: '9', type: 'default' }
];

export const apiMonitoringTemplate: WorkflowTemplate = {
  id: 'api-monitoring',
  name: 'API Monitoring Pipeline',
  description: 'Continuous monitoring and alerting for API endpoints',
  category: 'Monitoring',
  nodes,
  edges,
  variables: {
    endpoints: [
      { url: 'https://api.example.com/health', name: 'Main API' },
      { url: 'https://api.example.com/v1/status', name: 'Status API' }
    ],
    alertChannels: ['slack', 'email'],
    responseThreshold: 5000
  },
  tags: ['monitoring', 'api', 'health-check', 'alerts', 'uptime'],
  author: 'System',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  downloads: 950,
  rating: 4.6
};