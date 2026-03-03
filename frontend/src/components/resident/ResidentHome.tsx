import { useNavigate } from 'react-router';
import { CreditCard, MessageCircle, FileText, History, AlertCircle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export function ResidentHome() {
  const navigate = useNavigate();
  const { bills, activities } = useData();

  // Get current bill
  const currentBill = bills.find(b => b.status === 'pending') || bills[0];

  const quickActions = [
    {
      icon: FileText,
      label: 'Báo cáo sự cố',
      color: '#E67E22',
      bgColor: '#FEF3E8',
      path: '/resident/incidents/create',
    },
    {
      icon: MessageCircle,
      label: 'Hỏi AI',
      color: '#1A4B84',
      bgColor: '#E8F0F8',
      path: '/resident/chat',
    },
    {
      icon: History,
      label: 'Lịch sử thanh toán',
      color: '#1E7E34',
      bgColor: '#E8F5E9',
      path: '/resident/payment-history',
    },
    {
      icon: CreditCard,
      label: 'Thanh toán',
      color: '#D32F2F',
      bgColor: '#FFEBEE',
      path: '/resident/bill-detail',
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Greeting */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Xin chào, Nguyễn Văn A
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Căn hộ A-1205 • Tòa A
        </p>
      </div>

      {/* Bill Balance Card - Nổi bật nhất */}
      {currentBill ? (
        <div 
          className="rounded-2xl p-5 shadow-lg"
          style={{ 
            background: 'linear-gradient(135deg, #1A4B84 0%, #2563A8 100%)',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AlertCircle size={20} color="#FFF" />
              <p style={{ fontSize: '13px', color: '#FFF', fontWeight: 600 }}>
                Số dư hóa đơn tháng này
              </p>
            </div>
          </div>
          
          <div className="mb-3">
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#FFF', lineHeight: 1.2 }}>
              {currentBill.amount.toLocaleString('vi-VN')}đ
            </p>
            <p style={{ fontSize: '12px', color: '#E8F0F8', marginTop: '4px' }}>
              Hạn thanh toán: {currentBill.dueDate}
            </p>
          </div>

          <button
            onClick={() => navigate('/resident/bill-detail')}
            className="w-full py-3 rounded-lg text-center transition-colors"
            style={{
              backgroundColor: '#FFF',
              color: 'var(--brand-primary)',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            Xem chi tiết & Thanh toán
          </button>
        </div>
      ) : (
        <div 
          className="rounded-2xl p-5 shadow-lg"
          style={{ 
            background: 'linear-gradient(135deg, #E8F0F8 0%, #F5F9FC 100%)',
            border: '2px dashed #1A4B84',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AlertCircle size={20} color="#1A4B84" />
              <p style={{ fontSize: '13px', color: '#1A4B84', fontWeight: 600 }}>
                Thông báo
              </p>
            </div>
          </div>
          
          <div className="mb-3">
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              Chưa có hóa đơn nào
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Hóa đơn sẽ được cập nhật khi ban quản lý phê duyệt
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Truy cập nhanh
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                  style={{ backgroundColor: action.bgColor }}
                >
                  <Icon size={24} color={action.color} strokeWidth={2} />
                </div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left' }}>
                  {action.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Hoạt động gần đây
        </h3>
        <div className="space-y-2">
          {activities.slice(0, 3).map((activity) => {
            const getStatusStyle = (status: string) => {
              switch (status) {
                case 'success':
                  return { color: '#1E7E34', label: 'Hoàn thành' };
                case 'pending':
                  return { color: '#E67E22', label: 'Đang xử lý' };
                case 'warning':
                  return { color: '#D32F2F', label: 'Chờ xử lý' };
                default:
                  return { color: '#1A4B84', label: 'Mới' };
              }
            };
            const statusStyle = getStatusStyle(activity.status);
            
            return (
              <div key={activity.id} className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                <div className="flex-1 pr-2">
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {activity.title}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {activity.time}
                  </p>
                </div>
                <span
                  className="px-2 py-1 rounded-full flex-shrink-0"
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: statusStyle.color,
                    backgroundColor: statusStyle.color + '15',
                  }}
                >
                  {statusStyle.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}