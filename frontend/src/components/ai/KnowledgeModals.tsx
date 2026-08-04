import { X, Plus, Upload, Edit, Trash2, FileText, AlertTriangle, Check, FolderPlus, Settings } from 'lucide-react';
import { useState } from 'react';
import { knowledgeService } from '../../services/feature.service';

interface KnowledgeModalProps {
  knowledge?: any;
  onClose: () => void;
}

export function AddKnowledgeModal({ onClose }: KnowledgeModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('Nội quy');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    try {
      await knowledgeService.create({
        title: question.trim(),
        content: answer.trim(),
        category: selectedCategory,
        isActive: true,
      });
      onClose();
    } catch (_) {
      setSaving(false);
    }
  };
  
  return (
    <div className="admin-content-modal-overlay">
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
            <label className="block text-sm text-gray-700 mb-2 font-bold">Câu hỏi mẫu *</label>
            <input 
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ví dụ: Giờ truy cập hồ bơi là mấy giờ?"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-2 font-bold">Câu trả lời * (AI sẽ dùng để trả lời)</label>
            <textarea 
              rows={6}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Ví dụ: Hồ bơi mở cửa từ 6:00 - 22:00 hàng ngày."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                Nên viết rõ ràng, đầy đủ thông tin. AI sẽ diễn đạt lại theo ngữ cảnh.
              </p>
              <span className="text-xs text-gray-500">{answer.length}/500</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2 font-bold">Từ khóa liên quan (để tìm kiếm)</label>
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
            onClick={handleSave}
            disabled={saving || !question.trim() || !answer.trim()}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <Check size={16} />
            <span>{saving ? 'Đang lưu...' : 'Lưu tri thức'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditKnowledgeModal({ knowledge, onClose }: KnowledgeModalProps) {
  const [category, setCategory] = useState(knowledge?.category || 'Nội quy');
  const [question, setQuestion] = useState(knowledge?.title || '');
  const [answer, setAnswer] = useState(knowledge?.content || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    try {
      await knowledgeService.update(knowledge.id, {
        title: question.trim(),
        content: answer.trim(),
        category,
      });
      onClose();
    } catch (_) {
      setSaving(false);
    }
  };

  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[700px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Edit size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Chỉnh sửa tri thức - KB-{knowledge?.id}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-300 rounded p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Lưu ý:</strong> Thay đổi sẽ ảnh hưởng đến câu trả lời của AI.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2 font-bold">Danh mục *</label>
            <select 
              value={category}
              onChange={e => setCategory(e.target.value)}
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
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-2 font-bold">Câu trả lời *</label>
            <textarea 
              rows={6}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
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
            onClick={handleSave}
            disabled={saving || !question.trim() || !answer.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <Check size={16} />
            <span>{saving ? 'Đang lưu...' : 'Cập nhật tri thức'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteKnowledgeModal({ knowledge, onClose }: KnowledgeModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await knowledgeService.delete(knowledge.id);
      onClose();
    } catch (_) {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-content-modal-overlay">
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
                <p className="text-gray-800 mt-1">{knowledge?.title}</p>
              </div>
              <div>
                <span className="text-gray-600">Câu trả lời:</span>
                <p className="text-gray-800 mt-1">{knowledge?.content}</p>
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
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <Trash2 size={16} />
            <span>{deleting ? 'Đang xóa...' : 'Xác nhận xóa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function UploadFileModal({ onClose }: { onClose: () => void }) {
  const [uploadStep, setUploadStep] = useState<'upload' | 'processing' | 'result' | 'error'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadResult, setUploadResult] = useState<Awaited<ReturnType<typeof knowledgeService.uploadDocument>> | null>(null);
  const fileInputRef = { current: null as HTMLInputElement | null };

  const handleFileSelect = (file: File) => {
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setErrorMsg('Chỉ chấp nhận file PDF, DOCX, DOC, TXT');
      setUploadStep('error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Kích thước file không được vượt quá 10MB');
      setUploadStep('error');
      return;
    }
    setSelectedFile(file);
    setUploadResult(null);
    setErrorMsg('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setUploadStep('processing');
    try {
      const result = await knowledgeService.uploadDocument(selectedFile, 'Khác', true);
      setUploadResult(result);
      setUploadStep('result');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đã xảy ra lỗi khi xử lý file');
      setUploadStep('error');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Upload size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Nhập file PDF/Doc/TXT</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <p className="text-sm text-blue-800">
              📄 <strong>Hỗ trợ:</strong> PDF, DOCX, DOC, TXT • <strong>Tối đa:</strong> 10MB • Tài liệu sẽ được trích xuất, lưu vào kho tri thức và tự đồng bộ ChromaDB cho AI.
            </p>
          </div>

          {/* Upload step */}
          {uploadStep === 'upload' && (
            <>
              {/* Drag & drop zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={el => { fileInputRef.current = el; }}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
                {selectedFile ? (
                  <>
                    <FileText size={48} className="text-green-600 mx-auto mb-3" />
                    <p className="text-sm text-green-800 font-bold mb-1">{selectedFile.name}</p>
                    <p className="text-xs text-green-600">{formatFileSize(selectedFile.size)} • Click để đổi file</p>
                  </>
                ) : (
                  <>
                    <Upload size={48} className="text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-700 font-bold mb-1">Kéo thả file vào đây hoặc click để chọn</p>
                    <p className="text-xs text-gray-500">Hỗ trợ: PDF, DOCX, DOC, TXT (tối đa 10MB)</p>
                  </>
                )}
              </div>
            </>
          )}

          {/* Processing step - extracting and saving knowledge */}
          {uploadStep === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 border-r-blue-600 rounded-full animate-spin"></div>
                </div>
              </div>
              <div>
                <p className="text-lg text-gray-800 font-bold">Đang trích xuất, lưu và đồng bộ tri thức...</p>
                <p className="text-sm text-gray-600 mt-2">"{selectedFile?.name}"</p>
                <p className="text-xs text-gray-500 mt-2 px-4">
                  Hệ thống đang lưu dữ liệu vào LIVO Hub và cập nhật ChromaDB cho Chatbot RAG.
                </p>
              </div>
            </div>
          )}

          {/* Error step */}
          {uploadStep === 'error' && (
            <div className="bg-red-50 border border-red-300 rounded p-4 flex items-start space-x-3">
              <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-bold mb-1">Đồng bộ thất bại</p>
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Result step - upload successful */}
          {uploadStep === 'result' && (
            <div className="bg-green-50 border border-green-300 rounded p-6 flex items-start space-x-4 text-center">
              <div className="flex-1">
                <div className="flex justify-center mb-3">
                  <div className="bg-green-600 rounded-full p-3">
                    <Check size={32} className="text-white" />
                  </div>
                </div>
                <p className="text-lg text-green-800 font-bold mb-2">
                  {uploadResult?.ingestSucceeded ? 'Đã lưu và đồng bộ AI!' : 'Đã lưu vào kho tri thức!'}
                </p>
                <p className="text-sm text-green-700">
                  Tài liệu <strong>"{selectedFile?.name}"</strong> đã được lưu vào database tri thức.
                  {uploadResult?.ingestSucceeded
                    ? ` ChromaDB đã được cập nhật${uploadResult.ingestDocuments ? ` với ${uploadResult.ingestDocuments} đoạn dữ liệu` : ''}.`
                    : ' ChromaDB chưa cập nhật, vui lòng kiểm tra service Chatbot hoặc chạy ingest lại.'}
                </p>
                {!uploadResult?.ingestSucceeded && (
                  <p className="text-xs text-amber-700 mt-3 px-4 py-2 bg-amber-100 rounded">
                    Trạng thái ingest: {uploadResult?.ingestMessage || 'Chưa nhận được xác nhận từ Chatbot service.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          {(uploadStep === 'upload' || uploadStep === 'error') && (
            <>
              <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                Hủy
              </button>
              <button
                onClick={() => { if (uploadStep === 'error') { setUploadStep('upload'); setSelectedFile(null); setUploadResult(null); } }}
                style={{ display: uploadStep === 'error' ? undefined : 'none' }}
                className="px-4 py-2 bg-white border border-gray-800 text-gray-800 text-sm rounded hover:bg-gray-50"
              >
                Chọn lại
              </button>
              <button
                onClick={handleProcess}
                disabled={!selectedFile || uploadStep === 'error'}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-40"
              >
                <Upload size={16} />
                <span>Bắt đầu xử lý</span>
              </button>
            </>
          )}
          {uploadStep === 'processing' && (
            <button disabled className="px-4 py-2 bg-gray-400 text-white text-sm rounded cursor-not-allowed">
              Đang xử lý...
            </button>
          )}
          {uploadStep === 'result' && (
            <button onClick={onClose} className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-2">
              <Check size={16} />
              <span>Hoàn thành</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ManageCategoryModal({ onClose, categories }: { onClose: () => void; categories: Array<{ name: string; count: number }> }) {
  return (
    <div className="admin-content-modal-overlay">
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
              <h4 className="text-sm text-gray-800 font-bold">Danh sách danh mục ({categories.length})</h4>
              <button className="px-3 py-1.5 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 flex items-center space-x-1">
                <FolderPlus size={14} />
                <span>Thêm danh mục</span>
              </button>
            </div>
            
            <div className="divide-y divide-gray-200">
              {categories.length === 0 && (
                <div className="p-4 text-sm text-gray-500">Chưa có dữ liệu danh mục.</div>
              )}
              {categories.map((category) => (
                <div key={category.name} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-800 font-bold">{category.name}</p>
                      <p className="text-xs text-gray-600">{category.count} tri thức</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-1.5 hover:bg-gray-100 rounded" title="Sửa" disabled>
                        <Edit size={14} className="text-gray-400" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded" title="Xóa" disabled>
                        <Trash2 size={14} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
