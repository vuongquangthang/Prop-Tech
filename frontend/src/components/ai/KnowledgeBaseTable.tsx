import { Plus, Upload, Edit, Trash2, Filter, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AddKnowledgeModal, EditKnowledgeModal, DeleteKnowledgeModal, UploadFileModal, ManageCategoryModal } from './KnowledgeModals';
import { knowledgeService, KnowledgeBase } from '../../services/feature.service';

const categoryColors: Record<string, string> = {
  'Nội quy': 'bg-blue-100 text-blue-800 border-blue-300',
  'Thủ tục hành chính': 'bg-purple-100 text-purple-800 border-purple-300',
  'Giá dịch vụ': 'bg-green-100 text-green-800 border-green-300',
  'Tài chính': 'bg-orange-100 text-orange-800 border-orange-300',
  'Kỹ thuật': 'bg-red-100 text-red-800 border-red-300',
};

export function KnowledgeBaseTable() {
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [manageCategoryModal, setManageCategoryModal] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeBase | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const fetchData = () => {
    setLoading(true);
    knowledgeService.getAll()
      .then(data => setKnowledgeData(data))
      .catch(() => setKnowledgeData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggleActive = async (kb: KnowledgeBase) => {
    try {
      await knowledgeService.update(kb.id, { isActive: !kb.isActive });
      setKnowledgeData(prev => prev.map(k => k.id === kb.id ? { ...k, isActive: !k.isActive } : k));
    } catch (_) {}
  };

  const filteredData = knowledgeData.filter(kb => {
    const catMatch = categoryFilter === 'all' || kb.category === categoryFilter;
    const statusMatch = statusFilter === 'all' || (statusFilter === 'active' ? kb.isActive : !kb.isActive);
    const searchMatch = !searchText || kb.title.toLowerCase().includes(searchText.toLowerCase()) || kb.content.toLowerCase().includes(searchText.toLowerCase());
    return catMatch && statusMatch && searchMatch;
  });

  const activeCount = knowledgeData.filter(k => k.isActive).length;
  const inactiveCount = knowledgeData.length - activeCount;
  const categories = new Set(knowledgeData.map(k => k.category)).size;
  const categoryStats = Array.from(
    knowledgeData.reduce((acc, item) => {
      const key = item.category || 'Khác';
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  ).map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Tổng câu hỏi</p>
          <p className="text-2xl text-gray-900">{loading ? '...' : knowledgeData.length}</p>
          <p className="text-xs text-gray-600 mt-1">câu hỏi</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Đang hoạt động</p>
          <p className="text-2xl text-green-600">{loading ? '...' : activeCount}</p>
          <p className="text-xs text-gray-600 mt-1">câu hỏi</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Tạm dừng</p>
          <p className="text-2xl text-gray-600">{loading ? '...' : inactiveCount}</p>
          <p className="text-xs text-gray-600 mt-1">câu hỏi</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Danh mục</p>
          <p className="text-2xl text-gray-900">{loading ? '...' : categories}</p>
          <p className="text-xs text-gray-600 mt-1">danh mục</p>
        </div>
      </div>
      
      {/* Filter & Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter size={16} className="text-gray-500" />
          
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="Nội quy">Nội quy</option>
            <option value="Thủ tục hành chính">Thủ tục hành chính</option>
            <option value="Giá dịch vụ">Giá dịch vụ</option>
            <option value="Tài chính">Tài chính</option>
            <option value="Kỹ thuật">Kỹ thuật</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm dừng</option>
          </select>
          
          <input 
            type="text"
            placeholder="Tìm kiếm câu hỏi..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
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
          <h2 className="text-lg text-gray-800">Kho tri thức - {filteredData.length} mục</h2>
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
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Đang tải...</td>
                </tr>
              )}
              {!loading && filteredData.map((kb) => (
                <tr key={kb.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">KB-{kb.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                    <div className="truncate">{kb.title}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                    <div className="truncate">{kb.content}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 text-xs rounded border ${categoryColors[kb.category] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                      {kb.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={kb.isActive}
                        onChange={() => handleToggleActive(kb)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                    </label>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => { setSelectedKnowledge(kb); setEditModal(true); }}
                        className="p-2 hover:bg-gray-100 rounded" title="Sửa">
                        <Edit size={16} className="text-gray-600" />
                      </button>
                      <button 
                        onClick={() => { setSelectedKnowledge(kb); setDeleteModal(true); }}
                        className="p-2 hover:bg-gray-100 rounded" title="Xóa">
                        <Trash2 size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Không có dữ liệu</td>
                </tr>
              )}
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
      
      {showModal && (
        <AddKnowledgeModal onClose={() => { setShowModal(false); fetchData(); }} />
      )}
      
      {editModal && selectedKnowledge && (
        <EditKnowledgeModal knowledge={selectedKnowledge} onClose={() => { setEditModal(false); fetchData(); }} />
      )}
      
      {deleteModal && selectedKnowledge && (
        <DeleteKnowledgeModal knowledge={selectedKnowledge} onClose={() => { setDeleteModal(false); fetchData(); }} />
      )}
      
      {uploadModal && (
        <UploadFileModal onClose={() => setUploadModal(false)} />
      )}
      
      {manageCategoryModal && (
        <ManageCategoryModal categories={categoryStats} onClose={() => setManageCategoryModal(false)} />
      )}
    </div>
  );
}