import { LayoutDashboard, Building2, Users, FileText, Wrench, Bot, BarChart3, ChevronDown, UserCog, Home, ArrowLeft, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';

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
      { label: 'Báo cáo Công nợ', path: '/debt-report' },
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

export function Sidebar() {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-expand parent menu if we're on a sub-route
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Find which parent menu contains the current path
    const parentMenu = menuItems.find(item => 
      item.subItems?.some((subItem: any) => subItem.path === currentPath)
    );
    
    if (parentMenu) {
      setExpandedItem(parentMenu.label);
    }
  }, [location.pathname]);

  const handleItemClick = (item: any) => {
    if (item.subItems) {
      // Toggle submenu
      setExpandedItem(expandedItem === item.label ? null : item.label);
    } else if (item.path) {
      // Navigate and close all submenus
      setExpandedItem(null);
      navigate(item.path);
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
    <aside className="flex flex-col" style={{ width: '340px', backgroundColor: 'var(--surface-card)', borderRight: '1px solid var(--surface-border)', marginTop: '10px' }}>
      {/* Logo */}
      <div className="h-16 flex items-center" style={{ borderBottom: '1px solid var(--surface-border)', paddingLeft: '24px', gap: '12px' }}>
        {/* Icon Box */}
        <div 
          className="flex items-center justify-center"
          style={{ 
            width: '48px', 
            height: '48px', 
            backgroundColor: '#FF5733',
            borderRadius: '12px'
          }}
        >
          <Home size={28} style={{ color: 'white', strokeWidth: 2 }} />
        </div>
        {/* Text */}
        <span style={{ fontSize: '24px', fontWeight: 700, color: '#000000' }}>
          SmartHome Hub
        </span>
      </div>
      
      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '20px', paddingTop: '50px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {menuItems.map((item, index) => (
            <div key={index}>
              <button
                onClick={() => handleItemClick(item)}
                className="w-full flex items-center justify-between transition-colors"
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: isParentActive(item) && !item.subItems ? 'var(--brand-primary)' : '#F3F4F6',
                  color: isParentActive(item) && !item.subItems ? 'white' : 'var(--text-primary)',
                  fontSize: '18px',
                  fontWeight: 500,
                  textAlign: 'left'
                }}
              >
                <div className="flex items-center" style={{ gap: '12px' }}>
                  <item.icon size={24} />
                  <span>{item.label}</span>
                </div>
                {item.subItems && (
                  <ChevronDown 
                    size={20} 
                    className="transition-transform"
                    style={{
                      transform: expandedItem === item.label ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                )}
              </button>
              
              {/* Sub Items */}
              {item.subItems && expandedItem === item.label && (
                <div style={{ marginTop: '8px', paddingLeft: '36px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {item.subItems.map((subItem: any, subIndex: number) => (
                    <button
                      key={subIndex}
                      onClick={() => {
                        navigate(subItem.path);
                      }}
                      className="w-full transition-colors"
                      style={{
                        padding: '14px 20px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: isActive(subItem.path) ? 'var(--brand-primary)' : '#F3F4F6',
                        color: isActive(subItem.path) ? 'white' : 'var(--text-primary)',
                        fontSize: '16px',
                        fontWeight: isActive(subItem.path) ? 600 : 400,
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
  );
}