import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet, useLocation } from 'react-router';
import { useEffect, useRef, useState } from 'react';

// Map routes to titles
const routeTitles: Record<string, string> = {
  '/dashboard': 'Bảng điều khiển',
  '/building-management': 'Quản lý Hạ tầng',
  '/service-pricing': 'Quản lý Hạ tầng',
  '/asset-inventory': 'Quản lý Hạ tầng',
  '/resident-management': 'Cư dân & Hợp đồng - Danh sách Cư dân',
  '/contract-management': 'Cư dân & Hợp đồng - Quản lý Hợp đồng',
  '/settlement': 'Cư dân & Hợp đồng - Tất toán & Thanh lý',
  '/utility-reading': 'Hóa đơn & Tài chính - Xuất hóa đơn tháng',
  '/invoice-management': 'Hóa đơn & Tài chính - Xuất hóa đơn tháng',
  '/transaction-history': 'Hóa đơn & Tài chính - Lịch sử Giao dịch',
  '/debt-management': 'Hóa đơn & Tài chính - Công nợ & Nhắc nợ',
  '/maintenance-request': 'Vận hành & Sự cố - Quản lý Yêu cầu sửa chữa',
  '/resident-notifications': 'Thông báo cư dân - Gửi thông báo chủ động',
  '/post-management': 'Đăng bài tìm phòng - Quản lý bài đăng',
  '/post-management/create': 'Đăng bài tìm phòng - Tạo bài đăng',
  '/messages': 'Đăng bài tìm phòng - Tin nhắn',
  '/knowledge-base': 'Trợ lý ảo AI - Quản lý Kho tri thức',
  '/chat-history': 'Trợ lý ảo AI - Lịch sử hội thoại',
  '/revenue-report': 'Báo cáo & Thống kê - Báo cáo Doanh thu',
  '/occupancy-report': 'Báo cáo & Thống kê - Báo cáo Lấp đầy',
  '/user-accounts': 'Quản lý Tài khoản - Danh sách Tài khoản',
  '/my-profile': 'Quản lý Tài khoản - Hồ sơ cá nhân',
  '/audit-logs': 'Quản lý Tài khoản - Nhật ký hoạt động',
};

export function AdminLayout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Check if we're on pages that need padding
  const needsPadding = !['/building-management'].includes(location.pathname);
  
  // Get title for current route
  const currentTitle = routeTitles[location.pathname] || 'Bảng điều khiển';

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div
      className={`min-h-screen bg-surface-bg text-text-primary ${sidebarCollapsed ? 'sidebar-is-collapsed' : 'sidebar-is-expanded'}`}
      style={{ minHeight: '100dvh', backgroundColor: 'var(--surface-level-1)' }}
    >
      <style>{`
        .admin-main-content {
          margin-top: var(--admin-topbar-height);
          min-height: calc(100dvh - var(--admin-topbar-height));
          transition: margin-left 0.2s ease;
        }

        .admin-topbar {
          transition: left 0.2s ease;
        }

        @media (min-width: 1280px) {
          .sidebar-is-expanded .admin-topbar {
            left: 288px !important;
          }

          .sidebar-is-collapsed .admin-topbar {
            left: 80px !important;
          }

          .sidebar-is-expanded .admin-main-content {
            margin-left: 288px;
          }

          .sidebar-is-collapsed .admin-main-content {
            margin-left: 80px;
          }
        }
      `}</style>
      <Topbar title={currentTitle} onMenuToggle={() => setSidebarOpen(o => !o)} />
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
      />

      <main
        ref={mainRef}
        className="admin-main-content overflow-x-hidden"
      >
        <div className={needsPadding ? 'app-page-shell app-section' : ''}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
