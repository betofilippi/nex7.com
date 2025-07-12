import { Notification, PushSubscription } from './types';

export class PushService {
  private subscriptions: Map<string, PushSubscription[]> = new Map();
  private vapidKeys: { publicKey: string; privateKey: string } | null = null;
  private storageKey = 'nex7:push-subscriptions';

  constructor() {
    this.loadSubscriptions();
    this.initializeVAPIDKeys();
  }

  private async initializeVAPIDKeys(): Promise<void> {
    try {
      // In production, these would be loaded from environment variables
      this.vapidKeys = {
        publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'demo-public-key',
        privateKey: process.env.VAPID_PRIVATE_KEY || 'demo-private-key',
      };
    } catch (error) {
      console.error('Error initializing VAPID keys:', error);
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (!('serviceWorker' in navigator)) {
      throw new Error('This browser does not support service workers');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribe(userId: string): Promise<PushSubscription | null> {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidKeys?.publicKey || ''),
      });

      const pushSubscription: PushSubscription = {
        id: this.generateId(),
        userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
        userAgent: navigator.userAgent,
        createdAt: new Date(),
      };

      // Store subscription
      const userSubscriptions = this.subscriptions.get(userId) || [];
      userSubscriptions.push(pushSubscription);
      this.subscriptions.set(userId, userSubscriptions);
      this.saveSubscriptions();

      return pushSubscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  async unsubscribe(userId: string, subscriptionId?: string): Promise<void> {
    const userSubscriptions = this.subscriptions.get(userId) || [];
    
    if (subscriptionId) {
      // Remove specific subscription
      const filteredSubscriptions = userSubscriptions.filter(s => s.id !== subscriptionId);
      this.subscriptions.set(userId, filteredSubscriptions);
    } else {
      // Remove all subscriptions for user
      this.subscriptions.delete(userId);
    }
    
    this.saveSubscriptions();
  }

  async sendNotification(
    notification: Notification,
    pushPrefs: any
  ): Promise<void> {
    const userId = notification.userId || 'default';
    const userSubscriptions = this.subscriptions.get(userId) || [];

    if (userSubscriptions.length === 0) {
      return;
    }

    // Check quiet hours
    if (pushPrefs.quiet_hours?.enabled && this.isQuietHours(pushPrefs.quiet_hours)) {
      return;
    }

    const payload = {
      title: notification.title,
      body: notification.message,
      icon: notification.imageUrl || '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: notification.id,
      data: {
        url: notification.actions?.[0]?.url || '/',
        notificationId: notification.id,
        ...notification.data,
      },
      actions: notification.actions?.map(action => ({
        action: action.id,
        title: action.label,
      })) || [],
      requireInteraction: notification.persistent,
      silent: !pushPrefs.sound,
    };

    // Send to all user subscriptions
    const sendPromises = userSubscriptions.map(async (subscription) => {
      try {
        await this.sendPushMessage(subscription, payload);
        subscription.lastUsed = new Date();
      } catch (error) {
        console.error('Error sending push notification:', error);
        // Remove invalid subscription
        const updatedSubscriptions = userSubscriptions.filter(s => s.id !== subscription.id);
        this.subscriptions.set(userId, updatedSubscriptions);
      }
    });

    await Promise.allSettled(sendPromises);
    this.saveSubscriptions();
  }

  private async sendPushMessage(
    subscription: PushSubscription,
    payload: any
  ): Promise<void> {
    // In production, this would use a proper push service library like web-push
    // For demo purposes, we'll simulate the push
    console.log('Sending push notification:', { subscription, payload });
    
    // Simulate API call to push service
    const response = await fetch('/api/v1/notifications/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription,
        payload,
      }),
    });

    if (!response.ok) {
      throw new Error(`Push service error: ${response.statusText}`);
    }
  }

  private isQuietHours(quietHours: { start: string; end: string }): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      // Same day quiet hours
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadSubscriptions(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const subscriptions = JSON.parse(data);
        this.subscriptions = new Map(
          subscriptions.map(([userId, subs]: [string, PushSubscription[]]) => [
            userId,
            subs.map(sub => ({
              ...sub,
              createdAt: new Date(sub.createdAt),
              lastUsed: sub.lastUsed ? new Date(sub.lastUsed) : undefined,
            })),
          ])
        );
      }
    } catch (error) {
      console.error('Error loading push subscriptions:', error);
    }
  }

  private saveSubscriptions(): void {
    try {
      const subscriptions = Array.from(this.subscriptions.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(subscriptions));
    } catch (error) {
      console.error('Error saving push subscriptions:', error);
    }
  }

  getUserSubscriptions(userId: string): PushSubscription[] {
    return this.subscriptions.get(userId) || [];
  }

  isSubscribed(userId: string): boolean {
    return (this.subscriptions.get(userId) || []).length > 0;
  }
}