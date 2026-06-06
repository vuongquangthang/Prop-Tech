import { X, Download, Send, Users, Check } from 'lucide-react';
import { useState } from 'react';
import { useData } from '../../contexts/DataContext';

interface ActionModalProps {
  invoice?: any;
  onClose: () => void;
}

export function PrintInvoiceModal({ invoice, onClose }: ActionModalProps) {
  const [selectedFormat, setSelectedFormat] = useState('full-pdf');
  const [isPrinting, setIsPrinting] = useState(false);
  
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      alert(`Đã xuất hóa đơn ${invoice?.code} thành công!\nĐịnh dạng: ${
        selectedFormat === 'full-pdf' ? 'PDF đầy đủ' :
        selectedFormat === 'summary-pdf' ? 'PDF tóm tắt' : 'Excel'
      }`);
      setIsPrinting(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[600px]">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
          <h3 className="text-base text-gray-800">In/Xuất hóa đơn - {invoice?.code}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">Chọn định dạng xuất:</h4>
            
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <input 
                  type="radio" 
                  name="exportFormat" 
                  checked={selectedFormat === 'full-pdf'}
                  onChange={() => setSelectedFormat('full-pdf')}
                  className="w-4 h-4 mr-3" 
                />
                <div>
                  <p className="text-sm text-gray-800 font-bold">Hóa đơn đầy đủ (PDF)</p>
                  <p className="text-xs text-gray-600">Bao gồm chi tiết các khoản thu, chỉ số điện/nước, QR Code</p>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <input 
                  type="radio" 
                  name="exportFormat" 
                  checked={selectedFormat === 'summary-pdf'}
                  onChange={() => setSelectedFormat('summary-pdf')}
                  className="w-4 h-4 mr-3" 
                />
                <div>
                  <p className="text-sm text-gray-800 font-bold">Bản tóm tắt (PDF)</p>
                  <p className="text-xs text-gray-600">Chỉ tổng tiền và hạn thanh toán</p>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <input 
                  type="radio" 
                  name="exportFormat" 
                  checked={selectedFormat === 'excel'}
                  onChange={() => setSelectedFormat('excel')}
                  className="w-4 h-4 mr-3" 
                />
                <div>
                  <p className="text-sm text-gray-800 font-bold">File Excel (XLSX)</p>
                  <p className="text-xs text-gray-600">Dữ liệu bảng để phân tích</p>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={handlePrint}
            disabled={isPrinting}
            className={`px-4 py-2 text-white text-sm rounded flex items-center space-x-2 ${
              isPrinting ? 'bg-gray-400' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {isPrinting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang xuất...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Xuất & Tải về</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SendInvoiceModal({ invoice, onClose }: ActionModalProps) {
  const { updateInvoiceStatus, addNotification } = useData();
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['all']);
  const [sendMethod, setSendMethod] = useState('app-notification');
  const [isSending, setIsSending] = useState(false);
  
  // TODO: Fetch actual family members from API based on invoice's contract
  // Endpoint: GET /api/HopDong/{contractId}/residents
  // For now, start with empty array - users can still send via "all residents" option
  const members: Array<{id: string; name: string; role: string; phone: string; appInstalled: boolean}> = [];
  
  const toggleMember = (id: string) => {
    if (id === 'all') {
      setSelectedMembers(selectedMembers.includes('all') ? [] : ['all']);
    } else {
      setSelectedMembers(prev => {
        const newSelection = prev.filter(m => m !== 'all');
        return prev.includes(id) 
          ? newSelection.filter(m => m !== id)
          : [...newSelection, id];
      });
    }
  };
  
  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      const count = selectedMembers.includes('all') ? members.length : selectedMembers.length;
      
      // Update invoice status to 'pending'
      updateInvoiceStatus(invoice?.id, 'pending');
      
      // Send notification to resident
      addNotification({
        type: 'payment',
        title: 'Hóa đơn mới cần thanh toán',
        message: `Hóa đơn ${invoice?.code} cho phòng ${invoice?.room} kỳ ${invoice?.period} đã được phát hành. Tổng tiền: ${invoice?.amount} VNĐ. Vui lòng thanh toán trước hạn.`,
        relatedId: invoice?.id,
        target: 'resident',
      });
      
      const methodText = sendMethod === 'app-notification' ? 'Thông báo App' :
        sendMethod === 'sms' ? 'SMS' :
        sendMethod === 'email' ? 'Email' : 'App + SMS + Email';
      
      alert(`✅ Đã phê duyệt và gửi hóa đơn ${invoice?.code} thành công!\n\n• Gửi cho: ${count} thành viên\n• Phương thức: ${methodText}\n• Trạng thái: Chuyển sang "Chờ thanh toán"\n• Thông báo: Đã gửi đến App cư dân`);
      
      setIsSending(false);
      onClose();
    }, 1500);
  };
  
  const selectedCount = selectedMembers.includes('all') ? members.length : selectedMembers.length;

  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[700px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Send size={20} className="text-gray-800" />
            <h3 className="text-base text-gray-800">Gửi hóa đơn - {invoice?.code}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <p className="text-sm text-blue-800 font-medium">
              Hóa đơn <strong>{invoice?.code}</strong> - Phòng <strong>{invoice?.room}</strong>
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Tổng tiền: <strong>{invoice?.amount} VNĐ</strong> - Hạn thanh toán: <strong>15/02/2026</strong>
            </p>
          </div>

          {/* Select Members */}
          <div>
            <h4 className="text-sm text-gray-800 font-bold mb-3">Chọn người nhận:</h4>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 border-2 border-blue-400 bg-blue-50 rounded cursor-pointer">
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    checked={selectedMembers.includes('all')}
                    onChange={() => toggleMember('all')}
                    className="w-4 h-4" 
                  />
                  <div>
                    <p className="text-sm text-blue-900 font-bold">
                      Gửi cho tất cả {members.length > 0 ? `(${members.length} thành viên)` : '(Tất cả cư dân)'}
                    </p>
                    <p className="text-xs text-blue-700">Khuyến nghị để đảm bảo thông tin đến đầy đủ</p>
                  </div>
                </div>
                <Users size={20} className="text-blue-700" />
              </label>
              
              <div className="pl-4 border-l-2 border-gray-300 ml-2 space-y-2">
                {members.length === 0 ? (
                  <div className="p-3 text-center text-sm text-gray-500 bg-gray-50 border border-gray-300 rounded">
                    Chưa có thông tin thành viên cụ thể. Hệ thống sẽ gửi cho tất cả cư dân trong phòng.
                  </div>
                ) : (
                  members.map(member => (
                  <label 
                    key={member.id}
                    className="flex items-center justify-between p-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        checked={selectedMembers.includes('all') || selectedMembers.includes(member.id)}
                        onChange={() => toggleMember(member.id)}
                        disabled={selectedMembers.includes('all')}
                        className="w-4 h-4" 
                      />
                      <div>
                        <p className="text-sm text-gray-800">{member.name} <span className="text-gray-500">({member.role})</span></p>
                        <p className="text-xs text-gray-600">{member.phone}</p>
                      </div>
                    </div>
                    {member.appInstalled ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded border border-green-300">
                        Có App
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded border border-gray-300">
                        Không có App
                      </span>
                    )}
                  </label>
                ))
                )}
              </div>
            </div>
          </div>

          {/* Send Method */}
          <div>
            <h4 className="text-sm text-gray-800 font-bold mb-3">Hình thức gửi:</h4>
            
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  name="sendMethod" 
                  checked={sendMethod === 'app-notification'}
                  onChange={() => setSendMethod('app-notification')}
                  className="w-4 h-4 mr-3" 
                />
                <div>
                  <p className="text-sm text-gray-800 font-bold">Thông báo qua App (Khuyến nghị)</p>
                  <p className="text-xs text-gray-600">Gửi Push Notification + Hiển thị trong App cư dân</p>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  name="sendMethod" 
                  checked={sendMethod === 'sms'}
                  onChange={() => setSendMethod('sms')}
                  className="w-4 h-4 mr-3" 
                />
                <div>
                  <p className="text-sm text-gray-800 font-bold">SMS</p>
                  <p className="text-xs text-gray-600">Chi phí: 500 VNĐ/tin × {selectedCount} người = {selectedCount * 500} VNĐ</p>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  name="sendMethod" 
                  checked={sendMethod === 'email'}
                  onChange={() => setSendMethod('email')}
                  className="w-4 h-4 mr-3" 
                />
                <div>
                  <p className="text-sm text-gray-800 font-bold">Email</p>
                  <p className="text-xs text-gray-600">Miễn phí, kèm file PDF đính kèm</p>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  name="sendMethod" 
                  checked={sendMethod === 'all-methods'}
                  onChange={() => setSendMethod('all-methods')}
                  className="w-4 h-4 mr-3" 
                />
                <div>
                  <p className="text-sm text-gray-800 font-bold">Tất cả (App + SMS + Email)</p>
                  <p className="text-xs text-gray-600">Đảm bảo cao nhất, chi phí: {selectedCount * 500} VNĐ</p>
                </div>
              </label>
            </div>
          </div>

          {/* Summary Info */}
          <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
            <p className="text-sm text-yellow-800">
              <strong>📋 Tóm tắt:</strong> Sẽ gửi cho <strong>{selectedCount}</strong> người qua <strong>
              {sendMethod === 'app-notification' ? 'App Notification' :
               sendMethod === 'sms' ? 'SMS' :
               sendMethod === 'email' ? 'Email' : 'App + SMS + Email'}
              </strong>
              {(sendMethod === 'sms' || sendMethod === 'all-methods') && (
                <span className="ml-1">(Chi phí: {selectedCount * 500} VNĐ)</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={handleSend}
            disabled={isSending || selectedCount === 0}
            className={`px-5 py-2 text-white text-sm rounded flex items-center space-x-2 ${
              isSending || selectedCount === 0 ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Gửi ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}