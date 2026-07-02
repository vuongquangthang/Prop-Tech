import { Search, Edit2, X, AlertTriangle, User, Mail, Phone, Home, Shield, Loader2, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { EditResidentModal } from './ResidentTableModals';
import { residentService } from '../../services/api.service';
import { DataCard, DataTable, EmptyState, LoadingState, PageHeader, StatusBadge } from '../ui/product-system';
import { FilterSelect } from '../ui/FilterSelect';

interface ResidentData {
  id: number;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  idCardNumber?: string;
  buildingName?: string;
  floorNumber?: number;
  room?: string;
  status?: string;
  contractCode?: string;
  debt?: string;
}

const statusConfig = {
  active: { label: 'Đang hoạt động', tone: 'success' as const },
  locked: { label: 'Bị khóa', tone: 'danger' as const },
};

export function ResidentTable() {
  const [residents, setResidents] = useState<ResidentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState<any>(null);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await residentService.getAll();
      setResidents(data.map((r: any) => ({
        id: r.id,
        fullName: r.fullName || r.hoTen || '',
        phoneNumber: r.phoneNumber || r.soDienThoai || '',
        email: r.email || '',
        idCardNumber: r.idCardNumber || r.soCCCD || '',
        buildingName: r.buildingName || r.tenToaNha || '',
        floorNumber: r.floorNumber ?? r.soTang ?? undefined,
        room: r.roomCode || r.soPhong || '',
        status: r.isLocked ? 'locked' : 'active',
        contractCode: '',  // TODO: Get from contract data
        debt: '0'  // TODO: Get from invoice data
      })));
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách cư dân');
      console.error('Error fetching residents:', err);
    } finally {
      setLoading(false);
    }
  };

  const locationCollator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });
  const filteredResidents = residents
    .filter((resident) => {
      const matchesSearch =
        resident.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resident.phoneNumber && resident.phoneNumber.includes(searchTerm)) ||
        (resident.buildingName && resident.buildingName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (resident.room && resident.room.includes(searchTerm));
      const matchesStatus = statusFilter === 'all' || resident.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((first, second) => {
      const firstHasRoom = Boolean(first.buildingName && first.floorNumber != null && first.room);
      const secondHasRoom = Boolean(second.buildingName && second.floorNumber != null && second.room);
      if (firstHasRoom !== secondHasRoom) return firstHasRoom ? -1 : 1;

      const buildingComparison = locationCollator.compare(first.buildingName || '', second.buildingName || '');
      if (buildingComparison !== 0) return buildingComparison;

      const floorComparison = (first.floorNumber ?? Number.MAX_SAFE_INTEGER) - (second.floorNumber ?? Number.MAX_SAFE_INTEGER);
      if (floorComparison !== 0) return floorComparison;

      const roomComparison = locationCollator.compare(first.room || '', second.room || '');
      if (roomComparison !== 0) return roomComparison;

      return locationCollator.compare(first.fullName, second.fullName);
    });

  const handleEditClick = (resident: any) => {
    setSelectedResident(resident);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Cư dân"
        title="Quản lý cư dân"
        description="Theo dõi hồ sơ, phòng đang ở và trạng thái tài khoản cư dân trong cùng một danh sách."
      />

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Filter size={16} className="text-gray-500" />
          <FilterSelect
            className="app-select"
            style={{ width: '190px', flex: '0 0 190px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Bị khóa</option>
          </FilterSelect>
          <input
            type="text"
            placeholder="Tìm theo SĐT, tên hoặc phòng..."
            className="app-input"
            style={{ width: '280px', flex: '0 0 280px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
          <button 
            onClick={fetchResidents}
            className="app-button-danger ml-auto min-h-0 px-3 py-1"
          >
            Thử lại
          </button>
        </div>
      )}
      
      {/* Table */}
      <DataCard
        title={`Danh sách cư dân${loading ? '' : ` · ${filteredResidents.length} người`}`}
        description="Dữ liệu được đồng bộ từ hồ sơ cư dân và phòng đang thuê."
      >
          {loading ? (
            <LoadingState />
          ) : filteredResidents.length === 0 ? (
            <EmptyState icon={<User size={26} />} title="Không tìm thấy cư dân nào" description="Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái." />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Số điện thoại</th>
                  <th>Email</th>
                  <th>Tòa nhà</th>
                  <th>Tầng</th>
                  <th>Số phòng</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredResidents.map((resident) => (
                  <tr key={resident.id}>
                    <td className="font-semibold">{resident.fullName}</td>
                    <td>{resident.phoneNumber || '-'}</td>
                    <td>{resident.email || '-'}</td>
                    <td>{resident.buildingName || '-'}</td>
                    <td>{resident.floorNumber ?? '-'}</td>
                    <td>{resident.room || '-'}</td>
                    <td>
                      <StatusBadge tone={statusConfig[(resident.status || 'active') as keyof typeof statusConfig].tone}>
                        {statusConfig[(resident.status || 'active') as keyof typeof statusConfig].label}
                      </StatusBadge>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        <button className="product-action-icon" title="Sửa thông tin" onClick={() => handleEditClick(resident)}>
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
      </DataCard>
      
      {/* Modals */}
      {showEditModal && selectedResident && (
        <EditResidentModal 
          resident={selectedResident} 
          onClose={() => setShowEditModal(false)}
          onSuccess={fetchResidents}
        />
      )}
    </div>
  );
}
