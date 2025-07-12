import { WorkflowTemplate } from '@/components/canvas/types';
import { cicdTemplate } from './cicd-pipeline';
import { dataETLTemplate } from './data-etl';
import { apiMonitoringTemplate } from './api-monitoring';
import { contentGenerationTemplate } from './content-generation';
import { customerOnboardingTemplate } from './customer-onboarding';

export const workflowTemplates: WorkflowTemplate[] = [
  cicdTemplate,
  dataETLTemplate,
  apiMonitoringTemplate,
  contentGenerationTemplate,
  customerOnboardingTemplate
];

export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  return workflowTemplates.find(template => template.id === id);
};

export const getTemplatesByCategory = (category: string): WorkflowTemplate[] => {
  return workflowTemplates.filter(template => template.category === category);
};

export const searchTemplates = (query: string): WorkflowTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return workflowTemplates.filter(template =>
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};