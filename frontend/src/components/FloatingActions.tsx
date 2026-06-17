import { Plus, FileText, AlertCircle, Users, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

export function FloatingActions() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { icon: FileText, label: 'Quản lý hóa đơn', path: '/invoice-management' },
    { icon: AlertCircle, label: 'Yêu cầu sửa chữa', path: '/maintenance-request' },
    { icon: Users, label: 'Cư dân', path: '/residents' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-end gap-2">
          {actions.map((action) => (
            <button
              key={action.path}
              onClick={() => { navigate(action.path); setOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[10px] shadow-md hover:bg-gray-50 transition-colors"
              style={{ fontSize: 'var(--type-caption)', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              <action.icon size={16} style={{ color: 'var(--brand-primary)' }} />
              {action.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-14 h-14 rounded-[12px] shadow-lg flex items-center justify-center transition-colors"
        style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
        title="Thao tác nhanh"
      >
        {open ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
