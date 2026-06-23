import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  Home,
  MessageSquareWarning,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  UsersRound,
  Wrench,
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
import { FloatingActions } from './FloatingActions';

type ActivityType = 'resident' | 'payment' | 'complaint' | 'visitor';
type Severity = 'critical' | 'high' | 'medium';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  time: string;
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
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value)));

const compactCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  return currency(value);
};

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

const chartColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
const dashboardDemoEnabled = import.meta.env.VITE_DASHBOARD_DEMO === 'true';

const dateFromNow = (days: number, hours = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
};

const demoStats: DashboardStats = {
  roomStats: {
    totalRooms: 128,
    occupiedRooms: 119,
    availableRooms: 6,
    maintenanceRooms: 3,
    occupancyRate: 93,
  },
  revenueStats: {
    currentMonthRevenue: 486_500_000,
    lastMonthRevenue: 452_800_000,
    yearToDateRevenue: 2_674_000_000,
    averageMonthlyRevenue: 445_700_000,
    growthRate: 7.4,
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
  roomRentRevenue: roomRent * 1_000_000,
  serviceRevenue: service * 1_000_000,
  otherRevenue: other * 1_000_000,
}));

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
    const remaining = Number(invoice.remainingAmount ?? invoice.totalAmount - (invoice.paidAmount ?? 0) ?? 0);
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
    },
    {
      label: 'Phòng đã thuê',
      value: occupiedRooms.toLocaleString('vi-VN'),
      sub: `${totalRooms || 0} tổng số phòng`,
      trend: '+3 phòng',
      positive: true,
      icon: Home,
    },
    {
      label: 'Tỷ lệ lấp đầy',
      value: `${occupancyRate.toFixed(1)}%`,
      sub: 'So với mục tiêu vận hành 95%',
      trend: occupancyRate >= 90 ? '+2.1%' : '-1.8%',
      positive: occupancyRate >= 90,
      icon: Building2,
    },
    {
      label: 'Doanh thu tháng',
      value: `${compactCurrency(monthlyRevenueValue)} đ`,
      sub: `Tháng trước ${compactCurrency(lastMonthRevenueValue)} đ`,
      trend: `${(revenueStats?.growthRate ?? 0) >= 0 ? '+' : ''}${(revenueStats?.growthRate ?? 0).toFixed(1)}%`,
      positive: (revenueStats?.growthRate ?? 0) >= 0,
      icon: ReceiptText,
    },
    {
      label: 'Công nợ còn lại',
      value: `${compactCurrency(outstandingDebt)} đ`,
      sub: `${debtStats?.overdueInvoicesCount ?? invoices.length} hóa đơn cần xử lý`,
      trend: '-5.6%',
      positive: true,
      icon: CreditCard,
    },
  ];

  const revenueChart = useMemo(() => {
    if (monthlyRevenue.length > 0) {
      return monthlyRevenue.slice(-12).map((item) => ({
        month: `T${item.month}`,
        collected: Math.round((item.totalRevenue ?? 0) / 1_000_000),
        service: Math.round((item.serviceRevenue ?? 0) / 1_000_000),
      }));
    }
    return ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'].map((month, index) => ({
      month,
      collected: [82, 96, 91, 108, 124, 138][index],
      service: [18, 22, 20, 24, 29, 34][index],
    }));
  }, [monthlyRevenue]);

  const debtByBuilding = useMemo(() => {
    const grouped = new Map<string, number>();
    invoices.forEach((invoice) => {
      const building = invoice.buildingName || invoice.building || String(invoice.roomNumber ?? 'Tòa A').split('-')[0] || 'Tòa A';
      const amount = Number(invoice.remainingAmount ?? invoice.totalAmount - (invoice.paidAmount ?? 0) ?? 0);
      grouped.set(building, (grouped.get(building) ?? 0) + Math.max(0, amount));
    });

    const data = Array.from(grouped.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value / 1_000_000),
    }));

    return data.length > 0
      ? data
      : [
          { name: 'Tòa A', value: 42 },
          { name: 'Tòa B', value: 28 },
          { name: 'Tòa C', value: 16 },
        ];
  }, [invoices]);

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
    }));

    const paymentItems = invoices.slice(0, 3).map((invoice, index) => ({
      id: `payment-${invoice.id ?? index}`,
      type: 'payment' as ActivityType,
      title: 'Thanh toán/công nợ cần theo dõi',
      detail: `${invoice.roomNumber ?? 'Phòng'} · ${currency(Number(invoice.remainingAmount ?? invoice.totalAmount ?? 0))} đ`,
      time: relativeTime(invoice.paidAt ?? invoice.createdAt ?? invoice.dueDate),
    }));

    const complaintItems = maintenance.slice(0, 4).map((ticket) => ({
      id: `ticket-${ticket.id}`,
      type: 'complaint' as ActivityType,
      title: ticket.issueType || 'Yêu cầu sửa chữa mới',
      detail: `${ticket.roomNumber ?? `Phòng ${ticket.roomId}`} · ${ticket.userName ?? 'Cư dân'}`,
      time: relativeTime(ticket.createdAt),
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
      detail: `${debtStats?.overdueInvoicesCount ?? invoices.length} hóa đơn quá hạn · ${compactCurrency(outstandingDebt)} đ`,
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
          <div className="dashboard-eyebrow-row">
            <p className="dashboard-eyebrow">Bảng điều hành</p>
            {dashboardDemoEnabled && <span className="dashboard-demo-badge">Dữ liệu demo</span>}
          </div>
          <h1>Bảng điều khiển vận hành</h1>
          <p>Theo dõi sức khỏe tòa nhà, dòng tiền, bảo trì và hoạt động cư dân trong một giao diện tập trung.</p>
        </div>
        <div className="dashboard-hero-actions">
          <button onClick={() => navigate('/invoice-management')}>Tạo hóa đơn</button>
          <button onClick={() => navigate('/maintenance-request')}>Xem sự cố</button>
        </div>
      </section>

      <section className="dashboard-kpis">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article className="dashboard-kpi-card" key={kpi.label}>
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
              <span>Phân tích vận hành</span>
              <h2>Thu phí hằng tháng</h2>
            </div>
            <button onClick={() => navigate('/revenue-report')}>Báo cáo doanh thu <ChevronRight size={16} /></button>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChart} barGap={8}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--chart-axis)', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--chart-axis)', fontSize: 12 }} unit="M" />
                <Tooltip
                  cursor={{ fill: 'color-mix(in srgb, var(--primary) 8%, transparent)' }}
                  formatter={(value, name) => [`${value} triệu đồng`, name]}
                  labelFormatter={(label) => `Kỳ ${label}`}
                />
                <Bar dataKey="collected" name="Đã thu" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="service" name="Dịch vụ" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dashboard-panel debt-panel">
          <div className="dashboard-panel-header compact">
            <div>
              <span>Rủi ro tài chính</span>
              <h2>Công nợ theo tòa nhà</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={debtByBuilding} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4}>
                {debtByBuilding.map((_, index) => (
                  <Cell key={index} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}M đ`, 'Công nợ']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="debt-legend">
            {debtByBuilding.map((item, index) => (
              <div key={item.name}>
                <i style={{ background: chartColors[index % chartColors.length] }} />
                <span>{item.name}</span>
                <b>{item.value}M đ</b>
              </div>
            ))}
          </div>
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
          <div><b>{newTickets}</b><span>Yêu cầu mới</span></div>
          <div><b>{processingTickets}</b><span>Đang xử lý</span></div>
          <div className={overdueTickets > 0 ? 'danger' : ''}><b>{overdueTickets}</b><span>Quá hạn</span></div>
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
                  <article key={item.id} className="ticket-card">
                    <div>
                      <b>{item.issueType || 'Yêu cầu sửa chữa'}</b>
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
              <div className="activity-item" key={activity.id}>
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

      <FloatingActions />
    </div>
  );
}

const dashboardStyles = `
  .dashboard-shell {
    display: grid;
    gap: 24px;
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
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    padding: 24px;
    border: 1px solid var(--surface-level-2-border);
    border-radius: 12px;
    background:
      radial-gradient(circle at 8% 10%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 28%),
      radial-gradient(circle at 82% 0%, color-mix(in srgb, var(--info) 12%, transparent), transparent 32%),
      var(--surface-level-2);
    box-shadow: var(--shadow-card);
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
    border-radius: 999px;
    background: var(--success-soft);
    color: var(--success-foreground);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .dashboard-hero h1 {
    margin-top: 8px;
    color: var(--foreground);
    font-size: clamp(28px, 3vw, 42px);
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.04em;
  }

  .dashboard-hero p {
    max-width: 760px;
    margin-top: 10px;
    color: var(--foreground-subtle);
    font-size: 15px;
    line-height: 1.7;
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
    border-radius: 12px;
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
    border-radius: 12px;
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
    border-radius: 10px;
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
    border-radius: 999px;
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
    border-radius: 12px;
    background: var(--surface-level-3);
  }

  .dashboard-shell .recharts-default-tooltip {
    border: 1px solid var(--border) !important;
    border-radius: var(--radius-card);
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
    border-radius: 12px;
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

  .ticket-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 18px;
  }

  .ticket-summary div {
    padding: 16px;
    border: 1px solid var(--surface-level-3-border);
    border-radius: 12px;
    background: var(--surface-level-3);
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
    border-radius: 12px;
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
    border-radius: 10px;
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
    border-radius: 10px;
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
    border-radius: 10px;
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
    border-radius: 12px;
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
    border-radius: 12px;
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
    border-radius: 10px;
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
    border-radius: 12px;
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
    .dashboard-shell {
      gap: 16px;
      padding: 0;
    }

    .dashboard-hero,
    .dashboard-panel,
    .dashboard-kpi-card {
      border-radius: 12px;
      padding: 16px;
    }

    .dashboard-hero h1 {
      font-size: 28px;
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
