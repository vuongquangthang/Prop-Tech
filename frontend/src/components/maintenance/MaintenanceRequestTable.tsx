import { ArrowRight, Eye, Filter, AlertCircle, X, Upload } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { fileService } from '../../services/feature.service';

// Modal Hoàn thành yêu cầu
function CompleteModal({ request, onClose, onComplete }: { request: any; onClose: () => void; onComplete: (adminNote: string, completionImageUrl: string) => void }) {
  const [adminNote, setAdminNote] = useState('');
  const [completionImageUrl, setCompletionImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-gray-900">Gửi kết quả sửa chữa cho cư dân</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Mã yêu cầu:</p>
                <p className="text-gray-900 font-semibold">{request.code}</p>
              </div>
              <div>
                <p className="text-gray-600">Phòng:</p>
                <p className="text-gray-900 font-semibold">{request.room}</p>
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
              className="w-full px-4 py-3 border border-gray-300 rounded resize-none focus:outline-none focus:border-gray-500"
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
              <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded hover:border-gray-400 cursor-pointer">
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
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
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

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            disabled={uploading}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!adminNote.trim() || uploading}
            className="px-6 py-3 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
        imageUrl: incident.imageUrl || '🖼️',
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

  return (
    <div className="flex h-full">
      {/* Main Table Area */}
      <div className="flex-1 flex flex-col p-8 overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center space-x-2 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm rounded-t border-2 border-b-0 transition-colors ${
                activeTab === tab.key
                  ? 'bg-white border-gray-300 text-gray-900'
                  : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label} <span className={`ml-1 ${activeTab === tab.key ? 'text-gray-900' : 'text-gray-500'}`}>({tab.count})</span>
            </button>
          ))}
        </div>
        
        {/* Filter Bar */}
        <div className="flex items-center space-x-4 mb-4">
          <Filter size={16} className="text-gray-500" />
          
          <select 
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
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
          </select>
        </div>
        
        {/* Table */}
        <div className="bg-white border-2 border-gray-300 rounded flex-1 overflow-hidden flex flex-col">
          <div className="border-b border-gray-300 px-6 py-4">
            <h2 className="text-lg text-gray-800">Danh sách yêu cầu - {filteredRequests.length} yêu cầu</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Mã yêu cầu</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Phòng</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Loại sự cố</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Mô tả</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Thời gian gửi</th>
                  {activeTab === 'new' && (
                    <th className="px-6 py-3 text-center text-sm text-gray-600">Thời gian chờ</th>
                  )}
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, index) => (
                  <tr 
                    key={request.code} 
                    className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${selectedRequest?.code === request.code ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-800">{request.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{request.room}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{request.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{request.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{request.time}</td>
                    {activeTab === 'new' && (
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm ${request.waitingHours > 24 ? 'text-red-600 font-bold animate-pulse' : 'text-gray-700'}`}>
                          {request.waitingHours}h
                          {request.waitingHours > 24 && <AlertCircle size={14} className="inline ml-1" />}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusChange(request.code, e.target.value)}
                        className={`px-3 py-1 text-xs rounded border cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 ${statusConfig[request.status as keyof typeof statusConfig].color}`}
                      >
                        {getAvailableStatuses(request.status).map(status => (
                          <option key={status} value={status}>{statusConfig[status as keyof typeof statusConfig].label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Quick View Panel */}
      {selectedRequest && (
        <div className="w-96 bg-white border-l-2 border-gray-300 flex flex-col">
          <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between bg-gray-50">
            <h3 className="text-base text-gray-800">Chi tiết yêu cầu</h3>
            <button onClick={() => setSelectedRequest(null)} className="p-1 hover:bg-gray-200 rounded">
              <X size={18} className="text-gray-600" />
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
              <span className={`inline-block px-3 py-1 text-xs rounded border ${statusConfig[selectedRequest.status as keyof typeof statusConfig].color}`}>
                {statusConfig[selectedRequest.status as keyof typeof statusConfig].label}
              </span>
            </div>
            
            {/* Description */}
            <div>
              <p className="text-xs text-gray-600 mb-2">Mô tả chi tiết</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-300">
                {selectedRequest.description}
              </p>
            </div>
            
            {/* Before & After Images */}
            <div>
              <p className="text-xs text-gray-600 mb-2">Ảnh bằng chứng</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Trước khi sửa</p>
                  {selectedRequest.imageUrl ? (
                    <img 
                      src={`${import.meta.env.VITE_API_BASE_URL}${selectedRequest.imageUrl}`}
                      alt="Trước khi sửa"
                      className="w-full h-32 object-cover rounded border border-gray-300"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">Không có ảnh</span>
                    </div>
                  )}
                </div>
                {selectedRequest.status === 'completed' && selectedRequest.fullIncident?.completionImageUrl && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Sau khi sửa</p>
                    <img 
                      src={`${import.meta.env.VITE_API_BASE_URL}${selectedRequest.fullIncident.completionImageUrl}`}
                      alt="Sau khi sửa"
                      className="w-full h-32 object-cover rounded border border-gray-300"
                    />
                  </div>
                )}
              </div>
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
        </div>
      )}

      {/* Complete Modal */}
      {completeModalRequest && (
        <CompleteModal
          request={completeModalRequest}
          onClose={() => setCompleteModalRequest(null)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}