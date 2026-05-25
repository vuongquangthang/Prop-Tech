import { Plus, Edit2, Trash2, Filter, X, AlertTriangle, Loader2, Home, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { roomService, floorService, serviceService } from '../../services/api.service';
import type { Floor } from '../../services/api.service';
import type { Service } from '../../services/api.service';
import { fileService } from '../../services/feature.service';

interface RoomData {
  id: number;
  floorId: number;
  code: string;
  roomNumber: string;
  area: number;
  maxPeople: number;
  price: number;
  status: string;
  description?: string;
  type?: string;
  hasPrivateBathroom?: boolean;
  rooms?: {
    living?: number | null;
    bedroom?: number | null;
    kitchen?: number | null;
    bathroom?: number | null;
  };

  amenities?: string[];
  serviceIds?: number[];
  imageUrls?: string[];
}

const statusConfig = {
  empty: { label: 'Trống', bgColor: '#D1FAE5', textColor: '#065F46', borderColor: '#A7F3D0' },
  'Trống': { label: 'Trống', bgColor: '#D1FAE5', textColor: '#065F46', borderColor: '#A7F3D0' },
  rented: { label: 'Đã thuê', bgColor: '#FEE2E2', textColor: '#991B1B', borderColor: '#FECACA' },
  'Đã thuê': { label: 'Đã thuê', bgColor: '#FEE2E2', textColor: '#991B1B', borderColor: '#FECACA' },
  maintenance: { label: 'Bảo trì', bgColor: '#FED7AA', textColor: '#9A3412', borderColor: '#FDBA74' },
  'Bảo trì': { label: 'Bảo trì', bgColor: '#FED7AA', textColor: '#9A3412', borderColor: '#FDBA74' },
};

const getStatusConfig = (status: string) => {
  return (statusConfig as any)[status] || statusConfig['Trống'];
};

const amenityOptions = [
  { key: 'ac', label: '❄️ Điều hòa' },
  { key: 'heater', label: '🚿 Nước nóng' },
  { key: 'fridge', label: '🧊 Tủ lạnh' },
  { key: 'washer', label: '🧺 Máy giặt' },
  { key: 'bed', label: '🛏️ Giường' },
  { key: 'desk', label: '🪑 Bàn làm việc' },
  { key: 'tv', label: '📺 Tivi' },
  { key: 'wifi', label: '📶 WiFi' },
];

interface RoomTableProps {
  selectedFloorId?: number | null;
  selectedBuildingId?: number | null;
}

export function RoomTable({ selectedFloorId, selectedBuildingId }: RoomTableProps = {}) {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [floors, setFloors] = useState<Floor[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addFloorId, setAddFloorId] = useState<number>(0);
  const [addRoomCode, setAddRoomCode] = useState('');
  const [addArea, setAddArea] = useState('');
  const [addMaxPeople, setAddMaxPeople] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addStatus, setAddStatus] = useState('Trống');
  const [addRoomType, setAddRoomType] = useState<'single' | 'apartment'>('single');
  const [addHasPrivateBathroom, setAddHasPrivateBathroom] = useState(false);
  const [addLivingRoomCount, setAddLivingRoomCount] = useState('');
  const [addBedroomCount, setAddBedroomCount] = useState('');
  const [addKitchenCount, setAddKitchenCount] = useState('');
  const [addBathroomCount, setAddBathroomCount] = useState('');
  const [addAmenities, setAddAmenities] = useState<string[]>([]);
  const [addServiceIds, setAddServiceIds] = useState<number[]>([]);
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addDescription, setAddDescription] = useState<string>('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [serviceCatalog, setServiceCatalog] = useState<Service[]>([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [editRoomCode, setEditRoomCode] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editMaxPeople, setEditMaxPeople] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStatus, setEditStatus] = useState('Trống');
  const [editRoomType, setEditRoomType] = useState<'single' | 'apartment'>('single');
  const [editHasPrivateBathroom, setEditHasPrivateBathroom] = useState(false);
  const [editLivingRoomCount, setEditLivingRoomCount] = useState('');
  const [editBedroomCount, setEditBedroomCount] = useState('');
  const [editKitchenCount, setEditKitchenCount] = useState('');
  const [editBathroomCount, setEditBathroomCount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [editServiceIds, setEditServiceIds] = useState<number[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteRoom, setDeleteRoom] = useState<RoomData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showCannotDeleteModal, setShowCannotDeleteModal] = useState(false);
  const [blockedDeleteRoom, setBlockedDeleteRoom] = useState<RoomData | null>(null);

  const isRentedRoomStatus = (status: string) => {
    const s = (status || '').trim().toLowerCase();
    return s === 'rented' || s === 'da thue' || s === 'đã thuê';
  };

  useEffect(() => {
    fetchRooms();
    fetchFloors();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roomService.getAll();
      const roomData: RoomData[] = data.map((room: any) => ({
        id: room.id || room.phongId || 0,
        floorId: room.floorId || room.tangId || 0,
        code: room.roomCode || room.maPhong || '',
        roomNumber: room.roomNumber || room.soPhong || '',
        area: room.area || room.dienTich || 0,
        maxPeople: room.maxOccupants || 0,
        price: room.defaultRentPrice || room.monthlyRent || room.giaThue || 0,
        status: room.status || room.trangThai || 'Trống',
        description: room.description || room.moTa || '',
        type: room.roomType || room.loaiPhong || room.type || 'single',
        hasPrivateBathroom: !!(room.hasPrivateBathroom ?? room.privateBathroom ?? false),
        rooms: room.rooms || {
          living: room.livingRoomCount ?? null,
          bedroom: room.bedroomCount ?? null,
          kitchen: room.kitchenCount ?? null,
          bathroom: room.bathroomCount ?? null,
        },
        amenities: room.amenities || [],
        serviceIds: room.serviceIds || [],
        imageUrls: room.imageUrls || [],
      }));
      setRooms(roomData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const fetchFloors = async () => {
    try {
      const data = await floorService.getAll();
      setFloors(data);
    } catch {
      // floors not critical
    }
  };

  const buildingFloorIds = selectedBuildingId
    ? floors.filter(f => f.buildingId === selectedBuildingId).map(f => f.id)
    : null;

  const selectableFloors = selectedBuildingId
    ? floors.filter(f => f.buildingId === selectedBuildingId)
    : floors;

  const selectedAddFloor = floors.find(f => f.id === addFloorId);
  const addLocationLabel = selectedAddFloor
    ? `${selectedAddFloor.buildingName ? selectedAddFloor.buildingName : 'Tòa'} - Tầng ${selectedAddFloor.floorNumber}`
    : 'Chưa chọn tầng';

  const filteredRooms = rooms
    .filter(room =>
      selectedFloorId != null ? room.floorId === selectedFloorId
      : buildingFloorIds != null ? buildingFloorIds.includes(room.floorId)
      : true
    )
    .filter(room => {
      if (filter === 'all') return true;
      const s = room.status.toLowerCase();
      if (filter === 'empty') return s === 'trống' || s === 'empty';
      if (filter === 'rented') return s === 'đã thuê' || s === 'rented';
      if (filter === 'maintenance') return s === 'bảo trì' || s === 'maintenance';
      return true;
    });

  const parseCurrency = (value: string) => {
    const normalized = String(value ?? '').replace(/[^\d]/g, '');
    return normalized ? Number(normalized) : 0;
  };

  const toggleAmenity = (amenity: string) => {
    setAddAmenities(prev => prev.includes(amenity) ? prev.filter(item => item !== amenity) : [...prev, amenity]);
  };

  const toggleService = (serviceId: number) => {
    setAddServiceIds(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
  };

  const handleAddImageChange = (file?: File | null) => {
    if (!file) {
      setAddImageFile(null);
      setAddImagePreview(null);
      return;
    }

    setAddImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAddImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditImageChange = (file?: File | null) => {
    if (!file) {
      setEditImageFile(null);
      setEditImagePreview(selectedRoom?.imageUrls?.[0] ?? null);
      return;
    }

    setEditImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setEditImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };


    const openAddModal = async () => {
      try {
      const services = await serviceService.getAll();
      setServiceCatalog(services);
    } catch {
      setServiceCatalog([]);
    }

    const defaultFloorId =
      (selectedFloorId != null && selectableFloors.some(f => f.id === selectedFloorId) ? selectedFloorId : null)
      ?? selectableFloors[0]?.id
      ?? 0;

    setAddFloorId(defaultFloorId);
    setAddRoomCode('');
    setAddArea('');
    setAddMaxPeople('');
    setAddPrice('');
    setAddStatus('Trống');
    setAddRoomType('single');
    setAddHasPrivateBathroom(false);
    setAddLivingRoomCount('');
    setAddBedroomCount('');
    setAddKitchenCount('');
    setAddBathroomCount('');
    setAddServiceIds([]);
    setAddImagePreview(null);
    setAddImageFile(null);
    setAddDescription('');
    setAddError(null);
    setShowAddModal(true);
  };

  const handleAddSubmit = async () => {
    if (!addRoomCode.trim() || !addArea || !addPrice || !addMaxPeople) {
      setAddError('Vui lòng điền mã phòng, diện tích, số người tối đa và giá thuê');
      return;
    }
    if (!addFloorId) {
      setAddError('Vui lòng chọn tầng');
      return;
    }
    if (addRoomType === 'apartment' && (!addLivingRoomCount || !addBedroomCount || !addKitchenCount || !addBathroomCount)) {
      setAddError('Vui lòng điền đầy đủ số phòng khách, ngủ, bếp và vệ sinh');
      return;
    }
    setAddLoading(true); setAddError(null);
    try {
      const maxPeopleValue = parseInt(addMaxPeople, 10);
      const imageUrls: string[] = [];
      if (addImageFile) {
        const uploadedUrl = await fileService.upload(addImageFile);
        imageUrls.push(uploadedUrl);
      }

      await roomService.create({
        floorId: addFloorId,
        roomCode: addRoomCode.trim(),
        area: parseFloat(addArea),
        maxOccupants: maxPeopleValue,
        defaultRentPrice: parseCurrency(addPrice),
        status: addStatus,
        roomType: addRoomType,
        hasPrivateBathroom: addRoomType === 'single' ? addHasPrivateBathroom : false,
        livingRoomCount: addRoomType === 'apartment' ? parseInt(addLivingRoomCount, 10) : null,
        bedroomCount: addRoomType === 'apartment' ? parseInt(addBedroomCount, 10) : null,
        kitchenCount: addRoomType === 'apartment' ? parseInt(addKitchenCount, 10) : null,
        bathroomCount: addRoomType === 'apartment' ? parseInt(addBathroomCount, 10) : null,
        imageUrls,
        description: addDescription,
        amenities: addAmenities,
        serviceIds: addServiceIds,
      } as any);

      await fetchRooms();
      setShowAddModal(false);
    } catch (err: any) { setAddError(err.message || 'Có lỗi xảy ra'); }
    finally { setAddLoading(false); }
  };

  const openEditModal = async (room: RoomData) => {
    setSelectedRoom(room);
    setEditRoomCode(room.code);
    setEditArea(String(room.area));
    setEditMaxPeople(String(room.maxPeople || ''));
    setEditPrice(String(room.price));
    setEditStatus(room.status);
    setEditRoomType((room.type || 'single') as 'single' | 'apartment');
    setEditHasPrivateBathroom(!!room.hasPrivateBathroom);
    setEditLivingRoomCount(room.rooms?.living != null ? String(room.rooms.living) : '');
    setEditBedroomCount(room.rooms?.bedroom != null ? String(room.rooms.bedroom) : '');
    setEditKitchenCount(room.rooms?.kitchen != null ? String(room.rooms.kitchen) : '');
    setEditBathroomCount(room.rooms?.bathroom != null ? String(room.rooms.bathroom) : '');
    setEditDescription(room.description ?? '');
    setEditImagePreview((room.imageUrls && room.imageUrls.length > 0) ? room.imageUrls[0] : null);
    setEditImageFile(null);
    setEditAmenities(room.amenities ?? []);
    setEditServiceIds(room.serviceIds ?? []);
    setEditError(null);

    try {
      const services = await serviceService.getAll();
      setServiceCatalog(services);
    } catch {
      setServiceCatalog([]);
    }

    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedRoom || !editRoomCode.trim() || !editArea || !editPrice) { setEditError('Vui lòng điền đầy đủ thông tin'); return; }
    setEditLoading(true); setEditError(null);
    try {
      const maxPeopleValue = editMaxPeople ? parseInt(editMaxPeople, 10) : 0;
      const imageUrls: string[] = selectedRoom.imageUrls ? [...selectedRoom.imageUrls] : [];
      if (editImageFile) {
        const uploaded = await fileService.upload(editImageFile);
        if (uploaded) imageUrls.unshift(uploaded);
      }
      await roomService.update(selectedRoom.id, {
        roomCode: editRoomCode.trim(),
        area: parseFloat(editArea),
        maxOccupants: maxPeopleValue,
        defaultRentPrice: parseFloat(editPrice),
        status: editStatus,
        roomType: editRoomType,
        hasPrivateBathroom: editRoomType === 'single' ? editHasPrivateBathroom : false,
        livingRoomCount: editRoomType === 'apartment' ? parseInt(editLivingRoomCount, 10) : null,
        bedroomCount: editRoomType === 'apartment' ? parseInt(editBedroomCount, 10) : null,
        kitchenCount: editRoomType === 'apartment' ? parseInt(editKitchenCount, 10) : null,
        bathroomCount: editRoomType === 'apartment' ? parseInt(editBathroomCount, 10) : null,
        description: editDescription,
        imageUrls,
        amenities: editAmenities,
        serviceIds: editServiceIds,
      } as any);

      await fetchRooms();
      setShowEditModal(false);
    } catch (err: any) { setEditError(err.message || 'Có lỗi xảy ra'); }
    finally { setEditLoading(false); }
  };

  const openDeleteModal = (room: RoomData) => {
    if (isRentedRoomStatus(room.status)) {
      setBlockedDeleteRoom(room);
      setShowCannotDeleteModal(true);
      return;
    }

    setDeleteRoom(room); setDeleteError(null); setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!deleteRoom) return;
    setDeleteLoading(true); setDeleteError(null);
    try {
      await roomService.delete(deleteRoom.id);
      await fetchRooms();
      setShowDeleteModal(false);
    } catch (err: any) { setDeleteError(err.message || 'Có lỗi xảy ra'); }
    finally { setDeleteLoading(false); }
  };

  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 size={48} className="animate-spin text-gray-400" />
          <span className="text-gray-600">Đang tải danh sách phòng...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <AlertTriangle size={48} className="text-red-500" />
          <p className="text-red-600 text-center">{error}</p>
          <button onClick={fetchRooms} className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-300 rounded">
      <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg text-gray-800">
            {selectedFloorId
              ? (() => { const f = floors.find(fl => fl.id === selectedFloorId); return f ? `Tầng ${f.floorNumber}${f.buildingName ? ` - ${f.buildingName}` : ''} - ` : ''; })()
              : selectedBuildingId
              ? (() => { const f = floors.find(fl => fl.buildingId === selectedBuildingId); return f?.buildingName ? `${f.buildingName} - ` : ''; })()
              : ''}Danh sách phòng - {filteredRooms.length} phòng
          </h2>
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
              <option value="all">Tất cả</option>
              <option value="empty">Trống</option>
              <option value="rented">Đã thuê</option>
              <option value="maintenance">Bảo trì</option>
            </select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={openAddModal} className="px-4 py-2 bg-gray-800 text-white text-sm rounded flex items-center space-x-2 hover:bg-gray-700">
            <Plus size={16} /><span>Thêm Phòng</span>
          </button>
        </div>
      </div>

      {filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Home size={48} className="text-gray-300" />
          <p className="text-gray-500">Không tìm thấy phòng nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Mã phòng</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Diện tích (m²)</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Số người tối đa</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">Giá thuê (VNĐ/tháng)</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Trạng thái</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600 sticky right-0 bg-gray-50">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map(room => {
                const cfg = getStatusConfig(room.status);
                return (
                  <tr key={room.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{room.code || room.roomNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{room.area}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{room.maxPeople || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 text-right">{room.price.toLocaleString('vi-VN')}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block rounded px-3 py-1 text-xs font-semibold" style={{ backgroundColor: cfg.bgColor, color: cfg.textColor, border: `1px solid ${cfg.borderColor}` }}>{cfg.label}</span>
                    </td>
                    <td className="px-6 py-4 text-center sticky right-0 bg-white">
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => openEditModal(room)} className="p-2 hover:bg-gray-100 rounded" title="Sửa"><Edit2 size={16} className="text-gray-600" /></button>
                        <button onClick={() => openDeleteModal(room)} className="p-2 hover:bg-gray-100 rounded" title="Xóa"><Trash2 size={16} className="text-gray-600" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-[900px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg text-gray-800">Thêm Phòng mới</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-300 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Vị trí:</strong> {addLocationLabel}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Thông tin cơ bản</h4>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Ảnh phòng</label>
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 overflow-hidden">
                      {addImagePreview ? (
                        <img src={addImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Upload size={32} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAddImageChange(e.target.files?.[0] ?? null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-gray-800 file:text-white hover:file:bg-gray-700"
                      />
                      <p className="text-xs text-gray-500 mt-1">Hỗ trợ: JPG, PNG. Dung lượng tối đa 5MB</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tầng *</label>
                  <select value={addFloorId} onChange={e => setAddFloorId(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
                    {selectableFloors.length === 0 ? <option value={0}>Chưa có tầng nào</option> : selectableFloors.map(f => <option key={f.id} value={f.id}>Tầng {f.floorNumber}{f.buildingName ? ` - ${f.buildingName}` : ''}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Mã phòng *</label>
                    <input
                      type="text"
                      placeholder="VD: A-109"
                      value={addRoomCode}
                      onChange={e => setAddRoomCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Diện tích (m²) *</label>
                    <input
                      type="number"
                      placeholder="VD: 45"
                      value={addArea}
                      onChange={e => setAddArea(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Số người tối đa *</label>
                    <input
                      type="number"
                      placeholder="VD: 4"
                      min="1"
                      value={addMaxPeople}
                      onChange={e => setAddMaxPeople(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Loại phòng *</label>
                    <select
                      value={addRoomType}
                      onChange={(e) => setAddRoomType(e.target.value as 'single' | 'apartment')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
                    >
                      <option value="single">Phòng đơn</option>
                      <option value="apartment">Căn hộ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Giá phòng (VNĐ/tháng) *</label>
                  <input
                    type="text"
                    placeholder="VD: 8.500.000"
                    value={addPrice}
                    onChange={e => setAddPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tình trạng phòng *</label>
                  <select value={addStatus} onChange={e => setAddStatus(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
                    <option value="Trống">Trống</option>
                    <option value="Đã thuê">Đã thuê</option>
                    <option value="Bảo trì">Bảo trì</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Chi tiết phòng</h4>
                {addRoomType === 'single' ? (
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="private-bathroom" checked={addHasPrivateBathroom} onChange={(e) => setAddHasPrivateBathroom(e.target.checked)} className="w-4 h-4" />
                    <label htmlFor="private-bathroom" className="text-sm text-gray-700">Có vệ sinh khép kín</label>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng khách *</label>
                      <input type="number" min="0" placeholder="VD: 1" value={addLivingRoomCount} onChange={(e) => setAddLivingRoomCount(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng ngủ *</label>
                      <input type="number" min="0" placeholder="VD: 2" value={addBedroomCount} onChange={(e) => setAddBedroomCount(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng bếp *</label>
                      <input type="number" min="0" placeholder="VD: 1" value={addKitchenCount} onChange={(e) => setAddKitchenCount(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng vệ sinh *</label>
                      <input type="number" min="0" placeholder="VD: 2" value={addBathroomCount} onChange={(e) => setAddBathroomCount(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Dịch vụ & Tiện nghi</h4>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Phí dịch vụ cơ bản</label>
                  <div className="bg-blue-50 border border-blue-300 rounded px-3 py-2 mb-3">
                    <p className="text-xs text-blue-800">
                      💡 Danh sách dịch vụ được lấy từ <strong>Quản lý Hạ tầng → Quản lý dịch vụ</strong>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded">
                    {serviceCatalog.length === 0 ? (
                      <span className="text-xs text-gray-500">Chưa có dịch vụ nào</span>
                    ) : (
                      serviceCatalog.map((service) => (
                        <div className="flex items-center space-x-2" key={service.id}>
                          <input
                            type="checkbox"
                            id={`service-${service.id}`}
                            className="w-4 h-4"
                            checked={addServiceIds.includes(service.id)}
                            onChange={() => toggleService(service.id)}
                          />
                          <label htmlFor={`service-${service.id}`} className="text-sm text-gray-700">
                            {service.name} {service.unit ? `(${service.unit})` : ''}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tiện nghi</label>
                  <div className="grid grid-cols-3 gap-2">
                    {amenityOptions.map((amenity) => (
                      <div className="flex items-center space-x-2" key={amenity.key}>
                        <input
                          type="checkbox"
                          id={`amenity-${amenity.key}`}
                          className="w-4 h-4"
                          checked={addAmenities.includes(amenity.label)}
                          onChange={() => toggleAmenity(amenity.label)}
                        />
                        <label htmlFor={`amenity-${amenity.key}`} className="text-sm text-gray-700">{amenity.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Mô tả</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả chi tiết về phòng..."
                    value={addDescription}
                    onChange={e => setAddDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>

              {addError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{addError}</p>
              )}
            </div>

            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowAddModal(false)} disabled={addLoading} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50">
                Hủy
              </button>
              <button onClick={handleAddSubmit} disabled={addLoading} className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2">
                {addLoading && <Loader2 size={14} className="animate-spin" />}<span>Xác nhận thêm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-[900px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg text-gray-800">Chỉnh sửa Phòng - {selectedRoom.code}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} className="text-gray-600" /></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-300 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Vị trí:</strong> {floors.find(f => f.id === selectedRoom.floorId)?.buildingName ? `${floors.find(f => f.id === selectedRoom.floorId)?.buildingName} - ` : ''}Tầng {floors.find(f => f.id === selectedRoom.floorId)?.floorNumber ?? selectedRoom.floorId}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Thông tin cơ bản</h4>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Ảnh phòng</label>
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 overflow-hidden">
                      {editImagePreview ? (
                        <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Upload size={32} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleEditImageChange(e.target.files?.[0] ?? null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-gray-800 file:text-white hover:file:bg-gray-700"
                      />
                      <p className="text-xs text-gray-500 mt-1">Hỗ trợ: JPG, PNG. Dung lượng tối đa 5MB</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Mã phòng *</label>
                    <input type="text" value={editRoomCode} onChange={e => setEditRoomCode(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Diện tích (m²) *</label>
                    <input type="number" value={editArea} onChange={e => setEditArea(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Số người tối đa *</label>
                    <input type="number" value={editMaxPeople} onChange={e => setEditMaxPeople(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Loại phòng *</label>
                    <select value={editRoomType} onChange={e => setEditRoomType(e.target.value as 'single' | 'apartment')} className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
                      <option value="single">Phòng đơn</option>
                      <option value="apartment">Căn hộ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Giá thuê (VNĐ/tháng) *</label>
                    <input type="text" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Trạng thái *</label>
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
                      <option value="Trống">Trống</option>
                      <option value="Đã thuê">Đã thuê</option>
                      <option value="Bảo trì">Bảo trì</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Chi tiết phòng</h4>
                {editRoomType === 'single' ? (
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="private-bathroom-edit" checked={editHasPrivateBathroom} onChange={(e) => setEditHasPrivateBathroom(e.target.checked)} className="w-4 h-4" />
                    <label htmlFor="private-bathroom-edit" className="text-sm text-gray-700">Có vệ sinh khép kín</label>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng khách *</label>
                      <input type="number" min="0" value={editLivingRoomCount} onChange={e => setEditLivingRoomCount(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng ngủ *</label>
                      <input type="number" min="0" value={editBedroomCount} onChange={e => setEditBedroomCount(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng bếp *</label>
                      <input type="number" min="0" value={editKitchenCount} onChange={e => setEditKitchenCount(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng vệ sinh *</label>
                      <input type="number" min="0" value={editBathroomCount} onChange={e => setEditBathroomCount(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Dịch vụ & Tiện nghi</h4>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Phí dịch vụ cơ bản</label>
                  <div className="bg-blue-50 border border-blue-300 rounded px-3 py-2 mb-3">
                    <p className="text-xs text-blue-800">
                      💡 Danh sách dịch vụ được lấy từ <strong>Quản lý Hạ tầng → Quản lý dịch vụ</strong>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded">
                    {serviceCatalog.length === 0 ? (
                      <span className="text-xs text-gray-500">Chưa có dịch vụ nào</span>
                    ) : (
                      serviceCatalog.map((service) => (
                        <div className="flex items-center space-x-2" key={service.id}>
                          <input
                            type="checkbox"
                            id={`edit-service-${service.id}`}
                            className="w-4 h-4"
                            checked={editServiceIds.includes(service.id)}
                            onChange={() => setEditServiceIds(prev => prev.includes(service.id) ? prev.filter(id => id !== service.id) : [...prev, service.id])}
                          />
                          <label htmlFor={`edit-service-${service.id}`} className="text-sm text-gray-700">
                            {service.name} {service.unit ? `(${service.unit})` : ''}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tiện nghi</label>
                  <div className="grid grid-cols-3 gap-2">
                    {amenityOptions.map((amenity) => (
                      <div className="flex items-center space-x-2" key={amenity.key}>
                        <input
                          type="checkbox"
                          id={`edit-amenity-${amenity.key}`}
                          className="w-4 h-4"
                          checked={editAmenities.includes(amenity.label)}
                          onChange={() => setEditAmenities(prev => prev.includes(amenity.label) ? prev.filter(item => item !== amenity.label) : [...prev, amenity.label])}
                        />
                        <label htmlFor={`edit-amenity-${amenity.key}`} className="text-sm text-gray-700">{amenity.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Mô tả</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả chi tiết về phòng..."
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              {editError && <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{editError}</p>}
            </div>

            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowEditModal(false)} disabled={editLoading} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50">Hủy</button>
              <button onClick={handleEditSubmit} disabled={editLoading} className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2">
                {editLoading && <Loader2 size={14} className="animate-spin" />}<span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deleteRoom && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg text-gray-800">Xác nhận xóa</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} className="text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3 bg-red-50 border border-red-300 rounded p-4">
                <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-bold mb-1">Bạn có chắc chắn muốn xóa phòng này?</p>
                  <p className="text-sm text-red-700">Hành động này không thể hoàn tác!</p>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded p-4 space-y-1">
                <p className="text-sm text-gray-600 mb-2">Thông tin phòng sẽ bị xóa:</p>
                <p className="text-sm text-gray-800"><strong>Mã phòng:</strong> {deleteRoom.code}</p>
                <p className="text-sm text-gray-800"><strong>Diện tích:</strong> {deleteRoom.area}m²</p>
                <p className="text-sm text-gray-800"><strong>Giá thuê:</strong> {deleteRoom.price.toLocaleString('vi-VN')} VNĐ/tháng</p>
              </div>
              {(deleteRoom.status === 'rented' || deleteRoom.status === 'Đã thuê') && (
                <div className="bg-orange-50 border border-orange-300 rounded p-4">
                  <p className="text-sm text-orange-800"><strong>⚠️ Phòng đang có hợp đồng thuê.</strong> Vui lòng tất toán hợp đồng trước khi xóa!</p>
                </div>
              )}
              {deleteError && <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{deleteError}</p>}
            </div>
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button onClick={() => setShowDeleteModal(false)} disabled={deleteLoading} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50">Hủy</button>
              <button onClick={handleDeleteSubmit} disabled={deleteLoading || deleteRoom.status === 'rented' || deleteRoom.status === 'Đã thuê'} className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2">
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}<span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showCannotDeleteModal && blockedDeleteRoom && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg text-gray-800">Không thể xóa phòng</h3>
              <button onClick={() => setShowCannotDeleteModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} className="text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3 bg-orange-50 border border-orange-300 rounded p-4">
                <AlertTriangle size={24} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-orange-800 font-bold mb-1">Phòng đang ở trạng thái Đã thuê.</p>
                  <p className="text-sm text-orange-700">Bạn không thể xóa phòng này. Vui lòng tất toán hợp đồng và chuyển phòng về trạng thái Trống trước.</p>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded p-4 space-y-1">
                <p className="text-sm text-gray-800"><strong>Mã phòng:</strong> {blockedDeleteRoom.code}</p>
                <p className="text-sm text-gray-800"><strong>Trạng thái:</strong> {blockedDeleteRoom.status}</p>
              </div>
            </div>
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end">
              <button onClick={() => setShowCannotDeleteModal(false)} className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">Đã hiểu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
