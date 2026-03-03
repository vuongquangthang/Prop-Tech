import { Eye, FileText, Send, Filter } from 'lucide-react';
import { useState } from 'react';
import { ViewInvoiceModal, PrintInvoiceModal, SendInvoiceModal } from './InvoiceModals';
import { PrintInvoiceModal as PrintModal, SendInvoiceModal as SendModal } from './InvoiceActions';
import { useData } from '../../contexts/DataContext';

const statusConfig = {
  draft: { label: 'Nháp', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800 border-green-300' },
  overdue: { label: 'Quá hạn', color: 'bg-red-100 text-red-800 border-red-300' },
};

export function InvoiceTable() {
  const { invoices, updateInvoiceStatus, addNotification } = useData();
  const [activeTab, setActiveTab] = useState('draft');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [modalType, setModalType] = useState<'view' | 'print' | 'send' | null>(null);
  const [bulkSendModal, setBulkSendModal] = useState(false);
  
  const filteredInvoices = activeTab === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === activeTab);

  // Calculate tab counts
  const tabs = [
    { key: 'draft', label: 'Nháp', count: invoices.filter(inv => inv.status === 'draft').length },
    { key: 'pending', label: 'Chờ thanh toán', count: invoices.filter(inv => inv.status === 'pending').length },
    { key: 'paid', label: 'Đã thanh toán', count: invoices.filter(inv => inv.status === 'paid').length },
    { key: 'overdue', label: 'Quá hạn', count: invoices.filter(inv => inv.status === 'overdue').length },
  ];

  const handleOpenModal = (invoice: any, type: 'view' | 'print' | 'send') => {
    setSelectedInvoice(invoice);
    setModalType(type);
  };

  const handleCloseModal = () => {
    setSelectedInvoice(null);
    setModalType(null);
  };

  const handleBulkApproveAndSend = () => {
    const draftInvoices = filteredInvoices.filter(inv => inv.status === 'draft');
    if (draftInvoices.length === 0) {
      alert('Không có hóa đơn nháp nào để phê duyệt!');
      return;
    }
    
    if (confirm(`Bạn có chắc muốn phê duyệt và gửi ${draftInvoices.length} hóa đơn nháp?`)) {
      // Update each invoice status to 'pending' and send notification to residents
      draftInvoices.forEach((invoice) => {
        // Update invoice status
        updateInvoiceStatus(invoice.id, 'pending');
        
        // Send notification to resident
        addNotification({
          type: 'payment',
          title: 'Hóa đơn mới cần thanh toán',
          message: `Hóa đơn ${invoice.code} cho phòng ${invoice.room} kỳ ${invoice.period} đã được phát hành. Tổng tiền: ${invoice.amount} VNĐ. Vui lòng thanh toán trước hạn.`,
          relatedId: invoice.id,
          target: 'resident',
        });
      });
      
      alert(`✅ Đã phê duyệt và gửi thành công ${draftInvoices.length} hóa đơn!\n\n• Trạng thái: Chuyển sang "Chờ thanh toán"\n• Thông báo: Đã gửi đến App cư dân`);
      
      // Switch to pending tab to see results
      setActiveTab('pending');
    }
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center space-x-2">
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
      
      {/* Filter & Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter size={16} className="text-gray-500" />
          
          <select className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
            <option>Tất cả phòng</option>
            <option>Tòa A</option>
            <option>Tòa B</option>
            <option>Tòa C</option>
          </select>
          
          <select className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
            <option>Tháng 02/2026</option>
            <option>Tháng 01/2026</option>
            <option>Tháng 12/2025</option>
          </select>
        </div>
        
        {activeTab === 'draft' && (
          <button 
            onClick={handleBulkApproveAndSend}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2"
          >
            <Send size={16} />
            <span>Phê duyệt & Gửi hàng loạt</span>
          </button>
        )}
      </div>
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-lg text-gray-800">Danh sách hóa đơn - {filteredInvoices.length} hóa đơn</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Mã hóa đơn</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Phòng</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Chủ hộ</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Kỳ thanh toán</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">Tổng tiền (VNĐ)</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Trạng thái</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice, index) => (
                <tr key={index} className={`border-b border-gray-200 hover:bg-gray-50 ${invoice.status === 'overdue' ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 text-sm text-gray-800">{invoice.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{invoice.room}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{invoice.tenant}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{invoice.period}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">{invoice.amount}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 text-xs rounded border ${statusConfig[invoice.status as keyof typeof statusConfig].color}`}>
                      {statusConfig[invoice.status as keyof typeof statusConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded" title="Xem chi tiết" onClick={() => handleOpenModal(invoice, 'view')}>
                        <Eye size={16} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded" title="In hóa đơn" onClick={() => handleOpenModal(invoice, 'print')}>
                        <FileText size={16} className="text-gray-600" />
                      </button>
                      {invoice.status === 'draft' && (
                        <button className="p-2 hover:bg-gray-100 rounded" title="Phê duyệt & Gửi" onClick={() => handleOpenModal(invoice, 'send')}>
                          <Send size={16} className="text-gray-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modalType === 'view' && selectedInvoice && (
        <ViewInvoiceModal invoice={selectedInvoice} onClose={handleCloseModal} />
      )}
      {modalType === 'print' && selectedInvoice && (
        <PrintModal invoice={selectedInvoice} onClose={handleCloseModal} />
      )}
      {modalType === 'send' && selectedInvoice && (
        <SendModal invoice={selectedInvoice} onClose={handleCloseModal} />
      )}
    </>
  );
}