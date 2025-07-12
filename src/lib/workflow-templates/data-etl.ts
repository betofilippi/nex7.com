import { WorkflowTemplate, CustomNode, CustomEdge } from '@/components/canvas/types';

const nodes: CustomNode[] = [
  {
    id: '1',
    type: 'schedule',
    position: { x: 100, y: 100 },
    data: {
      label: 'Daily ETL Schedule',
      description: 'Run ETL process daily at 2 AM',
      cronExpression: '0 2 * * *',
      timezone: 'UTC',
      enabled: true
    }
  },
  {
    id: '2',
    type: 'database',
    position: { x: 400, y: 100 },
    data: {
      label: 'Extract from Source DB',
      description: 'Extract data from production database',
      database: 'postgresql',
      operation: 'select',
      query: 'SELECT * FROM transactions WHERE created_at >= NOW() - INTERVAL \'24 hours\''
    }
  },
  {
    id: '3',
    type: 'transform',
    position: { x: 700, y: 100 },
    data: {
      label: 'Clean & Validate Data',
      description: 'Remove duplicates and validate data integrity',
      transformType: 'custom',
      transformFunction: `
        data
          .filter(row => row.status !== 'cancelled')
          .map(row => ({
            ...row,
            amount: parseFloat(row.amount),
            date: new Date(row.created_at)
          }))
      `
    }
  },
  {
    id: '4',
    type: 'api',
    position: { x: 100, y: 300 },
    data: {
      label: 'Enrich with API Data',
      description: 'Add additional data from external API',
      url: 'https://api.enrichment.com/v1/enrich',
      method: 'POST',
      authentication: 'api-key'
    }
  },
  {
    id: '5',
    type: 'transform',
    position: { x: 400, y: 300 },
    data: {
      label: 'Aggregate Metrics',
      description: 'Calculate daily metrics and summaries',
      transformType: 'reduce',
      transformFunction: `
        data.reduce((acc, row) => {
          const date = row.date.toISOString().split('T')[0];
          acc[date] = acc[date] || { total: 0, count: 0, items: [] };
          acc[date].total += row.amount;
          acc[date].count += 1;
          acc[date].items.push(row);
          return acc;
        }, {})
      `
    }
  },
  {
    id: '6',
    type: 'database',
    position: { x: 700, y: 300 },
    data: {
      label: 'Load to Data Warehouse',
      description: 'Insert processed data into warehouse',
      database: 'postgresql',
      operation: 'insert',
      query: 'INSERT INTO analytics.daily_metrics (date, total, count, data) VALUES ($1, $2, $3, $4)'
    }
  },
  {
    id: '7',
    type: 'conditional',
    position: { x: 100, y: 500 },
    data: {
      label: 'Check Data Quality',
      description: 'Verify data quality thresholds',
      condition: 'results.errorRate < 0.05',
      trueOutput: 'success',
      falseOutput: 'alert'
    }
  },
  {
    id: '8',
    type: 'notification',
    position: { x: 400, y: 500 },
    data: {
      label: 'Success Notification',
      description: 'Notify team of successful ETL',
      channel: 'slack',
      recipients: ['#data-team'],
      title: 'ETL Process Complete',
      message: 'Daily ETL completed successfully',
      priority: 'low'
    }
  },
  {
    id: '9',
    type: 'notification',
    position: { x: 700, y: 500 },
    data: {
      label: 'Error Alert',
      description: 'Alert on data quality issues',
      channel: 'push',
      recipients: ['data-team@example.com'],
      title: 'ETL Data Quality Alert',
      message: 'Data quality threshold exceeded',
      priority: 'urgent'
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
  { id: 'e7-8', source: '7', target: '8', type: 'default', sourceHandle: 'true' },
  { id: 'e7-9', source: '7', target: '9', type: 'default', sourceHandle: 'false' }
];

export const dataETLTemplate: WorkflowTemplate = {
  id: 'data-etl',
  name: 'Data ETL Pipeline',
  description: 'Extract, Transform, and Load data pipeline for analytics',
  category: 'Data Processing',
  nodes,
  edges,
  variables: {
    sourceDatabase: '',
    targetDatabase: '',
    schedule: '0 2 * * *',
    errorThreshold: 0.05
  },
  tags: ['etl', 'data', 'analytics', 'database', 'pipeline', 'automation'],
  author: 'System',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  downloads: 850,
  rating: 4.7
};