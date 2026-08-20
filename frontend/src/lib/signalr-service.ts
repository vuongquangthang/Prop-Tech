// SignalR Service for Real-time Updates
import * as signalR from '@microsoft/signalr';
import { API_CONFIG } from './api-config';
import { getStoredAuthToken } from './api-client';

export class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor(private hubUrl: string) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_CONFIG.BASE_URL}${hubUrl}`, {
        accessTokenFactory: () => getStoredAuthToken() || '',
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 0s, 2s, 10s, 30s, then 30s
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount === 1) return 2000;
          if (retryContext.previousRetryCount === 2) return 10000;
          return 30000;
        },
      })
      // Mat ket noi la binh thuong (doi tab, mang chap chon, Render ngu day)
      // va da co withAutomaticReconnect lo. Chi log tu Critical tro len de
      // thu vien khong goi console.error gay bao dong gia.
      .configureLogging(signalR.LogLevel.Critical)
      .build();

    // Connection lifecycle events
    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting...', error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected. Connection ID:', connectionId);
    });

    this.connection.onclose((error) => {
      console.log('SignalR connection closed.', error);
    });
  }

  async start(): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection not initialized');
    }

    try {
      if (this.connection.state === signalR.HubConnectionState.Disconnected) {
        await this.connection.start();
        console.log('SignalR connected successfully');
      }
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      await this.connection.stop();
      console.log('SignalR connection stopped');
    }
  }

  removeAllListeners(): void {
    if (!this.connection) return;

    this.listeners.forEach((_callbacks, eventName) => {
      this.connection?.off(eventName);
    });
    this.listeners.clear();
  }

  on(eventName: string, callback: (...args: any[]) => void): void {
    if (!this.connection) return;

    // Register callback
    this.connection.on(eventName, callback);

    // Track listener for cleanup
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);
  }

  off(eventName: string, callback?: (...args: any[]) => void): void {
    if (!this.connection) return;

    if (callback) {
      this.connection.off(eventName, callback);
      this.listeners.get(eventName)?.delete(callback);
    } else {
      this.connection.off(eventName);
      this.listeners.delete(eventName);
    }
  }

  async invoke(methodName: string, ...args: any[]): Promise<any> {
    if (!this.connection) {
      throw new Error('SignalR connection not initialized');
    }

    if (this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.start();
    }

    return this.connection.invoke(methodName, ...args);
  }

  async send(methodName: string, ...args: any[]): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection not initialized');
    }

    if (this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.start();
    }

    return this.connection.send(methodName, ...args);
  }

  getState(): signalR.HubConnectionState {
    return this.connection?.state || signalR.HubConnectionState.Disconnected;
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Notification Hub Service
export const notificationHub = new SignalRService('/hubs/notifications');

// Export helper to initialize all hubs
export async function initializeSignalR(): Promise<void> {
  try {
    await notificationHub.start();
  } catch (error) {
    console.error('Failed to initialize SignalR:', error);
  }
}

// Export helper to cleanup all hubs
export async function disconnectSignalR(): Promise<void> {
  try {
    notificationHub.removeAllListeners();
    await notificationHub.stop();
  } catch (error) {
    console.error('Failed to disconnect SignalR:', error);
  }
}
