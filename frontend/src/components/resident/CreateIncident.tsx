import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Camera, Images, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const ISSUE_TYPES = [
  { value: 'elevator',   label: 'Thang máy', icon: '🛗' },
  { value: 'water',      label: 'Nước',       icon: '💧' },
  { value: 'electrical', label: 'Điện',       icon: '⚡' },
  { value: 'security',   label: 'An ninh',    icon: '🔒' },
  { value: 'cleaning',   label: 'Vệ sinh',    icon: '🧹' },
  { value: 'parking',    label: 'Bãi xe',     icon: '🚗' },
  { value: 'noise',      label: 'Tiếng ồn',   icon: '🔊' },
  { value: 'other',      label: 'Khác',       icon: '📝' },
];

export function CreateIncident() {
  const navigate = useNavigate();
  const { addIncident } = useData();
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          setImages(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedType || !description.trim()) {
      alert('Vui lòng chọn loại sự cố và mô tả vấn đề');
      return;
    }
    setSubmitting(true);
    try {
      const typeLabel = ISSUE_TYPES.find(t => t.value === selectedType)?.label ?? selectedType;
      await addIncident({
        title: typeLabel,
        category: selectedType,
        location: '',
        description: description.trim(),
        priority: 'medium',
        reportedBy: '',
        apartment: '',
      });
      navigate('/resident/incidents');
    } catch {
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#FFF', borderBottom: '1px solid #F3F4F6',
        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/resident/incidents')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <ChevronLeft size={22} color="#111827" />
        </button>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Báo cáo sự cố</p>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Description text */}
        <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
          Vui lòng chọn loại sự cố và mô tả chi tiết để Ban quản lý có thể xử lý nhanh chóng.
        </p>

        {/* Issue type grid */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
            Loại sự cố <span style={{ color: '#EF4444' }}>*</span>
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}>
            {ISSUE_TYPES.map(type => {
              const active = selectedType === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  style={{
                    padding: '14px 10px',
                    borderRadius: 14,
                    border: active ? '2px solid #2563EB' : '1.5px solid #E5E7EB',
                    backgroundColor: active ? '#EFF6FF' : '#FFF',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 6,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{type.icon}</span>
                  <span style={{
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    color: active ? '#2563EB' : '#374151',
                  }}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description textarea */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>
            Mô tả chi tiết <span style={{ color: '#EF4444' }}>*</span>
          </p>
          <div style={{ position: 'relative' }}>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Nhập mô tả tình trạng hư hỏng, vị trí, mức độ,..."
              maxLength={500}
              style={{
                width: '100%', minHeight: 100,
                padding: '10px 12px',
                border: `1.5px solid ${description ? '#2563EB' : '#E5E7EB'}`,
                borderRadius: 12,
                fontSize: 13, color: '#111827',
                resize: 'none', outline: 'none',
                backgroundColor: '#FFF',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
            <p style={{
              position: 'absolute', bottom: 8, right: 12,
              fontSize: 11, color: '#9CA3AF', margin: 0,
            }}>
              {description.length}/500
            </p>
          </div>
        </div>

        {/* Image upload */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>
            Hình ảnh (Tùy chọn)
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            {/* Camera capture */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              style={{
                flex: 1, padding: '12px 0',
                border: '1.5px dashed #2563EB', borderRadius: 12,
                backgroundColor: '#F8FAFF', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6,
              }}
            >
              <Camera size={22} color="#2563EB" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#2563EB' }}>Camera</span>
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Library picker */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1, padding: '12px 0',
                border: '1.5px dashed #2563EB', borderRadius: 12,
                backgroundColor: '#F8FAFF', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6,
              }}
            >
              <Images size={22} color="#2563EB" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#2563EB' }}>Thư viện</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {/* Image preview grid */}
          {images.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
              {images.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: 72, height: 72 }}>
                  <img
                    src={src}
                    alt={`Ảnh ${i + 1}`}
                    style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', border: '1px solid #E5E7EB' }}
                  />
                  <button
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 20, height: 20, borderRadius: '50%',
                      backgroundColor: '#EF4444', border: 'none',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X size={12} color="#FFF" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p style={{ fontSize: 11, color: '#9CA3AF' }}>
            📸 Hình ảnh giúp Ban quản lý hiểu rõ vấn đề hơn
          </p>
        </div>
      </div>

      {/* Sticky Footer */}
      <div style={{
        backgroundColor: '#FFF', borderTop: '1px solid #F3F4F6',
        padding: '12px 16px', display: 'flex', gap: 10, flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/resident/incidents')}
          style={{
            flex: 1, padding: '12px 0',
            border: '1.5px solid #E5E7EB', borderRadius: 12,
            backgroundColor: '#FFF', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: '#374151',
          }}
        >
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedType || !description.trim() || submitting}
          style={{
            flex: 2, padding: '12px 0',
            backgroundColor: selectedType && description.trim() ? '#1E3A8A' : '#D1D5DB',
            border: 'none', borderRadius: 12,
            cursor: selectedType && description.trim() ? 'pointer' : 'not-allowed',
            fontSize: 14, fontWeight: 700, color: '#FFF',
          }}
        >
          {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </button>
      </div>
    </div>
  );
}
