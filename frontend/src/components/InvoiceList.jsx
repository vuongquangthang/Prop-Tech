import { useState, useEffect } from 'react';
import api from '../services/api';

export default function InvoiceList({ userRole }) {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      let data;
      if (userRole === 'RESIDENT') {
        data = await api.getMyInvoices();
      } else {
        // For managers - show a placeholder or implement manager view
        data = [];
      }
      setInvoices(data || []);
    } catch (err) {
      setError('Không thể tải danh sách hóa đơn');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (invoiceId) => {
    try {
      const detail = await api.getInvoiceDetail(invoiceId);
      setSelectedInvoice(detail);
    } catch (err) {
      setError('Không thể tải chi tiết hóa đơn');
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="invoice-container">
      <h2>Danh Sách Hóa Đơn</h2>
      {error && <div className="error-message">{error}</div>}
      
      {selectedInvoice ? (
        <InvoiceDetail invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      ) : (
        <div className="invoice-list">
          {invoices.length === 0 ? (
            <p>Không có hóa đơn nào</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Mã Hóa Đơn</th>
                  <th>Phòng</th>
                  <th>Kỳ</th>
                  <th>Tổng Tiền</th>
                  <th>Trạng Thái</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.roomId}</td>
                    <td>{invoice.billingPeriodId}</td>
                    <td>{invoice.totalAmount.toLocaleString()} đ</td>
                    <td>
                      <span className={`status ${invoice.status.toLowerCase()}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleViewDetail(invoice.id)}
                        className="btn-small"
                      >
                        Xem Chi Tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function InvoiceDetail({ invoice, onClose }) {
  return (
    <div className="invoice-detail">
      <button onClick={onClose} className="btn-back">← Quay Lại</button>
      <h3>Chi Tiết Hóa Đơn {invoice.invoiceNumber}</h3>
      <div className="detail-grid">
        <div className="detail-item">
          <label>Mã Hóa Đơn:</label>
          <span>{invoice.invoiceNumber}</span>
        </div>
        <div className="detail-item">
          <label>Phòng:</label>
          <span>{invoice.roomId}</span>
        </div>
        <div className="detail-item">
          <label>Trạng Thái:</label>
          <span className={`status ${invoice.status.toLowerCase()}`}>{invoice.status}</span>
        </div>
        <div className="detail-item">
          <label>Ngày Phát Hành:</label>
          <span>{new Date(invoice.issueDate).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      <div className="breakdown">
        <h4>Chi Tiết Tiền:</h4>
        <div className="breakdown-row">
          <span>Tiền Phòng:</span>
          <span>{invoice.roomCharge?.toLocaleString() || 0} đ</span>
        </div>
        <div className="breakdown-row">
          <span>Tiền Nước ({invoice.headcount} người):</span>
          <span>{invoice.waterCharge?.toLocaleString() || 0} đ</span>
        </div>
        <div className="breakdown-row">
          <span>Tiền Điện:</span>
          <span>{invoice.electricityCharge?.toLocaleString() || 0} đ</span>
        </div>
        <div className="breakdown-row">
          <span>Tiền Dịch Vụ ({invoice.headcount} người):</span>
          <span>{invoice.serviceCharge?.toLocaleString() || 0} đ</span>
        </div>
        {invoice.adjustmentAmount !== 0 && (
          <div className="breakdown-row">
            <span>Điều Chỉnh:</span>
            <span>{invoice.adjustmentAmount?.toLocaleString()} đ</span>
          </div>
        )}
        <div className="breakdown-row total">
          <span>Tổng Cộng:</span>
          <span>{invoice.totalAmount.toLocaleString()} đ</span>
        </div>
      </div>

      {invoice.status === 'UNPAID' && (
        <div className="invoice-actions">
          <button className="btn-primary">Thanh Toán</button>
        </div>
      )}
    </div>
  );
}
