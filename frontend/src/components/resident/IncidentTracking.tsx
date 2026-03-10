import { useNavigate, useLocation } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

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

export function IncidentTracking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { incidents, updateIncidentStatus } = useData();

  const incidentId = (location.state as any)?.incidentId;
  const incident = incidentId
    ? incidents.find(i => i.id === incidentId) ?? incidents[0]
    : incidents[0];

  if (!incident) {
    return (
      <div style={{ backgroundColor: '#FFF', minHeight: '100vh', padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#6B7280' }}>Không có sự cố nào để theo dõi</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo(incident.status);
  const showActions = incident.status === 'review';

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const timelineItems = [
    { text: 'Bạn đã gửi yêu cầu', time: formatDateTime(incident.reportedAt) },
    ...(incident.status !== 'pending'
      ? [{ text: `BQL đã tiếp nhận - ${statusInfo.label}`, time: '' }]
      : []),
    ...(incident.resolvedAt
      ? [{ text: 'Đã hoàn thành', time: formatDateTime(incident.resolvedAt) }]
      : []),
  ];

  return (
    <div style={{ backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid #F3F4F6',
      }}>
        <button
          onClick={() => navigate('/resident/incidents')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <ChevronLeft size={24} color="#4B5563" />
        </button>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Chi tiết sự cố</p>
        <div style={{ width: 24 }} />
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Issue title */}
        <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4, marginTop: 0 }}>
          {getCategoryLabel(incident.category)}
        </p>

        {/* ID + date + apartment */}
        <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, marginTop: 0 }}>
          #{incident.id} · {new Date(incident.reportedAt).toLocaleDateString('vi-VN')} · Căn hộ {incident.apartment}
        </p>

        {/* Status badge */}
        <span style={{
          display: 'inline-block',
          padding: '6px 12px', borderRadius: 6,
          fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
          color: statusInfo.color, backgroundColor: statusInfo.bgColor,
          marginBottom: 24,
        }}>
          {statusInfo.label}
        </span>

        <div style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 24 }} />

        {/* Description */}
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12, marginTop: 0 }}>Mô tả</p>
        <p style={{ fontSize: 14, color: '#4B5563', lineHeight: '20px', marginBottom: 24, marginTop: 0 }}>
          {incident.description || 'Không có mô tả'}
        </p>

        {/* Before image */}
        {incident.imageUrl && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12, marginTop: 0 }}>
              Ảnh trước khi sửa
            </p>
            <div style={{
              backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
              borderRadius: 12, padding: 16, marginBottom: 24,
            }}>
              <img
                src={incident.imageUrl}
                alt="Ảnh trước khi sửa"
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
              />
              <p style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic', margin: 0 }}>
                Ảnh do cư dân gửi kèm khi báo sự cố
              </p>
            </div>
          </>
        )}

        <div style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 24 }} />

        {/* Timeline */}
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12, marginTop: 0 }}>
          Tiến độ xử lý
        </p>
        <div style={{ marginBottom: 24, paddingLeft: 8 }}>
          {timelineItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', marginBottom: 16 }}>
              <div style={{
                width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6',
                marginRight: 12, marginTop: 4, flexShrink: 0,
              }} />
              <div>
                <p style={{ fontSize: 14, color: '#4B5563', lineHeight: '20px', margin: 0 }}>{item.text}</p>
                {item.time && (
                  <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, marginBottom: 0 }}>{item.time}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Admin note */}
        {incident.resolutionNote && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12, marginTop: 0 }}>
              Ghi chú từ ban quản lý
            </p>
            <div style={{
              backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6',
              borderRadius: 12, padding: 16, marginBottom: 24,
            }}>
              <p style={{ fontSize: 14, color: '#4B5563', lineHeight: '20px', margin: 0 }}>
                {incident.resolutionNote}
              </p>
            </div>
          </>
        )}

        {/* Completion image */}
        {incident.completionImageUrl && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12, marginTop: 0 }}>
              Ảnh kết quả
            </p>
            <div style={{
              backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
              borderRadius: 12, padding: 16, marginBottom: 24,
            }}>
              <img
                src={incident.completionImageUrl}
                alt="Ảnh kết quả sửa chữa"
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
              />
              <p style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic', margin: 0 }}>
                BQL đã gửi ảnh kết quả xử lý
              </p>
            </div>
          </>
        )}

        {/* Evaluation section */}
        {showActions && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16, marginTop: 0 }}>
              Bạn có hài lòng với kết quả xử lý?
            </p>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <button
                onClick={async () => {
                  await updateIncidentStatus(incident.id, 'pending');
                  navigate('/resident/incidents');
                }}
                style={{
                  flex: 1, backgroundColor: '#FFF',
                  border: '1px solid #1E3A8A', borderRadius: 12,
                  padding: '14px 0', fontSize: 16, fontWeight: 600,
                  color: '#1E3A8A', cursor: 'pointer',
                }}
              >
                Yêu cầu sửa lại
              </button>
              <button
                onClick={async () => {
                  await updateIncidentStatus(incident.id, 'resolved');
                  navigate('/resident/incidents');
                }}
                style={{
                  flex: 1, backgroundColor: '#1E3A8A',
                  border: 'none', borderRadius: 12,
                  padding: '14px 0', fontSize: 16, fontWeight: 600,
                  color: '#FFF', cursor: 'pointer',
                }}
              >
                Hài lòng
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', margin: 0 }}>
              Lưu ý: Tự động đóng sau 48h nếu không phản hồi.
            </p>
          </>
        )}
      </div>
    </div>
  );
}