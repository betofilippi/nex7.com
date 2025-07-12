// Notification service integration for Vercel deployments
// This can be extended to support various notification channels

export interface NotificationConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
  };
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel?: string;
  };
  discord?: {
    enabled: boolean;
    webhookUrl: string;
  };
  webhook?: {
    enabled: boolean;
    url: string;
    headers?: Record<string, string>;
  };
}

export interface DeploymentNotification {
  type: 'deployment.created' | 'deployment.succeeded' | 'deployment.failed' | 'deployment.canceled' | 'deployment.rollback';
  project: {
    id: string;
    name: string;
  };
  deployment: {
    id: string;
    url: string;
    state: string;
    creator?: string;
  };
  error?: {
    code: string;
    message: string;
  };
  timestamp: number;
}

export class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  async sendNotification(notification: DeploymentNotification): Promise<void> {
    const promises: Promise<void>[] = [];

    // Send to all configured channels
    if (this.config.slack?.enabled) {
      promises.push(this.sendSlackNotification(notification));
    }

    if (this.config.discord?.enabled) {
      promises.push(this.sendDiscordNotification(notification));
    }

    if (this.config.webhook?.enabled) {
      promises.push(this.sendWebhookNotification(notification));
    }

    if (this.config.email?.enabled) {
      promises.push(this.sendEmailNotification(notification));
    }

    await Promise.allSettled(promises);
  }

  private async sendSlackNotification(notification: DeploymentNotification): Promise<void> {
    if (!this.config.slack?.webhookUrl) return;

    const color = this.getColorForNotificationType(notification.type);
    const emoji = this.getEmojiForNotificationType(notification.type);

    const payload = {
      channel: this.config.slack.channel,
      attachments: [{
        color,
        pretext: `${emoji} Vercel Deployment Update`,
        fields: [
          {
            title: 'Project',
            value: notification.project.name,
            short: true,
          },
          {
            title: 'Status',
            value: notification.deployment.state,
            short: true,
          },
          {
            title: 'URL',
            value: notification.deployment.url,
            short: false,
          },
        ],
        footer: 'Vercel Integration',
        ts: Math.floor(notification.timestamp / 1000),
      }],
    };

    if (notification.error) {
      payload.attachments[0].fields.push({
        title: 'Error',
        value: `${notification.error.code}: ${notification.error.message}`,
        short: false,
      });
    }

    await fetch(this.config.slack.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  private async sendDiscordNotification(notification: DeploymentNotification): Promise<void> {
    if (!this.config.discord?.webhookUrl) return;

    const emoji = this.getEmojiForNotificationType(notification.type);
    const color = this.getDiscordColorForNotificationType(notification.type);

    const embed = {
      title: `${emoji} Deployment ${this.getActionText(notification.type)}`,
      color,
      fields: [
        {
          name: 'Project',
          value: notification.project.name,
          inline: true,
        },
        {
          name: 'Status',
          value: notification.deployment.state,
          inline: true,
        },
        {
          name: 'URL',
          value: notification.deployment.url,
          inline: false,
        },
      ],
      timestamp: new Date(notification.timestamp).toISOString(),
      footer: {
        text: 'Vercel Integration',
      },
    };

    if (notification.error) {
      embed.fields.push({
        name: 'Error',
        value: `${notification.error.code}: ${notification.error.message}`,
        inline: false,
      });
    }

    await fetch(this.config.discord.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });
  }

  private async sendWebhookNotification(notification: DeploymentNotification): Promise<void> {
    if (!this.config.webhook?.url) return;

    await fetch(this.config.webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.webhook.headers,
      },
      body: JSON.stringify(notification),
    });
  }

  private async sendEmailNotification(notification: DeploymentNotification): Promise<void> {
    // This would integrate with your email service
    // For now, just log it
    console.log('Email notification:', notification);
  }

  private getColorForNotificationType(type: DeploymentNotification['type']): string {
    switch (type) {
      case 'deployment.succeeded':
        return '#36a64f'; // Green
      case 'deployment.failed':
      case 'deployment.rollback':
        return '#ff0000'; // Red
      case 'deployment.canceled':
        return '#ff9900'; // Orange
      case 'deployment.created':
      default:
        return '#0099ff'; // Blue
    }
  }

  private getDiscordColorForNotificationType(type: DeploymentNotification['type']): number {
    switch (type) {
      case 'deployment.succeeded':
        return 0x36a64f; // Green
      case 'deployment.failed':
      case 'deployment.rollback':
        return 0xff0000; // Red
      case 'deployment.canceled':
        return 0xff9900; // Orange
      case 'deployment.created':
      default:
        return 0x0099ff; // Blue
    }
  }

  private getEmojiForNotificationType(type: DeploymentNotification['type']): string {
    switch (type) {
      case 'deployment.succeeded':
        return '✅';
      case 'deployment.failed':
        return '❌';
      case 'deployment.canceled':
        return '🚫';
      case 'deployment.rollback':
        return '↩️';
      case 'deployment.created':
      default:
        return '🚀';
    }
  }

  private getActionText(type: DeploymentNotification['type']): string {
    switch (type) {
      case 'deployment.succeeded':
        return 'Succeeded';
      case 'deployment.failed':
        return 'Failed';
      case 'deployment.canceled':
        return 'Canceled';
      case 'deployment.rollback':
        return 'Rolled Back';
      case 'deployment.created':
      default:
        return 'Created';
    }
  }
}

// Factory function to create notification service from environment variables
export function createNotificationService(): NotificationService | null {
  const config: NotificationConfig = {};

  // Slack configuration
  if (process.env.SLACK_WEBHOOK_URL) {
    config.slack = {
      enabled: true,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_CHANNEL,
    };
  }

  // Discord configuration
  if (process.env.DISCORD_WEBHOOK_URL) {
    config.discord = {
      enabled: true,
      webhookUrl: process.env.DISCORD_WEBHOOK_URL,
    };
  }

  // Generic webhook configuration
  if (process.env.NOTIFICATION_WEBHOOK_URL) {
    config.webhook = {
      enabled: true,
      url: process.env.NOTIFICATION_WEBHOOK_URL,
      headers: process.env.NOTIFICATION_WEBHOOK_HEADERS 
        ? JSON.parse(process.env.NOTIFICATION_WEBHOOK_HEADERS)
        : undefined,
    };
  }

  // Email configuration
  if (process.env.NOTIFICATION_EMAIL_ENABLED === 'true') {
    config.email = {
      enabled: true,
      recipients: process.env.NOTIFICATION_EMAIL_RECIPIENTS?.split(',') || [],
    };
  }

  // Return null if no channels are configured
  const hasChannels = Object.values(config).some(channel => channel?.enabled);
  return hasChannels ? new NotificationService(config) : null;
}