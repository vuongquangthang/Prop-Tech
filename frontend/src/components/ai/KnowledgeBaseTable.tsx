import { Plus, Upload, Edit, Trash2, Filter, Settings } from 'lucide-react';
import { useState } from 'react';
import { AddKnowledgeModal, EditKnowledgeModal, DeleteKnowledgeModal, UploadFileModal, ManageCategoryModal } from './KnowledgeModals';

const knowledgeData = [
  { 
    id: 'KB-001', 
    question: 'Giờ truy cập hồ bơi là mấy giờ?', 
    answer: 'Hồ bơi mở cửa từ 6:00 - 22:00 hàng ngày. Vui lòng mang theo thẻ cư dân.', 
    category: 'Nội quy',
    active: true
  },
  { 
    id: 'KB-002', 
    question: 'Làm thế nào để đăng ký thẻ xe?', 
    answer: 'Quý cư dân vui lòng mang CMND + Giấy đăng ký xe đến văn phòng quản lý tầng trệt, thời gian làm việc 8:00-17:00.', 
    category: 'Thủ tục hành chính',
    active: true
  },
  { 
    id: 'KB-003', 
    question: 'Giá dịch vụ quản lý là bao nhiêu?', 
    answer: 'Phí quản lý: 15.000 VNĐ/m²/tháng. Phí gửi xe máy: 100.000 VNĐ/tháng. Phí gửi ô tô: 1.500.000 VNĐ/tháng.', 
    category: 'Giá dịch vụ',
    active: true
  },
  { 
    id: 'KB-004', 
    question: 'Khi nào phải nộp hóa đơn hàng tháng?', 
    answer: 'Hóa đơn phát hành vào ngày 1 hàng tháng. Hạn thanh toán là ngày 5. Sau ngày 5 sẽ bị tính phí trễ hạn.', 
    category: 'Tài chính',
    active: true
  },
  { 
    id: 'KB-005', 
    question: 'Tôi có thể nuôi thú cưng trong căn hộ không?', 
    answer: 'Được phép nuôi chó/mèo dưới 5kg. Cần đăng ký với Ban quản lý và có đầy đủ giấy tờ tiêm phòng.', 
    category: 'Nội quy',
    active: false
  },
  { 
    id: 'KB-006', 
    question: 'Làm sao để báo sửa chữa?', 
    answer: 'Vui lòng sử dụng tính năng "Báo sự cố" trong App cư dân hoặc gọi hotline 1900xxxx.', 
    category: 'Kỹ thuật',
    active: true
  },
];

const categoryColors: Record<string, string> = {
  'Nội quy': 'bg-blue-100 text-blue-800 border-blue-300',
  'Thủ tục hành chính': 'bg-purple-100 text-purple-800 border-purple-300',
  'Giá dịch vụ': 'bg-green-100 text-green-800 border-green-300',
  'Tài chính': 'bg-orange-100 text-orange-800 border-orange-300',
  'Kỹ thuật': 'bg-red-100 text-red-800 border-red-300',
};

export function KnowledgeBaseTable() {
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [manageCategoryModal, setManageCategoryModal] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState(null);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Tổng câu hỏi</p>
          <p className="text-2xl text-gray-900">156</p>
          <p className="text-xs text-gray-600 mt-1">câu hỏi</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Đang hoạt động</p>
          <p className="text-2xl text-green-600">142</p>
          <p className="text-xs text-gray-600 mt-1">câu hỏi</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Tạm dừng</p>
          <p className="text-2xl text-gray-600">14</p>
          <p className="text-xs text-gray-600 mt-1">câu hỏi</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Danh mục</p>
          <p className="text-2xl text-gray-900">8</p>
          <p className="text-xs text-gray-600 mt-1">danh mục</p>
        </div>
      </div>
      
      {/* Filter & Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter size={16} className="text-gray-500" />
          
          <select className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
            <option>Tất cả danh mục</option>
            <option>Nội quy</option>
            <option>Thủ tục hành chính</option>
            <option>Giá dịch vụ</option>
            <option>Tài chính</option>
            <option>Kỹ thuật</option>
          </select>
          
          <select className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
            <option>Tất cả trạng thái</option>
            <option>Đang hoạt động</option>
            <option>Tạm dừng</option>
          </select>
          
          <input 
            type="text"
            placeholder="Tìm kiếm câu hỏi..."
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500 w-64"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setUploadModal(true)}
            className="px-4 py-2 bg-white border border-gray-800 text-gray-800 text-sm rounded hover:bg-gray-50 flex items-center space-x-2"
          >
            <Upload size={16} />
            <span>Nhập file PDF/Doc</span>
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Thêm tri thức mới</span>
          </button>
          <button 
            onClick={() => setManageCategoryModal(true)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 flex items-center space-x-2"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-lg text-gray-800">Kho tri thức - {knowledgeData.length} mục</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Mã KB</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Câu hỏi mẫu</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Câu trả lời</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Danh mục</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Hiệu lực</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {knowledgeData.map((kb, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">{kb.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                    <div className="truncate">{kb.question}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                    <div className="truncate">{kb.answer}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 text-xs rounded border ${categoryColors[kb.category]}`}>
                      {kb.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={kb.active}
                        className="sr-only peer"
                        readOnly
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                    </label>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedKnowledge(kb);
                          setEditModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded" title="Sửa">
                        <Edit size={16} className="text-gray-600" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedKnowledge(kb);
                          setDeleteModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded" title="Xóa">
                        <Trash2 size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-300 rounded p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Hướng dẫn:</strong> Danh mục được phân biệt bằng màu sắc để dễ nhận diện. Tắt "Hiệu lực" để tạm ngừng câu trả lời mà không cần xóa. Chức năng "Nhập file PDF/Doc" hỗ trợ RAG để AI tự phân tích nội quy.
        </p>
      </div>
      
      {/* Add Knowledge Modal */}
      {showModal && (
        <AddKnowledgeModal onClose={() => setShowModal(false)} />
      )}
      
      {/* Edit Knowledge Modal */}
      {editModal && selectedKnowledge && (
        <EditKnowledgeModal knowledge={selectedKnowledge} onClose={() => setEditModal(false)} />
      )}
      
      {/* Delete Knowledge Modal */}
      {deleteModal && selectedKnowledge && (
        <DeleteKnowledgeModal knowledge={selectedKnowledge} onClose={() => setDeleteModal(false)} />
      )}
      
      {/* Upload File Modal */}
      {uploadModal && (
        <UploadFileModal onClose={() => setUploadModal(false)} />
      )}
      
      {/* Manage Category Modal */}
      {manageCategoryModal && (
        <ManageCategoryModal onClose={() => setManageCategoryModal(false)} />
      )}
    </div>
  );
}