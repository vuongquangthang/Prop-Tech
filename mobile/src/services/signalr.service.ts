import * as SignalR from '@microsoft/signalr';
import { getApiBaseUrl } from './api.service';
import { secureStorage } from '../utils/secureStorage';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
};

export type NotificationHandler = (notification: any) => void;
export type MaintenanceUpdateHandler = (update: any) => void;
export type PaymentUpdateHandler = (payment: any) => void;
export type InvoiceUpdateHandler = (invoice: any) => void;
export type SessionRevokedHandler = (payload: any) => void;

class SignalRService {
  private connection: SignalR.HubConnection | null = null;
  private notificationHandlers: NotificationHandler[] = [];
  private maintenanceHandlers: MaintenanceUpdateHandler[] = [];
  private paymentHandlers: PaymentUpdateHandler[] = [];
  private invoiceHandlers: InvoiceUpdateHandler[] = [];
  private sessionRevokedHandlers: SessionRevokedHandler[] = [];
  private isConnecting: boolean = false;

  /**
   * Initialize SignalR connection
   */
  async connect(): Promise<void> {
    if (this.connection?.state === SignalR.HubConnectionState.Connected) {
      console.log('✅ SignalR already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('⏳ SignalR connection already in progress');
      return;
    }

    try {
      this.isConnecting = true;
      console.log('🔌 Connecting to SignalR...');

      // Verify token exists before connecting
      const initialToken = await secureStorage.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      if (!initialToken) {
        console.warn('⚠️ No auth token, skipping SignalR connection');
        this.isConnecting = false;
        return;
      }

      this.connection = new SignalR.HubConnectionBuilder()
        .withUrl(`${getApiBaseUrl()}/hubs/notifications`, {
          accessTokenFactory: async () => {
            const t = await secureStorage.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
            return t || '';
          },
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Retry after 0, 2, 10, 30 seconds
            if (retryContext.previousRetryCount === 0) return 0;
            if (retryContext.previousRetryCount === 1) return 2000;
            if (retryContext.previousRetryCount === 2) return 10000;
            return 30000;
          },
        })
        // Mat ket noi la binh thuong (doi mang, app vao nen, Render ngu day)
        // va da co withAutomaticReconnect lo. De muc Error thi thu vien goi
        // console.error khien LogBox bao do gia. Chi log tu Critical tro len.
        .configureLogging(SignalR.LogLevel.Critical)
        .build();

      // Register event handlers
      this.connection.on('ReceiveNotification', (notification) => {
        console.log('📬 Received notification:', notification);
        this.notificationHandlers.forEach(handler => handler(notification));
        // Route invoice-type notifications to invoice handlers for real-time refresh
        // Backend DTO uses notificationType; raw SignalR push from NotifyResidentAsync uses type
        if (notification?.type === 'INVOICE' || notification?.notificationType === 'INVOICE') {
          console.log('📄 Invoice approved notification:', notification);
          this.invoiceHandlers.forEach(handler => handler(notification));
        }
      });

      this.connection.on('SessionRevoked', (payload) => {
        console.log('🔒 Session revoked:', payload);
        this.sessionRevokedHandlers.forEach(handler => handler(payload));
      });

      // Listen for new maintenance requests (from other residents - useful for admin)
      this.connection.on('NewMaintenanceRequest', (request) => {
        console.log('🆕 New maintenance request:', request);
        this.maintenanceHandlers.forEach(handler => handler(request));
        // Also trigger notification
        this.notificationHandlers.forEach(handler =>
          handler({
            type: 'MAINTENANCE',
            message: `Sự cố mới: ${request.issueType} - Phòng ${request.roomCode}`,
            relatedEntityId: request.id,
          })
        );
      });

      this.connection.on('MaintenanceRequestUpdated', (update) => {
        console.log('🔧 Maintenance request updated:', update);
        this.maintenanceHandlers.forEach(handler => handler(update));
      });

      this.connection.on('MaintenanceRequestClosed', (request) => {
        console.log('✅ Maintenance request closed:', request);
        this.maintenanceHandlers.forEach(handler => handler(request));
      });

      this.connection.on('InvoiceCreated', (invoice) => {
        console.log('💰 New invoice created:', invoice);
        // Trigger notification handlers
        this.notificationHandlers.forEach(handler =>
          handler({
            type: 'INVOICE',
            message: `Hóa đơn mới tháng ${invoice.month}/${invoice.year}`,
            relatedEntityId: invoice.id,
          })
        );
      });

      // Invoice approved - sent when admin approves a draft invoice (handled in ReceiveNotification above)

      // Payment events
      this.connection.on('PaymentInitiated', (payment) => {
        console.log('🔄 Payment initiated:', payment);
        this.paymentHandlers.forEach(handler => handler({
          type: 'INITIATED',
          ...payment
        }));
      });

      this.connection.on('PaymentSuccess', (payment) => {
        console.log('✅ Payment success:', payment);
        this.paymentHandlers.forEach(handler => handler({
          type: 'SUCCESS',
          ...payment
        }));
        // Trigger invoice list refresh (e.g. BillsScreen)
        this.invoiceHandlers.forEach(handler => handler(payment));
        // Also trigger notification
        this.notificationHandlers.forEach(handler =>
          handler({
            type: 'PAYMENT_SUCCESS',
            message: `Thanh toán thành công ${payment.amount?.toLocaleString()} VNĐ`,
            relatedEntityId: payment.invoiceId,
          })
        );
      });

      this.connection.on('PaymentFailed', (payment) => {
        console.log('❌ Payment failed:', payment);
        this.paymentHandlers.forEach(handler => handler({
          type: 'FAILED',
          ...payment
        }));
        // Also trigger notification
        this.notificationHandlers.forEach(handler =>
          handler({
            type: 'PAYMENT_FAILED',
            message: `Thanh toán thất bại`,
            relatedEntityId: payment.invoiceId,
          })
        );
      });

      this.connection.onreconnecting((error) => {
        console.warn('🔄 SignalR reconnecting...', error);
      });

      this.connection.onreconnected((connectionId) => {
        console.log('✅ SignalR reconnected:', connectionId);
      });

      this.connection.onclose((error) => {
        if (error) {
          console.warn('SignalR connection closed:', error);
        } else {
          console.log('SignalR connection closed');
        }
      });

      // Start connection
      await this.connection.start();
      console.log('✅ SignalR connected successfully');
    } catch (error) {
      console.warn('SignalR connection failed:', error);
      this.connection = null;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from SignalR
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('🔌 SignalR disconnected');
      } catch (error) {
        console.error('Error disconnecting SignalR:', error);
      }
      this.connection = null;
    }
  }

  /**
   * Subscribe to notifications
   */
  onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.notificationHandlers.indexOf(handler);
      if (index > -1) {
        this.notificationHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to maintenance request updates
   */
  onMaintenanceUpdate(handler: MaintenanceUpdateHandler): () => void {
    this.maintenanceHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.maintenanceHandlers.indexOf(handler);
      if (index > -1) {
        this.maintenanceHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to payment updates
   */
  onPaymentUpdate(handler: PaymentUpdateHandler): () => void {
    this.paymentHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.paymentHandlers.indexOf(handler);
      if (index > -1) {
        this.paymentHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to invoice updates (approval notifications)
   */
  onInvoiceUpdate(handler: InvoiceUpdateHandler): () => void {
    this.invoiceHandlers.push(handler);
    return () => {
      const index = this.invoiceHandlers.indexOf(handler);
      if (index > -1) {
        this.invoiceHandlers.splice(index, 1);
      }
    };
  }

  onSessionRevoked(handler: SessionRevokedHandler): () => void {
    this.sessionRevokedHandlers.push(handler);
    return () => {
      const index = this.sessionRevokedHandlers.indexOf(handler);
      if (index > -1) {
        this.sessionRevokedHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Send notification to user
   */
  async sendNotification(userId: number, message: string): Promise<void> {
    if (this.connection?.state === SignalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('SendNotification', userId, message);
        console.log('📤 Notification sent to user:', userId);
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.connection?.state === SignalR.HubConnectionState.Connected;
  }

  /**
   * Get connection state
   */
  getState(): SignalR.HubConnectionState | null {
    return this.connection?.state || null;
  }
}

export default new SignalRService();
