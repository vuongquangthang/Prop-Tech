import { AlertCircle, CheckCircle2, Clock3, Circle, Filter, Image as ImageIcon, MessageSquareWarning, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useData } from '../../contexts/DataContext';
import { fileService } from '../../services/feature.service';
import { DataCard, DataTable, EmptyState, SegmentedTabs, Toolbar } from '../ui/product-system';
import { FilterSelect } from '../ui/FilterSelect';
import { ImageViewer } from '../ui/ImageViewer';
import './MaintenanceDetailModal.css';

// Modal Hoàn thành yêu cầu
function CompleteModal({ request, onClose, onComplete }: { request: any; onClose: () => void; onComplete: (adminNote: string, completionImageUrl: string) => Promise<void> }) {
  const [adminNote, setAdminNote] = useState('');
  const [completionImageUrl, setCompletionImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  const roomDisplay =
    request?.room ||
    request?.location ||
    request?.fullIncident?.location ||
    request?.fullIncident?.roomNumber ||
    request?.roomNumber ||
    (request?.fullIncident?.roomId ? `Phòng ${request.fullIncident.roomId}` : '—');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!adminNote.trim()) {
      alert('Vui lòng nhập ghi chú');
      return;
    }

    try {
      let imageUrl = completionImageUrl;
      
      // Upload file if selected
      if (selectedFile) {
        setUploading(true);
        imageUrl = await fileService.upload(selectedFile);
      }

      await onComplete(adminNote, imageUrl);
      onClose();
    } catch (error: any) {
      alert('Lỗi tải ảnh: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-content-modal-overlay" onClick={onClose}>
      <div className="admin-content-modal-panel max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="admin-content-modal-header flex items-center justify-between px-6 py-4">
          <h2>Gửi kết quả sửa chữa cho cư dân</h2>
          <button onClick={onClose} className="product-action-icon">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="app-card-subtle p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Mã yêu cầu:</p>
                <p className="text-gray-900 font-semibold">{request.code}</p>
              </div>
              <div>
                <p className="text-gray-600">Phòng:</p>
                <p className="text-gray-900 font-semibold">{roomDisplay}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-600">Nội dung yêu cầu:</p>
                <p className="text-gray-900">{request.description}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Ghi chú kết quả sửa chữa <span className="text-red-500">*</span>
            </label>
            <textarea
              className="app-textarea resize-none"
              rows={4}
              placeholder="Mô tả kết quả sửa chữa để gửi cho cư dân xẮm xét (ví dụ: đã thay bóng đèn mới, đã sửa ổ khóa cửa...)"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Ảnh kết quả (không bắt buộc)
            </label>
            <div className="space-y-3">
              {/* File picker button */}
              <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-[var(--surface-border)] rounded-[10px] hover:border-[var(--brand-primary)] cursor-pointer bg-[var(--surface-card-2)]">
                <Upload size={20} className="text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">
                  {selectedFile ? selectedFile.name : 'Chọn ảnh kết quả'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>

              {/* Image preview */}
              {imagePreview && (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded border border-gray-300"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview('');
                      setCompletionImageUrl('');
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-[10px] hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Chọn ảnh kết quả sau khi hoàn thành sửa chữa để cư dân có thể xem. Tối đa 5MB.
              </p>
            </div>
          </div>
        </div>

        <div className="admin-content-modal-footer flex justify-end gap-3 px-6 py-4">
          <button
            onClick={onClose}
            className="app-button-secondary"
            disabled={uploading}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!adminNote.trim() || uploading}
            className="app-button-primary disabled:cursor-not-allowed"
          >
            {uploading ? 'Đang gửi...' : 'Gửi cho cư dân'}
          </button>
        </div>
      </div>
    </div>
  );
}

const statusConfig = {
  new: { label: 'Chờ xử lý', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  in_progress: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  review: { label: 'Chờ nghiệm thu', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  rework: { label: 'Sửa lại', color: 'bg-red-100 text-red-800 border-red-300' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800 border-green-300' },
};

const resolveImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${import.meta.env.VITE_API_BASE_URL}${url}`;
};

// Logic chuyển trạng thái tuần tự
const getAvailableStatuses = (currentStatus: string) => {
  const statusFlow = {
    new: ['new', 'in_progress'],
    in_progress: ['in_progress', 'review'],
    // Chờ cư dân nghiệm thu trên ứng dụng; phía quản lý không được đổi trạng thái.
    review: ['review'],
    rework: ['rework', 'in_progress'],
    completed: ['completed'],
  };
  return statusFlow[currentStatus as keyof typeof statusFlow] || ['new'];
};

const formatTimelineTime = (value?: string) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

function IncidentTimeline({ request }: { request: any }) {
  const statusIndex = {
    new: 0,
    in_progress: 1,
    review: 2,
    rework: 3,
    completed: 3,
  }[request.status] ?? 0;
  const currentStepKey = request.status === 'completed'
    ? 'completed'
    : request.status === 'rework'
      ? 'rework'
      : request.status;
  const currentStatusLabel = statusConfig[request.status as keyof typeof statusConfig]?.label || 'Chưa xác định';

  const reportedAt = request.fullIncident?.reportedAt || request.time;
  const resolvedAt = request.fullIncident?.resolvedAt ? formatTimelineTime(request.fullIncident.resolvedAt) : '';
  const getInProgressTime = () => {
    if (request.status === 'new') return 'Chưa tới mốc này';
    if (request.status === 'in_progress') return 'Đang xử lý';
    return 'Đã qua bước này';
  };
  const getReviewTime = () => {
    if (request.status === 'new' || request.status === 'in_progress') return 'Chưa tới mốc này';
    if (request.status === 'review') return 'Đang chờ cư dân phản hồi';
    if (request.status === 'rework') return 'Cư dân đã yêu cầu sửa lại';
    if (request.status === 'completed') return 'Cư dân đã nghiệm thu';
    return 'Chưa tới mốc này';
  };

  const steps = [
    {
      key: 'new',
      title: '1. Cư dân báo sự cố',
      description: 'Yêu cầu đã được gửi vào hệ thống và chờ tiếp nhận.',
      time: formatTimelineTime(reportedAt),
      icon: MessageSquareWarning,
    },
    {
      key: 'in_progress',
      title: '2. Đang xử lý',
      description: 'Bộ phận vận hành đang kiểm tra và triển khai xử lý.',
      time: getInProgressTime(),
      icon: Clock3,
    },
    {
      key: 'review',
      title: '3. Chờ nghiệm thu',
      description: 'Đã gửi kết quả cho cư dân để xác nhận hoàn tất hay yêu cầu làm lại.',
      time: getReviewTime(),
      icon: CheckCircle2,
    },
    {
      key: request.status === 'rework' ? 'rework' : 'completed',
      title: request.status === 'rework' ? '4. Cư dân yêu cầu sửa lại' : '4. Hoàn thành',
      description: request.status === 'rework'
        ? 'Cư dân chưa hài lòng và yêu cầu xử lý lại sự cố.'
        : 'Sự cố được đóng sau khi cư dân xác nhận hài lòng.',
      time: request.status === 'rework' ? 'Cần xử lý lại' : resolvedAt || (request.status === 'completed' ? 'Đã hoàn thành' : 'Chưa hoàn thành'),
      icon: request.status === 'completed' ? CheckCircle2 : Circle,
    },
  ];

  return (
    <section className="dashboard-incident-section dashboard-incident-timeline-section">
      <div className="dashboard-incident-section-title">
        <Clock3 size={18} />
        <div>
          <h3>Mốc quy trình xử lý</h3>
          <p className="dashboard-incident-current-line">
            <span>Trạng thái hiện tại</span>
            <span className="dashboard-incident-current-status">{currentStatusLabel}</span>
          </p>
        </div>
      </div>

      <div className="dashboard-incident-timeline" role="list" aria-label="Mốc quy trình xử lý sự cố">
        {steps.map((step, index) => {
          const stepIndex = index;
          const isDone = request.status === 'completed' ? true : stepIndex < statusIndex;
          const isActive = request.status !== 'completed' && step.key === currentStepKey;
          const StepIcon = step.icon;

          return (
            <div
              key={step.key}
              role="listitem"
              className={`dashboard-incident-timeline-item ${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''}`}
            >
              <div className="dashboard-incident-timeline-marker">
                <StepIcon size={16} />
              </div>
              <div className="dashboard-incident-timeline-content">
                <div className="dashboard-incident-timeline-title-row">
                  <h4>{step.title}</h4>
                  {isActive && <span className="dashboard-incident-current-badge">Hiện tại</span>}
                </div>
                <p>{step.description}</p>
                <strong>{step.time}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function MaintenanceRequestTable() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('new');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [completeModalRequest, setCompleteModalRequest] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<{ images: string[]; index: number; titlePrefix: string } | null>(null);
  const [filterType, setFilterType] = useState('all');
  
  // Get data from context
  const dataContext = useData();
  const { incidents, updateIncidentStatus } = dataContext;

  // Convert Incident[] to Request[] format
  const requests = useMemo(() => {
    if (!incidents || incidents.length === 0) {
      return [];
    }
    
    return incidents.map(incident => {
      // Map category to type
      const typeMap: Record<string, string> = {
        'electrical': 'Điện',
        'water': 'Nước',
        'plumbing': 'Nước',
        'elevator': 'Tài sản',
        'facility': 'Tài sản',
        'security': 'An ninh',
        'cleaning': 'Vệ sinh',
        'parking': 'Bãi xe',
        'noise': 'Tiếng ồn',
        'other': 'Khác',
      };

      // Map status
      const statusMap: Record<string, string> = {
        'pending': 'new',
        'in-progress': 'in_progress',
        'review': 'review',
        'rework': 'rework',
        'resolved': 'completed',
      };

      // Calculate waiting hours
      const reportedDate = new Date(incident.reportedAt);
      const now = new Date();
      const waitingHours = Math.floor((now.getTime() - reportedDate.getTime()) / (1000 * 60 * 60));

      // Format time
      const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      };

      return {
        code: incident.id,
        room: incident.location || incident.apartment,
        type: typeMap[incident.category] || incident.category || 'Khác',
        time: formatTime(incident.reportedAt),
        waitingHours,
        status: statusMap[incident.status] || 'new',
        description: incident.description,
        imageUrl: incident.imageUrl || '',
        assignee: incident.assignedTo,
        fullIncident: incident, // Keep original incident data
      };
    });
  }, [incidents]);

  useEffect(() => {
    const requestId = searchParams.get('requestId');
    const requestedStatus = searchParams.get('status');
    if (requestedStatus && ['new', 'in_progress', 'review', 'rework', 'completed'].includes(requestedStatus)) {
      setActiveTab(requestedStatus);
    }
    if (!requestId || requests.length === 0) return;

    const request = requests.find((item) => String(item.code) === requestId);
    if (!request) return;

    setActiveTab(request.status);
    setSelectedRequest(request);
  }, [requests, searchParams]);

  // Filter theo cả status (tab) và type (loại sự cố)
  const filteredRequests = requests.filter(req => {
    const matchStatus = req.status === activeTab;
    const matchType = filterType === 'all' || req.type === filterType;
    return matchStatus && matchType;
  });

  // Tính toán số lượng động cho từng tab
  const tabs = [
    { key: 'new', label: 'Chờ xử lý', count: requests.filter(r => r.status === 'new').length },
    { key: 'rework', label: 'Sửa lại', count: requests.filter(r => r.status === 'rework').length },
    { key: 'in_progress', label: 'Đang xử lý', count: requests.filter(r => r.status === 'in_progress').length },
    { key: 'review', label: 'Chờ nghiệm thu', count: requests.filter(r => r.status === 'review').length },
    { key: 'completed', label: 'Hoàn thành', count: requests.filter(r => r.status === 'completed').length },
  ];

  const handleStatusChange = (requestCode: string, newStatus: string) => {
    const request = requests.find(req => req.code === requestCode);
    if (request && request.fullIncident) {
      // Moving to "Chờ nghiệm thu" → show modal to add note, image and send to resident
      if (newStatus === 'review') {
        setCompleteModalRequest(request);
        return;
      }
      
      // Map status back to incident status
      const statusMapReverse: Record<string, string> = {
        'new': 'pending',
        'in_progress': 'in-progress',
        'review': 'review',
        'rework': 'rework',
        'completed': 'resolved',
      };
      
      updateIncidentStatus(request.fullIncident.id, statusMapReverse[newStatus] as any);
    }
    
    // Update selected request if it's the one being changed
    if (selectedRequest?.code === requestCode) {
      setSelectedRequest({ ...selectedRequest, status: newStatus });
    }
  };

  const handleComplete = async (adminNote: string, completionImageUrl: string) => {
    if (completeModalRequest && completeModalRequest.fullIncident) {
      await updateIncidentStatus(completeModalRequest.fullIncident.id, 'review', adminNote, completionImageUrl);
      setSelectedRequest((currentRequest: any) => {
        if (currentRequest?.code !== completeModalRequest.code) return currentRequest;

        return {
          ...currentRequest,
          status: 'review',
          fullIncident: {
            ...currentRequest.fullIncident,
            status: 'review',
            resolutionNote: adminNote,
            completionImageUrl,
          },
        };
      });
    }
  };

  const residentEvidenceImages = (() => {
    const images: string[] = [];
    const mediaUrls = selectedRequest?.fullIncident?.mediaUrls;

    if (mediaUrls) {
      try {
        const parsedUrls = JSON.parse(mediaUrls) as string[];
        if (Array.isArray(parsedUrls)) {
          images.push(...parsedUrls.map((url) => resolveImageUrl(url)).filter(Boolean));
        }
      } catch {
        // Fall back to the legacy single image below.
      }
    }

    if (images.length === 0 && selectedRequest?.imageUrl) {
      images.push(resolveImageUrl(selectedRequest.imageUrl));
    }

    return images;
  })();
  const completionImageUrl = resolveImageUrl(selectedRequest?.fullIncident?.completionImageUrl);
  const evidenceImages = completionImageUrl
    ? [...residentEvidenceImages, completionImageUrl]
    : residentEvidenceImages;

  return (
    <div className="space-y-5">
      <Toolbar>
        <SegmentedTabs items={tabs} activeKey={activeTab} onChange={setActiveTab} />
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-[var(--text-muted)]" />
          <FilterSelect
            className="app-select w-auto min-w-[190px]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tất cả loại sự cố</option>
            <option value="Điện">Điện</option>
            <option value="Nước">Nước</option>
            <option value="Tài sản">Tài sản</option>
            <option value="An ninh">An ninh</option>
            <option value="Vệ sinh">Vệ sinh</option>
            <option value="Bãi xe">Bãi xe</option>
            <option value="Tiếng ồn">Tiếng ồn</option>
            <option value="Khác">Khác</option>
          </FilterSelect>
        </div>
      </Toolbar>
      
      <div>
        <DataCard title={`Danh sách yêu cầu · ${filteredRequests.length} yêu cầu`} description="Chọn một dòng để xem nhanh chi tiết xử lý.">
          {filteredRequests.length === 0 ? (
            <EmptyState title="Không có yêu cầu phù hợp" description="Không có yêu cầu nào trong trạng thái hoặc loại sự cố đang chọn." />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>Mã yêu cầu</th>
                  <th>Phòng</th>
                  <th>Loại sự cố</th>
                  <th>Mô tả</th>
                  <th>Thời gian gửi</th>
                  {activeTab === 'new' && (
                    <th>Thời gian chờ</th>
                  )}
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr 
                    key={request.code} 
                    className={`cursor-pointer ${selectedRequest?.code === request.code ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <td className="font-semibold text-[var(--brand-primary)]">{request.code}</td>
                    <td>{request.room}</td>
                    <td>{request.type}</td>
                    <td className="max-w-[280px] truncate">{request.description}</td>
                    <td>{request.time}</td>
                    {activeTab === 'new' && (
                      <td>
                        <span className={`text-sm ${request.waitingHours > 24 ? 'text-red-600 font-bold animate-pulse' : 'text-gray-700'}`}>
                          {request.waitingHours}h
                          {request.waitingHours > 24 && <AlertCircle size={14} className="inline ml-1" />}
                        </span>
                      </td>
                    )}
                    <td onClick={(e) => e.stopPropagation()}>
                      <FilterSelect
                        value={request.status}
                        onChange={(e) => handleStatusChange(request.code, e.target.value)}
                        className="px-3 py-1 text-xs focus:outline-none"
                      >
                        {getAvailableStatuses(request.status).map(status => (
                          <option key={status} value={status}>{statusConfig[status as keyof typeof statusConfig].label}</option>
                        ))}
                      </FilterSelect>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </DataCard>
      
      {selectedRequest && (
        <div className="admin-content-modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="admin-content-modal-panel dashboard-incident-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-content-modal-header dashboard-incident-modal-header">
              <div className="dashboard-incident-heading">
                <div>
                  <span>Yêu cầu sửa chữa #{selectedRequest.code}</span>
                  <h2>{selectedRequest.type}</h2>
                  <p>{selectedRequest.room}</p>
                </div>
              </div>
              <div className="dashboard-incident-header-actions">
                <span className={`dashboard-incident-status ${
                  selectedRequest.status === 'completed'
                    ? 'is-completed'
                    : selectedRequest.status === 'in_progress' || selectedRequest.status === 'review'
                      ? 'is-processing'
                      : 'is-pending'
                }`}>
                  {statusConfig[selectedRequest.status as keyof typeof statusConfig].label}
                </span>
                <button type="button" className="product-action-icon" aria-label="Đóng" onClick={() => setSelectedRequest(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="dashboard-incident-modal-body">
              <main className="dashboard-incident-main">
                <IncidentTimeline request={selectedRequest} />

                <section className="dashboard-incident-section">
                  <div className="dashboard-incident-section-title">
                    <MessageSquareWarning size={18} />
                    <div>
                      <h3>Nội dung sự cố</h3>
                      <p>Thông tin do cư dân cung cấp</p>
                    </div>
                  </div>
                  <div className="dashboard-incident-description">
                    {selectedRequest.description || 'Không có mô tả chi tiết.'}
                  </div>
                </section>

                {residentEvidenceImages.length > 0 && (
                  <section className="dashboard-incident-section">
                    <div className="dashboard-incident-section-title">
                      <ImageIcon size={18} />
                      <div>
                        <h3>Ảnh cư dân gửi</h3>
                        <p>{residentEvidenceImages.length} ảnh đính kèm</p>
                      </div>
                    </div>
                    <div className="dashboard-incident-image-grid">
                      {residentEvidenceImages.map((imageUrl, index) => (
                        <button
                          key={imageUrl}
                          type="button"
                          className="dashboard-incident-image"
                          onClick={() => setPreviewImage({ images: evidenceImages, index, titlePrefix: 'Ảnh sửa chữa' })}
                        >
                          <img src={imageUrl} alt={`Ảnh sự cố ${index + 1}`} />
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <section className="dashboard-incident-section">
                  <div className="dashboard-incident-section-title">
                    <CheckCircle2 size={18} />
                    <div>
                      <h3>Kết quả xử lý</h3>
                      <p>Ghi chú từ bộ phận vận hành</p>
                    </div>
                  </div>
                  {selectedRequest.fullIncident?.resolutionNote ? (
                    <div className="dashboard-incident-note">{selectedRequest.fullIncident.resolutionNote}</div>
                  ) : (
                    <div className="dashboard-incident-empty">Chưa có ghi chú xử lý cho yêu cầu này.</div>
                  )}
                  {completionImageUrl && (
                    <div className="dashboard-incident-completion-image">
                      <button
                        type="button"
                        className="dashboard-incident-image"
                        onClick={() => setPreviewImage({
                          images: evidenceImages,
                          index: Math.max(evidenceImages.length - 1, 0),
                          titlePrefix: 'Ảnh sửa chữa',
                        })}
                      >
                        <img src={completionImageUrl} alt="Ảnh sau khi xử lý" />
                      </button>
                    </div>
                  )}
                </section>
              </main>

              <aside className="dashboard-incident-sidebar">
                <h3>Thông tin yêu cầu</h3>
                <div className="dashboard-incident-meta-list">
                  <div><span>Mã yêu cầu</span><strong>#{selectedRequest.code}</strong></div>
                  <div><span>Vị trí</span><strong>{selectedRequest.room}</strong></div>
                  <div><span>Người báo</span><strong>{selectedRequest.fullIncident?.reportedBy || 'Chưa cập nhật'}</strong></div>
                  <div><span>Loại sự cố</span><strong>{selectedRequest.type}</strong></div>
                  <div><span>Thời gian gửi</span><strong>{selectedRequest.time}</strong></div>
                  {selectedRequest.assignee && (
                    <div><span>Người xử lý</span><strong>{selectedRequest.assignee}</strong></div>
                  )}
                </div>
              </aside>
            </div>

            <div className="admin-content-modal-footer dashboard-incident-modal-footer">
              <button type="button" className="app-button-secondary" onClick={() => setSelectedRequest(null)}>
                Đóng
              </button>
              {getAvailableStatuses(selectedRequest.status)
                .filter((status) => status !== selectedRequest.status)
                .map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="app-button-primary"
                    onClick={() => handleStatusChange(selectedRequest.code, status)}
                  >
                    {status === 'new' ? 'Chuyển về ' : 'Chuyển sang '}
                    {statusConfig[status as keyof typeof statusConfig].label}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Complete Modal */}
      {completeModalRequest && (
        <CompleteModal
          request={completeModalRequest}
          onClose={() => setCompleteModalRequest(null)}
          onComplete={handleComplete}
        />
      )}

      {previewImage && (
        <ImageViewer
          images={previewImage.images}
          initialIndex={previewImage.index}
          titlePrefix={previewImage.titlePrefix}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}
