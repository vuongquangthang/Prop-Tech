import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Dashboard({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError('Không thể tải dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  if (user.role === 'RESIDENT') {
    return <ResidentDashboard data={dashboardData} />;
  } else {
    return <ManagerDashboard data={dashboardData} />;
  }
}

function ResidentDashboard({ data }) {
  return (
    <div className="dashboard resident-dashboard">
      <h2>Bảng Điều Khiển Cư Dân</h2>
      
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Hóa Đơn Chưa Thanh Toán</h3>
          <div className="card-value">
            {data?.unpaidInvoiceCount || 0}
          </div>
          <p className="card-label">Hóa Đơn</p>
        </div>

        <div className="dashboard-card">
          <h3>Tổng Nợ</h3>
          <div className="card-value">
            {(data?.totalDebt || 0).toLocaleString()}₫
          </div>
          <p className="card-label">Tiền</p>
        </div>

        <div className="dashboard-card">
          <h3>Khiếu Nại Đang Xử Lý</h3>
          <div className="card-value">
            {data?.openComplaintCount || 0}
          </div>
          <p className="card-label">Khiếu Nại</p>
        </div>

        <div className="dashboard-card">
          <h3>Kỳ Tính Tiền Hiện Tại</h3>
          <div className="card-value">
            {data?.currentPeriod || 'N/A'}
          </div>
          <p className="card-label">Kỳ</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Hóa Đơn Gần Đây</h3>
        {data?.recentInvoices?.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Số Hóa Đơn</th>
                <th>Kỳ</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {data.recentInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{invoice.billingPeriodId}</td>
                  <td>{invoice.totalAmount.toLocaleString()}₫</td>
                  <td>
                    <span className={`status ${invoice.status.toLowerCase()}`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Chưa có hóa đơn nào</p>
        )}
      </div>
    </div>
  );
}

function ManagerDashboard({ data }) {
  return (
    <div className="dashboard manager-dashboard">
      <h2>Bảng Điều Khiển Quản Lý</h2>
      
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Tổng Doanh Thu</h3>
          <div className="card-value">
            {(data?.totalRevenue || 0).toLocaleString()}₫
          </div>
          <p className="card-label">Tháng Này</p>
        </div>

        <div className="dashboard-card">
          <h3>Tiền Chưa Thu</h3>
          <div className="card-value">
            {(data?.totalReceivables || 0).toLocaleString()}₫
          </div>
          <p className="card-label">Công Nợ</p>
        </div>

        <div className="dashboard-card">
          <h3>Tất Cả Phòng</h3>
          <div className="card-value">
            {data?.totalRooms || 0}
          </div>
          <p className="card-label">Phòng</p>
        </div>

        <div className="dashboard-card">
          <h3>Phòng Đã Cho Thuê</h3>
          <div className="card-value">
            {data?.occupiedRooms || 0}
          </div>
          <p className="card-label">Phòng</p>
        </div>

        <div className="dashboard-card">
          <h3>Khiếu Nại Chưa Xử Lý</h3>
          <div className="card-value">
            {data?.pendingComplaints || 0}
          </div>
          <p className="card-label">Khiếu Nại</p>
        </div>

        <div className="dashboard-card">
          <h3>Hóa Đơn Nháp</h3>
          <div className="card-value">
            {data?.draftInvoiceCount || 0}
          </div>
          <p className="card-label">Hóa Đơn</p>
        </div>
      </div>

      <div className="manager-actions">
        <button className="btn-primary btn-large">
          Tạo Kỳ Tính Tiền Mới
        </button>
        <button className="btn-primary btn-large">
          Sinh Hóa Đơn
        </button>
      </div>

      <div className="dashboard-section">
        <h3>Thống Kê Theo Tòa</h3>
        {data?.buildingStats?.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Tòa</th>
                <th>Phòng Cho Thuê</th>
                <th>Doanh Thu</th>
                <th>Công Nợ</th>
              </tr>
            </thead>
            <tbody>
              {data.buildingStats.map((building) => (
                <tr key={building.id}>
                  <td>{building.name}</td>
                  <td>{building.occupiedRooms}/{building.totalRooms}</td>
                  <td>{building.revenue.toLocaleString()}₫</td>
                  <td>{building.receivables.toLocaleString()}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Chưa có dữ liệu</p>
        )}
      </div>
    </div>
  );
}
