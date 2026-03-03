import { useNavigate } from 'react-router';
import { ArrowLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export function IncidentTracking() {
  const navigate = useNavigate();
  const { incidents } = useData();

  // Get the most recent incident (last created)
  const latestIncident = incidents[0];

  if (!latestIncident) {
    return (
      <div className="bg-gray-50 min-h-screen p-4">
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Không có sự cố nào để theo dõi
        </p>
      </div>
    );
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Create timeline based on incident status
  const getTimeline = () => {
    const timeline = [
      {
        status: 'received',
        label: 'Đã tiếp nhận',
        time: formatDateTime(latestIncident.reportedAt),
        completed: true,
        message: 'Ban quản lý đã tiếp nhận báo cáo của bạn',
      },
    ];

    if (latestIncident.status === 'in-progress' || latestIncident.status === 'resolved') {
      timeline.push({
        status: 'in-progress',
        label: 'Đang xử lý',
        time: formatDateTime(latestIncident.reportedAt),
        completed: true,
        message: latestIncident.assignedTo 
          ? `Kỹ thuật viên ${latestIncident.assignedTo} đang xử lý`
          : 'Kỹ thuật viên đã đến hiện trường kiểm tra',
      });
    }

    if (latestIncident.status === 'resolved') {
      timeline.push({
        status: 'completed',
        label: 'Hoàn thành',
        time: latestIncident.resolvedAt ? formatDateTime(latestIncident.resolvedAt) : '',
        completed: true,
        message: latestIncident.resolutionNote || 'Sự cố đã được giải quyết hoàn toàn',
      });
    } else {
      timeline.push({
        status: 'completed',
        label: 'Hoàn thành',
        time: '',
        completed: false,
        message: 'Sự cố sẽ được xử lý trong vòng 24h',
      });
    }

    return timeline;
  };

  const timeline = getTimeline();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return { bg: '#FEF3E8', text: '#E67E22', border: '#E67E22', label: 'Đang xử lý' };
      case 'resolved':
        return { bg: '#E8F5E9', text: '#1E7E34', border: '#1E7E34', label: 'Đã hoàn thành' };
      default:
        return { bg: '#E8F0F8', text: '#1A4B84', border: '#1A4B84', label: 'Chờ xử lý' };
    }
  };

  const statusColor = getStatusColor(latestIncident.status);

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

  return (
    <div className="bg-gray-50">
      {/* Sub Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3">
        <button onClick={() => navigate('/resident/incidents')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} color="var(--text-primary)" />
        </button>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Theo dõi tiến độ
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Incident Info Card */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Mã sự cố
              </p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {latestIncident.id}
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: statusColor.text,
                backgroundColor: statusColor.bg,
                border: `2px solid ${statusColor.border}`,
              }}
            >
              {statusColor.label}
            </span>
          </div>

          <div className="space-y-2 pt-3 border-t border-gray-200">
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Loại sự cố
              </p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {getCategoryIcon(latestIncident.category)} {latestIncident.category}
              </p>
            </div>

            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Thời gian báo cáo
              </p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {formatDateTime(latestIncident.reportedAt)}
              </p>
            </div>

            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Mô tả
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>
                {latestIncident.description}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Tiến độ xử lý
          </p>

          <div className="space-y-4">
            {timeline.map((step, index) => {
              const isLast = index === timeline.length - 1;
              
              return (
                <div key={index} className="flex">
                  {/* Timeline Icon */}
                  <div className="flex flex-col items-center mr-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: step.completed ? '#1E7E34' : '#D1D5DB',
                        border: `3px solid ${step.completed ? '#1E7E34' : '#D1D5DB'}`,
                      }}
                    >
                      {step.completed ? (
                        <CheckCircle size={20} color="#FFF" />
                      ) : (
                        <Clock size={20} color="#FFF" />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className="w-0.5 flex-1 mt-2"
                        style={{
                          height: '40px',
                          backgroundColor: step.completed ? '#1E7E34' : '#D1D5DB',
                        }}
                      />
                    )}
                  </div>

                  {/* Timeline Content */}
                  <div className="flex-1 pb-4">
                    <p style={{ 
                      fontSize: '14px', 
                      fontWeight: 700, 
                      color: step.completed ? '#1E7E34' : 'var(--text-secondary)' 
                    }}>
                      {step.label}
                    </p>
                    {step.time && (
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {step.time}
                      </p>
                    )}
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '6px' }}>
                      {step.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estimated Time */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start space-x-2">
          <AlertCircle size={20} color="#E67E22" className="flex-shrink-0 mt-0.5" />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#E67E22' }}>
              Thời gian dự kiến hoàn thành
            </p>
            <p style={{ fontSize: '12px', color: '#E67E22', marginTop: '4px' }}>
              23/02/2026 - Trong vòng 24 giờ
            </p>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Cần hỗ trợ thêm?
          </p>
          <button
            className="px-6 py-2 rounded-xl border-2 hover:bg-gray-50 transition-colors"
            style={{
              borderColor: 'var(--brand-primary)',
              color: 'var(--brand-primary)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Liên hệ Ban quản lý
          </button>
        </div>
      </div>
    </div>
  );
}