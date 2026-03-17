import { Plus, Edit2, Trash2, Filter, X, AlertTriangle, Loader2, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { roomService, floorService } from '../../services/api.service';
import type { Floor } from '../../services/api.service';

interface RoomData {
  id: number;
  floorId: number;
  code: string;
  roomNumber: string;
  area: number;
  maxPeople: number;
  price: number;
  status: string;
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
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [editRoomCode, setEditRoomCode] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editMaxPeople, setEditMaxPeople] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStatus, setEditStatus] = useState('Trống');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteRoom, setDeleteRoom] = useState<RoomData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const openAddModal = async () => {
    let refreshedFloors = selectableFloors;
    try {
      const allFloors = await floorService.getAll();
      setFloors(allFloors);
      refreshedFloors = selectedBuildingId
        ? allFloors.filter(f => f.buildingId === selectedBuildingId)
        : allFloors;
    } catch {
      // Use current in-memory list if fetch fails.
    }

    const defaultFloorId =
      (selectedFloorId != null && refreshedFloors.some(f => f.id === selectedFloorId) ? selectedFloorId : null)
      ?? refreshedFloors[0]?.id
      ?? 0;

    setAddFloorId(defaultFloorId);
    setAddRoomCode('');
    setAddArea('');
    setAddMaxPeople('');
    setAddPrice('');
    setAddStatus('Trống');
    setAddError(null);
    setShowAddModal(true);
  };

  const handleAddSubmit = async () => {
    if (!addRoomCode.trim() || !addArea || !addPrice) { setAddError('Vui lòng điền mã phòng, diện tích và giá thuê'); return; }
    if (!addFloorId) { setAddError('Vui lòng chọn tầng'); return; }
    setAddLoading(true); setAddError(null);
    try {
      const maxPeopleValue = addMaxPeople ? parseInt(addMaxPeople, 10) : 0;
      await roomService.create({
        floorId: addFloorId,
        roomCode: addRoomCode.trim(),
        area: parseFloat(addArea),
        maxOccupants: maxPeopleValue,
        defaultRentPrice: parseFloat(addPrice),
        status: addStatus
      } as any);

      await fetchRooms();
      setShowAddModal(false);
    } catch (err: any) { setAddError(err.message || 'Có lỗi xảy ra'); }
    finally { setAddLoading(false); }
  };

  const openEditModal = (room: RoomData) => {
    setSelectedRoom(room);
    setEditRoomCode(room.code);
    setEditArea(String(room.area));
    setEditMaxPeople(String(room.maxPeople || ''));
    setEditPrice(String(room.price));
    setEditStatus(room.status);
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedRoom || !editRoomCode.trim() || !editArea || !editPrice) { setEditError('Vui lòng điền đầy đủ thông tin'); return; }
    setEditLoading(true); setEditError(null);
    try {
      const maxPeopleValue = editMaxPeople ? parseInt(editMaxPeople, 10) : 0;
      await roomService.update(selectedRoom.id, {
        roomCode: editRoomCode.trim(),
        area: parseFloat(editArea),
        maxOccupants: maxPeopleValue,
        defaultRentPrice: parseFloat(editPrice),
        status: editStatus
      } as any);

      await fetchRooms();
      setShowEditModal(false);
    } catch (err: any) { setEditError(err.message || 'Có lỗi xảy ra'); }
    finally { setEditLoading(false); }
  };

  const openDeleteModal = (room: RoomData) => {
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg text-gray-800">Thêm Phòng mới</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} className="text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tầng *</label>
                <select value={addFloorId} onChange={e => setAddFloorId(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
                  {selectableFloors.length === 0 ? <option value={0}>Chưa có tầng nào</option> : selectableFloors.map(f => <option key={f.id} value={f.id}>Tầng {f.floorNumber}{f.buildingName ? ` - ${f.buildingName}` : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Mã phòng *</label>
                  <input type="text" placeholder="VD: A-109" value={addRoomCode} onChange={e => setAddRoomCode(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Diện tích (m²) *</label>
                  <input type="number" placeholder="VD: 45" value={addArea} onChange={e => setAddArea(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Số người tối đa</label>
                <input type="number" placeholder="VD: 4" value={addMaxPeople} onChange={e => setAddMaxPeople(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Giá thuê (VNĐ/tháng) *</label>
                  <input type="number" placeholder="VD: 8500000" value={addPrice} onChange={e => setAddPrice(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Trạng thái ban đầu *</label>
                  <select value={addStatus} onChange={e => setAddStatus(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
                    <option value="Trống">Trống</option>
                    <option value="Bảo trì">Đang bảo trì</option>
                  </select>
                </div>
              </div>
              {addError && <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{addError}</p>}
            </div>
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button onClick={() => setShowAddModal(false)} disabled={addLoading} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50">Hủy</button>
              <button onClick={handleAddSubmit} disabled={addLoading} className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2">
                {addLoading && <Loader2 size={14} className="animate-spin" />}<span>Xác nhận thêm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg text-gray-800">Chỉnh sửa Phòng - {selectedRoom.code}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} className="text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4">
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
              <div>
                <label className="block text-sm text-gray-700 mb-2">Số người tối đa</label>
                <input type="number" value={editMaxPeople} onChange={e => setEditMaxPeople(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Giá thuê (VNĐ/tháng) *</label>
                  <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
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
              {editError && <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{editError}</p>}
            </div>
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
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
    </div>
  );
}
