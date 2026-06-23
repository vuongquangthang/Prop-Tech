import { ArrowRight, Eye, Filter, AlertCircle, X, Upload } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { fileService } from '../../services/feature.service';
import { DataCard, DataTable, EmptyState, PageHeader, SegmentedTabs, Toolbar } from '../ui/product-system';
import { FilterSelect } from '../ui/FilterSelect';
import { ImageViewer } from '../ui/ImageViewer';

// Modal Hoàn thành yêu cầu
function CompleteModal({ request, onClose, onComplete }: { request: any; onClose: () => void; onComplete: (adminNote: string, completionImageUrl: string) => void }) {
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

      onComplete(adminNote, imageUrl);
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
    // In review: wait for resident feedback or send back to pending.
    review: ['review', 'new'],
    completed: ['completed'],
  };
  return statusFlow[currentStatus as keyof typeof statusFlow] || ['new'];
};

export function MaintenanceRequestTable() {
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

  // Filter theo cả status (tab) và type (loại sự cố)
  const filteredRequests = requests.filter(req => {
    const matchStatus = req.status === activeTab;
    const matchType = filterType === 'all' || req.type === filterType;
    return matchStatus && matchType;
  });

  // Tính toán số lượng động cho từng tab
  const tabs = [
    { key: 'new', label: 'Chờ xử lý', count: requests.filter(r => r.status === 'new').length },
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
        'completed': 'resolved',
      };
      
      updateIncidentStatus(request.fullIncident.id, statusMapReverse[newStatus] as any);
    }
    
    // Update selected request if it's the one being changed
    if (selectedRequest?.code === requestCode) {
      setSelectedRequest({ ...selectedRequest, status: newStatus });
    }
  };

  const handleComplete = (adminNote: string, completionImageUrl: string) => {
    if (completeModalRequest && completeModalRequest.fullIncident) {
      updateIncidentStatus(completeModalRequest.fullIncident.id, 'review', adminNote, completionImageUrl);
      if (selectedRequest?.code === completeModalRequest.code) {
        setSelectedRequest({ ...selectedRequest, status: 'review' });
      }
    }
  };

  const evidenceImages = (() => {
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

    const completionImageUrl = selectedRequest?.fullIncident?.completionImageUrl;
    if (completionImageUrl) {
      images.push(resolveImageUrl(completionImageUrl));
    }

    return images;
  })();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Vận hành"
        title="Quản lý yêu cầu sửa chữa"
        description="Điều phối trạng thái, theo dõi SLA và gửi kết quả xử lý cho cư dân."
      />

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
      
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_384px]">
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
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusChange(request.code, e.target.value)}
                        className={`cursor-pointer rounded-[10px] border px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)] ${statusConfig[request.status as keyof typeof statusConfig].color}`}
                      >
                        {getAvailableStatuses(request.status).map(status => (
                          <option key={status} value={status}>{statusConfig[status as keyof typeof statusConfig].label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </DataCard>
      
      {/* Quick View Panel */}
      {selectedRequest && (
        <aside className="product-card flex flex-col overflow-hidden">
          <div className="product-card-header">
            <div>
              <h2>Chi tiết yêu cầu</h2>
              <p>Thông tin xử lý và bằng chứng ảnh</p>
            </div>
            <button onClick={() => setSelectedRequest(null)} className="product-action-icon">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Basic Info */}
            <div>
              <p className="text-xs text-gray-600 mb-1">Mã yêu cầu</p>
              <p className="text-sm text-gray-900">{selectedRequest.code}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Phòng</p>
                <p className="text-sm text-gray-900">{selectedRequest.room}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Loại sự cố</p>
                <p className="text-sm text-gray-900">{selectedRequest.type}</p>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-gray-600 mb-1">Trạng thái</p>
              <span className={`product-status-badge ${selectedRequest.status === 'completed' ? 'is-success' : selectedRequest.status === 'review' ? 'is-info' : selectedRequest.status === 'in_progress' ? 'is-warning' : 'is-brand'}`}>
                {statusConfig[selectedRequest.status as keyof typeof statusConfig].label}
              </span>
            </div>
            
            {/* Description */}
            <div>
              <p className="text-xs text-gray-600 mb-2">Mô tả chi tiết</p>
              <p className="app-card-subtle p-3 text-sm text-gray-700">
                {selectedRequest.description}
              </p>
            </div>
            
            {/* Before & After Images */}
            <div>
              <p className="text-xs text-gray-600 mb-2">Ảnh bằng chứng</p>
              
              {/* Before images (multiple) */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Trước khi sửa</p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedRequest.fullIncident?.mediaUrls ? (() => {
                    try {
                      const urls = JSON.parse(selectedRequest.fullIncident.mediaUrls) as string[];
                      if (Array.isArray(urls) && urls.length > 0) {
                        return urls.map((url: string, idx: number) => (
                          <button key={idx} type="button" onClick={() => setPreviewImage({ images: evidenceImages, index: idx, titlePrefix: 'Ảnh sửa chữa' })} className="block w-full text-left">
                            <img
                              src={resolveImageUrl(url)}
                              alt={`Ảnh trước khi sửa ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border border-gray-300 hover:opacity-90"
                            />
                          </button>
                        ));
                      }
                    } catch {
                      // Fall back to single image URL
                    }
                    return null;
                  })() : null}
                  {!selectedRequest.fullIncident?.mediaUrls && selectedRequest.imageUrl && (
                    <button type="button" onClick={() => setPreviewImage({ images: evidenceImages, index: 0, titlePrefix: 'Ảnh sửa chữa' })} className="block w-full text-left">
                      <img 
                        src={resolveImageUrl(selectedRequest.imageUrl)}
                        alt="Trước khi sửa"
                        className="w-full h-24 object-cover rounded border border-gray-300 hover:opacity-90"
                      />
                    </button>
                  )}
                  {!selectedRequest.fullIncident?.mediaUrls && !selectedRequest.imageUrl && (
                    <div className="col-span-3 h-24 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">Không có ảnh</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* After image (single) */}
              {selectedRequest.status === 'completed' && selectedRequest.fullIncident?.completionImageUrl && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Sau khi sửa</p>
                  <button
                    type="button"
                    onClick={() => setPreviewImage({
                      images: evidenceImages,
                      index: Math.max(evidenceImages.length - 1, 0),
                      titlePrefix: 'Ảnh sửa chữa',
                    })}
                    className="block w-full text-left"
                  >
                    <img 
                      src={resolveImageUrl(selectedRequest.fullIncident.completionImageUrl)}
                      alt="Sau khi sửa"
                      className="w-full h-32 object-cover rounded border border-gray-300 hover:opacity-90"
                    />
                  </button>
                </div>
              )}
            </div>
            
            {/* Assignee */}
            {selectedRequest.assignee && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Người xử lý</p>
                <p className="text-sm text-gray-900">{selectedRequest.assignee}</p>
              </div>
            )}
            
            {/* Admin Note */}
            {selectedRequest.fullIncident?.resolutionNote && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Ghi chú từ BQL</p>
                <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded border border-yellow-200">
                  {selectedRequest.fullIncident.resolutionNote}
                </p>
              </div>
            )}
            
          </div>
        </aside>
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
