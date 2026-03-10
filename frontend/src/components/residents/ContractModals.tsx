import { X, User, Home, Calendar, DollarSign, FileText, AlertTriangle, Check, Eye, Printer, Download, Mail, Plus, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { buildingService, roomService, residentService, contractService } from '../../services/api.service';
import { Loader2 } from 'lucide-react';

interface ContractModalProps {
  contract?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  idCard: string;
  email?: string;
  avatar: string;
}

export function CreateContractModal({ onClose, onSuccess }: ContractModalProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // API data
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // Form state - Step 1
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');

  // Form state - Step 2 (tenant)
  const [tenantName, setTenantName] = useState('');
  const [tenantIdCard, setTenantIdCard] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');

  // Form state - Step 3 (contract terms)
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [durationMonths, setDurationMonths] = useState('12');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');

  // Loading/error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    buildingService.getAll().then((data: any) => setBuildings(Array.isArray(data) ? data : data?.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      roomService.getAll().then((data: any) => {
        const all = Array.isArray(data) ? data : data?.data ?? [];
        const filtered = all.filter((r: any) => {
          const floor = r.floor || r.floorId;
          return floor?.buildingId?.toString() === selectedBuildingId || r.buildingId?.toString() === selectedBuildingId;
        });
        setRooms(filtered.length ? filtered : all);
      }).catch(() => {});
    }
  }, [selectedBuildingId]);

  const handleRemoveMember = (id: string) => {
    setFamilyMembers(familyMembers.filter(member => member.id !== id));
  };

  const handleAddMember = (newMember: Omit<FamilyMember, 'id'>) => {
    const member: FamilyMember = { ...newMember, id: Date.now().toString() };
    setFamilyMembers([...familyMembers, member]);
    setShowAddMemberModal(false);
  };

  const handleSubmit = async () => {
    if (!selectedRoomId || !tenantName.trim() || !tenantIdCard.trim() || !tenantPhone.trim() || !startDate || !monthlyRent) {
      setError('Vui lòng điền đầy đủ: Phòng, Họ tên, CCCD, SĐT chủ hộ, Ngày bắt đầu, Tiền thuê');
      return;
    }
    setLoading(true); setError(null);
    try {
      // Create head of household resident
      const tenantRes: any = await residentService.create({
        fullName: tenantName.trim(),
        phoneNumber: tenantPhone.trim(),
        idCardNumber: tenantIdCard.trim(),
      } as any);
      const tenantResidentId = tenantRes?.id ?? tenantRes?.residentId ?? tenantRes?.data?.id;

      // Create family member residents
      const memberResidentIds: number[] = [];
      for (const m of familyMembers) {
        try {
          const mr: any = await residentService.create({ fullName: m.name, phoneNumber: m.phone, idCardNumber: m.idCard } as any);
          const mid = mr?.id ?? mr?.residentId ?? mr?.data?.id;
          if (mid) memberResidentIds.push(mid);
        } catch {}
      }

      // Calculate expected end date
      const end = new Date(startDate);
      end.setMonth(end.getMonth() + parseInt(durationMonths));

      // Build residents array
      const residentsPayload: any[] = [];
      if (tenantResidentId) residentsPayload.push({ residentId: tenantResidentId, residencyRole: 'Người thuê chính', fromDate: startDate });
      memberResidentIds.forEach(mid => residentsPayload.push({ residentId: mid, residencyRole: 'Thành viên', fromDate: startDate }));

      await contractService.create({
        roomId: parseInt(selectedRoomId),
        startDate,
        expectedEndDate: end.toISOString().split('T')[0],
        actualRentPrice: parseFloat(monthlyRent.replace(/[^0-9.]/g, '')),
        depositAmount: deposit ? parseFloat(deposit.replace(/[^0-9.]/g, '')) : undefined,
        residents: residentsPayload,
      } as any);

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[900px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <FileText size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Tạo hợp đồng mới</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Step 1: Room Selection */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center">
              <Home size={16} className="mr-2" />
              BƯỚC 1: Chọn phòng
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tòa nhà *</label>
                <select
                  value={selectedBuildingId}
                  onChange={e => { setSelectedBuildingId(e.target.value); setSelectedRoomId(''); }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                >
                  <option value="">Chọn tòa nhà...</option>
                  {buildings.map((b: any) => (
                    <option key={b.id ?? b.buildingId} value={b.id ?? b.buildingId}>{b.buildingName ?? b.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">Phòng *</label>
                <select
                  value={selectedRoomId}
                  onChange={e => setSelectedRoomId(e.target.value)}
                  disabled={!selectedBuildingId}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 disabled:bg-gray-100"
                >
                  <option value="">Chọn phòng...</option>
                  {rooms.map((r: any) => {
                    const id = r.id ?? r.roomId;
                    const code = r.roomCode ?? r.code ?? r.name;
                    const area = r.area ? ` - ${r.area}m²` : '';
                    const status = r.status ?? '';
                    const isEmpty = status === 'Trống' || status === '' || status === 'empty';
                    return <option key={id} value={id} disabled={!isEmpty}>{code}{area} ({isEmpty ? '✅ Trống' : status})</option>;
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  🔗 Danh sách phòng từ <strong>Quản lý Hạ tầng → Cơ cấu tòa nhà</strong>
                </p>
              </div>
            </div>

            {/* Room Info Preview */}
            <div className="mt-3 bg-blue-50 border border-blue-300 rounded p-3">
              <p className="text-xs text-blue-800">
                <strong>Thông tin phòng A-104:</strong> Diện tích 50m², Tầng 1, Hướng Đông Nam, 
                Tiện nghi: Điều hòa (2), Giường, Bàn ghế, Tủ quần áo
              </p>
            </div>
          </div>

          {/* Step 2: Head of Household */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center">
              <User size={16} className="mr-2" />
              BƯỚC 2: Thông tin chủ hộ (Người ký hợp đồng)
            </h4>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input type="radio" name="tenantType" id="newTenant" defaultChecked className="w-4 h-4" />
                <label htmlFor="newTenant" className="text-sm text-gray-700 font-bold">Cư dân mới (Tự động tạo tài khoản)</label>
              </div>

              <div className="grid grid-cols-2 gap-4 ml-7">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Họ và tên *</label>
                  <input 
                    type="text"
                    placeholder="VD: Nguyễn Văn A"
                    value={tenantName}
                    onChange={e => setTenantName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">CMND/CCCD *</label>
                  <input 
                    type="text"
                    placeholder="VD: 001234567890"
                    value={tenantIdCard}
                    onChange={e => setTenantIdCard(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Số điện thoại *</label>
                  <input 
                    type="text"
                    placeholder="VD: 0912345678"
                    value={tenantPhone}
                    onChange={e => setTenantPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Email</label>
                  <input 
                    type="email"
                    placeholder="VD: email@example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-300 pt-3">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="tenantType" id="existingTenant" className="w-4 h-4" />
                  <label htmlFor="existingTenant" className="text-sm text-gray-700 font-bold">Chọn từ cư dân đã có</label>
                </div>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 mt-2 ml-7" disabled>
                  <option value="">Chọn cư dân...</option>
                  <option>Nguyễn Văn A - 0912345678 - A-101</option>
                  <option>Trần Thị B - 0923456789 - B-205</option>
                </select>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  🔗 Danh sách đồng bộ từ <strong>Cư dân & Hợp đồng → Danh sách Cư dân</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Step 2B: Family Members */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm text-gray-800 font-bold flex items-center">
                <Users size={16} className="mr-2" />
                BƯỚC 2B: Thành viên cùng ở (Không bắt buộc)
              </h4>
              <button className="px-3 py-1.5 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 flex items-center space-x-1" onClick={() => setShowAddMemberModal(true)}>
                <Plus size={14} />
                <span>Thêm thành viên</span>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-300 rounded p-3 mb-3">
              <p className="text-xs text-blue-800">
                💡 <strong>Lưu ý:</strong> Các thành viên gia đình cũng sẽ được tạo tài khoản để đăng nhập App cư dân, 
                nhận thông báo, và báo cáo sự cố. Họ có quyền <strong>Xem</strong> nhưng <strong>không có quyền thanh toán</strong>.
              </p>
            </div>

            {/* Member List */}
            {familyMembers.length > 0 ? (
              <div className="space-y-2">
                {familyMembers.map(member => (
                  <div key={member.id} className="bg-white border border-gray-300 rounded p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-xl">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="text-sm text-gray-800 font-bold">{member.name}</p>
                          <p className="text-xs text-gray-600">{member.relationship}</p>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Xóa thành viên" onClick={() => handleRemoveMember(member.id)}>
                        <X size={16} className="text-red-600" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">SĐT:</span>
                        <span className="text-gray-800 ml-1 font-bold">{member.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">CMND:</span>
                        <span className="text-gray-800 ml-1 font-bold">{member.idCard}</span>
                      </div>
                      {member.email && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Email:</span>
                          <span className="text-gray-800 ml-1">{member.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center text-gray-500">
                <Users size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Chưa có thành viên nào</p>
                <p className="text-xs mt-1">Nhấn "Thêm thành viên" để bắt đầu</p>
              </div>
            )}

            <div className="mt-3 bg-green-50 border border-green-300 rounded p-3">
              <p className="text-xs text-green-800">
                <strong>✅ Tự động:</strong> Tất cả thành viên (<strong>1 chủ hộ + {familyMembers.length} thành viên</strong>) sẽ được tạo tài khoản 
                và hiển thị trong <strong>Cư dân & Hợp đồng → Danh sách Cư dân</strong> với vai trò tương ứng.
              </p>
            </div>
          </div>

          {/* Step 3: Contract Details */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center">
              <Calendar size={16} className="mr-2" />
              BƯỚC 3: Điều khoản hợp đồng
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Mã hợp đồng</label>
                <input 
                  type="text"
                  placeholder="Tự động: HD-2026-XXX"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100 focus:outline-none"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Ngày bắt đầu *</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Thời hạn *</label>
                <select
                  value={durationMonths}
                  onChange={e => setDurationMonths(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                >
                  <option value="6">6 tháng</option>
                  <option value="12">12 tháng</option>
                  <option value="24">24 tháng</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tiền thuê/tháng (VNĐ) *</label>
                <input 
                  type="text"
                  placeholder="VD: 8500000"
                  value={monthlyRent}
                  onChange={e => setMonthlyRent(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tiền cọc (VNĐ)</label>
                <input 
                  type="text"
                  placeholder="Thường = 1 tháng thuê"
                  value={deposit}
                  onChange={e => setDeposit(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm text-gray-700 mb-2">Ngày thanh toán hàng tháng</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" defaultValue="5">
                <option value="1">Ngày 1 hàng tháng</option>
                <option value="5">Ngày 5 hàng tháng</option>
                <option value="10">Ngày 10 hàng tháng</option>
                <option value="15">Ngày 15 hàng tháng</option>
                <option value="20">Ngày 20 hàng tháng</option>
              </select>
            </div>
          </div>

          {/* Step 4: Services */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center">
              <DollarSign size={16} className="mr-2" />
              BƯỚC 4: Dịch vụ áp dụng
            </h4>

            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span>Dịch vụ quản lý chung cư</span>
                </div>
                <span className="text-gray-800 font-bold">25.000 VNĐ/m²</span>
              </label>

              <label className="flex items-center justify-between text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span>Tiền điện</span>
                </div>
                <span className="text-gray-800 font-bold">3.500 VNĐ/kWh</span>
              </label>

              <label className="flex items-center justify-between text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span>Tiền nước</span>
                </div>
                <span className="text-gray-800 font-bold">25.000 VNĐ/m³</span>
              </label>

              <label className="flex items-center justify-between text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>Gửi xe máy</span>
                </div>
                <span className="text-gray-800 font-bold">100.000 VNĐ/tháng</span>
              </label>

              <label className="flex items-center justify-between text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>Gửi xe ô tô</span>
                </div>
                <span className="text-gray-800 font-bold">1.500.000 VNĐ/tháng</span>
              </label>

              <label className="flex items-center justify-between text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>Internet</span>
                </div>
                <span className="text-gray-800 font-bold">200.000 VNĐ/tháng</span>
              </label>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              🔗 Đơn giá đồng bộ từ <strong>Quản lý Hạ tầng → Dịch vụ & Đơn giá</strong>
            </p>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <h4 className="text-sm text-blue-800 font-bold mb-2">📊 Tổng quan hợp đồng:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
              <div>• Phòng: <strong>{selectedRoomId ? rooms.find(r => (r.id ?? r.roomId)?.toString() === selectedRoomId)?.roomCode ?? selectedRoomId : '(chưa chọn)'}</strong></div>
              <div>• Chủ hộ: <strong>{tenantName || '(chưa nhập)'}</strong></div>
              <div>• Số người ở: <strong>{1 + familyMembers.length} người</strong> (1 chủ + {familyMembers.length} thành viên)</div>
              <div>• Thời hạn: <strong>{durationMonths} tháng</strong> từ {startDate}</div>
              <div>• Tiền thuê: <strong>{monthlyRent || '—'} VNĐ/tháng</strong></div>
              <div>• Tiền cọc: <strong>{deposit || '—'} VNĐ</strong></div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{error}</p>
          )}
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <Check size={16} />
            <span>Tạo hợp đồng ({1 + familyMembers.length} người)</span>
          </button>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddFamilyMemberModal onClose={() => setShowAddMemberModal(false)} onAdd={handleAddMember} />
      )}
    </div>
  );
}

// Add Family Member Modal Component
function AddFamilyMemberModal({ onClose, onAdd }: { onClose: () => void, onAdd: (member: Omit<FamilyMember, 'id'>) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Vợ/Chồng',
    phone: '',
    idCard: '',
    email: '',
    avatar: '👤'
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.idCard) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }
    onAdd(formData);
  };

  const relationshipOptions = [
    { value: 'Vợ/Chồng', label: 'Vợ/Chồng', avatar: '👤' },
    { value: 'Con', label: 'Con', avatar: '👶' },
    { value: 'Mẹ/Bố', label: 'Mẹ/Bố', avatar: '👵' },
    { value: 'Anh/Chị/Em', label: 'Anh/Chị/Em', avatar: '👤' },
    { value: 'Ông/Bà', label: 'Ông/Bà', avatar: '👴' },
    { value: 'Khác', label: 'Khác', avatar: '👤' }
  ];

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center space-x-2">
            <User size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Thêm thành viên cùng ở</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-300 rounded p-3">
            <p className="text-xs text-blue-800">
              💡 Thành viên sẽ được tạo tài khoản App cư dân với quyền Xem thông tin và Báo cáo sự cố (không thanh toán).
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Mối quan hệ với chủ hộ *</label>
            <select 
              value={formData.relationship}
              onChange={(e) => {
                const selected = relationshipOptions.find(opt => opt.value === e.target.value);
                setFormData({ ...formData, relationship: e.target.value, avatar: selected?.avatar || '👤' });
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            >
              {relationshipOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.avatar} {opt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Họ và tên *</label>
              <input 
                type="text"
                placeholder="VD: Trần Thị B"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">CMND/CCCD *</label>
              <input 
                type="text"
                placeholder="VD: 001234567891"
                value={formData.idCard}
                onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Số điện thoại *</label>
              <input 
                type="text"
                placeholder="VD: 0923456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Dùng để đăng nhập App cư dân</p>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Email (Tùy chọn)</label>
              <input 
                type="email"
                placeholder="VD: tranthib@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div className="bg-green-50 border border-green-300 rounded p-3">
            <p className="text-xs text-green-800">
              <strong>✅ Tự động:</strong> Sau khi thêm, thành viên sẽ nhận mật khẩu qua SMS và có thể đăng nhập App cư dân.
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Thêm thành viên</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function ViewContractModal({ contract, onClose }: ContractModalProps) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[900px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Eye size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Chi tiết hợp đồng - {contract?.code}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Status Alert */}
          {contract?.status === 'expired' && (
            <div className="bg-red-50 border border-red-300 rounded p-4 flex items-start space-x-3">
              <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-bold mb-1">⚠️ Hợp đồng đã quá hạn {Math.abs(contract.daysLeft)} ngày!</p>
                <p className="text-sm text-red-700">Vui lòng liên hệ cư dân để gia hạn hoặc thanh lý hợp đồng.</p>
              </div>
            </div>
          )}

          {contract?.status === 'danger' && (
            <div className="bg-yellow-50 border border-yellow-300 rounded p-4 flex items-start space-x-3">
              <AlertTriangle size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-bold mb-1">⚠️ Hợp đồng sắp hết hn (còn {contract.daysLeft} ngày)</p>
                <p className="text-sm text-yellow-700">Nên liên hệ cư dân để chuẩn bị gia hạn.</p>
              </div>
            </div>
          )}

          {/* Contract Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Thông tin hợp đồng</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã hợp đồng:</span>
                    <span className="text-gray-800 font-bold">{contract?.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phòng:</span>
                    <span className="text-gray-800 font-bold">{contract?.room}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày bắt đầu:</span>
                    <span className="text-gray-800">{contract?.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày kết thúc:</span>
                    <span className="text-gray-800">{contract?.endDate}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className={`font-bold ${
                      contract?.status === 'active' ? 'text-green-700' : 
                      contract?.status === 'expired' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {contract?.status === 'active' ? 'Đang hoạt động' :
                       contract?.status === 'expired' ? `Quá hạn ${Math.abs(contract.daysLeft)} ngày` :
                       `Còn ${contract?.daysLeft} ngày`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm text-gray-600">Thành viên trong hộ</h4>
                  <span className="text-xs text-gray-600 bg-gray-200 px-2 py-0.5 rounded">4 người</span>
                </div>
                
                {/* Head of Household */}
                <div className="space-y-2">
                  <div className="bg-white border border-gray-300 rounded p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-lg">
                        👤
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-800 font-bold">{contract?.tenant}</p>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-300">Chủ hộ</span>
                        </div>
                        <p className="text-xs text-gray-600">0912345678 • 001234567890</p>
                      </div>
                    </div>
                  </div>

                  {/* Family Members */}
                  <div className="bg-white border border-gray-300 rounded p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-lg">
                        👤
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-700">Trần Thị B</p>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-300">Vợ/Chồng</span>
                        </div>
                        <p className="text-xs text-gray-600">0923456789</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-300 rounded p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-lg">
                        👶
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-700">Nguyễn Văn C</p>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-300">Con</span>
                        </div>
                        <p className="text-xs text-gray-600">0934567890</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-300 rounded p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-lg">
                        👵
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-700">Nguyễn Thị D</p>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-300">Mẹ/Bố</span>
                        </div>
                        <p className="text-xs text-gray-600">0945678901</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-300">
                  🔗 Tất cả thành viên có tài khoản trong <strong>Danh sách Cư dân</strong>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Chi phí</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiền thuê/tháng:</span>
                    <span className="text-gray-800 font-bold">{contract?.monthlyRent} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiền cọc:</span>
                    <span className="text-gray-800 font-bold">{contract?.deposit} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày thanh toán:</span>
                    <span className="text-gray-800">Ngày 5 hàng tháng</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Dịch vụ đang sử dụng</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Quản lý chung cư</span>
                    <span className="text-gray-800 font-bold">25.000 VNĐ/m²</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Tiền điện</span>
                    <span className="text-gray-800 font-bold">3.500 VNĐ/kWh</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Tiền nước</span>
                    <span className="text-gray-800 font-bold">25.000 VNĐ/m³</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Gửi xe máy</span>
                    <span className="text-gray-800 font-bold">100.000 VNĐ/tháng</span>
                  </div>
                  <p className="text-xs text-gray-500 pt-2 border-t border-gray-300">
                    🔗 Đơn giá từ <strong>Dịch vụ & Đơn giá</strong>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Thông tin thanh toán</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng đã thanh toán:</span>
                    <span className="text-green-700 font-bold">95.500.000 VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Công nợ hiện tại:</span>
                    <span className={contract?.room === 'C-312' ? 'text-red-700 font-bold' : 'text-gray-800'}>
                      {contract?.room === 'C-312' ? '15.500.000 VNĐ' : '0 VNĐ'}
                    </span>
                  </div>
                  <button className="w-full mt-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50">
                    → Xem lịch sử hóa đơn
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Room Details */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-600 mb-3">Thông tin phòng</h4>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Diện tích:</p>
                <p className="text-gray-800 font-bold">50m²</p>
              </div>
              <div>
                <p className="text-gray-600">Tầng:</p>
                <p className="text-gray-800 font-bold">Tầng 1</p>
              </div>
              <div>
                <p className="text-gray-600">Hướng:</p>
                <p className="text-gray-800 font-bold">Đông Nam</p>
              </div>
              <div>
                <p className="text-gray-600">Trạng thái:</p>
                <p className="text-green-700 font-bold">Đang thuê</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-gray-600 text-xs mb-2">Tiện nghi:</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-white border border-gray-300 text-xs rounded">Điều hòa (2)</span>
                <span className="px-2 py-1 bg-white border border-gray-300 text-xs rounded">Giường</span>
                <span className="px-2 py-1 bg-white border border-gray-300 text-xs rounded">Bàn ghế</span>
                <span className="px-2 py-1 bg-white border border-gray-300 text-xs rounded">Tủ quần áo</span>
                <span className="px-2 py-1 bg-white border border-gray-300 text-xs rounded">Bếp điện</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              🔗 Thông tin đồng bộ từ <strong>Quản lý Hạ tầng → Cơ cấu tòa nhà & Quản lý kho tài sản</strong>
            </p>
          </div>

        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-between sticky bottom-0 bg-white">
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-2">
              <Printer size={16} />
              <span>In hợp đồng</span>
            </button>
            <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-2">
              <Mail size={16} />
              <span>Gửi Email cho 4 người</span>
            </button>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export function PrintContractModal({ contract, onClose }: ContractModalProps) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <FileText size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">In/Xuất hợp đồng - {contract?.code}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Export Options */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">Chọn định dạng xuất:</h4>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="exportFormat" defaultChecked className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-800 font-bold">Hợp đồng đầy đủ (PDF)</p>
                    <p className="text-xs text-gray-600">Bao gồm tất cả điều khoản, chữ ký số, đóng dấu</p>
                  </div>
                </div>
                <FileText size={20} className="text-gray-600" />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="exportFormat" className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-800 font-bold">Bản tóm tắt (PDF)</p>
                    <p className="text-xs text-gray-600">Chỉ thông tin chính: Phòng, Cư dân, Thời hạn, Chi phí</p>
                  </div>
                </div>
                <FileText size={20} className="text-gray-600" />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="exportFormat" className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-800 font-bold">File Word (DOCX)</p>
                    <p className="text-xs text-gray-600">Có thể chỉnh sửa trước khi in</p>
                  </div>
                </div>
                <Download size={20} className="text-gray-600" />
              </label>
            </div>
          </div>

          {/* Contract Preview */}
          <div className="bg-white border-2 border-gray-300 rounded p-6" style={{ minHeight: '400px' }}>
            <div className="text-center mb-6">
              <h2 className="text-xl text-gray-800 font-bold">HỢP ĐỒNG THUÊ PHÒNG</h2>
              <p className="text-sm text-gray-600 mt-2">Số: {contract?.code}</p>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-bold mb-2">BÊN CHO THUÊ (Bên A):</p>
                <p>Tên: CÔNG TY QUẢN LÝ CHUNG CƯ ABC</p>
                <p>Địa chỉ: 123 Đường XYZ, Quận ABC, TP.HCM</p>
                <p>Điện thoại: 0900123456</p>
              </div>

              <div>
                <p className="font-bold mb-2">BÊN THUÊ (Bên B):</p>
                <p>Họ tên: {contract?.tenant}</p>
                <p>CMND/CCCD: 001234567890</p>
                <p>Điện thoại: 0912345678</p>
                <p>Email: nguyenvana@email.com</p>
                <p className="mt-2 font-bold">Số người cùng ở: 4 người (Bao gồm chủ hộ)</p>
                <p className="ml-4">1. Nguyễn Văn A (Chủ hộ) - SĐT: 0912345678</p>
                <p className="ml-4">2. Trần Thị B (Vợ/Chồng) - SĐT: 0923456789</p>
                <p className="ml-4">3. Nguyễn Văn C (Con) - SĐT: 0934567890</p>
                <p className="ml-4">4. Nguyễn Thị D (Mẹ/Bố) - SĐT: 0945678901</p>
              </div>

              <div>
                <p className="font-bold mb-2">ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG</p>
                <p>Bên A đồng ý cho Bên B thuê phòng <strong>{contract?.room}</strong></p>
                <p>Diện tích: <strong>50m²</strong>, Tầng <strong>1</strong></p>
              </div>

              <div>
                <p className="font-bold mb-2">ĐIỀU 2: THỜI HẠN THUÊ</p>
                <p>Từ ngày: <strong>{contract?.startDate}</strong></p>
                <p>Đến ngày: <strong>{contract?.endDate}</strong></p>
              </div>

              <div>
                <p className="font-bold mb-2">ĐIỀU 3: GIÁ CHO THUÊ VÀ PHƯƠNG THỨC THANH TOÁN</p>
                <p>Tiền thuê: <strong>{contract?.monthlyRent} VNĐ/tháng</strong></p>
                <p>Tiền cọc: <strong>{contract?.deposit} VNĐ</strong></p>
                <p>Ngày thanh toán: <strong>Ngày 5 hàng tháng</strong></p>
              </div>

              <div>
                <p className="font-bold mb-2">ĐIỀU 4: DỊCH VỤ KÈM THEO</p>
                <p>• Quản lý chung cư: 25.000 VNĐ/m²</p>
                <p>• Tiền điện: 3.500 VNĐ/kWh</p>
                <p>• Tiền nước: 25.000 VNĐ/m³</p>
                <p>• Gửi xe máy: 100.000 VNĐ/tháng</p>
              </div>

              <p className="text-xs text-gray-500 text-center pt-4">
                (Còn 5 điều khoản nữa trong bản đầy đủ...)
              </p>
            </div>
          </div>

          {/* Additional Options */}
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <h4 className="text-sm text-blue-800 font-bold mb-3">Tùy chọn bổ sung:</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Bao gồm chữ ký số của Ban quản lý</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Đóng dấu công ty (watermark)</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span>Gửi email bản PDF cho tất cả 4 thành viên</span>
              </label>
            </div>
          </div>

        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <Printer size={16} />
            <span>In ngay</span>
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Tải xuống PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}