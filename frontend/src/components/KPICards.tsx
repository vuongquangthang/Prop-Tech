import { DollarSign, Home, FileText } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useSignalRRefresh } from '../lib/useSignalRRefresh';
import { reportService } from '../services/feature.service';
import { contractService, Contract } from '../services/api.service';

export function KPICards() {
  const [revenue, setRevenue] = useState<number | null>(null);
  const [growthRate, setGrowthRate] = useState<number | null>(null);
  const [availableRooms, setAvailableRooms] = useState<number | null>(null);
  const [totalRooms, setTotalRooms] = useState<number | null>(null);
  const [expiringContracts, setExpiringContracts] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [dashboard, contracts] = await Promise.allSettled([
        reportService.getDashboard(),
        contractService.getActive(),
      ]);

      if (dashboard.status === 'fulfilled') {
        const d = dashboard.value;
        setRevenue(d.revenueStats?.currentMonthRevenue ?? null);
        setGrowthRate(d.revenueStats?.growthRate ?? null);
        setAvailableRooms(d.roomStats?.availableRooms ?? null);
        setTotalRooms(d.roomStats?.totalRooms ?? null);
      }

      if (contracts.status === 'fulfilled') {
        const now = new Date();
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiring = contracts.value.filter((c: Contract) => {
          const endStr = c.expectedEndDate ?? c.endDate;
          if (!endStr) return false;
          const end = new Date(endStr);
          return end >= now && end <= in30Days;
        });
        setExpiringContracts(expiring.length);
      }
    } catch (_) {
      // silently keep null values to show fallback UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useSignalRRefresh(['PaymentSuccess', 'PaymentFailed', 'InvoiceUpdated'], fetchData);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(value));

  const occupancyPct =
    totalRooms && totalRooms > 0 && availableRooms !== null
      ? ((availableRooms / totalRooms) * 100).toFixed(1)
      : null;

  const kpiData = [
    {
      title: 'Doanh thu tháng này',
      value: loading ? '...' : revenue !== null ? formatCurrency(revenue) : '—',
      unit: 'VNĐ',
      change: growthRate !== null ? `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%` : null,
      subtext: null,
      icon: DollarSign,
    },
    {
      title: 'Phòng trống',
      value: loading ? '...' : availableRooms !== null ? String(availableRooms) : '—',
      unit: 'phòng',
      change: null,
      subtext: occupancyPct !== null ? `${occupancyPct}% tổng số phòng` : null,
      icon: Home,
    },
    {
      title: 'Hợp đồng sắp hết hạn',
      value: loading ? '...' : expiringContracts !== null ? String(expiringContracts) : '—',
      unit: 'hợp đồng',
      change: null,
      subtext: 'Trong 30 ngày tới',
      icon: FileText,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-3 mb-6" style={{ gap: 'var(--space-card)' }}>
        {kpiData.map((kpi, index) => (
          <div key={index} className="rounded" style={{ 
            backgroundColor: 'var(--surface-card)', 
            border: '1px solid var(--surface-border)', 
            borderRadius: 'var(--radius-card)',
            padding: 'var(--space-card)'
          }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)', marginBottom: '4px' }}>{kpi.title}</p>
                <div className="flex items-baseline" style={{ gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>{kpi.value}</span>
                  <span style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>{kpi.unit}</span>
                </div>
                {kpi.change && (
                  <p style={{ fontSize: 'var(--type-caption)', color: 'var(--success)' }}>{kpi.change} so với tháng trước</p>
                )}
                {kpi.subtext && (
                  <p style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>{kpi.subtext}</p>
                )}
              </div>
              <div className="rounded flex items-center justify-center flex-shrink-0" style={{ 
                width: '48px', 
                height: '48px', 
                backgroundColor: 'var(--brand-surface)' 
              }}>
                <kpi.icon size={24} style={{ color: 'var(--brand-primary)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}