import { Notification } from './types';
import crypto from 'crypto';

export class WebhookService {
  async sendNotification(
    notification: Notification,
    webhookPrefs: any
  ): Promise<void> {
    if (!webhookPrefs.url) {
      throw new Error('Webhook URL not configured');
    }

    const payload = {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      data: notification.data,
      createdAt: notification.createdAt.toISOString(),
      userId: notification.userId,
      category: notification.category,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'NeX7-Webhooks/1.0',
      'X-NeX7-Event': 'notification',
      'X-NeX7-Delivery': crypto.randomUUID(),
    };

    // Add signature if secret is configured
    if (webhookPrefs.secret) {
      const signature = this.generateSignature(payload, webhookPrefs.secret);
      headers['X-NeX7-Signature'] = signature;
    }

    try {
      const response = await fetch(webhookPrefs.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Webhook delivery failed:', error);
      throw error;
    }
  }

  private generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString, 'utf8');
    return `sha256=${hmac.digest('hex')}`;
  }

  async testWebhook(url: string, secret?: string): Promise<boolean> {
    const testPayload = {
      id: 'test',
      title: 'Test Notification',
      message: 'This is a test notification to verify your webhook endpoint.',
      type: 'info',
      priority: 'low',
      createdAt: new Date().toISOString(),
      test: true,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'NeX7-Webhooks/1.0',
      'X-NeX7-Event': 'test',
      'X-NeX7-Delivery': crypto.randomUUID(),
    };

    if (secret) {
      const signature = this.generateSignature(testPayload, secret);
      headers['X-NeX7-Signature'] = signature;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
      });

      return response.ok;
    } catch (error) {
      console.error('Webhook test failed:', error);
      return false;
    }
  }

  validateSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')}`;
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}