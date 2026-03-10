import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'in-progress', label: 'Đang xử lý' },
  { key: 'review', label: 'Chờ nghiệm thu' },
  { key: 'resolved', label: 'Hoàn thành' },
] as const;

const getStatusInfo = (status: string) => {
  const map: Record<string, { label: string; color: string; bgColor: string }> = {
    'pending':     { label: 'Chờ xử lý',      color: '#D97706', bgColor: '#FEF3C7' },
    'in-progress': { label: 'Đang xử lý',     color: '#2563EB', bgColor: '#DBEAFE' },
    'review':      { label: 'Chờ nghiệm thu', color: '#7C3AED', bgColor: '#F3E8FF' },
    'resolved':    { label: 'Hoàn thành',      color: '#059669', bgColor: '#D1FAE5' },
  };
  return map[status] || { label: status, color: '#6B7280', bgColor: '#F3F4F6' };
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    elevator: 'Thang máy', water: 'Nước', electrical: 'Điện',
    security: 'An ninh', cleaning: 'Vệ sinh', parking: 'Bãi xe',
    noise: 'Tiếng ồn', other: 'Khác',
  };
  return labels[category] || category;
};

export function IncidentList() {
  const navigate = useNavigate();
  const { incidents } = useData();
  const [activeTab, setActiveTab] = useState<string>('all');

  const filtered = activeTab === 'all' ? incidents : incidents.filter(i => i.status === activeTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#FFF', borderBottom: '1px solid #F3F4F6', padding: '16px 24px' }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Danh sách sự cố</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ backgroundColor: '#FFF', borderBottom: '1px solid #F3F4F6', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, padding: '16px 24px', minWidth: 'max-content' }}>
          {STATUS_TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  paddingLeft: 16, paddingRight: 16, paddingTop: 6, paddingBottom: 6,
                  borderRadius: 16, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                  backgroundColor: isActive ? '#1F2937' : '#F3F4F6',
                  color: isActive ? '#FFF' : '#6B7280',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60 }}>
            <span style={{ fontSize: 48 }}>📄</span>
            <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 12 }}>Chưa có sự cố nào</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((incident) => {
              const statusInfo = getStatusInfo(incident.status);
              const categoryLabel = getCategoryLabel(incident.category);
              return (
                <button
                  key={incident.id}
                  onClick={() => navigate('/resident/incidents/tracking', { state: { incidentId: incident.id } })}
                  style={{
                    backgroundColor: '#FFF',
                    border: '1px solid #E5E7EB', borderRadius: 12,
                    padding: 16, textAlign: 'left', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ flex: 1, marginRight: 12 }}>
                    {/* Top row: tag + status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        padding: '4px 10px', backgroundColor: '#F3F4F6', borderRadius: 4,
                        fontSize: 10, fontWeight: 600, color: '#6B7280',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>
                        {categoryLabel}
                      </span>
                      <span style={{
                        padding: '3px 8px', backgroundColor: statusInfo.bgColor, borderRadius: 4,
                        fontSize: 10, fontWeight: 600, color: statusInfo.color,
                        textTransform: 'uppercase', letterSpacing: '0.3px',
                      }}>
                        {statusInfo.label}
                      </span>
                    </div>
                    {/* Description as title */}
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4, margin: '0 0 4px' }}>
                      {incident.description || 'Không có mô tả'}
                    </p>
                    {/* ID + date */}
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                      #{incident.id} · {new Date(incident.reportedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <ChevronRight size={20} color="#9CA3AF" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer button */}
      <div style={{ backgroundColor: '#FFF', borderTop: '1px solid #F3F4F6', padding: '16px 24px' }}>
        <button
          onClick={() => navigate('/resident/incidents/create')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            backgroundColor: '#1E3A8A', color: '#FFF', borderRadius: 12,
            paddingTop: 14, paddingBottom: 14, fontSize: 16, fontWeight: 600,
            border: 'none', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
          <span>Báo cáo sự cố mới</span>
        </button>
      </div>
    </div>
  );
}