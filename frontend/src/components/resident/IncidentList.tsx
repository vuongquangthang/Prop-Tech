import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export function IncidentList() {
  const navigate = useNavigate();
  const { incidents } = useData();

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
      elevator: '🛗',
      water: '💧',
      electrical: '⚡',
      security: '🔒',
      cleaning: '🧹',
      parking: '🚗',
      noise: '🔊',
      other: '📝',
    };
    return icons[category] || '📝';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

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

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {incidents.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Chưa có sự cố nào được báo cáo
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Nhấn nút bên dưới để báo cáo sự cố mới
            </p>
          </div>
        ) : (
          incidents.map((incident) => {
            const statusColor = getStatusColor(incident.status);
            const categoryIcon = getCategoryIcon(incident.category);
            const formattedDate = formatDate(incident.reportedAt);
            return (
              <button
                key={incident.id}
                onClick={() => navigate('/resident/incidents/tracking', { state: { incidentId: incident.id } })}
                className="w-full bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span style={{ fontSize: '28px' }}>{categoryIcon}</span>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {incident.title}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {incident.id}
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-2 py-1 rounded-full flex-shrink-0"
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: statusColor.text,
                      backgroundColor: statusColor.bg,
                      border: `1px solid ${statusColor.border}`,
                    }}
                  >
                    {statusColor.label}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {incident.description}
                </p>

                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  📅 {formattedDate}
                </p>
              </button>
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