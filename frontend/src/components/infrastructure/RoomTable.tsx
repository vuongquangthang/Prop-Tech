import { Plus, Edit2, Trash2, Filter, X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const roomsData = [
  { code: 'A-101', area: '45', maxPeople: '4', price: '8.500.000', status: 'empty' },
  { code: 'A-102', area: '50', maxPeople: '5', price: '9.000.000', status: 'rented' },
  { code: 'A-103', area: '42', maxPeople: '3', price: '7.800.000', status: 'empty' },
  { code: 'A-104', area: '48', maxPeople: '4', price: '8.800.000', status: 'maintenance' },
  { code: 'A-105', area: '55', maxPeople: '6', price: '10.000.000', status: 'rented' },
  { code: 'A-106', area: '45', maxPeople: '4', price: '8.500.000', status: 'empty' },
  { code: 'A-107', area: '50', maxPeople: '5', price: '9.200.000', status: 'rented' },
  { code: 'A-108', area: '43', maxPeople: '3', price: '8.000.000', status: 'empty' },
];

const statusConfig = {
  empty: { label: 'Trống', bgColor: '#D1FAE5', textColor: '#065F46', borderColor: '#A7F3D0' },
  rented: { label: 'Đã thuê', bgColor: '#FEE2E2', textColor: '#991B1B', borderColor: '#FECACA' },
  maintenance: { label: 'Bảo trì', bgColor: '#FED7AA', textColor: '#9A3412', borderColor: '#FDBA74' },
};

export function RoomTable() {
  const [filter, setFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const filteredRooms = filter === 'all' 
    ? roomsData 
    : roomsData.filter(room => room.status === filter);

  const handleEditClick = (room: any) => {
    setSelectedRoom(room);
    setShowEditModal(true);
  };

  const handleDeleteClick = (room: any) => {
    setSelectedRoom(room);
    setShowDeleteModal(true);
  };
  
  return (
    <div className="bg-white border-2 border-gray-300 rounded">
      {/* Header */}
      <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg text-gray-800">Danh sách phòng - Tòa A, Tầng 1</h2>
          
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
            >
              <option value="all">Tất cả</option>
              <option value="empty">Trống</option>
              <option value="rented">Đã thuê</option>
              <option value="maintenance">Bảo trì</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded flex items-center space-x-2 hover:bg-gray-700"
        >
          <Plus size={16} />
          <span>Thêm Phòng</span>
        </button>
      </div>
      
      {/* Table */}
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
            {filteredRooms.map((room, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800">{room.code}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{room.area}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{room.maxPeople}</td>
                <td className="px-6 py-4 text-sm text-gray-800 text-right">{room.price}</td>
                <td className="px-6 py-4 text-center">
                  <span 
                    className="inline-block rounded"
                    style={{
                      padding: '6px 12px',
                      fontSize: 'var(--type-caption)',
                      fontWeight: 600,
                      backgroundColor: statusConfig[room.status as keyof typeof statusConfig].bgColor,
                      color: statusConfig[room.status as keyof typeof statusConfig].textColor,
                      border: `1px solid ${statusConfig[room.status as keyof typeof statusConfig].borderColor}`
                    }}
                  >
                    {statusConfig[room.status as keyof typeof statusConfig].label}
                  </span>
                </td>
                <td className="px-6 py-4 text-center sticky right-0 bg-white">
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      onClick={() => handleEditClick(room)}
                      className="p-2 hover:bg-gray-100 rounded" 
                      title="Sửa"
                    >
                      <Edit2 size={16} className="text-gray-600" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(room)}
                      className="p-2 hover:bg-gray-100 rounded" 
                      title="Xóa"
                    >
                      <Trash2 size={16} className="text-gray-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg text-gray-800">Thêm Phòng mới</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Location */}
              <div className="bg-blue-50 border border-blue-300 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Vị trí:</strong> Tòa A - Tầng 1
                </p>
              </div>

              {/* Room Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Mã phòng *</label>
                  <input 
                    type="text"
                    placeholder="VD: A-109"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Diện tích (m²) *</label>
                  <input 
                    type="number"
                    placeholder="VD: 45"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              {/* Capacity & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Số người tối đa *</label>
                  <input 
                    type="number"
                    placeholder="VD: 4"
                    min="1"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Giá thuê (VNĐ/tháng) *</label>
                  <input 
                    type="text"
                    placeholder="VD: 8.500.000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Trạng thái ban đầu *</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
                  <option value="empty">Trống</option>
                  <option value="maintenance">Đang bảo trì</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Trạng thái "Đã thuê" chỉ được thiết lập khi có hợp đồng</p>
              </div>

              {/* Facilities */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tiện nghi</label>
                <div className="bg-blue-50 border border-blue-300 rounded px-3 py-2 mb-2">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Gợi ý:</strong> Danh sách này được đồng bộ từ{' '}
                    <strong>Quản lý Hạ tầng → Kho tài sản → Tab "Danh mục tiện nghi"</strong>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="ac" className="w-4 h-4" defaultChecked />
                    <label htmlFor="ac" className="text-sm text-gray-700">❄️ Điều hòa</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="heater" className="w-4 h-4" defaultChecked />
                    <label htmlFor="heater" className="text-sm text-gray-700">🚿 Nước nóng</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="fridge" className="w-4 h-4" />
                    <label htmlFor="fridge" className="text-sm text-gray-700">🧊 Tủ lạnh</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="washer" className="w-4 h-4" />
                    <label htmlFor="washer" className="text-sm text-gray-700">🧺 Máy giặt</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="bed" className="w-4 h-4" defaultChecked />
                    <label htmlFor="bed" className="text-sm text-gray-700">🛏️ Giường</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="desk" className="w-4 h-4" defaultChecked />
                    <label htmlFor="desk" className="text-sm text-gray-700">🪑 Bàn làm việc</label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Mô tả</label>
                <textarea 
                  rows={3}
                  placeholder="Mô tả chi tiết về phòng..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
              >
                Xác nhận thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg text-gray-800">Chỉnh sửa Phòng - {selectedRoom.code}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Location */}
              <div className="bg-blue-50 border border-blue-300 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Vị trí:</strong> Tòa A - Tầng 1
                </p>
              </div>

              {/* Room Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Mã phòng *</label>
                  <input 
                    type="text"
                    defaultValue={selectedRoom.code}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Diện tích (m²) *</label>
                  <input 
                    type="number"
                    defaultValue={selectedRoom.area}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              {/* Capacity & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Số người tối đa *</label>
                  <input 
                    type="number"
                    defaultValue={selectedRoom.maxPeople}
                    min="1"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Giá thuê (VNĐ/tháng) *</label>
                  <input 
                    type="text"
                    defaultValue={selectedRoom.price}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Trạng thái *</label>
                <select 
                  defaultValue={selectedRoom.status}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
                >
                  <option value="empty">Trống</option>
                  <option value="rented">Đã thuê</option>
                  <option value="maintenance">Đang bảo trì</option>
                </select>
              </div>

              {/* Facilities */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tiện nghi</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="ac-edit" className="w-4 h-4" defaultChecked />
                    <label htmlFor="ac-edit" className="text-sm text-gray-700">❄️ Điều hòa</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="heater-edit" className="w-4 h-4" defaultChecked />
                    <label htmlFor="heater-edit" className="text-sm text-gray-700">🚿 Nước nóng</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="fridge-edit" className="w-4 h-4" />
                    <label htmlFor="fridge-edit" className="text-sm text-gray-700">🧊 Tủ lạnh</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="washer-edit" className="w-4 h-4" />
                    <label htmlFor="washer-edit" className="text-sm text-gray-700">🧺 Máy giặt</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="bed-edit" className="w-4 h-4" defaultChecked />
                    <label htmlFor="bed-edit" className="text-sm text-gray-700">🛏️ Giường</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="desk-edit" className="w-4 h-4" defaultChecked />
                    <label htmlFor="desk-edit" className="text-sm text-gray-700">🪑 Bàn làm việc</label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Mô tả</label>
                <textarea 
                  rows={3}
                  placeholder="Mô tả chi tiết về phòng..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button 
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg text-gray-800">Xác nhận xóa</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Warning */}
              <div className="flex items-start space-x-3 bg-red-50 border border-red-300 rounded p-4">
                <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-bold mb-1">Bạn có chắc chắn muốn xóa phòng này?</p>
                  <p className="text-sm text-red-700">Hành động này không thể hoàn tác!</p>
                </div>
              </div>

              {/* Room Info */}
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <p className="text-sm text-gray-600 mb-2">Thông tin phòng sẽ bị xóa:</p>
                <div className="space-y-1">
                  <p className="text-sm text-gray-800"><strong>Mã phòng:</strong> {selectedRoom.code}</p>
                  <p className="text-sm text-gray-800"><strong>Diện tích:</strong> {selectedRoom.area}m²</p>
                  <p className="text-sm text-gray-800"><strong>Giá thuê:</strong> {selectedRoom.price} VNĐ/tháng</p>
                  <p className="text-sm text-gray-800">
                    <strong>Trạng thái:</strong>{' '}
                    <span className={`inline-block px-2 py-0.5 text-xs rounded ${statusConfig[selectedRoom.status as keyof typeof statusConfig].borderColor}`}>
                      <span className={`bg-${statusConfig[selectedRoom.status as keyof typeof statusConfig].bgColor} text-${statusConfig[selectedRoom.status as keyof typeof statusConfig].textColor} px-2 py-0.5 rounded`}>
                        {statusConfig[selectedRoom.status as keyof typeof statusConfig].label}
                      </span>
                    </span>
                  </p>
                </div>
              </div>

              {/* Additional Warning for Rented Rooms */}
              {selectedRoom.status === 'rented' && (
                <div className="bg-orange-50 border border-orange-300 rounded p-4">
                  <p className="text-sm text-orange-800">
                    <strong>⚠️ Cảnh báo:</strong> Phòng này đang có hợp đồng thuê. Vui lòng tất toán hợp đồng trước khi xóa!
                  </p>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={selectedRoom.status === 'rented'}
                className={`px-4 py-2 text-white text-sm rounded ${
                  selectedRoom.status === 'rented'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}