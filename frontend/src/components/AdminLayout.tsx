import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet, useLocation } from 'react-router';
import { useState } from 'react';

// Map routes to titles
const routeTitles: Record<string, string> = {
  '/dashboard': 'Bảng điều khiển',
  '/building-management': 'Quản lý Hạ tầng - Cơ cấu Tòa nhà & Phòng',
  '/service-pricing': 'Quản lý Hạ tầng - Danh mục Dịch vụ & Đơn giá',
  '/asset-inventory': 'Quản lý Hạ tầng - Quản lý Kho tài sản',
  '/resident-management': 'Cư dân & Hợp đồng - Danh sách Cư dân',
  '/contract-management': 'Cư dân & Hợp đồng - Quản lý Hợp đồng',
  '/settlement': 'Cư dân & Hợp đồng - Tất toán & Thanh lý',
  '/utility-reading': 'Hóa đơn & Tài chính - Chốt chỉ số Điện/Nước',
  '/invoice-management': 'Hóa đơn & Tài chính - Quản lý Hóa đơn',
  '/transaction-history': 'Hóa đơn & Tài chính - Lịch sử Giao dịch',
  '/debt-management': 'Hóa đơn & Tài chính - Công nợ & Nhắc nợ',
  '/maintenance-request': 'Vận hành & Sự cố - Quản lý Yêu cầu sửa chữa',
  '/knowledge-base': 'Trợ lý ảo AI - Quản lý Kho tri thức',
  '/chat-history': 'Trợ lý ảo AI - Lịch sử hội thoại',
  '/revenue-report': 'Báo cáo & Thống kê - Báo cáo Doanh thu',
  '/occupancy-report': 'Báo cáo & Thống kê - Báo cáo Lấp đầy',
  '/debt-report': 'Báo cáo & Thống kê - Báo cáo Công nợ',
  '/user-accounts': 'Quản lý Tài khoản - Danh sách Tài khoản',
  '/my-profile': 'Quản lý Tài khoản - Hồ sơ cá nhân',
  '/audit-logs': 'Quản lý Tài khoản - Nhật ký hoạt động',
};

export function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Check if we're on pages that need padding
  const needsPadding = !['/building-management'].includes(location.pathname);
  
  // Get title for current route
  const currentTitle = routeTitles[location.pathname] || 'Bảng điều khiển';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-bg)' }}>
      <div className="flex" style={{ minHeight: '100vh' }}>
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
          {/* Topbar */}
          <Topbar title={currentTitle} onMenuToggle={() => setSidebarOpen(o => !o)} />
          
          {/* Content Area */}
          <main className="flex-1 overflow-y-auto overflow-x-auto" style={{ padding: needsPadding ? 'var(--space-layout)' : '0' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}