import { DollarSign, Home, AlertCircle, FileText, X, TrendingUp, Calendar, ExternalLink, UserPlus, FileCheck } from 'lucide-react';
import { useState } from 'react';

// Simplified KPI data - only for quick metrics at the top
const kpiData = [
  {
    title: 'Doanh thu tháng này',
    value: '125.500.000',
    unit: 'VNĐ',
    change: '+6.2%',
    icon: DollarSign,
  },
  {
    title: 'Phòng trống',
    value: '12',
    unit: 'phòng',
    subtext: '8.5% tổng số phòng',
    icon: Home,
  },
  {
    title: 'Hợp đồng sắp hết hạn',
    value: '8',
    unit: 'hợp đồng',
    subtext: 'Trong 30 ngày tới',
    icon: FileText,
  },
];

export function KPICards() {
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const [renewalModal, setRenewalModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  const handleCardClick = (index: number) => {
    setActiveModal(index);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  return (
    <>
      {/* Simplified KPI cards - 3 cards in a row, smaller and cleaner */}
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