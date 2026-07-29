import { LayoutDashboard, Building2, Users, CircleDollarSign, Wrench, Bot, BarChart3, ChevronDown, ChevronLeft, ChevronRight, UserCog, Home, Newspaper } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';

interface SidebarProps {
  isOpen?: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
  onToggleCollapsed?: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Bảng điều khiển', path: '/dashboard' },
  { 
    icon: Building2, 
    label: 'Quản lý Hạ tầng',
    path: '/building-management',
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
    icon: CircleDollarSign, 
    label: 'Hóa đơn & Tài chính',
    subItems: [
      { label: 'Xuất hóa đơn tháng', path: '/utility-reading' },
      { label: 'Lịch sử Giao dịch', path: '/transaction-history' },
      { label: 'Công nợ & Nhắc nợ', path: '/debt-management' },
    ]
  },
  { 
    icon: Wrench, 
    label: 'Vận hành & Sự cố',
    path: '/maintenance-request',
  },
  {
    icon: Newspaper,
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

export function Sidebar({ isOpen = false, isCollapsed = false, onClose, onToggleCollapsed }: SidebarProps) {
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
    if (isCollapsed && item.subItems) {
      onToggleCollapsed?.();
      setExpandedItem(item.label);
      return;
    }

    if (item.subItems) {
      setExpandedItem(expandedItem === item.label ? null : item.label);
    } else if (item.path) {
      setExpandedItem(null);
      navigate(item.path);
      onClose?.(); // close drawer on mobile after navigation
    }
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    if (location.pathname === path) return true;
    return path === '/post-management' && location.pathname.startsWith('/post-management/');
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
        .admin-sidebar {
          top: 0 !important;
          height: 100vh !important;
          transition: width 0.2s ease, min-width 0.2s ease, transform 0.22s ease;
        }

        @media (max-width: 1279px) {
          #sidebar-backdrop { display: block !important; top: 0 !important; }
          .admin-sidebar {
            position: fixed !important;
            left: 0; bottom: 0;
            z-index: 70;
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
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            height: 100vh !important;
            z-index: 70;
            transform: none !important;
          }
        }

        .admin-sidebar.collapsed .sidebar-logo-text,
        .admin-sidebar.collapsed .sidebar-item-label,
        .admin-sidebar.collapsed .sidebar-chevron {
          display: none;
        }

        .admin-sidebar.collapsed .sidebar-logo-toggle {
          justify-content: center;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }

        .admin-sidebar.collapsed .sidebar-menu-button {
          justify-content: center !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }

        .sidebar-menu-button {
          cursor: pointer;
        }

        .sidebar-menu-button:hover {
          background-color: rgba(30, 78, 140, 0.08) !important;
          color: var(--brand-primary) !important;
          box-shadow: inset 0 0 0 1px rgba(30, 78, 140, 0.12) !important;
        }

        .sidebar-submenu-button {
          cursor: pointer;
        }

        .sidebar-submenu-button:hover {
          background-color: rgba(30, 78, 140, 0.08) !important;
          color: var(--brand-primary) !important;
        }
      `}</style>
      <aside
        className={`admin-sidebar flex flex-col${isOpen ? ' open' : ''}${isCollapsed ? ' collapsed' : ''}`}
        style={{ width: isCollapsed ? '80px' : '288px', minWidth: isCollapsed ? '80px' : '288px', height: '100vh', backgroundColor: 'var(--sidebar)', borderRight: '1px solid var(--surface-border)' }}>
      {/* Logo */}
        <button
          type="button"
          className="sidebar-logo-toggle h-16 flex w-full items-center justify-between transition-colors hover:bg-[var(--brand-surface)]"
          style={{ border: 'none', borderBottom: '1px solid var(--surface-border)', background: 'transparent', cursor: 'pointer', paddingLeft: '20px', paddingRight: '12px', gap: '12px' }}
          onClick={onToggleCollapsed}
          title={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        >
          <div className="flex min-w-0 items-center" style={{ gap: '12px' }}>
            {/* Icon Box */}
            <div 
              className="flex shrink-0 items-center justify-center"
              style={{ 
                width: '40px', 
                height: '40px', 
                background: 'linear-gradient(135deg, var(--primary), var(--info))',
                borderRadius: '12px',
                boxShadow: '0 12px 26px rgba(30, 78, 140, 0.22)'
              }}
            >
              <Home size={28} style={{ color: 'white', strokeWidth: 2 }} />
            </div>
            {/* Text */}
            <span className="sidebar-logo-text truncate" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              SmartHome Hub
            </span>
          </div>
          <span className="sidebar-logo-text flex shrink-0 items-center justify-center rounded-lg" style={{ width: '32px', height: '32px', color: 'var(--text-secondary)' }}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </span>
        </button>
      
      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '16px 14px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item, index) => (
            <div key={index}>
              <button
                onClick={() => handleItemClick(item)}
                className="sidebar-menu-button w-full flex items-center justify-between transition-colors"
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isParentActive(item) ? 'rgba(30, 78, 140, 0.1)' : 'transparent',
                  color: isParentActive(item) ? 'var(--brand-primary)' : 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'left',
                  boxShadow: isParentActive(item) ? 'inset 0 0 0 1px rgba(30, 78, 140, 0.15), 0 10px 22px rgba(30, 78, 140, 0.08)' : 'none'
                }}
                title={item.label}
              >
                <div className="flex items-center" style={{ gap: '10px' }}>
                  <item.icon size={18} className="shrink-0" />
                  <span className="sidebar-item-label">{item.label}</span>
                </div>
                {item.subItems && (
                  <ChevronDown 
                    size={16} 
                    className="sidebar-chevron transition-transform"
                    style={{
                      transform: expandedItem === item.label ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                )}
              </button>
              
              {/* Sub Items */}
              {!isCollapsed && item.subItems && expandedItem === item.label && (
                <div style={{ marginTop: '6px', paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {item.subItems.map((subItem: any, subIndex: number) => (
                    <button
                      key={subIndex}
                      onClick={() => {
                        navigate(subItem.path);
                        onClose?.();
                      }}
                      className="sidebar-submenu-button w-full transition-colors"
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: isActive(subItem.path) ? 'rgba(30, 78, 140, 0.12)' : 'transparent',
                        color: isActive(subItem.path) ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        fontSize: 'var(--type-caption)',
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
