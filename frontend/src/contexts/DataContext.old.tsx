import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
}

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'payment' | 'incident' | 'success';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  relatedId?: string;
  target: 'resident' | 'admin'; // Thông báo cho ai?
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
  addIncident: (incident: Omit<Incident, 'id' | 'reportedAt' | 'status'>) => void;
  updateIncidentStatus: (id: string, status: Incident['status'], resolutionNote?: string) => void;
  confirmIncidentCompletion: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'time' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  updateBillStatus: (id: string, status: Bill['status']) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'code' | 'createdAt'>) => void;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  getUnreadNotificationCount: () => number;
  getUnreadNotificationCountByTarget: (target: 'resident' | 'admin') => number;
  getNotificationsByTarget: (target: 'resident' | 'admin') => Notification[];
  getPendingIncidentCount: () => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial mock data
const initialIncidents: Incident[] = [
  {
    id: 'INC001',
    title: 'Đèn hành lang tầng 12 hỏng',
    category: 'electrical',
    location: 'Hành lang tầng 12, Tòa A',
    description: 'Đèn chiếu sáng hành lang tầng 12 không hoạt động từ 2 ngày nay, gây khó khăn cho cư dân di chuyển vào buổi tối.',
    status: 'in-progress',
    priority: 'high',
    reportedBy: 'Nguyễn Văn A',
    apartment: 'A-1205',
    reportedAt: '2026-02-20T14:30:00',
    assignedTo: 'Nguyễn Văn B',
  },
  {
    id: 'INC002',
    title: 'Thang máy số 2 kêu lạ',
    category: 'elevator',
    location: 'Thang máy số 2, Tòa A',
    description: 'Thang máy phát ra tiếng kêu lạ khi di chuyển, cần kiểm tra và bảo trì.',
    status: 'pending',
    priority: 'medium',
    reportedBy: 'Trần Thị C',
    apartment: 'A-0805',
    reportedAt: '2026-02-21T09:15:00',
  },
];

const initialNotifications: Notification[] = [
  {
    id: 'NOTIF001',
    type: 'warning',
    title: 'Cảnh báo bảo trì',
    message: 'Hệ thống nước sẽ tạm ngưng từ 8h-12h ngày 25/02 để bảo trì đường ống.',
    time: '2 giờ trước',
    isRead: false,
    target: 'admin',
  },
  {
    id: 'NOTIF002',
    type: 'payment',
    title: 'Hóa đơn mới',
    message: 'Hóa đơn tháng 02/2026 đã được phát hành. Vui lòng thanh toán trước ngày 30/02.',
    time: '5 giờ trước',
    isRead: false,
    target: 'resident',
  },
  {
    id: 'NOTIF003',
    type: 'incident',
    title: 'Sự cố đã xử lý',
    message: 'Sự cố "Đèn hành lang tầng 12 hỏng" đang được xử lý bởi Kỹ thuật viên Nguyễn Văn B.',
    time: '1 ngày trước',
    isRead: false,
    relatedId: 'INC001',
    target: 'resident',
  },
];

const initialBills: Bill[] = [];

const initialInvoices: Invoice[] = [
  {
    id: 'INV001',
    code: 'INV-001',
    room: 'A-1205',
    tenant: 'Nguyễn Văn A',
    period: '02/2026',
    amount: '2,450,000',
    status: 'draft',
    createdAt: '2026-02-20T14:30:00',
    dueDate: '30/02/2026',
    items: [
      { name: 'Phí quản lý', quantity: 1, unit: 'tháng', price: 800000, total: 800000 },
      { name: 'Phí điện', quantity: 150, unit: 'kWh', price: 2500, total: 375000 },
      { name: 'Phí nước', quantity: 12, unit: 'm³', price: 15000, total: 180000 },
      { name: 'Phí gửi xe', quantity: 2, unit: 'xe', price: 200000, total: 400000 },
      { name: 'Phí internet', quantity: 1, unit: 'tháng', price: 300000, total: 300000 },
      { name: 'Phí vệ sinh', price: 395000, total: 395000 },
    ],
  },
];

const initialActivities: Activity[] = [
  {
    id: 'ACT001',
    title: 'Đã thanh toán hóa đơn tháng 01/2026',
    time: '2 ngày trước',
    status: 'success',
    type: 'payment',
  },
  {
    id: 'ACT002',
    title: 'Báo cáo sự cố "Đèn hành lang"',
    time: '2 ngày trước',
    status: 'pending',
    type: 'incident',
  },
];

// Helper function to deduplicate IDs
function deduplicateIds<T extends { id: string }>(items: T[], prefix: string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  let counter = 1;
  
  for (const item of items) {
    if (seen.has(item.id)) {
      // Duplicate found, reassign ID
      let newId = `${prefix}${String(counter).padStart(3, '0')}`;
      while (seen.has(newId)) {
        counter++;
        newId = `${prefix}${String(counter).padStart(3, '0')}`;
      }
      result.push({ ...item, id: newId });
      seen.add(newId);
      counter++;
    } else {
      result.push(item);
      seen.add(item.id);
      // Update counter based on current ID
      const num = parseInt(item.id.replace(prefix, ''));
      if (!isNaN(num) && num >= counter) {
        counter = num + 1;
      }
    }
  }
  
  return result;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const stored = localStorage.getItem('smarthome_incidents');
    const data = stored ? JSON.parse(stored) : initialIncidents;
    return deduplicateIds(data, 'INC');
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem('smarthome_notifications');
    const data = stored ? JSON.parse(stored) : initialNotifications;
    return deduplicateIds(data, 'NOTIF');
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    const stored = localStorage.getItem('smarthome_bills');
    const data = stored ? JSON.parse(stored) : initialBills;
    return deduplicateIds(data, 'BILL');
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const stored = localStorage.getItem('smarthome_invoices');
    const data = stored ? JSON.parse(stored) : initialInvoices;
    return deduplicateIds(data, 'INV');
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const stored = localStorage.getItem('smarthome_activities');
    const data = stored ? JSON.parse(stored) : initialActivities;
    return deduplicateIds(data, 'ACT');
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('smarthome_incidents', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('smarthome_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('smarthome_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('smarthome_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('smarthome_activities', JSON.stringify(activities));
  }, [activities]);

  const addIncident = (incident: Omit<Incident, 'id' | 'reportedAt' | 'status'>) => {
    // Find max incident number
    const maxId = incidents.reduce((max, inc) => {
      const num = parseInt(inc.id.replace('INC', ''));
      return num > max ? num : max;
    }, 0);
    
    const newIncident: Incident = {
      ...incident,
      id: `INC${String(maxId + 1).padStart(3, '0')}`,
      reportedAt: new Date().toISOString(),
      status: 'pending',
    };

    setIncidents(prev => [newIncident, ...prev]);

    // Find max notification number
    const maxNotifId = notifications.reduce((max, notif) => {
      const num = parseInt(notif.id.replace('NOTIF', ''));
      return num > max ? num : max;
    }, 0);

    // Add notification for admin
    const adminNotification: Notification = {
      id: `NOTIF${String(maxNotifId + 1).padStart(3, '0')}`,
      type: 'warning',
      title: 'Sự cố mới',
      message: `Cư dân ${incident.reportedBy} (${incident.apartment}) vừa báo cáo: \"${incident.title}\"`,
      time: 'Vừa xong',
      isRead: false,
      relatedId: newIncident.id,
      target: 'admin',
    };
    setNotifications(prev => [adminNotification, ...prev]);

    // Find max activity number
    const maxActId = activities.reduce((max, act) => {
      const num = parseInt(act.id.replace('ACT', ''));
      return num > max ? num : max;
    }, 0);

    // Add activity
    const activity: Activity = {
      id: `ACT${String(maxActId + 1).padStart(3, '0')}`,
      title: `Báo cáo sự cố \"${incident.title}\"`,
      time: 'Vừa xong',
      status: 'pending',
      type: 'incident',
    };
    setActivities(prev => [activity, ...prev]);
  };

  const updateIncidentStatus = (id: string, status: Incident['status'], resolutionNote?: string) => {
    // Find the incident to get details BEFORE updating
    const incident = incidents.find(i => i.id === id);
    
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

    if (incident) {
      // Find max notification number
      const maxNotifId = notifications.reduce((max, notif) => {
        const num = parseInt(notif.id.replace('NOTIF', ''));
        return num > max ? num : max;
      }, 0);

      // Add notification for resident
      let message = '';
      let notifType: Notification['type'] = 'info';
      let notifTitle = 'Cập nhật sự cố';
      
      if (status === 'in-progress') {
        message = `Sự cố \"${incident.title}\" đang được xử lý${incident.assignedTo ? ` bởi ${incident.assignedTo}` : ''}.`;
      } else if (status === 'review') {
        notifType = 'warning';
        notifTitle = 'Yêu cầu nghiệm thu';
        message = `Sự cố \"${incident.title}\" đã được xử lý xong. Vui lòng kiểm tra và xác nhận hoàn thành hài lòng.`;
      } else if (status === 'resolved') {
        notifType = 'success';
        notifTitle = 'Sự cố đã hoàn thành';
        message = `Sự cố \"${incident.title}\" đã được giải quyết hoàn toàn. ${resolutionNote || ''}`;
      }

      const residentNotification: Notification = {
        id: `NOTIF${String(maxNotifId + 1).padStart(3, '0')}`,
        type: notifType,
        title: notifTitle,
        message,
        time: 'Vừa xong',
        isRead: false,
        relatedId: id,
        target: 'resident',
      };
      setNotifications(prev => [residentNotification, ...prev]);

      // Find max activity number
      const maxActId = activities.reduce((max, act) => {
        const num = parseInt(act.id.replace('ACT', ''));
        return num > max ? num : max;
      }, 0);

      // Update activity
      const activity: Activity = {
        id: `ACT${String(maxActId + 1).padStart(3, '0')}`,
        title: `Sự cố \"${incident.title}\" - ${status === 'resolved' ? 'Đã giải quyết' : status === 'review' ? 'Chờ nghiệm thu' : status === 'in-progress' ? 'Đang xử lý' : 'Chờ xử lý'}`,
        time: 'Vừa xong',
        status: status === 'resolved' ? 'success' : status === 'in-progress' ? 'pending' : 'warning',
        type: 'incident',
      };
      setActivities(prev => [activity, ...prev]);
    }
  };

  const confirmIncidentCompletion = (id: string) => {
    // Find the incident to get details BEFORE updating
    const incident = incidents.find(i => i.id === id);
    
    setIncidents(prev =>
      prev.map(incident =>
        incident.id === id
          ? {
              ...incident,
              status: 'resolved',
              resolvedAt: new Date().toISOString(),
            }
          : incident
      )
    );

    if (incident) {
      // Find max notification number
      const maxNotifId = notifications.reduce((max, notif) => {
        const num = parseInt(notif.id.replace('NOTIF', ''));
        return num > max ? num : max;
      }, 0);

      // Add notification for admin
      const adminNotification: Notification = {
        id: `NOTIF${String(maxNotifId + 1).padStart(3, '0')}`,
        type: 'success',
        title: 'Cư dân xác nhận hoàn thành',
        message: `Cư dân đã xác nhận hài lòng với việc xử lý sự cố \"${incident.title}\".`,
        time: 'Vừa xong',
        isRead: false,
        relatedId: id,
        target: 'admin',
      };
      setNotifications(prev => [adminNotification, ...prev]);

      // Find max activity number
      const maxActId = activities.reduce((max, act) => {
        const num = parseInt(act.id.replace('ACT', ''));
        return num > max ? num : max;
      }, 0);

      // Update activity
      const activity: Activity = {
        id: `ACT${String(maxActId + 1).padStart(3, '0')}`,
        title: `Sự cố \"${incident.title}\" - Đã hoàn thành`,
        time: 'Vừa xong',
        status: 'success',
        type: 'incident',
      };
      setActivities(prev => [activity, ...prev]);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'time' | 'isRead'>) => {
    // Find max notification number
    const maxNotifId = notifications.reduce((max, notif) => {
      const num = parseInt(notif.id.replace('NOTIF', ''));
      return num > max ? num : max;
    }, 0);

    const newNotification: Notification = {
      ...notification,
      id: `NOTIF${String(maxNotifId + 1).padStart(3, '0')}`,
      time: 'Vừa xong',
      isRead: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, isRead: true } : notif))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  };

  const updateBillStatus = (id: string, status: Bill['status']) => {
    // Find the bill to get details BEFORE updating
    const bill = bills.find(b => b.id === id);
    
    setBills(prev =>
      prev.map(bill => (bill.id === id ? { ...bill, status } : bill))
    );

    // Add notification and activity when bill is paid
    if (status === 'paid' && bill) {
      // Find max notification number
      const maxNotifId = notifications.reduce((max, notif) => {
        const num = parseInt(notif.id.replace('NOTIF', ''));
        return num > max ? num : max;
      }, 0);

      const notification: Notification = {
        id: `NOTIF${String(maxNotifId + 1).padStart(3, '0')}`,
        type: 'success',
        title: 'Thanh toán thành công',
        message: `Hóa đơn tháng ${bill.period} (${bill.amount.toLocaleString('vi-VN')}đ) đã được thanh toán.`,
        time: 'Vừa xong',
        isRead: false,
        target: 'resident',
      };
      setNotifications(prev => [notification, ...prev]);

      // Find max activity number
      const maxActId = activities.reduce((max, act) => {
        const num = parseInt(act.id.replace('ACT', ''));
        return num > max ? num : max;
      }, 0);

      const activity: Activity = {
        id: `ACT${String(maxActId + 1).padStart(3, '0')}`,
        title: `Đã thanh toán hóa đơn tháng ${bill.period}`,
        time: 'Vừa xong',
        status: 'success',
        type: 'payment',
      };
      setActivities(prev => [activity, ...prev]);
    }
  };

  const addInvoice = (invoice: Omit<Invoice, 'id' | 'code' | 'createdAt'>) => {
    // Find max invoice number
    const maxInvId = invoices.reduce((max, inv) => {
      const num = parseInt(inv.id.replace('INV', ''));
      return num > max ? num : max;
    }, 0);

    const newInvoice: Invoice = {
      ...invoice,
      id: `INV${String(maxInvId + 1).padStart(3, '0')}`,
      code: `INV-${String(maxInvId + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // Find max notification number
    const maxNotifId = notifications.reduce((max, notif) => {
      const num = parseInt(notif.id.replace('NOTIF', ''));
      return num > max ? num : max;
    }, 0);

    // Add notification for admin
    const adminNotification: Notification = {
      id: `NOTIF${String(maxNotifId + 1).padStart(3, '0')}`,
      type: 'warning',
      title: 'Hóa đơn mới',
      message: `Hóa đơn mới cho căn hộ ${invoice.room} (${invoice.tenant}) đã được tạo.`,
      time: 'Vừa xong',
      isRead: false,
      relatedId: newInvoice.id,
      target: 'admin',
    };
    setNotifications(prev => [adminNotification, ...prev]);

    // Find max activity number
    const maxActId = activities.reduce((max, act) => {
      const num = parseInt(act.id.replace('ACT', ''));
      return num > max ? num : max;
    }, 0);

    // Add activity
    const activity: Activity = {
      id: `ACT${String(maxActId + 1).padStart(3, '0')}`,
      title: `Tạo hóa đơn mới cho căn hộ ${invoice.room}`,
      time: 'Vừa xong',
      status: 'pending',
      type: 'payment',
    };
    setActivities(prev => [activity, ...prev]);
  };

  const updateInvoiceStatus = (id: string, status: Invoice['status']) => {
    // Find the invoice to get details BEFORE updating
    const invoice = invoices.find(i => i.id === id);
    
    setInvoices(prev =>
      prev.map(invoice =>
        invoice.id === id
          ? {
              ...invoice,
              status,
            }
          : invoice
      )
    );

    if (invoice) {
      // When invoice is approved (pending), sync to bills for resident app
      if (status === 'pending' && invoice.items) {
        // Parse amount string to number (remove commas, VNĐ, etc)
        const amountNumber = parseInt(invoice.amount.replace(/[^0-9]/g, ''));
        
        // Check if bill already exists for this apartment and period
        const existingBillIndex = bills.findIndex(
          b => b.apartment === invoice.room && b.period === invoice.period
        );

        if (existingBillIndex >= 0) {
          // Update existing bill
          setBills(prev =>
            prev.map((bill, idx) =>
              idx === existingBillIndex
                ? {
                    ...bill,
                    amount: amountNumber,
                    status: 'pending' as Bill['status'],
                    items: invoice.items || bill.items,
                  }
                : bill
            )
          );
        } else {
          // Find max bill number
          const maxBillId = bills.reduce((max, b) => {
            const num = parseInt(b.id.replace('BILL', ''));
            return num > max ? num : max;
          }, 0);

          // Create new bill for resident
          const newBill: Bill = {
            id: `BILL${String(maxBillId + 1).padStart(3, '0')}`,
            apartment: invoice.room,
            period: invoice.period,
            amount: amountNumber,
            dueDate: invoice.dueDate || '30/02/2026',
            status: 'pending',
            items: invoice.items,
          };
          setBills(prev => [newBill, ...prev]);
        }
      }
      
      // Find max notification number
      const maxNotifId = notifications.reduce((max, notif) => {
        const num = parseInt(notif.id.replace('NOTIF', ''));
        return num > max ? num : max;
      }, 0);

      // Add notification for resident
      let message = '';
      let notifType: Notification['type'] = 'info';
      let notifTitle = 'Cập nhật hóa đơn';
      
      if (status === 'pending') {
        message = `Hóa đơn tháng ${invoice.period} (${invoice.amount}) đang chờ thanh toán.`;
      } else if (status === 'paid') {
        notifType = 'success';
        notifTitle = 'Hóa đơn đã thanh toán';
        message = `Hóa đơn tháng ${invoice.period} (${invoice.amount}) đã được thanh toán.`;
      } else if (status === 'overdue') {
        notifType = 'warning';
        notifTitle = 'Hóa đơn quá hạn';
        message = `Hóa đơn tháng ${invoice.period} (${invoice.amount}) đã quá hạn.`;
      }

      const residentNotification: Notification = {
        id: `NOTIF${String(maxNotifId + 1).padStart(3, '0')}`,
        type: notifType,
        title: notifTitle,
        message,
        time: 'Vừa xong',
        isRead: false,
        relatedId: id,
        target: 'resident',
      };
      setNotifications(prev => [residentNotification, ...prev]);

      // Find max activity number
      const maxActId = activities.reduce((max, act) => {
        const num = parseInt(act.id.replace('ACT', ''));
        return num > max ? num : max;
      }, 0);

      // Update activity
      const activity: Activity = {
        id: `ACT${String(maxActId + 1).padStart(3, '0')}`,
        title: `Hóa đơn tháng ${invoice.period} - ${status === 'paid' ? 'Đã thanh toán' : status === 'overdue' ? 'Quá hạn' : 'Chờ thanh toán'}`,
        time: 'Vừa xong',
        status: status === 'paid' ? 'success' : status === 'overdue' ? 'warning' : 'pending',
        type: 'payment',
      };
      setActivities(prev => [activity, ...prev]);
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

  const value: DataContextType = {
    incidents,
    notifications,
    bills,
    invoices,
    activities,
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

// Export default for compatibility
export default useData;