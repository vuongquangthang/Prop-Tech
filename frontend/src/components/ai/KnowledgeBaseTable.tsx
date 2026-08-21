import { Upload, FileText, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
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

  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border-2 border-gray-300 rounded p-4">
        <p className="text-sm text-gray-600 mb-2">Tổng tài liệu tri thức</p>
        <p className="text-2xl text-gray-900">{loading ? '...' : knowledgeData.length}</p>
        <p className="text-xs text-gray-600 mt-1">file đã tải lên</p>
      </div>

      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="flex items-center justify-between gap-3 border-b border-gray-300 px-6 py-4">
          <h2 className="table-section-title flex items-center gap-2">
            <FileText size={18} />
            <span>Danh sách tài liệu tri thức</span>
          </h2>
          <button
            onClick={() => setUploadModal(true)}
            className="app-button-primary shrink-0"
          >
            <Upload size={16} />
            <span>Tải file vào kho tri thức</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">ID</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Tên file</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">URL</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Đang tải...</td>
                </tr>
              )}
              {!loading && knowledgeData.map((kb) => (
                <tr key={kb.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">KB-{kb.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                    <div className="truncate" title={kb.fileName}>{kb.fileName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-blue-700 max-w-md">
                    <a
                      href={kb.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-center gap-1 hover:underline"
                      title={kb.fileUrl}
                    >
                      <span className="truncate">{kb.fileUrl}</span>
                      <ExternalLink size={14} className="shrink-0" />
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {formatDateTime(kb.createdAt)}
                  </td>
                </tr>
              ))}
              {!loading && knowledgeData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Chưa có tài liệu tri thức. Hãy tải file đầu tiên để lưu vào kho lưu trữ.
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
