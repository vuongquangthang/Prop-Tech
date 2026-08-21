import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  Gauge,
  Home,
  Loader2,
  PlugZap,
  Wrench,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  contractService,
  invoiceService,
  roomService,
  type Contract,
  type Invoice,
  type Room,
} from '../../services/api.service';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';
import { maintenanceService, reportService, type MaintenanceRequest, type MonthlyRevenue } from '../../services/feature.service';
import { FilterSelect } from '../ui/FilterSelect';

type PeriodMode = 'month' | 'year';
type ReportTab = 'occupancy' | 'finance' | 'contracts' | 'maintenance' | 'utilities';

interface RoomUtilityReading {
  roomId: number;
  roomCode: string;
  oldElecReading?: number;
  newElecReading?: number;
  oldWaterReading?: number;
  newWaterReading?: number;
  elecRecorded: boolean;
  waterRecorded: boolean;
  elecIsAnomaly?: boolean;
  waterIsAnomaly?: boolean;
}

interface InvoiceLineItem {
  itemType?: string;
  serviceName?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
}

const formatCurrency = (value: number) => `${Math.round(value || 0).toLocaleString('vi-VN')} đ`;
const formatPercent = (value: number) => `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;
const asDate = (value?: string | null) => (value ? new Date(value) : null);
const isRentedStatus = (status?: string) => ['đã thuê', 'rented', 'occupied'].includes((status || '').toLowerCase());
const isPaidStatus = (status?: string) => ['paid', 'đã thanh toán', 'paidfully'].includes((status || '').toLowerCase());
const isFinalInvoice = (status?: string) => !['draft', 'nháp', 'rejected', 'từ chối', 'cancelled'].includes((status || '').toLowerCase());

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
const getPeriodRange = (year: number, month: number, mode: PeriodMode) => {
  const start = mode === 'month' ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
  const end = mode === 'month' ? new Date(year, month - 1, daysInMonth(year, month), 23, 59, 59) : new Date(year, 11, 31, 23, 59, 59);
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return { start, end, totalDays };
};

const getPreviousMonth = (year: number, month: number) =>
  month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };

const getIssueTypeLabel = (type?: string) => {
  const normalized = (type || '').toLowerCase();
  if (normalized.includes('electric') || normalized.includes('điện')) return 'Điện';
  if (normalized.includes('water') || normalized.includes('nước')) return 'Nước';
  if (normalized.includes('clean') || normalized.includes('vệ sinh')) return 'Vệ sinh';
  if (normalized.includes('security') || normalized.includes('an ninh')) return 'An ninh';
  if (normalized.includes('device') || normalized.includes('thiết bị')) return 'Thiết bị';
  return type || 'Khác';
};

const overlapsPeriod = (contract: Contract, start: Date, end: Date) => {
  const contractStart = asDate(contract.startDate);
  const contractEnd = asDate(contract.terminatedDate || contract.endDate || contract.expectedEndDate);
  if (!contractStart) return false;
  return contractStart <= end && (!contractEnd || contractEnd >= start);
};

const occupiedDaysInPeriod = (contract: Contract, start: Date, end: Date) => {
  const contractStart = asDate(contract.startDate);
  if (!contractStart) return 0;
  const contractEnd = asDate(contract.terminatedDate || contract.endDate || contract.expectedEndDate) || end;
  const actualStart = new Date(Math.max(contractStart.getTime(), start.getTime()));
  const actualEnd = new Date(Math.min(contractEnd.getTime(), end.getTime()));
  if (actualEnd < actualStart) return 0;
  return Math.round((actualEnd.getTime() - actualStart.getTime()) / 86400000) + 1;
};

function MetricCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
  icon: typeof Home;
  tone?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
}) {
  return (
    <div className="bg-white border border-gray-300 rounded p-4">
      <div>
        <p className="text-sm font-semibold text-gray-600">{title}</p>
        <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{sub}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-300 rounded">
      <div className="border-b border-gray-300 px-5 py-4">
        <h2 className="table-section-title">{title}</h2>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </section>
  );
}

function ReportFilterBar({
  activeTab,
  periodMode,
  selectedMonth,
  selectedYear,
  yearOptions,
  onPeriodModeChange,
  onMonthChange,
  onYearChange,
  onReset,
}: {
  activeTab: ReportTab;
  periodMode: PeriodMode;
  selectedMonth: number;
  selectedYear: number;
  yearOptions: number[];
  onPeriodModeChange: (value: PeriodMode) => void;
  onMonthChange: (value: number) => void;
  onYearChange: (value: number) => void;
  onReset: () => void;
}) {
  if (activeTab === 'contracts') {
    return (
      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-300 rounded p-4">
        <span className="text-sm font-semibold text-gray-700">Phạm vi</span>
        <span className="rounded-[6px] bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
          Theo mốc 30/60 ngày tới
        </span>
      </div>
    );
  }

  const forceMonth = activeTab === 'utilities';

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-300 rounded p-4">
      <span className="text-sm font-semibold text-gray-700">Lọc theo</span>
      {!forceMonth && (
        <FilterSelect value={periodMode} onChange={(event) => onPeriodModeChange(event.target.value as PeriodMode)}>
          <option value="month">Tháng</option>
          <option value="year">Năm</option>
        </FilterSelect>
      )}
      {forceMonth && (
        <span className="rounded-[6px] bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">Tháng</span>
      )}
      {(forceMonth || periodMode === 'month') && (
        <FilterSelect value={String(selectedMonth)} onChange={(event) => onMonthChange(Number(event.target.value))}>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
            <option key={month} value={month}>Tháng {String(month).padStart(2, '0')}</option>
          ))}
        </FilterSelect>
      )}
      <FilterSelect value={String(selectedYear)} onChange={(event) => onYearChange(Number(event.target.value))}>
        {yearOptions.map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </FilterSelect>
      <button
        type="button"
        onClick={onReset}
        className="border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        style={{ borderRadius: 'var(--radius-button)' }}
      >
        Xóa lọc
      </button>
    </div>
  );
}

export function OccupancyReportContent() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState<ReportTab>('occupancy');
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [readings, setReadings] = useState<RoomUtilityReading[]>([]);
  const [previousReadings, setPreviousReadings] = useState<RoomUtilityReading[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<Array<{ name: string; amount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    Promise.allSettled([
      roomService.getAll(),
      contractService.getAll(),
      invoiceService.getAll(),
      maintenanceService.getAll(),
    ])
      .then((results) => {
        if (!mounted) return;

        const [roomsRes, contractsRes, invoicesRes, maintenanceRes] = results;
        setRooms(roomsRes.status === 'fulfilled' ? roomsRes.value : []);
        setContracts(contractsRes.status === 'fulfilled' ? contractsRes.value : []);
        setInvoices(invoicesRes.status === 'fulfilled' ? invoicesRes.value : []);
        setMaintenance(maintenanceRes.status === 'fulfilled' ? maintenanceRes.value : []);

        const hasCriticalError = results.some((item) => item.status === 'rejected');
        if (hasCriticalError) {
          setError('Một phần dữ liệu báo cáo không tải được. Các chỉ số còn lại vẫn được hiển thị theo dữ liệu khả dụng.');
        }
      })
      .catch((err: any) => setError(err?.message || 'Không thể tải dữ liệu báo cáo'))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    reportService.getMonthlyRevenue(selectedYear)
      .then((data) => {
        if (mounted) setMonthlyRevenue(data);
      })
      .catch(() => {
        if (mounted) setMonthlyRevenue([]);
      });

    return () => {
      mounted = false;
    };
  }, [selectedYear]);

  useEffect(() => {
    let mounted = true;
    const previousMonth = getPreviousMonth(selectedYear, selectedMonth);

    Promise.allSettled([
      api.get<RoomUtilityReading[]>(API_ENDPOINTS.UTILITY_READINGS.MONTH(selectedYear, selectedMonth)),
      api.get<RoomUtilityReading[]>(API_ENDPOINTS.UTILITY_READINGS.MONTH(previousMonth.year, previousMonth.month)),
    ]).then(([readingsRes, previousReadingsRes]) => {
      if (!mounted) return;
      setReadings(readingsRes.status === 'fulfilled' ? readingsRes.value.data : []);
      setPreviousReadings(previousReadingsRes.status === 'fulfilled' ? previousReadingsRes.value.data : []);
    });

    return () => {
      mounted = false;
    };
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (activeTab === 'utilities' && periodMode !== 'month') {
      setPeriodMode('month');
    }
  }, [activeTab, periodMode]);

  useEffect(() => {
    let mounted = true;
    const periodInvoices = invoices.filter((invoice) =>
      isFinalInvoice(invoice.status)
      && invoice.year === selectedYear
      && (periodMode === 'year' || invoice.month === selectedMonth)
    );

    Promise.allSettled(
      periodInvoices.slice(0, 80).map((invoice) => invoiceService.getById(invoice.id))
    ).then((invoiceDetails) => {
      if (!mounted) return;
      const serviceTotals = new Map<string, number>();
      invoiceDetails.forEach((result) => {
        if (result.status !== 'fulfilled') return;
        const lineItems: InvoiceLineItem[] = (result.value as any)?.lineItems || [];
        lineItems.forEach((item) => {
          const name = item.serviceName || item.description || item.itemType || 'Dịch vụ khác';
          const lower = name.toLowerCase();
          if (lower.includes('phòng') || lower.includes('rent')) return;
          serviceTotals.set(name, (serviceTotals.get(name) || 0) + Number(item.amount || 0));
        });
      });
      setServiceBreakdown([...serviceTotals.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount));
    });

    return () => {
      mounted = false;
    };
  }, [invoices, periodMode, selectedMonth, selectedYear]);

  const report = useMemo(() => {
    const { start, end, totalDays } = getPeriodRange(selectedYear, selectedMonth, periodMode);
    const finalInvoices = invoices.filter((invoice) =>
      isFinalInvoice(invoice.status)
      && invoice.year === selectedYear
      && (periodMode === 'year' || invoice.month === selectedMonth)
    );
    const monthRevenueRows = monthlyRevenue.filter((row) => periodMode === 'year' || row.month === selectedMonth);
    const selectedRevenue = monthRevenueRows.reduce((sum, row) => ({
      roomRentRevenue: sum.roomRentRevenue + Number(row.roomRentRevenue || 0),
      serviceRevenue: sum.serviceRevenue + Number(row.serviceRevenue || 0),
      collectedRevenue: sum.collectedRevenue + Number(row.collectedRevenue || 0),
      outstandingRevenue: sum.outstandingRevenue + Number(row.outstandingRevenue || 0),
      totalRevenue: sum.totalRevenue + Number(row.totalRevenue || 0),
    }), { roomRentRevenue: 0, serviceRevenue: 0, collectedRevenue: 0, outstandingRevenue: 0, totalRevenue: 0 });

    const activeRoomIds = new Set(
      contracts
        .filter((contract) => overlapsPeriod(contract, start, end))
        .map((contract) => contract.roomId)
    );
    const periodIncludesToday = start <= now && now <= end;
    const occupiedRooms = rooms.filter((room) =>
      activeRoomIds.has(room.id) || (periodIncludesToday && isRentedStatus(room.status))
    ).length;
    const totalRooms = rooms.length;
    const vacantRooms = Math.max(0, totalRooms - occupiedRooms);
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const vacancyRate = Math.max(0, 100 - occupancyRate);
    const roomVacancyRows = rooms.map((room) => {
      const roomContracts = contracts.filter((contract) => contract.roomId === room.id && overlapsPeriod(contract, start, end));
      const occupiedDays = Math.min(totalDays, roomContracts.reduce((sum, contract) => sum + occupiedDaysInPeriod(contract, start, end), 0));
      const vacantDays = Math.max(0, totalDays - occupiedDays);
      return {
        roomCode: room.roomCode,
        building: room.buildingName || 'Chưa gắn tòa',
        vacantDays,
        vacancyRate: totalDays > 0 ? (vacantDays / totalDays) * 100 : 0,
      };
    }).sort((a, b) => b.vacancyRate - a.vacancyRate);

    const collected = finalInvoices.reduce((sum, invoice) => sum + Number(invoice.paidAmount || 0), 0);
    const receivable = finalInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);
    const debtRecoveryRate = receivable > 0 ? (collected / receivable) * 100 : 100;
    const overdueDebt = finalInvoices
      .filter((invoice) => {
        const dueDate = asDate(invoice.dueDate);
        return dueDate && dueDate < now && !isPaidStatus(invoice.status) && Number(invoice.remainingAmount ?? invoice.totalAmount) > 0;
      })
      .reduce((sum, invoice) => sum + Number(invoice.remainingAmount ?? invoice.totalAmount ?? 0), 0);

    const projectedFullRevenue = rooms.reduce((sum, room) => sum + Number(room.defaultRentPrice || 0), 0) * (periodMode === 'year' ? 12 : 1);
    const expiring30 = contracts.filter((contract) => {
      const endDate = asDate(contract.expectedEndDate || contract.endDate);
      if (!endDate) return false;
      const thirtyDays = new Date(now.getTime() + 30 * 86400000);
      return endDate >= now && endDate <= thirtyDays;
    }).length;
    const expiring60 = contracts.filter((contract) => {
      const endDate = asDate(contract.expectedEndDate || contract.endDate);
      if (!endDate) return false;
      const sixtyDays = new Date(now.getTime() + 60 * 86400000);
      return endDate >= now && endDate <= sixtyDays;
    }).length;

    const periodMaintenance = maintenance.filter((item) => {
      const createdAt = asDate(item.createdAt);
      return createdAt && createdAt >= start && createdAt <= end;
    });
    const issueByType = [...periodMaintenance.reduce((map, item) => {
      const label = getIssueTypeLabel(item.issueType);
      map.set(label, (map.get(label) || 0) + 1);
      return map;
    }, new Map<string, number>()).entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const completedIssues = periodMaintenance.filter((item) => item.closedAt);
    const avgResolveHours = completedIssues.length > 0
      ? completedIssues.reduce((sum, item) => {
        const createdAt = asDate(item.createdAt);
        const closedAt = asDate(item.closedAt);
        return sum + (createdAt && closedAt ? Math.max(0, closedAt.getTime() - createdAt.getTime()) / 3600000 : 0);
      }, 0) / completedIssues.length
      : 0;
    const yearlyMaintenance = maintenance.filter((item) => asDate(item.createdAt)?.getFullYear() === selectedYear);
    const repeatKeys = new Map<string, number>();
    yearlyMaintenance.forEach((item) => {
      const key = `${item.roomId}-${getIssueTypeLabel(item.issueType)}`;
      repeatKeys.set(key, (repeatKeys.get(key) || 0) + 1);
    });
    const repeatedIssueCount = [...repeatKeys.values()].filter((count) => count > 1).reduce((sum, count) => sum + count, 0);
    const repeatRate = yearlyMaintenance.length > 0 ? (repeatedIssueCount / yearlyMaintenance.length) * 100 : 0;

    const consumptionRows = readings.map((reading) => {
      const electric = Math.max(0, Number(reading.newElecReading ?? 0) - Number(reading.oldElecReading ?? 0));
      const water = Math.max(0, Number(reading.newWaterReading ?? 0) - Number(reading.oldWaterReading ?? 0));
      const prev = previousReadings.find((item) => item.roomId === reading.roomId);
      const prevElectric = prev ? Math.max(0, Number(prev.newElecReading ?? 0) - Number(prev.oldElecReading ?? 0)) : 0;
      const prevWater = prev ? Math.max(0, Number(prev.newWaterReading ?? 0) - Number(prev.oldWaterReading ?? 0)) : 0;
      return {
        roomCode: reading.roomCode,
        electric,
        water,
        electricChange: prevElectric > 0 ? ((electric - prevElectric) / prevElectric) * 100 : 0,
        waterChange: prevWater > 0 ? ((water - prevWater) / prevWater) * 100 : 0,
        anomaly: reading.elecIsAnomaly || reading.waterIsAnomaly,
      };
    }).sort((a, b) => (b.electric + b.water) - (a.electric + a.water));

    return {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate,
      vacancyRate,
      roomVacancyRows,
      selectedRevenue,
      projectedFullRevenue,
      serviceBreakdown,
      debtRecoveryRate,
      overdueDebt,
      expiring30,
      expiring60,
      issueByType,
      avgResolveHours,
      maintenanceCost: 0,
      repeatRate,
      consumptionRows,
    };
  }, [contracts, invoices, maintenance, monthlyRevenue, now, periodMode, previousReadings, readings, rooms, selectedMonth, selectedYear, serviceBreakdown]);

  const yearOptions = Array.from({ length: 5 }, (_, index) => now.getFullYear() - 2 + index);
  const tabs: Array<{ key: ReportTab; label: string; icon: typeof Home }> = [
    { key: 'occupancy', label: 'Lấp đầy phòng', icon: Home },
    { key: 'finance', label: 'Doanh thu & tài chính', icon: CircleDollarSign },
    { key: 'contracts', label: 'Hợp đồng', icon: CalendarClock },
    { key: 'maintenance', label: 'Sự cố / bảo trì', icon: Wrench },
    { key: 'utilities', label: 'Điện nước', icon: PlugZap },
  ];
  const filteredRevenueRows = monthlyRevenue.filter((row) => periodMode === 'year' || row.month === selectedMonth);
  const revenueChartData = filteredRevenueRows.map((row) => ({
    period: `${String(row.month).padStart(2, '0')}/${row.year}`,
    'Tiền phòng': Number(row.roomRentRevenue || 0),
    'Dịch vụ': Number(row.serviceRevenue || 0),
  }));
  const collectionChartData = [
    { name: 'Đã gạch nợ', value: report.debtRecoveryRate, color: 'var(--chart-4)' },
    { name: 'Còn phải thu', value: Math.max(0, 100 - report.debtRecoveryRate), color: 'var(--chart-5)' },
  ];

  if (loading) {
    return (
      <div className="bg-white border border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 size={48} className="animate-spin text-gray-400" />
          <span className="text-gray-600">Đang tổng hợp dữ liệu báo cáo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="sticky top-16 z-30">
        <div className="product-tabs">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={active ? 'is-active' : ''}
              >
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ReportFilterBar
        activeTab={activeTab}
        periodMode={periodMode}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        yearOptions={yearOptions}
        onPeriodModeChange={setPeriodMode}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onReset={() => {
          setPeriodMode('month');
          setSelectedMonth(now.getMonth() + 1);
          setSelectedYear(now.getFullYear());
        }}
      />

      {activeTab === 'occupancy' && (
      <Section title="1. Nhóm chỉ số lấp đầy phòng">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard title="Tỷ lệ lấp đầy phòng" value={formatPercent(report.occupancyRate)} sub={`${report.occupiedRooms}/${report.totalRooms} phòng đang sinh lời`} icon={Home} tone="green" />
          <MetricCard title="Tỷ lệ phòng trống" value={formatPercent(report.vacancyRate)} sub={`${report.vacantRooms} phòng cần theo dõi`} icon={Gauge} tone="orange" />
          <MetricCard title="Phòng trống cao nhất" value={`${formatPercent(report.roomVacancyRows[0]?.vacancyRate || 0)}`} sub={report.roomVacancyRows[0]?.roomCode || 'Không có dữ liệu'} icon={AlertTriangle} tone="red" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <div className="border border-gray-300 rounded p-4">
            <h3 className="table-section-title" style={{ marginBottom: 12 }}>Phân bổ trạng thái phòng</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={[
                  { name: 'Đang thuê', value: report.occupiedRooms, color: 'var(--chart-4)' },
                  { name: 'Trống', value: report.vacantRooms, color: 'var(--chart-2)' },
                ]} dataKey="value" nameKey="name" outerRadius={82} label>
                  {[report.occupiedRooms, report.vacantRooms].map((_, index) => (
                    <Cell key={index} fill={index === 0 ? 'var(--chart-4)' : 'var(--chart-2)'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="border border-gray-300 rounded overflow-hidden">
            <div className="border-b border-gray-300 px-4 py-3 text-sm font-bold text-gray-800">Tỷ lệ trống từng phòng</div>
            <div className="max-h-72 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-gray-600">Phòng</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-600">Tòa</th>
                    <th className="px-4 py-2 text-right text-xs text-gray-600">Ngày trống</th>
                    <th className="px-4 py-2 text-right text-xs text-gray-600">Tỷ lệ trống</th>
                  </tr>
                </thead>
                <tbody>
                  {report.roomVacancyRows.slice(0, 12).map((room) => (
                    <tr key={room.roomCode} className="border-t border-gray-200">
                      <td className="px-4 py-2 text-sm font-semibold text-gray-900">{room.roomCode}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{room.building}</td>
                      <td className="px-4 py-2 text-right text-sm text-gray-700">{room.vacantDays}</td>
                      <td className="px-4 py-2 text-right text-sm font-semibold text-orange-700">{formatPercent(room.vacancyRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </Section>
      )}

      {activeTab === 'finance' && (
      <Section title="2. Nhóm chỉ số doanh thu & tài chính">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <MetricCard title="Doanh thu thực thu" value={formatCurrency(report.selectedRevenue.collectedRevenue)} sub="Tiền đã về theo thanh toán" icon={CircleDollarSign} tone="green" />
          <MetricCard title="Doanh thu từ tiền phòng" value={formatCurrency(report.selectedRevenue.roomRentRevenue)} sub="Nguồn thu cốt lõi" icon={Home} tone="blue" />
          <MetricCard title="Doanh thu dự kiến 100%" value={formatCurrency(report.projectedFullRevenue)} sub="Trần lý thuyết nếu lấp đầy" icon={BarChart3} tone="purple" />
          <MetricCard title="Thu hồi công nợ" value={formatPercent(report.debtRecoveryRate)} sub={`Nợ quá hạn: ${formatCurrency(report.overdueDebt)}`} icon={Gauge} tone={report.debtRecoveryRate >= 90 ? 'green' : 'orange'} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
          <div className="border border-gray-300 rounded p-4">
            <h3 className="table-section-title" style={{ marginBottom: 12 }}>Biểu đồ cột doanh thu: tiền phòng và dịch vụ</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => `${Number(value) / 1000000}M`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Tiền phòng" fill="var(--chart-1)" />
                <Bar dataKey="Dịch vụ" fill="var(--chart-5)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="border border-gray-300 rounded p-4">
            <h3 className="table-section-title" style={{ marginBottom: 12 }}>Thu hồi công nợ = 100%</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={collectionChartData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={86} label>
                  {collectionChartData.map((item) => <Cell key={item.name} fill={item.color} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatPercent(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-sm text-gray-700">Đã gạch nợ + còn phải thu = 100% tổng hóa đơn phải thu.</div>
          </div>
        </div>

        <div className="border border-gray-300 rounded overflow-hidden">
          <div className="border-b border-gray-300 px-4 py-3 text-sm font-bold text-gray-800">Doanh thu dịch vụ tiện ích theo loại</div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-600">Loại dịch vụ</th>
                <th className="px-4 py-2 text-right text-xs text-gray-600">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {(report.serviceBreakdown.length ? report.serviceBreakdown : [{ name: 'Tổng dịch vụ', amount: report.selectedRevenue.serviceRevenue }]).map((item) => (
                <tr key={item.name} className="border-t border-gray-200">
                  <td className="px-4 py-2 text-sm font-semibold text-gray-900">{item.name}</td>
                  <td className="px-4 py-2 text-right text-sm text-gray-700">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </Section>
      )}

      {activeTab === 'contracts' && (
      <Section title="3. Nhóm chỉ số hợp đồng">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <MetricCard title="Sắp hết hạn trong 30 ngày" value={`${report.expiring30}`} sub="Cần liên hệ gia hạn sớm" icon={CalendarClock} tone="orange" />
          <MetricCard title="Sắp hết hạn trong 60 ngày" value={`${report.expiring60}`} sub="Mốc theo dõi kế hoạch phòng trống" icon={CalendarClock} tone="blue" />
        </div>
      </Section>
      )}

      {activeTab === 'maintenance' && (
      <Section title="4. Nhóm chỉ số sự cố / bảo trì">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <MetricCard title="Sự cố phát sinh" value={`${report.issueByType.reduce((sum, item) => sum + item.count, 0)}`} sub="Đếm theo loại trong kỳ" icon={Wrench} tone="orange" />
          <MetricCard title="Thời gian xử lý TB" value={`${report.avgResolveHours.toFixed(1)} giờ`} sub="Từ báo cáo đến xử lý xong" icon={Gauge} tone="blue" />
          <MetricCard title="Chi phí bảo trì" value={report.maintenanceCost ? formatCurrency(report.maintenanceCost) : 'Chưa ghi nhận'} sub="Cần trường chi phí để tính chính xác" icon={CircleDollarSign} tone="gray" />
          <MetricCard title="Tỷ lệ sự cố lặp lại" value={formatPercent(report.repeatRate)} sub="Theo phòng/loại sự cố trong năm" icon={AlertTriangle} tone={report.repeatRate > 20 ? 'red' : 'green'} />
        </div>
        <div className="border border-gray-300 rounded p-4">
          <h3 className="table-section-title" style={{ marginBottom: 12 }}>Sự cố theo loại</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={report.issueByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Số sự cố" fill="var(--chart-5)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>
      )}

      {activeTab === 'utilities' && (
      <Section title="5. Nhóm chỉ số tiện ích (điện, nước)">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard title="Tổng điện tiêu thụ" value={`${report.consumptionRows.reduce((sum, item) => sum + item.electric, 0).toLocaleString('vi-VN')} kWh`} sub={`Tháng ${String(selectedMonth).padStart(2, '0')}/${selectedYear}`} icon={PlugZap} tone="orange" />
          <MetricCard title="Tổng nước tiêu thụ" value={`${report.consumptionRows.reduce((sum, item) => sum + item.water, 0).toLocaleString('vi-VN')} m³`} sub={`Tháng ${String(selectedMonth).padStart(2, '0')}/${selectedYear}`} icon={Gauge} tone="blue" />
          <MetricCard title="Phòng có bất thường" value={`${report.consumptionRows.filter((item) => item.anomaly).length}`} sub="Theo cờ bất thường khi nhập chỉ số" icon={AlertTriangle} tone="red" />
        </div>
        <div className="border border-gray-300 rounded overflow-hidden">
          <div className="table-section-title border-b border-gray-300 px-4 py-3">Tiêu thụ điện/nước mỗi phòng và chênh lệch so với tháng trước</div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-600">Phòng</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-600">Điện (kWh)</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-600">Δ điện</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-600">Nước (m³)</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-600">Δ nước</th>
                </tr>
              </thead>
              <tbody>
                {report.consumptionRows.map((item) => (
                  <tr key={item.roomCode} className="border-t border-gray-200">
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">{item.roomCode}</td>
                    <td className="px-4 py-2 text-right text-sm text-gray-700">{item.electric}</td>
                    <td className={`px-4 py-2 text-right text-sm font-semibold ${item.electricChange > 20 ? 'text-red-700' : 'text-gray-700'}`}>{formatPercent(item.electricChange)}</td>
                    <td className="px-4 py-2 text-right text-sm text-gray-700">{item.water}</td>
                    <td className={`px-4 py-2 text-right text-sm font-semibold ${item.waterChange > 20 ? 'text-red-700' : 'text-gray-700'}`}>{formatPercent(item.waterChange)}</td>
                  </tr>
                ))}
                {report.consumptionRows.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">Chưa có dữ liệu điện nước trong kỳ đã chọn</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
      )}
    </div>
  );
}
