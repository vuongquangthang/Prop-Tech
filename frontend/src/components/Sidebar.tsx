import { LayoutDashboard, Building2, Users, FileText, Wrench, Bot, BarChart3, ChevronDown, UserCog, Home, LogOut, Megaphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Bảng điều khiển', path: '/dashboard' },
  { 
    icon: Building2, 
    label: 'Quản lý Hạ tầng',
    subItems: [
      { label: 'Cơ cấu Tòa nhà & Phòng', path: '/building-management' },
      { label: 'Danh mục Dịch vụ & Đơn giá', path: '/service-pricing' },
      { label: 'Quản lý Kho tài sản', path: '/asset-inventory' },
    ]
  },
  { 
    icon: Users, 
    label: 'Cư dân & Hợp đồng',
    subItems: [
      { label: 'Danh sách Cư dân', path: '/resident-management' },
      { label: 'Quản lý Hợp đồng', path: '/contract-management' },
      { label: 'Tất toán & Thanh lý', path: '/settlement' },
    ]
  },
  { 
    icon: FileText, 
    label: 'Hóa đơn & Tài chính',
    subItems: [
      { label: 'Chốt chỉ số Điện/Nước', path: '/utility-reading' },
      { label: 'Quản lý Hóa đơn', path: '/invoice-management' },
      { label: 'Lịch sử Giao dịch', path: '/transaction-history' },
      { label: 'Công nợ & Nhắc nợ', path: '/debt-management' },
    ]
  },
  { 
    icon: Wrench, 
    label: 'Vận hành & Sự cố',
    subItems: [
      { label: 'Quản lý Yêu cầu sửa chữa', path: '/maintenance-request' },
    ]
  },
  { 
    icon: Megaphone, 
    label: 'Đăng bài tìm phòng',
    subItems: [
      { label: 'Quản lý bài đăng', path: '/post-management' },
      { label: 'Tin nhắn', path: '/messages' },
    ]
  },
  { 
    icon: Bot, 
    label: 'Trợ lý ảo AI',
    subItems: [
      { label: 'Quản lý Kho tri thức', path: '/knowledge-base' },
      { label: 'Lịch sử hội thoại', path: '/chat-history' },
    ]
  },
  { 
    icon: BarChart3, 
    label: 'Báo cáo & Thống kê',
    subItems: [
      { label: 'Báo cáo Doanh thu', path: '/revenue-report' },
      { label: 'Báo cáo Lấp đầy', path: '/occupancy-report' },
    ]
  },
  { 
    icon: UserCog, 
    label: 'Quản lý Tài khoản',
    subItems: [
      { label: 'Danh sách Tài khoản', path: '/user-accounts' },
      { label: 'Hồ sơ cá nhân', path: '/my-profile' },
      { label: 'Nhật ký hoạt động', path: '/audit-logs' },
    ]
  },
];

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-expand parent menu if we're on a sub-route
  useEffect(() => {
    const currentPath = location.pathname;
    const parentMenu = menuItems.find(item => 
      item.subItems?.some((subItem: any) => subItem.path === currentPath)
    );
    if (parentMenu) {
      setExpandedItem(parentMenu.label);
    }
  }, [location.pathname]);

  const handleItemClick = (item: any) => {
    if (item.subItems) {
      setExpandedItem(expandedItem === item.label ? null : item.label);
    } else if (item.path) {
      setExpandedItem(null);
      navigate(item.path);
      onClose?.(); // close drawer on mobile after navigation
    }
  };

  const isActive = (path?: string) => {
    return location.pathname === path;
  };
  
  // Check if current route belongs to this parent menu
  const isParentActive = (item: any) => {
    if (item.path && isActive(item.path)) return true;
    if (item.subItems) {
      return item.subItems.some((subItem: any) => isActive(subItem.path));
    }
    return false;
  };

  return (
    <>
      {/* Backdrop overlay for tablet/small screens */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/35"
          style={{ display: 'none' }}
          id="sidebar-backdrop"
          onClick={onClose}
        />
      )}
      <style>{`
        @media (max-width: 1279px) {
          #sidebar-backdrop { display: block !important; }
          .admin-sidebar {
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.22s ease;
            box-shadow: 16px 0 40px rgba(15, 23, 42, 0.12);
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
        }
        @media (min-width: 1280px) {
          #sidebar-backdrop { display: none !important; }
          .admin-sidebar {
            position: relative !important;
            transform: none !important;
          }
        }
      `}</style>
      <aside
        className={`admin-sidebar flex flex-col${isOpen ? ' open' : ''}`}
        style={{ width: '288px', minWidth: '288px', backgroundColor: 'rgba(255,255,255,0.92)', borderRight: '1px solid var(--surface-border)' }}>
      {/* Logo */}
      <div className="h-16 flex items-center" style={{ borderBottom: '1px solid var(--surface-border)', paddingLeft: '20px', gap: '12px' }}>
        {/* Icon Box */}
        <div 
          className="flex items-center justify-center"
          style={{ 
            width: '40px', 
            height: '40px', 
            backgroundColor: 'var(--brand-primary)',
            borderRadius: '12px'
          }}
        >
          <Home size={28} style={{ color: 'white', strokeWidth: 2 }} />
        </div>
        {/* Text */}
        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
          SmartHome Hub
        </span>
      </div>
      
      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '16px 14px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item, index) => (
            <div key={index}>
              <button
                onClick={() => handleItemClick(item)}
                className="w-full flex items-center justify-between transition-colors"
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: isParentActive(item) ? 'rgba(30, 78, 140, 0.1)' : 'transparent',
                  color: isParentActive(item) ? 'var(--brand-primary)' : 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'left',
                  boxShadow: isParentActive(item) ? 'inset 0 0 0 1px rgba(30, 78, 140, 0.15)' : 'none'
                }}
              >
                <div className="flex items-center" style={{ gap: '10px' }}>
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.subItems && (
                  <ChevronDown 
                    size={16} 
                    className="transition-transform"
                    style={{
                      transform: expandedItem === item.label ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                )}
              </button>
              
              {/* Sub Items */}
              {item.subItems && expandedItem === item.label && (
                <div style={{ marginTop: '6px', paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {item.subItems.map((subItem: any, subIndex: number) => (
                    <button
                      key={subIndex}
                      onClick={() => {
                        navigate(subItem.path);
                        onClose?.();
                      }}
                      className="w-full transition-colors"
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: isActive(subItem.path) ? 'rgba(30, 78, 140, 0.12)' : 'transparent',
                        color: isActive(subItem.path) ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: isActive(subItem.path) ? 600 : 500,
                        textAlign: 'left'
                      }}
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </aside>
    </>
  );
}