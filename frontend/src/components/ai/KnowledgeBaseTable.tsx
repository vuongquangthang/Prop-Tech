import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { UploadFileModal } from './KnowledgeModals';
import { knowledgeService, KnowledgeBase } from '../../services/feature.service';

export function KnowledgeBaseTable() {
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);

  const fetchData = () => {
    setLoading(true);
    knowledgeService.getAll()
      .then(data => setKnowledgeData(data))
      .catch(() => setKnowledgeData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const activeCount = knowledgeData.filter(k => k.isActive).length;
  const inactiveCount = Math.max(knowledgeData.length - activeCount, 0);
  const recentItems = knowledgeData.slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="bg-white border-2 border-gray-300 rounded p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl text-gray-900">Quản lý kho tri thức</h2>
            <p className="text-sm text-gray-600 mt-2 max-w-2xl">
              Hệ thống hiện vận hành theo mô hình đồng bộ tài liệu với AI. Bạn chỉ cần tải tài liệu lên,
              hệ thống sẽ gửi sang n8n và cập nhật vào luồng RAG để chatbot sử dụng.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUploadModal(true)}
              className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center gap-2"
            >
              <Upload size={16} />
              <span>Tải tài liệu lên AI</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Tổng mục tri thức</p>
          <p className="text-2xl text-gray-900">{loading ? '...' : knowledgeData.length}</p>
          <p className="text-xs text-gray-600 mt-1">mục</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Đang hoạt động</p>
          <p className="text-2xl text-green-600">{loading ? '...' : activeCount}</p>
          <p className="text-xs text-gray-600 mt-1">mục</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Tạm ngưng</p>
          <p className="text-2xl text-gray-600">{loading ? '...' : inactiveCount}</p>
          <p className="text-xs text-gray-600 mt-1">mục</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={18} className="text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Quy trình hiện tại</p>
            <p className="mt-1">1) Tải file tài liệu lên 2) Hệ thống đồng bộ sang AI qua n8n 3) Chatbot sử dụng dữ liệu mới.</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-lg text-gray-800 flex items-center gap-2">
            <FileText size={18} />
            <span>Dữ liệu tri thức gần đây</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Mã KB</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Tiêu đề</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Danh mục</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Đang tải...</td>
                </tr>
              )}
              {!loading && recentItems.map((kb) => (
                <tr key={kb.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">KB-{kb.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                    <div className="truncate">{kb.title}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span>{kb.category || 'Khác'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 text-xs rounded border ${kb.isActive ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                      {kb.isActive ? 'Đang dùng' : 'Tạm ngưng'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && recentItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Chưa có dữ liệu tri thức. Hãy tải tài liệu đầu tiên để bắt đầu đồng bộ với AI.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {uploadModal && (
        <UploadFileModal onClose={() => { setUploadModal(false); fetchData(); }} />
      )}
    </div>
  );
}