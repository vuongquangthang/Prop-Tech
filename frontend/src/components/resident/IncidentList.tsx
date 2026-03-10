import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, ThumbsUp, RotateCcw } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'in-progress', label: 'Đang xử lý' },
  { key: 'review', label: 'Chờ nghiệm thu' },
  { key: 'resolved', label: 'Hoàn thành' },
] as const;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in-progress':
      return { bg: '#FEF3E8', text: '#E67E22', border: '#E67E22', label: 'Đang xử lý' };
    case 'review':
      return { bg: '#F3E8FF', text: '#7C3AED', border: '#7C3AED', label: 'Chờ nghiệm thu' };
    case 'resolved':
      return { bg: '#E8F5E9', text: '#1E7E34', border: '#1E7E34', label: 'Hoàn thành' };
    default:
      return { bg: '#E8F0F8', text: '#1A4B84', border: '#1A4B84', label: 'Chờ xử lý' };
  }
};

const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: string } = {
    elevator: '🛗', water: '💧', electrical: '⚡',
    security: '🔒', cleaning: '🧹', parking: '🚗',
    noise: '🔊', other: '📝',
  };
  return icons[category] || '📝';
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function IncidentList() {
  const navigate = useNavigate();
  const { incidents, updateIncidentStatus } = useData();
  const [activeTab, setActiveTab] = useState<string>('all');

  const filtered = activeTab === 'all' ? incidents : incidents.filter(i => i.status === activeTab);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Sự cố của tôi
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          {incidents.length} sự cố đã báo cáo
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-gray-200 px-3 overflow-x-auto">
        <div className="flex space-x-1 py-2" style={{ minWidth: 'max-content' }}>
          {STATUS_TABS.map(tab => {
            const count = tab.key === 'all'
              ? incidents.length
              : incidents.filter(i => i.status === tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: isActive
                    ? (tab.key === 'review' ? '#7C3AED' : 'var(--brand-primary)')
                    : '#F3F4F6',
                  color: isActive ? '#FFF' : 'var(--text-secondary)',
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : '#E5E7EB',
                      color: isActive ? '#FFF' : 'var(--text-secondary)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Không có sự cố nào
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Nhấn nút bên dưới để báo cáo sự cố mới
            </p>
          </div>
        ) : (
          filtered.map((incident) => {
            const statusColor = getStatusColor(incident.status);
            const categoryIcon = getCategoryIcon(incident.category);
            const isReview = incident.status === 'review';

            return (
              <div
                key={incident.id}
                className="bg-white rounded-xl border overflow-hidden"
                style={{ borderColor: isReview ? '#7C3AED' : '#E5E7EB', borderWidth: isReview ? '2px' : '1px' }}
              >
                {/* Clickable area → tracking */}
                <button
                  onClick={() => navigate('/resident/incidents/tracking', { state: { incidentId: incident.id } })}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span style={{ fontSize: '26px' }}>{categoryIcon}</span>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {incident.title}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                          {incident.id}
                        </p>
                      </div>
                    </div>
                    <span
                      className="px-2 py-1 rounded-full flex-shrink-0"
                      style={{
                        fontSize: '11px', fontWeight: 600,
                        color: statusColor.text,
                        backgroundColor: statusColor.bg,
                        border: `1px solid ${statusColor.border}`,
                      }}
                    >
                      {statusColor.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {incident.description}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    📅 {formatDate(incident.reportedAt)}
                  </p>
                </button>

                {/* Evaluation row — only for review status */}
                {isReview && (
                  <div className="px-4 pb-3 pt-1 border-t border-purple-100 bg-purple-50 space-y-2">
                    {incident.resolutionNote && (
                      <p style={{ fontSize: '12px', color: '#7C3AED' }}>
                        💬 {incident.resolutionNote}
                      </p>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await updateIncidentStatus(incident.id, 'resolved');
                        }}
                        className="flex-1 py-2 rounded-lg flex items-center justify-center space-x-1"
                        style={{ backgroundColor: '#1E7E34', color: '#FFF', fontSize: '13px', fontWeight: 700 }}
                      >
                        <ThumbsUp size={15} />
                        <span>Hài lòng</span>
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await updateIncidentStatus(incident.id, 'pending');
                        }}
                        className="flex-1 py-2 rounded-lg flex items-center justify-center space-x-1 border-2"
                        style={{ borderColor: '#E67E22', color: '#E67E22', fontSize: '13px', fontWeight: 700 }}
                      >
                        <RotateCcw size={15} />
                        <span>Sửa lại</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <div className="p-4 bg-white border-t border-gray-200">
        <button
          onClick={() => navigate('/resident/incidents/create')}
          className="w-full py-3 rounded-xl text-center shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center space-x-2"
          style={{
            backgroundColor: 'var(--brand-primary)',
            color: '#FFF',
            fontSize: '15px',
            fontWeight: 700,
          }}
        >
          <Plus size={20} />
          <span>Báo cáo sự cố mới</span>
        </button>
      </div>
    </div>
  );
}