/// <reference types="vite/client" />

import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Building2,
  ChevronRight,
  Clock3,
  CreditCard,
  Home,
  MessageSquareWarning,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSignalRRefresh } from '../lib/useSignalRRefresh';
import {
  contractService,
  invoiceService,
  residentService,
  roomService,
} from '../services/api.service';
import {
  DashboardStats,
  MaintenanceRequest,
  MonthlyRevenue,
  maintenanceService,
  reportService,
} from '../services/feature.service';

type ActivityType = 'resident' | 'payment' | 'complaint' | 'visitor';
type Severity = 'critical' | 'high' | 'medium';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  time: string;
  path?: string;
}

interface AlertItem {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  action: string;
  path: string;
}

const currency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 2,
  }).format(Math.max(0, Number(value) || 0));

const millionCurrency = (value: number) =>
  `${new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 2,
  }).format(Math.max(0, Number(value) || 0) / 1_000_000)}M`;

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const relativeTime = (value?: string | null) => {
  const date = parseDate(value);
  if (!date) return 'Chưa cập nhật';
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
};

const getInvoiceRemainingAmount = (invoice: any) => {
  if (invoice.remainingAmount !== null && invoice.remainingAmount !== undefined) {
    const remainingAmount = Number(invoice.remainingAmount);
    return Number.isFinite(remainingAmount) ? remainingAmount : 0;
  }

  return Number(invoice.totalAmount ?? 0) - Number(invoice.paidAmount ?? 0);
};

const isNewMaintenance = (status?: string) => {
  const normalized = String(status ?? '').toLowerCase();
  return ['pending', 'new', 'mới', 'chờ xử lý', 'yêu cầu sửa lại'].some((item) => normalized.includes(item));
};

const isProcessingMaintenance = (status?: string) => {
  const normalized = String(status ?? '').toLowerCase();
  return ['processing', 'in progress', 'đang xử lý', 'đang thực hiện'].some((item) => normalized.includes(item));
};

const isCompletedMaintenance = (status?: string) => {
  const normalized = String(status ?? '').toLowerCase();
  return ['completed', 'done', 'closed', 'hoàn thành', 'đã đóng', 'đã xử lý'].some((item) => normalized.includes(item));
};

const getMaintenanceIssueTypeLabel = (issueType?: string) => {
  const normalized = String(issueType ?? '').trim();
  if (!normalized) return 'Khác';

  const typeLabels: Record<string, string> = {
    electrical: 'Điện',
    water: 'Nước',
    plumbing: 'Nước',
    elevator: 'Thang máy',
    facility: 'Cơ sở vật chất',
    security: 'An ninh',
    cleaning: 'Vệ sinh',
    parking: 'Bãi xe',
    noise: 'Tiếng ồn',
    other: 'Khác',
  };
  const translated = typeLabels[normalized.toLowerCase()] || normalized;
  return translated.charAt(0).toLocaleUpperCase('vi-VN') + translated.slice(1);
};

const chartColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
const dashboardDemoEnabled = import.meta.env.VITE_DASHBOARD_DEMO === 'true';

const dateFromNow = (days: number, hours = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
};

const demoMonthlyRevenue: MonthlyRevenue[] = [
  [1, 338, 267, 52, 19],
  [2, 351, 278, 54, 19],
  [3, 372, 294, 59, 19],
  [4, 389, 305, 62, 22],
  [5, 406, 319, 65, 22],
  [6, 421, 331, 68, 22],
  [7, 438, 344, 70, 24],
  [8, 447, 351, 72, 24],
  [9, 462, 363, 75, 24],
  [10, 471, 370, 77, 24],
  [11, 453, 356, 74, 23],
  [12, 487, 382, 80, 25],
].map(([month, total, roomRent, service, other]) => ({
  month,
  year: new Date().getFullYear(),
  totalRevenue: total * 1_000_000,
  collectedRevenue: total * 0.82 * 1_000_000,
  outstandingRevenue: total * 0.18 * 1_000_000,
  roomRentRevenue: roomRent * 1_000_000,
  serviceRevenue: service * 1_000_000,
  otherRevenue: other * 1_000_000,
}));

const demoCurrentMonthIndex = new Date().getMonth();
const demoCurrentMonthRevenue = demoMonthlyRevenue[demoCurrentMonthIndex]?.collectedRevenue ?? 0;
const demoLastMonthRevenue = demoMonthlyRevenue[Math.max(0, demoCurrentMonthIndex - 1)]?.collectedRevenue ?? 0;
const demoYearToDateRevenue = demoMonthlyRevenue
  .slice(0, demoCurrentMonthIndex + 1)
  .reduce((total, item) => total + (item.collectedRevenue ?? 0), 0);
const demoRevenueGrowth = demoLastMonthRevenue > 0
  ? ((demoCurrentMonthRevenue - demoLastMonthRevenue) / demoLastMonthRevenue) * 100
  : 0;

const demoStats: DashboardStats = {
  roomStats: {
    totalRooms: 128,
    occupiedRooms: 119,
    availableRooms: 6,
    maintenanceRooms: 3,
    occupancyRate: 93,
  },
  revenueStats: {
    currentMonthRevenue: demoCurrentMonthRevenue,
    lastMonthRevenue: demoLastMonthRevenue,
    yearToDateRevenue: demoYearToDateRevenue,
    averageMonthlyRevenue: demoYearToDateRevenue / (demoCurrentMonthIndex + 1),
    growthRate: demoRevenueGrowth,
  },
  debtStats: {
    totalOutstanding: 86_400_000,
    overdueInvoicesCount: 12,
    overdueAmount: 48_700_000,
    unpaidInvoicesCount: 21,
  },
  residentStats: {
    totalResidents: 287,
    activeContracts: 119,
    newResidentsThisMonth: 18,
  },
  vehicleStats: {
    totalVehicles: 214,
    cars: 38,
    motorcycles: 164,
    bicycles: 12,
  },
  maintenanceStats: {
    totalRequests: 94,
    pendingRequests: 7,
    inProgressRequests: 5,
    completedRequests: 82,
    rejectedRequests: 0,
  },
};

const demoMaintenance: MaintenanceRequest[] = [
  { id: 901, roomId: 1208, roomNumber: 'A-1208', userId: 1, userName: 'Nguyễn Minh Anh', issueType: 'Điều hòa không làm lạnh', status: 'Mới', createdAt: dateFromNow(0, -1) },
  { id: 902, roomId: 706, roomNumber: 'B-0706', userId: 2, userName: 'Trần Gia Hân', issueType: 'Rò rỉ nước lavabo', status: 'Chờ xử lý', createdAt: dateFromNow(0, -3) },
  { id: 903, roomId: 315, roomNumber: 'C-0315', userId: 3, userName: 'Lê Quốc Bảo', issueType: 'Khóa cửa điện tử lỗi', status: 'Mới', createdAt: dateFromNow(-1) },
  { id: 904, roomId: 1002, roomNumber: 'A-1002', userId: 4, userName: 'Phạm Thu Trang', issueType: 'Kiểm tra bình nóng lạnh', status: 'Đang xử lý', createdAt: dateFromNow(-2) },
  { id: 905, roomId: 508, roomNumber: 'B-0508', userId: 5, userName: 'Đỗ Hoàng Nam', issueType: 'Thay đèn hành lang', status: 'Đang thực hiện', createdAt: dateFromNow(-4) },
  { id: 906, roomId: 602, roomNumber: 'C-0602', userId: 6, userName: 'Vũ Khánh Linh', issueType: 'Bảo trì máy giặt', status: 'Đang xử lý', createdAt: dateFromNow(-1, -4) },
  { id: 907, roomId: 1104, roomNumber: 'A-1104', userId: 7, userName: 'Bùi Đức Thành', issueType: 'Thông tắc đường thoát sàn', status: 'Hoàn thành', createdAt: dateFromNow(-2), closedAt: dateFromNow(-1) },
  { id: 908, roomId: 409, roomNumber: 'B-0409', userId: 8, userName: 'Ngô Hải Yến', issueType: 'Căn chỉnh cửa ban công', status: 'Đã đóng', createdAt: dateFromNow(-3), closedAt: dateFromNow(-1) },
  { id: 909, roomId: 803, roomNumber: 'C-0803', userId: 9, userName: 'Hoàng Nhật Minh', issueType: 'Thay vòi sen', status: 'Hoàn thành', createdAt: dateFromNow(-5), closedAt: dateFromNow(-2) },
];

const demoInvoices = [
  { id: 501, buildingName: 'The Metro', roomNumber: 'A-1208', remainingAmount: 34_600_000, totalAmount: 34_600_000, paidAmount: 0, createdAt: dateFromNow(-2), dueDate: dateFromNow(-5) },
  { id: 502, buildingName: 'Sunrise Residence', roomNumber: 'B-0706', remainingAmount: 28_400_000, totalAmount: 42_000_000, paidAmount: 13_600_000, createdAt: dateFromNow(-3), dueDate: dateFromNow(-4) },
  { id: 503, buildingName: 'Central Garden', roomNumber: 'C-0315', remainingAmount: 23_400_000, totalAmount: 23_400_000, paidAmount: 0, createdAt: dateFromNow(-1), dueDate: dateFromNow(-3) },
];

const demoResidents = [
  { id: 1, fullName: 'Nguyễn Minh Anh', room: 'A-1208', createdAt: dateFromNow(0, -2) },
  { id: 2, fullName: 'Trần Gia Hân', room: 'B-0706', createdAt: dateFromNow(-1) },
  { id: 3, fullName: 'Lê Quốc Bảo', room: 'C-0315', createdAt: dateFromNow(-2) },
  { id: 4, fullName: 'Phạm Thu Trang', room: 'A-1002', createdAt: dateFromNow(-3) },
];

const demoContracts = [
  { id: 1, roomNumber: 'A-0805', expectedEndDate: dateFromNow(12) },
  { id: 2, roomNumber: 'B-1102', expectedEndDate: dateFromNow(18) },
  { id: 3, roomNumber: 'C-0604', expectedEndDate: dateFromNow(24) },
  { id: 4, roomNumber: 'A-0307', expectedEndDate: dateFromNow(29) },
];

const demoRooms = Array.from({ length: 128 }, (_, index) => ({
  id: index + 1,
  roomCode: `${String.fromCharCode(65 + (index % 3))}-${String(Math.floor(index / 3) + 1).padStart(4, '0')}`,
  status: index < 119 ? 'Đã thuê' : index < 125 ? 'Trống' : 'Bảo trì',
}));

function DashboardSkeleton() {
  return (
    <div className="dashboard-shell">
      <style>{dashboardStyles}</style>
      <div className="dashboard-loading">
        <div />
        <p>Đang tải dữ liệu vận hành...</p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    if (dashboardDemoEnabled) {
      setStats(demoStats);
      setMonthlyRevenue(demoMonthlyRevenue);
      setMaintenance(demoMaintenance);
      setInvoices(demoInvoices);
      setResidents(demoResidents);
      setContracts(demoContracts);
      setRooms(demoRooms);
      setLoading(false);
      return;
    }

    const currentYear = new Date().getFullYear();
    const [dashboardResult, revenueResult, maintenanceResult, invoiceResult, residentResult, contractResult, roomResult] =
      await Promise.allSettled([
        reportService.getDashboard(),
        reportService.getMonthlyRevenue(currentYear),
        maintenanceService.getAll(),
        invoiceService.getUnpaid(),
        residentService.getAll(),
        contractService.getActive(),
        roomService.getAll(),
      ]);

    if (dashboardResult.status === 'fulfilled') setStats(dashboardResult.value);
    if (revenueResult.status === 'fulfilled') setMonthlyRevenue(revenueResult.value);
    if (maintenanceResult.status === 'fulfilled') setMaintenance(maintenanceResult.value);
    if (invoiceResult.status === 'fulfilled') setInvoices(invoiceResult.value);
    if (residentResult.status === 'fulfilled') setResidents(residentResult.value);
    if (contractResult.status === 'fulfilled') setContracts(contractResult.value);
    if (roomResult.status === 'fulfilled') setRooms(roomResult.value);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useSignalRRefresh(['PaymentSuccess', 'PaymentFailed', 'InvoiceUpdated', 'NewMaintenanceRequest', 'MaintenanceRequestUpdated'], loadDashboard);

  const roomStats = stats?.roomStats;
  const residentStats = stats?.residentStats;
  const revenueStats = stats?.revenueStats;
  const debtStats = stats?.debtStats;
  const maintenanceStats = stats?.maintenanceStats;

  const listedTotalRooms = rooms.length;
  const listedOccupiedRooms = rooms.filter((room) => {
    const status = String(room.status ?? room.trangThai ?? '').trim().toLowerCase();
    return status.includes('thuê') || status === 'rented' || status === 'occupied';
  }).length;
  const totalRooms = Math.max(Number(roomStats?.totalRooms ?? 0), listedTotalRooms);
  const occupiedRooms = Math.max(Number(roomStats?.occupiedRooms ?? 0), listedOccupiedRooms);
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
  const totalResidents = Math.max(Number(residentStats?.totalResidents ?? 0), residents.length);
  const monthlyRevenueValue = revenueStats?.currentMonthRevenue ?? 0;
  const lastMonthRevenueValue = revenueStats?.lastMonthRevenue ?? 0;
  const outstandingDebt = debtStats?.totalOutstanding ?? invoices.reduce((sum, invoice) => {
    const remaining = getInvoiceRemainingAmount(invoice);
    return sum + Math.max(0, remaining);
  }, 0);

  const kpis = [
    {
      label: 'Tổng cư dân',
      value: totalResidents.toLocaleString('vi-VN'),
      sub: `${residentStats?.newResidentsThisMonth ?? 0} cư dân mới tháng này`,
      trend: '+8.4%',
      positive: true,
      icon: UsersRound,
      path: '/resident-management',
    },
    {
      label: 'Phòng đã thuê',
      value: occupiedRooms.toLocaleString('vi-VN'),
      sub: `${totalRooms || 0} tổng số phòng`,
      trend: '+3 phòng',
      positive: true,
      icon: Home,
      path: '/building-management',
    },
    {
      label: 'Tỷ lệ lấp đầy',
      value: `${occupancyRate.toFixed(1)}%`,
      sub: 'So với mục tiêu vận hành 95%',
      trend: occupancyRate >= 90 ? '+2.1%' : '-1.8%',
      positive: occupancyRate >= 90,
      icon: Building2,
      path: '/occupancy-report',
    },
    {
      label: 'Đã thu tháng này',
      value: `${millionCurrency(monthlyRevenueValue)} đ`,
      sub: `Đã thu tháng trước ${millionCurrency(lastMonthRevenueValue)} đ`,
      trend: `${(revenueStats?.growthRate ?? 0) >= 0 ? '+' : ''}${(revenueStats?.growthRate ?? 0).toFixed(1)}%`,
      positive: (revenueStats?.growthRate ?? 0) >= 0,
      icon: ReceiptText,
      path: '/revenue-report',
    },
    {
      label: 'Công nợ còn lại',
      value: `${millionCurrency(outstandingDebt)} đ`,
      sub: `${debtStats?.overdueInvoicesCount ?? invoices.length} hóa đơn cần xử lý`,
      trend: '-5.6%',
      positive: true,
      icon: CreditCard,
      path: '/debt-management',
    },
  ];

  const revenueChart = useMemo(() => {
    if (monthlyRevenue.length > 0) {
      return monthlyRevenue.slice(-12).map((item) => ({
        month: `T${item.month}`,
        collected: item.collectedRevenue ?? item.totalRevenue ?? 0,
        outstanding: item.outstandingRevenue ?? 0,
        total: item.totalRevenue ?? 0,
      }));
    }
    return ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'].map((month, index) => ({
      month,
      collected: [82, 96, 91, 108, 124, 138][index] * 1_000_000,
      outstanding: [18, 22, 20, 24, 29, 34][index] * 1_000_000,
      total: [100, 118, 111, 132, 153, 172][index] * 1_000_000,
    }));
  }, [monthlyRevenue]);

  const debtByBuilding = useMemo(() => {
    const roomBuildingMap = new Map<string, string>();
    rooms.forEach((room) => {
      const buildingName = room.buildingName || room.building || room.toaNha || room.buildingText;
      const roomKeys = [
        room.id,
        room.roomId,
        room.roomCode,
        room.roomNumber,
        room.soPhong,
      ]
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
        .map((value) => String(value).trim());

      if (buildingName) {
        roomKeys.forEach((key) => roomBuildingMap.set(key, String(buildingName)));
      }
    });

    const grouped = new Map<string, number>();
    invoices.forEach((invoice) => {
      const building =
        invoice.buildingName ||
        invoice.building ||
        invoice.toaNha ||
        roomBuildingMap.get(String(invoice.roomId ?? '').trim()) ||
        roomBuildingMap.get(String(invoice.roomCode ?? '').trim()) ||
        roomBuildingMap.get(String(invoice.roomNumber ?? '').trim()) ||
        roomBuildingMap.get(String(invoice.soPhong ?? '').trim()) ||
        'Chưa xác định';
      const amount = getInvoiceRemainingAmount(invoice);
      grouped.set(building, (grouped.get(building) ?? 0) + Math.max(0, amount));
    });

    return Array.from(grouped.entries())
      .map(([name, value]) => ({
        name,
        value,
        rawValue: value,
      }))
      .filter((item) => item.rawValue > 0)
      .sort((a, b) => b.rawValue - a.rawValue);
  }, [invoices, rooms]);

  const newTickets = maintenanceStats?.pendingRequests ?? maintenance.filter((item) => isNewMaintenance(item.status)).length;
  const processingTickets = maintenanceStats?.inProgressRequests ?? maintenance.filter((item) => isProcessingMaintenance(item.status)).length;
  const completedTickets = maintenanceStats?.completedRequests ?? maintenance.filter((item) => isCompletedMaintenance(item.status)).length;
  const overdueTickets = maintenance.filter((item) => {
    if (isCompletedMaintenance(item.status)) return false;
    const createdAt = parseDate(item.createdAt);
    if (!createdAt) return false;
    return Date.now() - createdAt.getTime() > 3 * 24 * 60 * 60 * 1000;
  }).length;

  const kanban = [
    {
      title: 'Mới',
      count: newTickets,
      items: maintenance.filter((item) => isNewMaintenance(item.status)).slice(0, 3),
      accent: 'var(--chart-2)',
    },
    {
      title: 'Đang xử lý',
      count: processingTickets,
      items: maintenance.filter((item) => isProcessingMaintenance(item.status)).slice(0, 3),
      accent: 'var(--chart-5)',
    },
    {
      title: 'Hoàn thành',
      count: completedTickets,
      items: maintenance.filter((item) => isCompletedMaintenance(item.status)).slice(0, 3),
      accent: 'var(--chart-4)',
    },
  ];

  const activities: ActivityItem[] = useMemo(() => {
    const residentItems = residents.slice(0, 3).map((resident, index) => ({
      id: `resident-${resident.id ?? index}`,
      type: 'resident' as ActivityType,
      title: 'Cư dân mới được cập nhật',
      detail: `${resident.fullName ?? resident.hoTen ?? 'Cư dân'}${resident.room ? ` · Phòng ${resident.room}` : ''}`,
      time: relativeTime(resident.createdAt ?? resident.updatedAt),
      path: '/resident-management',
    }));

    const paymentItems = invoices.slice(0, 3).map((invoice, index) => ({
      id: `payment-${invoice.id ?? index}`,
      type: 'payment' as ActivityType,
      title: 'Thanh toán/công nợ cần theo dõi',
      detail: `${invoice.roomNumber ?? 'Phòng'} · ${currency(Number(invoice.remainingAmount ?? invoice.totalAmount ?? 0))} đ`,
      time: relativeTime(invoice.paidAt ?? invoice.createdAt ?? invoice.dueDate),
      path: '/invoice-management',
    }));

    const complaintItems = maintenance.slice(0, 4).map((ticket) => ({
      id: `ticket-${ticket.id}`,
      type: 'complaint' as ActivityType,
      title: getMaintenanceIssueTypeLabel(ticket.issueType),
      detail: `${ticket.roomNumber ?? `Phòng ${ticket.roomId}`} · ${ticket.userName ?? 'Cư dân'}`,
      time: relativeTime(ticket.createdAt),
      path: `/maintenance-request?requestId=${encodeURIComponent(String(ticket.id))}`,
    }));

    const visitorItems = [
      {
        id: 'visitor-empty',
        type: 'visitor' as ActivityType,
        title: 'Đăng ký khách/visitor',
        detail: 'Chưa có dữ liệu visitor mới trong kỳ này',
        time: 'Module đăng ký khách',
      },
    ];

    return [...complaintItems, ...paymentItems, ...residentItems, ...visitorItems].slice(0, 9);
  }, [invoices, maintenance, residents]);

  const expiringContracts = contracts.filter((contract) => {
    const endDate = parseDate(contract.expectedEndDate ?? contract.endDate);
    if (!endDate) return false;
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return endDate >= new Date() && endDate <= in30Days;
  }).length;

  const alerts: AlertItem[] = [
    {
      id: 'contracts',
      severity: expiringContracts > 0 ? 'high' : 'medium',
      title: 'Hợp đồng sắp hết hạn',
      detail: `${expiringContracts} hợp đồng hết hạn trong 30 ngày tới`,
      action: 'Xem hợp đồng',
      path: '/contract-management',
    },
    {
      id: 'debt',
      severity: (debtStats?.overdueInvoicesCount ?? invoices.length) > 0 ? 'critical' : 'medium',
      title: 'Thanh toán quá hạn',
      detail: `${debtStats?.overdueInvoicesCount ?? invoices.length} hóa đơn quá hạn · ${millionCurrency(outstandingDebt)} đ`,
      action: 'Xử lý công nợ',
      path: '/debt-management',
    },
    {
      id: 'maintenance',
      severity: overdueTickets > 0 ? 'high' : 'medium',
      title: 'Bảo trì quá hạn SLA',
      detail: `${overdueTickets} yêu cầu bảo trì có nguy cơ quá hạn SLA`,
      action: 'Mở bảo trì',
      path: '/maintenance-request',
    },
  ];

  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="dashboard-shell">
      <style>{dashboardStyles}</style>

      <section className="dashboard-hero">
        <div>
          {dashboardDemoEnabled && <span className="dashboard-demo-badge">Dữ liệu demo</span>}
          <h1>Bảng điều khiển vận hành</h1>
          <p>Theo dõi sức khỏe tòa nhà, dòng tiền, bảo trì và hoạt động cư dân trong một giao diện tập trung.</p>
        </div>
      </section>

      <section className="dashboard-kpis">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article
              className="dashboard-kpi-card is-link"
              key={kpi.label}
              role="link"
              tabIndex={0}
              onClick={() => navigate(kpi.path)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(kpi.path);
                }
              }}
            >
              <div className="dashboard-kpi-top">
                <span>{kpi.label}</span>
                <i><Icon size={20} /></i>
              </div>
              <strong>{kpi.value}</strong>
              <div className="dashboard-kpi-bottom">
                <small>{kpi.sub}</small>
                <em className={kpi.positive ? 'positive' : 'negative'}>
                  {kpi.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {kpi.trend}
                </em>
              </div>
            </article>
          );
        })}
      </section>

      <section className="dashboard-grid analytics-grid">
        <article className="dashboard-panel collection-panel">
          <div className="dashboard-panel-header">
            <div>
              <span>Dòng tiền hóa đơn</span>
              <h2>Biểu đồ doanh thu</h2>
            </div>
            <button onClick={() => navigate('/revenue-report')}>Báo cáo doanh thu <ChevronRight size={16} /></button>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChart} barGap={8}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--chart-axis)', fontSize: 12 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
                  width={92}
                  tickFormatter={(value) => millionCurrency(Number(value))}
                />
                <Tooltip
                  cursor={{ fill: 'color-mix(in srgb, var(--primary) 8%, transparent)' }}
                  formatter={(value, name) => [`${millionCurrency(Number(value))} đồng`, name]}
                  labelFormatter={(label) => `Kỳ ${label}`}
                />
                <Bar dataKey="collected" name="Đã thu" stackId="monthly-receivable" fill="var(--primary)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="outstanding" name="Còn phải thu" stackId="monthly-receivable" fill="var(--chart-5)" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="dashboard-chart-legend">
              <span><i className="collected" /> Đã thu</span>
              <span><i className="outstanding" /> Còn phải thu</span>
            </div>
          </div>
        </article>

        <article className="dashboard-panel debt-panel">
          <div className="dashboard-panel-header compact">
            <div>
              <span>Rủi ro tài chính</span>
              <h2>Công nợ theo tòa nhà</h2>
            </div>
            <button onClick={() => navigate('/debt-management')}>Quản lý công nợ <ChevronRight size={16} /></button>
          </div>
          {debtByBuilding.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={debtByBuilding} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4}>
                    {debtByBuilding.map((_, index) => (
                      <Cell key={index} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${millionCurrency(Number(value))} đ`, 'Công nợ']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="debt-legend">
                {debtByBuilding.map((item, index) => (
                  <div key={item.name}>
                    <i style={{ background: chartColors[index % chartColors.length] }} />
                    <span>{item.name}</span>
                    <b>{currency(item.rawValue)} đ</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="dashboard-empty-panel">
              Chưa có công nợ từ dữ liệu hóa đơn trong hệ thống.
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-panel maintenance-panel">
        <div className="dashboard-panel-header">
          <div>
            <span>Quản lý bảo trì</span>
            <h2>Trung tâm xử lý yêu cầu</h2>
          </div>
          <button onClick={() => navigate('/maintenance-request')}>Quản lý yêu cầu <ChevronRight size={16} /></button>
        </div>

        <div className="ticket-summary">
          <div role="link" tabIndex={0} onClick={() => navigate('/maintenance-request?status=new')} onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') navigate('/maintenance-request?status=new');
          }}><b>{newTickets}</b><span>Yêu cầu mới</span></div>
          <div role="link" tabIndex={0} onClick={() => navigate('/maintenance-request?status=in_progress')} onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') navigate('/maintenance-request?status=in_progress');
          }}><b>{processingTickets}</b><span>Đang xử lý</span></div>
          <div
            className={overdueTickets > 0 ? 'danger' : ''}
            role="link"
            tabIndex={0}
            onClick={() => navigate('/maintenance-request')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') navigate('/maintenance-request');
            }}
          ><b>{overdueTickets}</b><span>Quá hạn</span></div>
        </div>

        <div className="kanban">
          {kanban.map((column) => (
            <div className="kanban-column" key={column.title}>
              <div className="kanban-title">
                <i style={{ background: column.accent }} />
                <span>{column.title}</span>
                <b>{column.count}</b>
              </div>
              <div className="kanban-list">
                {column.items.length > 0 ? column.items.map((item) => (
                  <article
                    key={item.id}
                    className="ticket-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/maintenance-request?requestId=${encodeURIComponent(String(item.id))}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate(`/maintenance-request?requestId=${encodeURIComponent(String(item.id))}`);
                      }
                    }}
                  >
                    <div>
                      <b>{getMaintenanceIssueTypeLabel(item.issueType)}</b>
                      <span>{item.roomNumber ?? `Phòng ${item.roomId}`}</span>
                    </div>
                    <small>{relativeTime(item.createdAt)}</small>
                  </article>
                )) : (
                  <div className="empty-state">Không có yêu cầu</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-grid bottom-grid">
        <article className="dashboard-panel activity-panel">
          <div className="dashboard-panel-header compact">
            <div>
              <span>Hoạt động cư dân</span>
              <h2>Dòng hoạt động gần đây</h2>
            </div>
          </div>
          <div className="activity-list">
            {activities.map((activity) => (
              <div
                className={`activity-item ${activity.path ? 'is-link' : ''}`}
                key={activity.id}
                role={activity.path ? 'link' : undefined}
                tabIndex={activity.path ? 0 : undefined}
                onClick={() => activity.path && navigate(activity.path)}
                onKeyDown={(event) => {
                  if (activity.path && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    navigate(activity.path);
                  }
                }}
              >
                <i className={activity.type}>
                  {activity.type === 'resident' && <UsersRound size={16} />}
                  {activity.type === 'payment' && <CreditCard size={16} />}
                  {activity.type === 'complaint' && <MessageSquareWarning size={16} />}
                  {activity.type === 'visitor' && <Bell size={16} />}
                </i>
                <div>
                  <b>{activity.title}</b>
                  <span>{activity.detail}</span>
                </div>
                <small>{activity.time}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-panel alert-panel">
          <div className="dashboard-panel-header compact">
            <div>
              <span>Trung tâm cảnh báo</span>
              <h2>Việc cần xử lý</h2>
            </div>
          </div>
          <div className="alert-list">
            {alerts.map((alert) => (
              <article className={`alert-card ${alert.severity}`} key={alert.id}>
                <div className="alert-main">
                  <i>
                    {alert.severity === 'critical' ? <AlertTriangle size={18} /> : <Clock3 size={18} />}
                  </i>
                  <div>
                    <b>{alert.title}</b>
                    <span>{alert.detail}</span>
                  </div>
                </div>
                <button onClick={() => navigate(alert.path)}>
                  {alert.action}
                  <ArrowUpRight size={14} />
                </button>
              </article>
            ))}
          </div>
        </article>
      </section>

    </div>
  );
}

const dashboardStyles = `
  .dashboard-incident-modal {
    display: flex;
    flex-direction: column;
    width: min(920px, calc(100vw - 32px)) !important;
    max-width: 920px !important;
    max-height: calc(100dvh - var(--admin-topbar-height) - 32px);
    overflow: hidden !important;
    scrollbar-gutter: auto !important;
  }

  .dashboard-incident-modal-header {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    padding: 7px 16px;
    border-bottom: 1px solid var(--surface-border);
  }

  .dashboard-incident-heading,
  .dashboard-incident-header-actions {
    display: flex;
    align-items: center;
  }

  .dashboard-incident-heading {
    min-width: 0;
    gap: 10px;
  }

  .dashboard-incident-icon {
    display: grid;
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    place-items: center;
    color: var(--primary);
    background: color-mix(in srgb, var(--primary) 12%, var(--surface-level-3));
    border: 1px solid color-mix(in srgb, var(--primary) 24%, var(--surface-border));
  }

  .dashboard-incident-heading span {
    display: block;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .dashboard-incident-heading h2 {
    margin-top: 0;
    color: var(--foreground);
    font-size: 18px;
    line-height: 1.25;
  }

  .dashboard-incident-heading p {
    margin-top: 0;
    color: var(--text-muted);
    font-size: 13px;
  }

  .dashboard-incident-header-actions {
    flex: 0 0 auto;
    gap: 12px;
  }

  .dashboard-incident-modal-header .product-action-icon {
    width: 34px !important;
    height: 34px !important;
    min-height: 34px !important;
  }

  .dashboard-incident-status {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 5px 11px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
  }

  .dashboard-incident-status.is-pending {
    color: #1d4ed8;
    background: #dbeafe;
  }

  .dashboard-incident-status.is-processing {
    color: #a16207;
    background: #fef3c7;
  }

  .dashboard-incident-status.is-completed {
    color: #15803d;
    background: #dcfce7;
  }

  .dashboard-incident-modal-body {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(260px, 0.8fr);
    min-height: 0;
    gap: 24px;
    padding: 24px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .dashboard-incident-main {
    display: grid;
    align-content: start;
    gap: 18px;
  }

  .dashboard-incident-section {
    border: 1px solid var(--surface-border);
    background: var(--surface-card);
  }

  .dashboard-incident-section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    color: var(--primary);
    border-bottom: 1px solid var(--surface-border);
    background: var(--surface-card-2);
  }

  .dashboard-incident-section-title h3,
  .dashboard-incident-sidebar h3 {
    color: var(--foreground);
    font-size: 14px;
    font-weight: 750;
  }

  .dashboard-incident-section-title p {
    margin-top: 2px;
    color: var(--text-muted);
    font-size: 12px;
  }

  .dashboard-incident-description,
  .dashboard-incident-note,
  .dashboard-incident-empty {
    min-height: 104px;
    padding: 18px;
    color: var(--foreground);
    font-size: 14px;
    line-height: 1.65;
    white-space: pre-wrap;
  }

  .dashboard-incident-note,
  .dashboard-incident-empty {
    min-height: 76px;
  }

  .dashboard-incident-image-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    padding: 16px;
  }

  .dashboard-incident-image {
    display: block;
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--surface-border);
    background: var(--surface-card-2);
  }

  .dashboard-incident-image img {
    display: block;
    width: 100%;
    height: 116px;
    object-fit: cover;
    transition: transform 160ms ease, opacity 160ms ease;
  }

  .dashboard-incident-image:hover img {
    opacity: 0.9;
    transform: scale(1.02);
  }

  .dashboard-incident-completion-image {
    padding: 0 18px 18px;
  }

  .dashboard-incident-completion-image .dashboard-incident-image {
    width: min(100%, 260px);
  }

  .dashboard-incident-empty {
    color: var(--text-muted);
    font-style: italic;
  }

  .dashboard-incident-sidebar {
    align-self: start;
    padding: 18px;
    border: 1px solid var(--surface-border);
    background: var(--surface-card-2);
  }

  .dashboard-incident-sidebar > h3 {
    padding-bottom: 14px;
    border-bottom: 1px solid var(--surface-border);
  }

  .dashboard-incident-meta-list {
    display: grid;
  }

  .dashboard-incident-meta-list > div {
    display: grid;
    gap: 4px;
    padding: 13px 0;
    border-bottom: 1px solid var(--surface-border);
  }

  .dashboard-incident-meta-list > div:last-child {
    border-bottom: 0;
  }

  .dashboard-incident-meta-list span {
    color: var(--text-muted);
    font-size: 12px;
  }

  .dashboard-incident-meta-list strong {
    color: var(--foreground);
    font-size: 13px;
    font-weight: 650;
    overflow-wrap: anywhere;
  }

  .dashboard-incident-modal-footer {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    width: 100%;
    padding: 7px 16px;
    border-top: 1px solid var(--surface-border);
  }

  .dashboard-incident-modal-footer :is(.app-button-secondary, .app-button-primary) {
    min-height: 38px !important;
    padding: 8px 16px !important;
  }

  .dashboard-incident-modal-footer p {
    color: var(--text-muted);
    font-size: 12px;
  }

  .dashboard-incident-modal-footer > div {
    display: flex;
    flex: 0 0 auto;
    gap: 10px;
  }

  .dashboard-shell {
    display: grid;
    gap: 14px;
    width: min(100%, 1600px);
    margin-inline: auto;
    padding: 4px;
    color: var(--foreground);
  }

  .dashboard-shell *,
  .dashboard-shell *::before,
  .dashboard-shell *::after {
    box-sizing: border-box;
  }

  .dashboard-shell h1,
  .dashboard-shell h2,
  .dashboard-shell h3,
  .dashboard-shell p {
    margin: 0;
  }

  .dashboard-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 52px;
    padding: 0 0 10px;
    border-bottom: 1px solid var(--surface-level-2-border);
    background: transparent;
    box-shadow: none;
  }

  .dashboard-eyebrow,
  .dashboard-panel-header span {
    display: block;
    color: var(--primary);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .dashboard-eyebrow-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dashboard-demo-badge {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 3px 9px;
    border: 1px solid color-mix(in srgb, var(--success) 34%, var(--surface-level-3-border));
    border-radius: 0;
    background: var(--success-soft);
    color: var(--success-foreground);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .dashboard-hero h1 {
    margin-top: 2px;
    font-family: var(--font-heading) !important;
    color: var(--foreground);
    font-size: clamp(18px, 1.25vw, 22px);
    font-weight: 800;
    line-height: 1.18;
    letter-spacing: -0.035em;
  }

  .dashboard-hero p {
    max-width: 760px;
    margin-top: 3px;
    color: var(--foreground-subtle);
    font-size: 12px;
    line-height: 1.45;
    font-weight: 500;
  }

  .dashboard-hero-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .dashboard-hero-actions button,
  .dashboard-panel-header button,
  .alert-card button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--surface-level-3-border);
    border-radius: var(--radius-button);
    background: var(--surface-level-3);
    color: var(--foreground-muted);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
  }

  .dashboard-hero-actions button:first-child {
    border-color: var(--primary);
    background: var(--primary);
    color: var(--primary-foreground);
  }

  .dashboard-hero-actions button:hover,
  .dashboard-panel-header button:hover,
  .alert-card button:hover {
    transform: translateY(-1px);
    border-color: var(--surface-level-4-border);
    background: var(--surface-level-4);
  }

  .dashboard-kpis {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
  }

  .dashboard-kpi-card,
  .dashboard-panel {
    border: 1px solid var(--surface-level-2-border);
    border-radius: 0;
    background: var(--surface-level-2);
    box-shadow: var(--shadow-soft);
  }

  .dashboard-kpi-card {
    min-height: 160px;
    padding: 18px;
    transition: transform 160ms ease, box-shadow 160ms ease;
  }

  .dashboard-kpi-card:hover {
    transform: translateY(-2px);
    border-color: var(--surface-level-4-border);
    background: color-mix(in srgb, var(--surface-level-2) 82%, var(--surface-level-4));
    box-shadow: var(--shadow-hover);
  }

  .dashboard-kpi-card.is-link,
  .ticket-summary > div[role="link"],
  .activity-item.is-link {
    cursor: pointer;
  }

  .dashboard-kpi-card.is-link:focus-visible,
  .ticket-summary > div[role="link"]:focus-visible,
  .activity-item.is-link:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  .dashboard-kpi-top,
  .dashboard-kpi-bottom,
  .dashboard-panel-header,
  .kanban-title,
  .alert-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .dashboard-kpi-top span {
    color: var(--foreground-subtle);
    font-size: 12px;
    font-weight: 700;
  }

  .dashboard-kpi-top i {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 6px;
    background: var(--primary-soft);
    color: var(--primary);
  }

  .dashboard-kpi-card strong {
    display: block;
    margin-top: 18px;
    color: var(--foreground);
    font-size: clamp(24px, 2.4vw, 32px);
    font-weight: 800;
    letter-spacing: -0.05em;
  }

  .dashboard-kpi-bottom {
    align-items: flex-end;
    margin-top: 12px;
  }

  .dashboard-kpi-bottom small {
    max-width: 130px;
    color: var(--foreground-subtle);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.45;
  }

  .dashboard-kpi-bottom em {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 7px;
    border-radius: 15px !important;
    font-size: 11px;
    font-style: normal;
    font-weight: 800;
    white-space: nowrap;
  }

  .dashboard-kpi-bottom em.positive {
    background: var(--success-soft);
    color: var(--success-foreground);
  }

  .dashboard-kpi-bottom em.negative {
    background: var(--error-soft);
    color: var(--error-foreground);
  }

  .dashboard-grid {
    display: grid;
    gap: 24px;
  }

  .analytics-grid {
    grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.55fr);
  }

  .bottom-grid {
    grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
  }

  .dashboard-panel {
    padding: 20px;
  }

  .dashboard-panel-header {
    align-items: flex-start;
    margin-bottom: 18px;
  }

  .dashboard-panel-header.compact {
    margin-bottom: 14px;
  }

  .dashboard-panel-header h2 {
    margin-top: 4px;
    color: var(--foreground);
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.035em;
  }

  .chart-wrap {
    min-height: 300px;
    padding: 14px 10px 4px;
    border: 1px solid var(--surface-level-3-border);
    border-radius: 0;
    background: var(--surface-level-3);
  }

  .dashboard-chart-legend {
    display: flex;
    justify-content: center;
    gap: 18px;
    padding: 2px 0 8px;
    color: var(--foreground-muted);
    font-size: 12px;
    font-weight: 700;
  }

  .dashboard-chart-legend span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .dashboard-chart-legend i {
    width: 10px;
    height: 10px;
    border-radius: 0;
  }

  .dashboard-chart-legend i.collected {
    background: var(--primary);
  }

  .dashboard-chart-legend i.outstanding {
    background: var(--chart-5);
  }

  .dashboard-shell .recharts-default-tooltip {
    border: 1px solid var(--border) !important;
    border-radius: 0 !important;
    background: var(--chart-tooltip) !important;
    color: var(--foreground) !important;
    box-shadow: var(--shadow-card);
  }

  .debt-legend {
    display: grid;
    gap: 10px;
    margin-top: 6px;
  }

  .debt-legend div {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--surface-level-3-border);
    border-radius: 0;
    background: var(--surface-level-3);
    transition: background 160ms ease, border-color 160ms ease;
  }

  .debt-legend div:hover {
    border-color: var(--surface-level-4-border);
    background: var(--surface-level-4);
  }

  .debt-legend i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .debt-legend span,
  .debt-legend b {
    color: var(--foreground-muted);
    font-size: 12px;
    font-weight: 700;
  }

  .dashboard-empty-panel {
    display: grid;
    place-items: center;
    min-height: 230px;
    padding: 18px;
    border: 1px dashed var(--border-hover);
    border-radius: 0;
    background: var(--surface-level-3);
    color: var(--foreground-subtle);
    font-size: 12px;
    font-weight: 700;
    line-height: 1.5;
    text-align: center;
  }

  .ticket-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 18px;
  }

  .ticket-summary div {
    padding: 16px;
    border: 1px solid var(--surface-level-3-border);
    border-radius: 0;
    background: var(--surface-level-3);
  }

  .ticket-summary > div[role="link"] {
    transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
  }

  .debt-panel .dashboard-panel-header button {
    flex: 0 0 auto;
    white-space: nowrap;
    min-width: max-content;
  }

  .debt-panel .dashboard-panel-header span {
    white-space: nowrap;
  }

  .ticket-summary > div[role="link"]:hover {
    transform: translateY(-1px);
    border-color: var(--surface-level-4-border);
    background: var(--surface-level-4);
  }

  .ticket-summary div.danger {
    border-color: color-mix(in srgb, var(--error) 34%, transparent);
    background: var(--error-soft);
  }

  .ticket-summary b {
    display: block;
    color: var(--foreground);
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.04em;
  }

  .ticket-summary span {
    display: block;
    margin-top: 4px;
    color: var(--foreground-subtle);
    font-size: 12px;
    font-weight: 700;
  }

  .kanban {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .kanban-column {
    min-height: 260px;
    border: 1px solid var(--surface-level-3-border);
    border-radius: 0;
    background: var(--surface-level-3);
    padding: 14px;
  }

  .kanban-title {
    justify-content: flex-start;
    margin-bottom: 12px;
  }

  .kanban-title i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }

  .kanban-title span {
    flex: 1;
    color: var(--foreground-muted);
    font-size: 13px;
    font-weight: 800;
  }

  .kanban-title b {
    color: var(--foreground-subtle);
    font-size: 12px;
    font-weight: 800;
  }

  .kanban-list {
    display: grid;
    gap: 10px;
  }

  .ticket-card {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--surface-level-4-border);
    border-radius: 0;
    background: var(--surface-level-4);
    transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
  }

  .ticket-card:hover {
    border-color: color-mix(in srgb, var(--primary) 46%, var(--surface-level-4-border));
    background: color-mix(in srgb, var(--surface-level-4) 90%, var(--primary));
    transform: translateY(-1px);
  }

  .ticket-card b {
    display: block;
    color: var(--foreground);
    font-size: 13px;
    font-weight: 800;
  }

  .ticket-card span,
  .ticket-card small,
  .empty-state {
    color: var(--foreground-subtle);
    font-size: 11px;
    font-weight: 700;
  }

  .empty-state {
    padding: 18px;
    border: 1px dashed var(--border-hover);
    border-radius: 0;
    text-align: center;
  }

  .activity-list,
  .alert-list {
    display: grid;
    gap: 12px;
  }

  .activity-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid var(--surface-level-3-border);
    border-radius: 0;
    background: var(--surface-level-3);
    transition: background 160ms ease, border-color 160ms ease;
  }

  .activity-item:hover {
    border-color: var(--surface-level-4-border);
    background: var(--surface-level-4);
  }

  .activity-item i {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 0;
    color: var(--foreground-on-color);
  }

  .activity-item i.resident { background: var(--chart-1); }
  .activity-item i.payment { background: var(--chart-4); }
  .activity-item i.complaint { background: var(--chart-5); }
  .activity-item i.visitor { background: var(--chart-3); }

  .activity-item b,
  .alert-card b {
    display: block;
    color: var(--foreground);
    font-size: 13px;
    font-weight: 800;
  }

  .activity-item span,
  .alert-card span {
    display: block;
    margin-top: 3px;
    color: var(--foreground-subtle);
    font-size: 12px;
    font-weight: 600;
  }

  .activity-item small {
    color: var(--foreground-subtle);
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
  }

  .alert-card {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 14px;
    padding: 14px;
    border: 1px solid var(--surface-level-3-border);
    border-radius: 0;
    background: var(--surface-level-3);
    transition: background 160ms ease, border-color 160ms ease;
  }

  .alert-card:hover {
    border-color: var(--surface-level-4-border);
    background: var(--surface-level-4);
  }

  .alert-main {
    justify-content: flex-start;
  }

  .alert-main i {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 0;
    flex: none;
  }

  .alert-card.critical {
    border-color: color-mix(in srgb, var(--error) 34%, transparent);
    background: var(--error-soft);
  }

  .alert-card.critical i {
    background: var(--error-soft);
    color: var(--error-foreground);
  }

  .alert-card.high i {
    background: var(--warning-soft);
    color: var(--warning-foreground);
  }

  .alert-card.medium i {
    background: var(--info-soft);
    color: var(--info-foreground);
  }

  .dashboard-loading {
    display: grid;
    place-items: center;
    min-height: 420px;
    border: 1px solid var(--surface-level-2-border);
    border-radius: 0;
    background: var(--surface-level-2);
  }

  .dashboard-loading div {
    width: 42px;
    height: 42px;
    border: 4px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: dashboard-spin 0.8s linear infinite;
  }

  .dashboard-loading p {
    margin-top: 14px;
    color: var(--foreground-subtle);
    font-size: 14px;
    font-weight: 700;
  }

  @keyframes dashboard-spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1280px) {
    .dashboard-kpis {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .analytics-grid,
    .bottom-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 900px) {
    .dashboard-incident-modal-body {
      grid-template-columns: 1fr;
    }

    .dashboard-hero {
      align-items: stretch;
      flex-direction: column;
    }

    .dashboard-kpis,
    .ticket-summary,
    .kanban {
      grid-template-columns: 1fr;
    }

    .dashboard-panel-header {
      flex-direction: column;
    }
  }

  @media (max-width: 640px) {
    .dashboard-incident-modal-header,
    .dashboard-incident-modal-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .dashboard-incident-header-actions {
      justify-content: space-between;
    }

    .dashboard-incident-modal-body {
      gap: 16px;
      padding: 16px;
    }

    .dashboard-incident-image-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-incident-modal-footer > div {
      justify-content: flex-end;
    }

    .dashboard-shell {
      gap: 16px;
      padding: 0;
    }

    .dashboard-hero,
    .dashboard-panel,
    .dashboard-kpi-card {
      border-radius: 0;
      padding: 12px;
    }

    .dashboard-hero h1 {
      font-size: 19px;
    }

    .dashboard-kpis {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .activity-item,
    .alert-card {
      grid-template-columns: auto 1fr;
    }

    .activity-item small,
    .alert-card button {
      grid-column: 2;
      justify-self: start;
    }
  }
`;
