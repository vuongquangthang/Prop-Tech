import { AlertTriangle, Check, FileText, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { knowledgeService } from '../../services/feature.service';

export function UploadFileModal({ onClose }: { onClose: () => void }) {
  const [uploadStep, setUploadStep] = useState<'upload' | 'processing' | 'result' | 'error'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadResult, setUploadResult] = useState<Awaited<ReturnType<typeof knowledgeService.uploadDocument>> | null>(null);
  const fileInputRef = { current: null as HTMLInputElement | null };

  const handleFileSelect = (file: File) => {
    const allowed = ['.pdf', '.docx', '.txt', '.md'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setErrorMsg('Chi chap nhan file PDF, DOCX, TXT, MD');
      setUploadStep('error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Kich thuoc file khong duoc vuot qua 10MB');
      setUploadStep('error');
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
    setErrorMsg('');
    setUploadStep('upload');
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setUploadStep('processing');
    try {
      const result = await knowledgeService.uploadDocument(selectedFile, 'Khac', true);
      setUploadResult(result);
      setUploadStep('result');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Da xay ra loi khi tai file');
      setUploadStep('error');
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setErrorMsg('');
    setUploadStep('upload');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[760px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Upload size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Tai file vao kho tri thuc</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <p className="text-sm text-blue-800">
              <strong>Ho tro:</strong> PDF, DOCX, TXT, MD - <strong>Toi da:</strong> 10MB -
              File se duoc gui sang chatbot app local de xu ly va luu vao ChromaDB.
            </p>
          </div>

          {uploadStep === 'upload' && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
              onDragOver={event => { event.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={el => { fileInputRef.current = el; }}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              {selectedFile ? (
                <>
                  <FileText size={48} className="text-green-600 mx-auto mb-3" />
                  <p className="text-sm text-green-800 font-bold mb-1">{selectedFile.name}</p>
                  <p className="text-xs text-green-600">{formatFileSize(selectedFile.size)} - Click de doi file</p>
                </>
              ) : (
                <>
                  <Upload size={48} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-700 font-bold mb-1">Keo tha file vao day hoac click de chon</p>
                  <p className="text-xs text-gray-500">Ho tro: PDF, DOCX, TXT, MD</p>
                </>
              )}
            </div>
          )}

          {uploadStep === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 border-r-blue-600 rounded-full animate-spin"></div>
                </div>
              </div>
              <div>
                <p className="text-lg text-gray-800 font-bold">Dang gui file sang chatbot app...</p>
                <p className="text-sm text-gray-600 mt-2">"{selectedFile?.name}"</p>
                <p className="text-xs text-gray-500 mt-2 px-4">
                  Chatbot app local se doc file, chia chunk, embedding va ghi vao ChromaDB.
                </p>
              </div>
            </div>
          )}

          {uploadStep === 'error' && (
            <div className="bg-red-50 border border-red-300 rounded p-4 flex items-start space-x-3">
              <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-bold mb-1">Tai file that bai</p>
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            </div>
          )}

          {uploadStep === 'result' && (
            <div className="bg-green-50 border border-green-300 rounded p-6 flex items-start space-x-4 text-center">
              <div className="flex-1">
                <div className="flex justify-center mb-3">
                  <div className="bg-green-600 rounded-full p-3">
                    <Check size={32} className="text-white" />
                  </div>
                </div>
                <p className="text-lg text-green-800 font-bold mb-2">Da dong bo file vao ChromaDB</p>
                <p className="text-sm text-green-700">
                  File <strong>"{uploadResult?.fileName || selectedFile?.name}"</strong> da duoc chatbot app xu ly thanh cong.
                </p>
                {uploadResult?.ingestTriggered && (
                  <div
                    className={`mt-3 rounded border px-3 py-2 text-sm ${
                      uploadResult.ingestSucceeded
                        ? 'border-green-300 bg-white text-green-700'
                        : 'border-yellow-300 bg-yellow-50 text-yellow-800'
                    }`}
                  >
                    {uploadResult.ingestSucceeded
                      ? `Da ingest sang ChromaDB${uploadResult.ingestDocuments ? ` (${uploadResult.ingestDocuments} tai lieu)` : ''}.`
                      : `Ingest ChromaDB chua thanh cong: ${uploadResult.ingestMessage || 'kiem tra chatbot local.'}`}
                  </div>
                )}
                {!uploadResult?.ingestTriggered && (
                  <div className="mt-3 rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                    Backend chua goi ingest. Kiem tra cau hinh Chatbot__AutoIngestOnKnowledgeUpload.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          {(uploadStep === 'upload' || uploadStep === 'error') && (
            <>
              <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                Huy
              </button>
              {uploadStep === 'error' && (
                <button
                  onClick={resetUpload}
                  className="px-4 py-2 bg-white border border-gray-800 text-gray-800 text-sm rounded hover:bg-gray-50"
                >
                  Chon lai
                </button>
              )}
              <button
                onClick={handleProcess}
                disabled={!selectedFile || uploadStep === 'error'}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-40"
              >
                <Upload size={16} />
                <span>Tai len</span>
              </button>
            </>
          )}
          {uploadStep === 'processing' && (
            <button disabled className="px-4 py-2 bg-gray-400 text-white text-sm rounded cursor-not-allowed">
              Dang tai len...
            </button>
          )}
          {uploadStep === 'result' && (
            <button onClick={onClose} className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-2">
              <Check size={16} />
              <span>Hoan thanh</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
