import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { maintenanceService, notificationService } from '../services/feature.service';
import { invoiceService, paymentService } from '../services/api.service';
import { notificationHub, initializeSignalR, disconnectSignalR } from '../lib/signalr-service';

// Types
export interface Incident {
  id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  imageUrl?: string;
  status: 'pending' | 'in-progress' | 'review' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  reportedBy: string;
  reportedAt: string;
  apartment: string;
  assignedTo?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  completionImageUrl?: string;
}

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'payment' | 'incident' | 'success';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  relatedId?: string;
  target: 'resident' | 'admin';
}

export interface Bill {
  id: string;
  apartment: string;
  period: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  items: {
    name: string;
    quantity?: number;
    unit?: string;
    price: number;
    total: number;
  }[];
}

export interface Invoice {
  id: string;
  code: string;
  room: string;
  tenant: string;
  period: string;
  amount: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  createdAt: string;
  dueDate?: string;
  items?: {
    name: string;
    quantity?: number;
    unit?: string;
    price: number;
    total: number;
  }[];
}

export interface Activity {
  id: string;
  title: string;
  time: string;
  status: 'success' | 'pending' | 'warning';
  type: 'incident' | 'payment' | 'notification';
}

interface DataContextType {
  incidents: Incident[];
  notifications: Notification[];
  bills: Bill[];
  invoices: Invoice[];
  activities: Activity[];
  loading: boolean;
  error: string | null;
  addIncident: (incident: Omit<Incident, 'id' | 'reportedAt' | 'status'>) => Promise<void>;
  updateIncidentStatus: (id: string, status: Incident['status'], resolutionNote?: string, completionImageUrl?: string) => Promise<void>;
  confirmIncidentCompletion: (id: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'time' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  updateBillStatus: (id: string, status: Bill['status']) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'code' | 'createdAt'>) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  getUnreadNotificationCount: () => number;
  getUnreadNotificationCountByTarget: (target: 'resident' | 'admin') => number;
  getNotificationsByTarget: (target: 'resident' | 'admin') => Notification[];
  getPendingIncidentCount: () => number;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to convert backend maintenance to frontend incident
function mapMaintenanceToIncident(maintenance: any): Incident {
  return {
    id: maintenance.id?.toString() || '',
    title: maintenance.issueType || 'Không có tiêu đề',
    category: maintenance.issueType || 'other',
    location: maintenance.roomNumber || `Room ${maintenance.roomId}`,
    description: maintenance.description || '',
    imageUrl: maintenance.mediaUrl,
    status: mapMaintenanceStatus(maintenance.status),
    priority: 'medium', // Backend doesn't have priority field
    reportedBy: maintenance.userName || `User ${maintenance.userId}`,
    reportedAt: maintenance.createdAt || new Date().toISOString(),
    apartment: maintenance.roomId?.toString() || '',
    assignedTo: undefined, // Backend doesn't have assigned field yet
    resolvedAt: maintenance.closedAt,
    resolutionNote: maintenance.adminNote,
    completionImageUrl: maintenance.completionImageUrl,
  };
}

function mapMaintenanceStatus(status: string | undefined): Incident['status'] {
  const normalized = status?.toLowerCase().replace(/\s+/g, '') || '';
  switch (normalized) {
    case 'chờxửlý':
    case 'choxuly':
      return 'pending';
    case 'đangxửlý':
    case 'dangxuly':
      return 'in-progress';
    case 'hoànthành':
    case 'hoanthanh':
      return 'resolved';
    case 'từchối':
    case 'tuchoi':
      return 'pending'; // Map rejected to pending for now
    default:
      return 'pending';
  }
}

function mapBackendStatus(status: Incident['status']): string {
  switch (status) {
    case 'pending':
      return 'Chờ xử lý';
    case 'in-progress':
      return 'Đang xử lý';
    case 'review':
      return 'Đang xử lý'; // No review status in backend
    case 'resolved':
      return 'Hoàn thành';
    default:
      return 'Chờ xử lý';
  }
}

// Helper to map backend notifications
function mapBackendNotification(notif: any): Notification {
  return {
    id: notif.id?.toString() || '',
    type: notif.type || 'info',
    title: notif.tieuDe || notif.title || '',
    message: notif.noiDung || notif.message || '',
    time: formatTime(notif.ngayTao || notif.createdAt),
    isRead: notif.daDoc || notif.isRead || false,
    relatedId: notif.relatedId?.toString(),
    target: notif.target || 'resident',
  };
}

// Helper to format time
function formatTime(dateString: string): string {
  if (!dateString) return 'Vừa xong';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Vừa xong';
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  if (diffInDays < 7) return `${diffInDays} ngày trước`;
  
  return date.toLocaleDateString('vi-VN');
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch maintenance requests (incidents)
      try {
        const maintenanceData = await maintenanceService.getAll();
        const mappedIncidents = maintenanceData.map(mapMaintenanceToIncident);
        setIncidents(mappedIncidents);
      } catch (err) {
        console.error('Error fetching maintenance:', err);
      }

      // Fetch notifications
      try {
        const notifData = await notificationService.getMy();
        const mappedNotifications = notifData.map(mapBackendNotification);
        setNotifications(mappedNotifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }

      // Fetch invoices
      try {
        const invoiceData = await invoiceService.getAll();
        const mappedInvoices = invoiceData.map((inv: any) => ({
          id: inv.id?.toString() || '',
          code: inv.maHoaDon || '',
          room: inv.phongId?.toString() || '',
          tenant: inv.chuHoId?.toString() || '',
          period: inv.thang || '',
          amount: inv.tongTien?.toString() || '0',
          status: inv.trangThai?.toLowerCase() || 'draft',
          createdAt: inv.ngayTao || new Date().toISOString(),
          dueDate: inv.hanThanhToan,
          items: inv.chiTiet || [],
        }));
        setInvoices(mappedInvoices);
      } catch (err) {
        console.error('Error fetching invoices:', err);
      }

      // Generate activities from recent data
      const newActivities: Activity[] = [];
      
      // Add recent incidents as activities
      incidents.slice(0, 5).forEach(inc => {
        newActivities.push({
          id: `act-inc-${inc.id}`,
          title: `Sự cố: ${inc.title}`,
          time: formatTime(inc.reportedAt),
          status: inc.status === 'resolved' ? 'success' : 'pending',
          type: 'incident',
        });
      });

      // Add recent invoices as activities
      invoices.slice(0, 5).forEach(inv => {
        newActivities.push({
          id: `act-inv-${inv.id}`,
          title: `Hóa đơn ${inv.period}: ${inv.amount}`,
          time: formatTime(inv.createdAt),
          status: inv.status === 'paid' ? 'success' : 'pending',
          type: 'payment',
        });
      });

      setActivities(newActivities);

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Initialize data and SignalR on mount
  useEffect(() => {
    fetchData();

    // Initialize SignalR for real-time updates
    initializeSignalR().then(() => {
      // Listen for new notifications
      notificationHub.on('ReceiveNotification', (notification: any) => {
        const mappedNotif = mapBackendNotification(notification);
        setNotifications(prev => [mappedNotif, ...prev]);
        
        // Add activity
        setActivities(prev => [{
          id: `act-notif-${mappedNotif.id}`,
          title: mappedNotif.title,
          time: 'Vừa xong',
          status: 'warning',
          type: 'notification',
        }, ...prev.slice(0, 19)]); // Keep max 20 activities
      });

      // Listen for NEW maintenance requests
      notificationHub.on('NewMaintenanceRequest', (request: any) => {
        console.log('🆕 New maintenance request received:', request);
        const mappedIncident = mapMaintenanceToIncident(request);
        setIncidents(prev => [mappedIncident, ...prev]);
        
        // Show notification
        setNotifications(prev => [{
          id: `notif-maint-${request.id}`,
          title: 'Sự cố mới',
          message: `${request.issueType} - Phòng ${request.roomCode}`,
          time: new Date().toISOString(),
          type: 'warning',
          isRead: false,
          relatedId: request.id?.toString(),
          target: 'admin',
        }, ...prev]);
        
        // Add activity
        setActivities(prev => [{
          id: `act-maint-new-${request.id}`,
          title: `Sự cố mới: ${request.issueType}`,
          time: 'Vừa xong',
          status: 'warning',
          type: 'incident',
        }, ...prev.slice(0, 19)]);
      });

      // Listen for maintenance updates
      notificationHub.on('MaintenanceRequestUpdated', (maintenance: any) => {
        console.log('🔧 Maintenance request updated:', maintenance);
        const mappedIncident = mapMaintenanceToIncident(maintenance);
        setIncidents(prev => {
          const index = prev.findIndex(i => i.id === mappedIncident.id);
          if (index >= 0) {
            const newIncidents = [...prev];
            newIncidents[index] = mappedIncident;
            return newIncidents;
          }
          return [mappedIncident, ...prev];
        });
      });

      // Listen for maintenance closure
      notificationHub.on('MaintenanceRequestClosed', (request: any) => {
        console.log('✅ Maintenance request closed:', request);
        const mappedIncident = mapMaintenanceToIncident(request);
        setIncidents(prev => {
          const index = prev.findIndex(i => i.id === mappedIncident.id);
          if (index >= 0) {
            const newIncidents = [...prev];
            newIncidents[index] = mappedIncident;
            return newIncidents;
          }
          return prev;
        });
      });

      // Listen for invoice updates
      notificationHub.on('InvoiceUpdated', (invoice: any) => {
        setInvoices(prev => {
          const index = prev.findIndex(i => i.id === invoice.id?.toString());
          if (index >= 0) {
            const newInvoices = [...prev];
            newInvoices[index] = {
              ...newInvoices[index],
              status: invoice.trangThai?.toLowerCase() || newInvoices[index].status,
            };
            return newInvoices;
          }
          return prev;
        });
      });

      // Listen for payment success/failure — update matching invoice status
      const handlePaymentEvent = (event: string) => (data: any) => {
        const invoiceId = data?.invoiceId ?? data?.HoaDonId;
        if (!invoiceId) return;
        setInvoices(prev => {
          const index = prev.findIndex(i => i.id === String(invoiceId));
          if (index < 0) return prev;
          const newInvoices = [...prev];
          newInvoices[index] = {
            ...newInvoices[index],
            status: event === 'PaymentSuccess' ? 'paid' : newInvoices[index].status,
          };
          return newInvoices;
        });
        setBills(prev => {
          const index = prev.findIndex(b => b.id === String(invoiceId));
          if (index < 0) return prev;
          const newBills = [...prev];
          newBills[index] = {
            ...newBills[index],
            status: event === 'PaymentSuccess' ? 'paid' : newBills[index].status,
          };
          return newBills;
        });
      };
      notificationHub.on('PaymentSuccess', handlePaymentEvent('PaymentSuccess'));
      notificationHub.on('PaymentFailed', handlePaymentEvent('PaymentFailed'));
    });

    // Cleanup on unmount
    return () => {
      disconnectSignalR();
    };
  }, []);

  // CRUD operations
  const addIncident = async (incident: Omit<Incident, 'id' | 'reportedAt' | 'status'>) => {
    try {
      const result = await maintenanceService.create({
        roomId: parseInt(incident.apartment) || 0,
        issueType: incident.category,
        description: `${incident.title} - ${incident.location}${incident.description ? ': ' + incident.description : ''}`,
        mediaUrl: incident.imageUrl,
      });

      const newIncident = mapMaintenanceToIncident(result);
      setIncidents(prev => [newIncident, ...prev]);

      // Add activity
      setActivities(prev => [{
        id: `act-new-${newIncident.id}`,
        title: `Báo cáo sự cố: ${newIncident.title}`,
        time: 'Vừa xong',
        status: 'pending',
        type: 'incident',
      }, ...prev]);
    } catch (err: any) {
      console.error('Error adding incident:', err);
      throw new Error(err.message || 'Không thể tạo yêu cầu');
    }
  };

  const updateIncidentStatus = async (id: string, status: Incident['status'], resolutionNote?: string, completionImageUrl?: string) => {
    try {
      const backendStatus = mapBackendStatus(status);
      if (status === 'resolved') {
        await maintenanceService.close(parseInt(id), 'Hoàn thành', resolutionNote, completionImageUrl);
      } else {
        await maintenanceService.update(parseInt(id), backendStatus, resolutionNote, completionImageUrl);
      }

      setIncidents(prev =>
        prev.map(incident =>
          incident.id === id
            ? {
                ...incident,
                status,
                resolvedAt: status === 'resolved' ? new Date().toISOString() : incident.resolvedAt,
                resolutionNote: resolutionNote || incident.resolutionNote,
              }
            : incident
        )
      );
    } catch (err: any) {
      console.error('Error updating incident status:', err);
      throw new Error(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  const confirmIncidentCompletion = async (id: string) => {
    await updateIncidentStatus(id, 'resolved');
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'time' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `local-${Date.now()}`,
      time: 'Vừa xong',
      isRead: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      if (!id.startsWith('local-')) {
        await notificationService.markAsRead(parseInt(id));
      }
      setNotifications(prev =>
        prev.map(notif => (notif.id === id ? { ...notif, isRead: true } : notif))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      // Mark all server notifications as read
      const serverNotifs = notifications.filter(n => !n.id.startsWith('local-'));
      await Promise.all(
        serverNotifs.map(n => notificationService.markAsRead(parseInt(n.id)).catch(() => {}))
      );
      
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const updateBillStatus = (id: string, status: Bill['status']) => {
    setBills(prev =>
      prev.map(bill => (bill.id === id ? { ...bill, status } : bill))
    );

    if (status === 'paid') {
      const bill = bills.find(b => b.id === id);
      if (bill) {
        setActivities(prev => [{
          id: `act-pay-${id}`,
          title: `Đã thanh toán hóa đơn ${bill.period}`,
          time: 'Vừa xong',
          status: 'success',
          type: 'payment',
        }, ...prev]);
      }
    }
  };

  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'code' | 'createdAt'>) => {
    try {
      // Note: Backend doesn't have direct create endpoint
      // Use generate endpoint instead or implement on backend
      throw new Error('Invoice creation not yet implemented. Use generate method.');
      
      /* Future implementation when backend adds create endpoint:
      const result = await invoiceService.create({
        roomId: parseInt(invoice.room),
        month: invoice.period,
        totalAmount: parseFloat(invoice.amount),
        status: invoice.status || 'draft',
      });

      const newInvoice: Invoice = {
        id: result.id?.toString() || '',
        code: result.maHoaDon || '',
        room: invoice.room,
        tenant: invoice.tenant,
        period: invoice.period,
        amount: invoice.amount,
        status: invoice.status || 'draft',
        createdAt: new Date().toISOString(),
      };

      setInvoices(prev => [newInvoice, ...prev]);
      */
    } catch (err: any) {
      console.error('Error adding invoice:', err);
      throw new Error(err.message || 'Không thể tạo hóa đơn');
    }
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    try {
      // Note: Backend doesn't have direct update endpoint
      // Use finalize for finalizing invoices (changes from draft to pending)
      if (status === 'pending') {
        await invoiceService.finalize(parseInt(id));
      } else {
        throw new Error('Invoice status update not yet implemented on backend.');
      }

      setInvoices(prev =>
        prev.map(invoice =>
          invoice.id === id ? { ...invoice, status } : invoice
        )
      );
    } catch (err: any) {
      console.error('Error updating invoice status:', err);
      throw new Error(err.message || 'Không thể cập nhật hóa đơn');
    }
  };

  const getUnreadNotificationCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

  const getUnreadNotificationCountByTarget = (target: 'resident' | 'admin') => {
    return notifications.filter(n => !n.isRead && n.target === target).length;
  };

  const getNotificationsByTarget = (target: 'resident' | 'admin') => {
    return notifications.filter(n => n.target === target);
  };

  const getPendingIncidentCount = () => {
    return incidents.filter(i => i.status === 'pending').length;
  };

  const refreshData = async () => {
    await fetchData();
  };

  const value: DataContextType = {
    incidents,
    notifications,
    bills,
    invoices,
    activities,
    loading,
    error,
    addIncident,
    updateIncidentStatus,
    confirmIncidentCompletion,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    updateBillStatus,
    addInvoice,
    updateInvoiceStatus,
    getUnreadNotificationCount,
    getUnreadNotificationCountByTarget,
    getNotificationsByTarget,
    getPendingIncidentCount,
    refreshData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export default useData;
