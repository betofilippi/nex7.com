import { WorkflowTemplate, CustomNode, CustomEdge } from '@/components/canvas/types';

const nodes: CustomNode[] = [
  {
    id: '1',
    type: 'schedule',
    position: { x: 100, y: 100 },
    data: {
      label: 'Daily Content Schedule',
      description: 'Generate content daily at 9 AM',
      cronExpression: '0 9 * * *',
      timezone: 'UTC',
      enabled: true
    }
  },
  {
    id: '2',
    type: 'database',
    position: { x: 400, y: 100 },
    data: {
      label: 'Get Content Topics',
      description: 'Fetch pending content topics from database',
      database: 'postgresql',
      operation: 'select',
      query: 'SELECT * FROM content_topics WHERE status = \'pending\' ORDER BY priority DESC LIMIT 5'
    }
  },
  {
    id: '3',
    type: 'ai-task',
    position: { x: 700, y: 100 },
    data: {
      label: 'Research Topic',
      description: 'Research and gather information about the topic',
      model: 'claude-3-opus',
      task: 'Research the topic and provide comprehensive information including current trends, statistics, and expert opinions',
      temperature: 0.7,
      maxTokens: 2000
    }
  },
  {
    id: '4',
    type: 'ai-task',
    position: { x: 100, y: 300 },
    data: {
      label: 'Create Outline',
      description: 'Generate content outline and structure',
      model: 'claude-3-sonnet',
      task: 'Create a detailed content outline with main points, subheadings, and key takeaways',
      temperature: 0.5
    }
  },
  {
    id: '5',
    type: 'ai-task',
    position: { x: 400, y: 300 },
    data: {
      label: 'Write Content',
      description: 'Generate the full article content',
      model: 'claude-3-opus',
      task: 'Write a comprehensive, engaging article based on the research and outline. Include SEO-friendly headings and natural keyword integration.',
      temperature: 0.7,
      maxTokens: 4000
    }
  },
  {
    id: '6',
    type: 'ai-task',
    position: { x: 700, y: 300 },
    data: {
      label: 'Generate Images',
      description: 'Create image descriptions for content',
      model: 'claude-3-haiku',
      task: 'Generate detailed descriptions for 3-5 images that would complement the article content',
      temperature: 0.8
    }
  },
  {
    id: '7',
    type: 'transform',
    position: { x: 100, y: 500 },
    data: {
      label: 'Format Content',
      description: 'Format content for publication',
      transformType: 'custom',
      transformFunction: `
        content => ({
          title: content.title,
          slug: content.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          body: content.body,
          excerpt: content.body.substring(0, 200) + '...',
          images: content.images,
          seoKeywords: content.keywords,
          publishDate: new Date(),
          status: 'draft'
        })
      `
    }
  },
  {
    id: '8',
    type: 'database',
    position: { x: 400, y: 500 },
    data: {
      label: 'Save to CMS',
      description: 'Save formatted content to CMS database',
      database: 'postgresql',
      operation: 'insert',
      query: 'INSERT INTO articles (title, slug, body, excerpt, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())'
    }
  },
  {
    id: '9',
    type: 'notification',
    position: { x: 700, y: 500 },
    data: {
      label: 'Notify Content Team',
      description: 'Notify content team of new draft',
      channel: 'slack',
      recipients: ['#content-team'],
      title: 'New Content Draft Ready',
      message: 'A new article draft has been generated and is ready for review',
      priority: 'normal'
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
  { id: 'e8-9', source: '8', target: '9', type: 'default' }
];

export const contentGenerationTemplate: WorkflowTemplate = {
  id: 'content-generation',
  name: 'AI Content Generation Pipeline',
  description: 'Automated content research, writing, and publishing workflow using AI',
  category: 'Content Marketing',
  nodes,
  edges,
  variables: {
    contentType: 'blog-post',
    targetAudience: 'general',
    wordCount: 1500,
    seoKeywords: [],
    publishSchedule: 'draft'
  },
  tags: ['ai', 'content', 'writing', 'seo', 'automation', 'marketing'],
  author: 'System',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  downloads: 680,
  rating: 4.9
};