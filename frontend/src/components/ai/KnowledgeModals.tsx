import { X, Plus, Upload, Edit, Trash2, FileText, AlertTriangle, Check, FolderPlus, Settings } from 'lucide-react';
import { useState } from 'react';

interface KnowledgeModalProps {
  knowledge?: any;
  onClose: () => void;
}

export function AddKnowledgeModal({ onClose }: KnowledgeModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('Nội quy');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[700px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Plus size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Thêm tri thức mới</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Hướng dẫn:</strong> Thêm câu hỏi-trả lời để Trợ lý AI có thể trả lời cư dân tự động. 
              Nên nhập nhiều biến thể câu hỏi để AI hiểu tốt hơn.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2 font-bold">Danh mục *</label>
            <div className="flex items-center space-x-2">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
              >
                <option value="Nội quy">🏢 Nội quy</option>
                <option value="Thủ tục hành chính">📋 Thủ tục hành chính</option>
                <option value="Giá dịch vụ">💰 Giá dịch vụ</option>
                <option value="Tài chính">💳 Tài chính</option>
                <option value="Kỹ thuật">🔧 Kỹ thuật</option>
                <option value="Tiện ích">🏊 Tiện ích</option>
                <option value="An ninh">🔐 An ninh</option>
                <option value="Khác">📌 Khác</option>
              </select>
              <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 flex items-center space-x-1">
                <FolderPlus size={16} />
                <span>Thêm mới</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Không thấy danh mục? Nhấn "Thêm mới" hoặc vào <strong>Cài đặt danh mục</strong>
            </p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-2 font-bold">Câu hỏi mẫu * (Có thể nhiều biến thể)</label>
            <input 
              type="text"
              placeholder="Ví dụ: Giờ truy cập hồ bơi là mấy giờ?"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 mb-2"
            />
            <input 
              type="text"
              placeholder="Biến thể: Hồ bơi mở cửa lúc mấy giờ?"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 mb-2"
            />
            <input 
              type="text"
              placeholder="Biến thể: Khi nào có thể đi bơi?"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
            <button className="mt-2 text-xs text-blue-700 hover:underline">
              + Thêm biến thể câu hỏi
            </button>
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-2 font-bold">Câu trả lời * (AI sẽ dùng để trả lời)</label>
            <textarea 
              rows={6}
              placeholder="Ví dụ: Hồ bơi mở cửa từ 6:00 - 22:00 hàng ngày. Quý cư dân vui lòng mang theo thẻ cư dân khi sử dụng. Trẻ em dưới 12 tuổi phải có người lớn đi cùng."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                Nên viết rõ ràng, đầy đủ thông tin. AI sẽ diễn đạt lại theo ngữ cảnh.
              </p>
              <span className="text-xs text-gray-500">0/500</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2 font-bold">Từ khóa liên quan (để tìm kiếm)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 border border-gray-300 text-xs rounded">
                hồ bơi
                <button className="ml-1 text-gray-600 hover:text-red-600">×</button>
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 border border-gray-300 text-xs rounded">
                giờ mở cửa
                <button className="ml-1 text-gray-600 hover:text-red-600">×</button>
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 border border-gray-300 text-xs rounded">
                tiện ích
                <button className="ml-1 text-gray-600 hover:text-red-600">×</button>
              </span>
            </div>
            <input 
              type="text"
              placeholder="Nhập từ khóa và Enter..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-700 font-bold mb-3">Tùy chọn nâng cao</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 font-bold">Kích hoạt ngay</p>
                  <p className="text-xs text-gray-500">AI sẽ sử dụng câu trả lời này ngay lập tức</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 font-bold">Ưu tiên cao</p>
                  <p className="text-xs text-gray-500">AI sẽ ưu tiên câu trả lời này nếu có nhiều kết quả</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 font-bold">Cần xác nhận người quản lý</p>
                  <p className="text-xs text-gray-500">AI sẽ đề xuất nhưng cần BQL xác nhận trước khi gửi</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2"
          >
            <Check size={16} />
            <span>Lưu tri thức</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditKnowledgeModal({ knowledge, onClose }: KnowledgeModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[700px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Edit size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Chỉnh sửa tri thức - {knowledge?.id}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-300 rounded p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Lưu ý:</strong> Tri thức này đã được sử dụng <strong>127 lần</strong> trong 30 ngày qua. 
              Thay đổi có thể ảnh hưởng đến câu trả lời của AI.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2 font-bold">Danh mục *</label>
            <select 
              defaultValue={knowledge?.category}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
            >
              <option value="Nội quy">🏢 Nội quy</option>
              <option value="Thủ tục hành chính">📋 Thủ tục hành chính</option>
              <option value="Giá dịch vụ">💰 Giá dịch vụ</option>
              <option value="Tài chính">💳 Tài chính</option>
              <option value="Kỹ thuật">🔧 Kỹ thuật</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-2 font-bold">Câu hỏi mẫu *</label>
            <input 
              type="text"
              defaultValue={knowledge?.question}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 mb-2"
            />
            <input 
              type="text"
              placeholder="Biến thể: Hồ bơi mở cửa lúc mấy giờ?"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 mb-2"
            />
            <button className="text-xs text-blue-700 hover:underline">
              + Thêm biến thể câu hỏi
            </button>
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-2 font-bold">Câu trả lời *</label>
            <textarea 
              rows={6}
              defaultValue={knowledge?.answer}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2 font-bold">Từ khóa liên quan</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 border border-gray-300 text-xs rounded">
                hồ bơi
                <button className="ml-1 text-gray-600 hover:text-red-600">×</button>
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 border border-gray-300 text-xs rounded">
                giờ mở cửa
                <button className="ml-1 text-gray-600 hover:text-red-600">×</button>
              </span>
            </div>
            <input 
              type="text"
              placeholder="Nhập từ khóa và Enter..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-700 font-bold mb-3">Thống kê sử dụng</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white border border-gray-300 rounded p-3">
                <p className="text-2xl text-gray-900 font-bold">127</p>
                <p className="text-xs text-gray-600">Lần sử dụng</p>
                <p className="text-xs text-gray-500">30 ngày qua</p>
              </div>
              <div className="bg-white border border-gray-300 rounded p-3">
                <p className="text-2xl text-green-600 font-bold">92%</p>
                <p className="text-xs text-gray-600">Hài lòng</p>
                <p className="text-xs text-gray-500">117/127 👍</p>
              </div>
              <div className="bg-white border border-gray-300 rounded p-3">
                <p className="text-2xl text-blue-600 font-bold">#3</p>
                <p className="text-xs text-gray-600">Phổ biến nhất</p>
                <p className="text-xs text-gray-500">Top 3 câu hỏi</p>
              </div>
            </div>
            <button className="w-full mt-3 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50">
              → Xem chi tiết thống kê trong Báo cáo & Thống kê
            </button>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-700 font-bold mb-3">Lịch sử thay đổi</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-white border border-gray-300 rounded">
                <span className="text-gray-700">Tạo mới</span>
                <span className="text-gray-600">15/01/2026 09:30 - Admin Nguyễn A</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white border border-gray-300 rounded">
                <span className="text-gray-700">Cập nhật câu trả lời</span>
                <span className="text-gray-600">20/01/2026 14:15 - Admin Trần B</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <Check size={16} />
            <span>Cập nhật tri thức</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteKnowledgeModal({ knowledge, onClose }: KnowledgeModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Trash2 size={20} className="text-red-600" />
            <h3 className="text-lg text-gray-800">Xóa tri thức</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border-2 border-red-400 rounded p-4 flex items-start space-x-3">
            <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-bold mb-2">⚠️ CẢNH BÁO: BẠN SẮP XÓA TRI THỨC</p>
              <p className="text-sm text-red-700">
                Tri thức này đã được sử dụng <strong>127 lần</strong> trong 30 ngày qua. 
                Sau khi xóa, AI sẽ không thể trả lời các câu hỏi tương tự nữa.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-700 font-bold mb-3">Thông tin tri thức:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã KB:</span>
                <span className="text-gray-800 font-bold">{knowledge?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Danh mục:</span>
                <span className="text-gray-800">{knowledge?.category}</span>
              </div>
              <div>
                <span className="text-gray-600">Câu hỏi:</span>
                <p className="text-gray-800 mt-1">{knowledge?.question}</p>
              </div>
              <div>
                <span className="text-gray-600">Câu trả lời:</span>
                <p className="text-gray-800 mt-1">{knowledge?.answer}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-700 font-bold mb-3">Thống kê sử dụng:</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xl text-gray-900 font-bold">127</p>
                <p className="text-xs text-gray-600">Lần sử dụng</p>
              </div>
              <div className="text-center">
                <p className="text-xl text-green-600 font-bold">92%</p>
                <p className="text-xs text-gray-600">Hài lòng</p>
              </div>
              <div className="text-center">
                <p className="text-xl text-blue-600 font-bold">#3</p>
                <p className="text-xs text-gray-600">Phổ biến</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 rounded p-4">
            <h4 className="text-sm text-yellow-800 font-bold mb-2">💡 Gợi ý thay thế:</h4>
            <ul className="text-sm text-yellow-800 space-y-1 ml-4">
              <li>• <strong>Tắt "Hiệu lực"</strong> thay vì xóa - AI sẽ tạm ngừng sử dụng</li>
              <li>• <strong>Chỉnh sửa câu trả lời</strong> nếu thông tin cũ không còn chính xác</li>
              <li>• <strong>Lưu trữ</strong> vào danh mục "Đã ngừng sử dụng" để tham khảo sau</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-700 font-bold mb-3">Lý do xóa (tùy chọn):</h4>
            <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500 mb-2">
              <option>Thông tin đã lỗi thời</option>
              <option>Trùng lặp với tri thức khác</option>
              <option>Không còn phù hợp</option>
              <option>Thông tin sai</option>
              <option>Lý do khác...</option>
            </select>
            <textarea 
              placeholder="Ghi chú thêm..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 h-20"
            />
          </div>
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 flex items-center space-x-2"
          >
            <Settings size={16} />
            <span>Tắt hiệu lực thay vì xóa</span>
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>Xác nhận xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function UploadFileModal({ onClose }: { onClose: () => void }) {
  const [uploadStep, setUploadStep] = useState<'upload' | 'processing' | 'result'>('upload');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Upload size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Nhập file PDF/Doc - RAG AI</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <p className="text-sm text-blue-800 mb-2">
              🤖 <strong>RAG (Retrieval-Augmented Generation):</strong> AI sẽ tự động phân tích file PDF/Doc 
              và trích xuất thành câu hỏi-trả lời.
            </p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4">
              <li>• <strong>Hỗ trợ:</strong> PDF, DOC, DOCX, TXT</li>
              <li>• <strong>Kích thước tối đa:</strong> 10MB/file</li>
              <li>• <strong>Nội dung phù hợp:</strong> Nội quy, quy định, hướng dẫn, bảng giá...</li>
            </ul>
          </div>

          {uploadStep === 'upload' && (
            <>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer">
                <Upload size={48} className="text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-700 font-bold mb-1">Kéo thả file vào đây hoặc click để chọn</p>
                <p className="text-xs text-gray-500">Hỗ trợ: PDF, DOC, DOCX, TXT (tối đa 10MB)</p>
                <button className="mt-4 px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">
                  Chọn file từ máy tính
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-700 font-bold mb-3">File mẫu để upload:</h4>
                <div className="space-y-2">
                  <label className="flex items-center p-3 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" className="w-4 h-4 mr-3" />
                    <FileText size={20} className="text-blue-600 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-bold">Nội quy chung cư 2026.pdf</p>
                      <p className="text-xs text-gray-600">2.3 MB • Nội quy • Cập nhật 01/01/2026</p>
                    </div>
                  </label>

                  <label className="flex items-center p-3 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" className="w-4 h-4 mr-3" />
                    <FileText size={20} className="text-blue-600 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-bold">Bảng giá dịch vụ.docx</p>
                      <p className="text-xs text-gray-600">456 KB • Giá dịch vụ • Cập nhật 15/01/2026</p>
                    </div>
                  </label>

                  <label className="flex items-center p-3 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" className="w-4 h-4 mr-3" />
                    <FileText size={20} className="text-blue-600 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-bold">Hướng dẫn sử dụng tiện ích.pdf</p>
                      <p className="text-xs text-gray-600">1.8 MB • Tiện ích • Cập nhật 10/01/2026</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-700 font-bold mb-3">Cài đặt RAG:</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Danh mục mặc định cho tri thức mới</label>
                    <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white">
                      <option>🏢 Nội quy</option>
                      <option>📋 Thủ tục hành chính</option>
                      <option>💰 Giá dịch vụ</option>
                      <option>💳 Tài chính</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700 font-bold">Kích hoạt ngay sau khi xử lý</p>
                      <p className="text-xs text-gray-500">AI sẽ sử dụng ngay, không cần duyệt thủ công</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700 font-bold">Gộp câu hỏi trùng lặp</p>
                      <p className="text-xs text-gray-500">AI sẽ tự nhận diện và gộp các câu hỏi tương tự</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {uploadStep === 'processing' && (
            <div className="py-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg text-gray-800 font-bold">🤖 AI đang xử lý file...</p>
                <p className="text-sm text-gray-600 mt-2">Vui lòng đợi trong giây lát</p>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">✅ Đọc file PDF</span>
                    <span className="text-xs text-green-600">Hoàn thành</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">🔄 Phân tích nội dung</span>
                    <span className="text-xs text-blue-600">Đang xử lý...</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">⏳ Trích xuất Q&A</span>
                    <span className="text-xs text-gray-500">Chờ xử lý</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">⏳ Phân loại danh mục</span>
                    <span className="text-xs text-gray-500">Chờ xử lý</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {uploadStep === 'result' && (
            <>
              <div className="bg-green-50 border border-green-300 rounded p-4 flex items-start space-x-3">
                <Check size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-800 font-bold mb-1">✅ Xử lý thành công!</p>
                  <p className="text-sm text-green-700">
                    AI đã trích xuất <strong>47 câu hỏi-trả lời</strong> từ file "Nội quy chung cư 2026.pdf"
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-700 font-bold mb-3">Kết quả xử lý:</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white border border-gray-300 rounded p-3 text-center">
                    <p className="text-2xl text-blue-600 font-bold">47</p>
                    <p className="text-xs text-gray-600">Câu hỏi mới</p>
                  </div>
                  <div className="bg-white border border-gray-300 rounded p-3 text-center">
                    <p className="text-2xl text-green-600 font-bold">42</p>
                    <p className="text-xs text-gray-600">Đã kích hoạt</p>
                  </div>
                  <div className="bg-white border border-gray-300 rounded p-3 text-center">
                    <p className="text-2xl text-yellow-600 font-bold">5</p>
                    <p className="text-xs text-gray-600">Cần duyệt</p>
                  </div>
                  <div className="bg-white border border-gray-300 rounded p-3 text-center">
                    <p className="text-2xl text-gray-600 font-bold">8</p>
                    <p className="text-xs text-gray-600">Danh mục</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-300 rounded">
                <div className="border-b border-gray-300 px-4 py-3">
                  <h4 className="text-sm text-gray-800 font-bold">Xem trước 5 câu hỏi mới:</h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-3 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-800 font-bold flex-1">Giờ truy cập hồ bơi là mấy giờ?</p>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-300 ml-2">Nội quy</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Hồ bơi mở cửa từ 6:00 - 22:00 hàng ngày...
                    </p>
                  </div>
                  <div className="p-3 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-800 font-bold flex-1">Được phép nuôi thú cưng không?</p>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-300 ml-2">Nội quy</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Được phép nuôi chó/mèo dưới 5kg. Cần đăng ký...
                    </p>
                  </div>
                  <div className="p-3 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-800 font-bold flex-1">Giờ giữ xe ô tô là bao giờ?</p>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded border border-orange-300 ml-2">An ninh</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Bãi xe hoạt động 24/7. Vui lòng mang thẻ xe...
                    </p>
                  </div>
                  <div className="p-3 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-800 font-bold flex-1">Quy định về tiếng ồn là gì?</p>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-300 ml-2">Nội quy</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Không gây ồn sau 22:00. Vi phạm sẽ bị nhắc nhở...
                    </p>
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-800 font-bold flex-1">Làm thế nào để đăng ký khách qua đêm?</p>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded border border-purple-300 ml-2">Thủ tục</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Liên hệ bảo vệ trước 20:00. Khách cần CMND/CCCD...
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-300 px-4 py-3 text-center">
                  <button className="text-sm text-blue-700 hover:underline">
                    Xem tất cả 47 câu hỏi mới →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          {uploadStep === 'upload' && (
            <>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button 
                onClick={() => setUploadStep('processing')}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-2"
              >
                <Upload size={16} />
                <span>Bắt đầu xử lý AI</span>
              </button>
            </>
          )}
          {uploadStep === 'processing' && (
            <button 
              onClick={() => setUploadStep('result')}
              className="px-4 py-2 bg-gray-400 text-white text-sm rounded cursor-not-allowed"
              disabled
            >
              Đang xử lý...
            </button>
          )}
          {uploadStep === 'result' && (
            <>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
              >
                Đóng
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Duyệt 5 câu hỏi còn lại
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-2"
              >
                <Check size={16} />
                <span>Hoàn thành</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ManageCategoryModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[700px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Settings size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Quản lý danh mục tri thức</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <p className="text-sm text-blue-800">
              💡 Danh mục giúp phân loại và quản lý tri thức dễ dàng hơn. Mỗi danh mục có màu riêng để dễ nhận diện.
            </p>
          </div>

          <div className="bg-white border border-gray-300 rounded">
            <div className="border-b border-gray-300 px-4 py-3 flex items-center justify-between">
              <h4 className="text-sm text-gray-800 font-bold">Danh sách danh mục (8)</h4>
              <button className="px-3 py-1.5 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 flex items-center space-x-1">
                <FolderPlus size={14} />
                <span>Thêm danh mục</span>
              </button>
            </div>
            
            <div className="divide-y divide-gray-200">
              {/* Category Item */}
              <div className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 border border-blue-300 rounded flex items-center justify-center text-lg">
                      🏢
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-bold">Nội quy</p>
                      <p className="text-xs text-gray-600">32 tri thức • Màu xanh dương</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded border border-blue-300">
                      Xem mẫu
                    </span>
                    <button className="p-1.5 hover:bg-gray-100 rounded" title="Sửa">
                      <Edit size={14} className="text-gray-600" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded" title="Xóa">
                      <Trash2 size={14} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 border border-purple-300 rounded flex items-center justify-center text-lg">
                      📋
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-bold">Thủ tục hành chính</p>
                      <p className="text-xs text-gray-600">28 tri thức • Màu tím</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded border border-purple-300">
                      Xem mẫu
                    </span>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Edit size={14} className="text-gray-600" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Trash2 size={14} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 border border-green-300 rounded flex items-center justify-center text-lg">
                      💰
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-bold">Giá dịch vụ</p>
                      <p className="text-xs text-gray-600">15 tri thức • Màu xanh lá</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded border border-green-300">
                      Xem mẫu
                    </span>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Edit size={14} className="text-gray-600" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Trash2 size={14} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 border border-orange-300 rounded flex items-center justify-center text-lg">
                      💳
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-bold">Tài chính</p>
                      <p className="text-xs text-gray-600">24 tri thức • Màu cam</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded border border-orange-300">
                      Xem mẫu
                    </span>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Edit size={14} className="text-gray-600" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Trash2 size={14} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 border border-red-300 rounded flex items-center justify-center text-lg">
                      🔧
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-bold">Kỹ thuật</p>
                      <p className="text-xs text-gray-600">19 tri thức • Màu đỏ</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded border border-red-300">
                      Xem mẫu
                    </span>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Edit size={14} className="text-gray-600" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Trash2 size={14} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-cyan-100 border border-cyan-300 rounded flex items-center justify-center text-lg">
                      🏊
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-bold">Tiện ích</p>
                      <p className="text-xs text-gray-600">22 tri thức • Màu xanh ngọc</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-cyan-100 text-cyan-800 px-3 py-1 rounded border border-cyan-300">
                      Xem mẫu
                    </span>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Edit size={14} className="text-gray-600" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Trash2 size={14} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center text-lg">
                      🔐
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-bold">An ninh</p>
                      <p className="text-xs text-gray-600">11 tri thức • Màu vàng</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded border border-yellow-300">
                      Xem mẫu
                    </span>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Edit size={14} className="text-gray-600" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Trash2 size={14} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-lg">
                      📌
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-bold">Khác</p>
                      <p className="text-xs text-gray-600">5 tri thức • Màu xám</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded border border-gray-300">
                      Xem mẫu
                    </span>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Edit size={14} className="text-gray-600" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <Trash2 size={14} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}