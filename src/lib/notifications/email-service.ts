import type { Notification, EmailTemplate } from './types';

export class EmailService {
  private templates: Map<string, EmailTemplate> = new Map();
  private apiUrl: string;

  constructor(apiUrl: string = '/api/v1/notifications/email') {
    this.apiUrl = apiUrl;
    this.loadDefaultTemplates();
  }

  private loadDefaultTemplates(): void {
    const defaultTemplates: EmailTemplate[] = [
      {
        id: 'default',
        name: 'Default Notification',
        subject: '{{title}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #333; margin-top: 0;">{{title}}</h2>
              <p style="color: #666; line-height: 1.6;">{{message}}</p>
              {{#actions}}
              <div style="margin-top: 20px;">
                {{#each actions}}
                <a href="{{url}}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-right: 10px;">{{label}}</a>
                {{/each}}
              </div>
              {{/actions}}
            </div>
          </div>
        `,
        text: '{{title}}\n\n{{message}}',
        variables: ['title', 'message', 'actions'],
      },
      {
        id: 'error',
        name: 'Error Notification',
        subject: '🚨 Error: {{title}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 20px; border-radius: 8px;">
              <h2 style="color: #c53030; margin-top: 0;">🚨 {{title}}</h2>
              <p style="color: #4a5568; line-height: 1.6;">{{message}}</p>
              {{#data}}
              <div style="background: #f7fafc; padding: 15px; border-radius: 4px; margin-top: 15px;">
                <h4 style="color: #2d3748; margin-top: 0;">Additional Details:</h4>
                <pre style="background: white; padding: 10px; border-radius: 4px; overflow-x: auto;">{{data}}</pre>
              </div>
              {{/data}}
            </div>
          </div>
        `,
        text: '🚨 {{title}}\n\n{{message}}',
        variables: ['title', 'message', 'data'],
      },
      {
        id: 'success',
        name: 'Success Notification',
        subject: '✅ {{title}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f0fff4; border-left: 4px solid #38a169; padding: 20px; border-radius: 8px;">
              <h2 style="color: #2f855a; margin-top: 0;">✅ {{title}}</h2>
              <p style="color: #4a5568; line-height: 1.6;">{{message}}</p>
            </div>
          </div>
        `,
        text: '✅ {{title}}\n\n{{message}}',
        variables: ['title', 'message'],
      },
      {
        id: 'warning',
        name: 'Warning Notification',
        subject: '⚠️ {{title}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fffbf0; border-left: 4px solid #ed8936; padding: 20px; border-radius: 8px;">
              <h2 style="color: #c05621; margin-top: 0;">⚠️ {{title}}</h2>
              <p style="color: #4a5568; line-height: 1.6;">{{message}}</p>
            </div>
          </div>
        `,
        text: '⚠️ {{title}}\n\n{{message}}',
        variables: ['title', 'message'],
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  async sendNotification(
    notification: Notification, 
    emailPrefs: any
  ): Promise<void> {
    const template = this.getTemplate(notification.type);
    const rendered = this.renderTemplate(template, notification);

    await this.sendEmail({
      to: notification.userId || 'user@example.com', // In production, get from user data
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  private getTemplate(type: string): EmailTemplate {
    return this.templates.get(type) || this.templates.get('default')!;
  }

  private renderTemplate(template: EmailTemplate, notification: Notification): {
    subject: string;
    html: string;
    text: string;
  } {
    const variables = {
      title: notification.title,
      message: notification.message,
      data: notification.data ? JSON.stringify(notification.data, null, 2) : null,
      actions: notification.actions,
    };

    return {
      subject: this.interpolate(template.subject, variables),
      html: this.interpolate(template.html, variables),
      text: this.interpolate(template.text || template.subject, variables),
    };
  }

  private interpolate(template: string, variables: Record<string, any>): string {
    let result = template;
    
    // Simple variable interpolation
    Object.entries(variables).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, String(value));
      }
    });

    // Handle conditional blocks
    result = result.replace(/{{#(\w+)}}([\s\S]*?){{\/\1}}/g, (match, key, content) => {
      return variables[key] ? content : '';
    });

    // Handle array iteration (simplified)
    result = result.replace(/{{#each (\w+)}}([\s\S]*?){{\/each}}/g, (match, key, content) => {
      const array = variables[key];
      if (Array.isArray(array)) {
        return array.map(item => {
          let itemContent = content;
          Object.entries(item).forEach(([itemKey, itemValue]) => {
            const regex = new RegExp(`{{${itemKey}}}`, 'g');
            itemContent = itemContent.replace(regex, String(itemValue));
          });
          return itemContent;
        }).join('');
      }
      return '';
    });

    return result;
  }

  private async sendEmail(email: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(email),
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  addTemplate(template: EmailTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplateById(id: string): EmailTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }
}