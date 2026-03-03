import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Camera, Upload } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export function CreateIncident() {
  const navigate = useNavigate();
  const { addIncident } = useData();
  const [selectedType, setSelectedType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const incidentTypes = [
    { value: 'elevator', label: 'Thang máy', icon: '🛗' },
    { value: 'water', label: 'Nước', icon: '💧' },
    { value: 'electrical', label: 'Điện', icon: '⚡' },
    { value: 'security', label: 'An ninh', icon: '🔒' },
    { value: 'cleaning', label: 'Vệ sinh', icon: '🧹' },
    { value: 'parking', label: 'Bãi xe', icon: '🚗' },
    { value: 'noise', label: 'Tiếng ồn', icon: '🔊' },
    { value: 'other', label: 'Khác', icon: '📝' },
  ];

  const handleSubmit = () => {
    if (!selectedType || !description) {
      alert('Vui lòng chọn loại sự cố và mô tả vấn đề');
      return;
    }

    // Add incident to global state
    const typeLabel = incidentTypes.find(t => t.value === selectedType)?.label || selectedType;
    addIncident({
      title: `${typeLabel}${location ? ` - ${location}` : ''}`,
      category: selectedType,
      location: location || 'Tòa A',
      description: description,
      priority: 'medium',
      reportedBy: 'Nguyễn Văn A',
      apartment: 'A-1205',
    });

    // Navigate to tracking page
    navigate('/resident/incidents/tracking');
  };

  return (
    <div className="bg-gray-50">
      {/* Sub Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3">
        <button onClick={() => navigate('/resident')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} color="var(--text-primary)" />
        </button>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Báo cáo sự cố
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p style={{ fontSize: '12px', color: 'var(--brand-primary)' }}>
            💡 Vui lòng mô tả rõ sự cố để Ban quản lý xử lý nhanh chóng
          </p>
        </div>

        {/* Incident Type Selection */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '12px' }}>
            Loại sự cố <span style={{ color: 'var(--error)' }}>*</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            {incidentTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className="p-3 rounded-xl border-2 transition-all text-left hover:shadow-md"
                style={{
                  borderColor: selectedType === type.value ? 'var(--brand-primary)' : '#D1D5DB',
                  backgroundColor: selectedType === type.value ? '#E8F0F8' : '#FFF',
                }}
              >
                <div className="flex items-center space-x-2">
                  <span style={{ fontSize: '24px' }}>{type.icon}</span>
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: selectedType === type.value ? 600 : 400,
                    color: selectedType === type.value ? 'var(--brand-primary)' : 'var(--text-primary)'
                  }}>
                    {type.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '12px' }}>
            Vị trí (Tùy chọn)
          </label>

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ví dụ: Tầng 5, phòng 1205..."
            className="w-full p-3 border-2 border-gray-300 rounded-xl focus:outline-none transition-colors"
            style={{
              fontSize: '13px',
              color: 'var(--text-primary)',
              borderColor: location ? 'var(--brand-primary)' : '#D1D5DB',
            }}
          />

          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {location.length}/500 ký tự
          </p>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '12px' }}>
            Mô tả chi tiết <span style={{ color: 'var(--error)' }}>*</span>
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ví dụ: Thang máy số 2 bị kẹt tại tầng 5, không mở cửa được..."
            rows={5}
            className="w-full p-3 border-2 border-gray-300 rounded-xl focus:outline-none transition-colors"
            style={{
              fontSize: '13px',
              color: 'var(--text-primary)',
              borderColor: description ? 'var(--brand-primary)' : '#D1D5DB',
            }}
          />

          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {description.length}/500 ký tự
          </p>
        </div>

        {/* Photo/Video Upload */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '12px' }}>
            Hình ảnh/Video (Tùy chọn)
          </label>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              className="p-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors flex flex-col items-center space-y-2"
              style={{ backgroundColor: '#F9FAFB' }}
            >
              <Camera size={28} color="var(--brand-primary)" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)' }}>
                Chụp ảnh
              </span>
            </button>

            <button
              className="p-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors flex flex-col items-center space-y-2"
              style={{ backgroundColor: '#F9FAFB' }}
            >
              <Upload size={28} color="var(--brand-primary)" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)' }}>
                Tải lên
              </span>
            </button>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            📸 Hình ảnh/video giúp Ban quản lý hiểu rõ vấn đề hơn
          </p>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '12px' }}>
            Thông tin liên hệ
          </label>

          <div className="space-y-2">
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Họ tên
              </p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                Nguyễn Văn A
              </p>
            </div>

            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Số điện thoại
              </p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                0901234567
              </p>
            </div>

            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Căn hộ
              </p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                A-1205
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl text-center shadow-md hover:shadow-lg transition-shadow"
          style={{
            backgroundColor: selectedType && description ? 'var(--brand-primary)' : '#D1D5DB',
            color: '#FFF',
            fontSize: '15px',
            fontWeight: 700,
            cursor: selectedType && description ? 'pointer' : 'not-allowed',
          }}
          disabled={!selectedType || !description}
        >
          Gửi báo cáo
        </button>
      </div>
    </div>
  );
}