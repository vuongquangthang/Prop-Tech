import { Plus, Edit2, Trash2, Filter, X, AlertTriangle, Package, QrCode } from 'lucide-react';
import { useState } from 'react';

const assetsData = [
  { 
    id: 1,
    image: '🖼️', 
    name: 'Điều hòa Daikin 12000BTU', 
    code: 'AC-001', 
    room: 'A-101', 
    price: '8.000.000',
    purchaseDate: '15/01/2025',
    warranty: '24 tháng'
  },
  { 
    id: 2,
    image: '🖼️', 
    name: 'Tủ lạnh Panasonic 180L', 
    code: 'FR-001', 
    room: 'A-101', 
    price: '5.500.000',
    purchaseDate: '15/01/2025',
    warranty: '12 tháng'
  },
  { 
    id: 3,
    image: '🖼️', 
    name: 'Máy giặt LG 9kg', 
    code: 'WM-001', 
    room: 'A-102', 
    price: '6.000.000',
    purchaseDate: '20/01/2025',
    warranty: '12 tháng'
  },
  { 
    id: 4,
    image: '🖼️', 
    name: 'Điều hòa Daikin 12000BTU', 
    code: 'AC-002', 
    room: 'A-102', 
    price: '8.000.000',
    purchaseDate: '15/01/2025',
    warranty: '24 tháng'
  },
  { 
    id: 5,
    image: '🖼️', 
    name: 'Bàn làm việc gỗ', 
    code: 'TB-001', 
    room: 'A-103', 
    price: '2.500.000',
    purchaseDate: '10/01/2025',
    warranty: 'Không'
  },
  { 
    id: 6,
    image: '🖼️', 
    name: 'Giường ngủ 1m6', 
    code: 'BD-001', 
    room: 'A-103', 
    price: '4.000.000',
    purchaseDate: '10/01/2025',
    warranty: '6 tháng'
  },
];

export function AssetTable() {
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const filteredAssets = assetsData.filter(asset => {
    const matchRoom = roomFilter === 'all' || asset.room === roomFilter;
    return matchRoom;
  });

  const handleEditClick = (asset: any) => {
    setSelectedAsset(asset);
    setShowEditModal(true);
  };

  const handleDeleteClick = (asset: any) => {
    setSelectedAsset(asset);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter size={16} className="text-gray-500" />
          
          {/* Room Filter */}
          <select 
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
          >
            <option value="all">Tất cả phòng</option>
            <option value="A-101">A-101</option>
            <option value="A-102">A-102</option>
            <option value="A-103">A-103</option>
          </select>
        </div>
        
        <button 
          onClick={() => {
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded flex items-center space-x-2 hover:bg-gray-700"
        >
          <Plus size={16} />
          <span>Thêm tài sản lẻ</span>
        </button>
      </div>
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-lg text-gray-800">Danh sách tài sản - Kho {filteredAssets.length} tài sản</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Ảnh</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Tên tài sản</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Mã tài sản (QR)</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Phòng</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Tình trạng</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">Đơn giá đền bù (VNĐ)</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 bg-gray-200 border border-gray-300 rounded flex items-center justify-center text-2xl">
                      {asset.image}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{asset.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{asset.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{asset.room}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 text-xs rounded border ${asset.warranty === 'Không' ? 'bg-gray-100 text-gray-800 border-gray-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                      {asset.warranty === 'Không' ? 'Không bảo hành' : 'Bảo hành'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">{asset.price}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded" title="Sửa" onClick={() => handleEditClick(asset)}>
                        <Edit2 size={16} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded" title="Xóa" onClick={() => handleDeleteClick(asset)}>
                        <Trash2 size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Warning Box */}
      <div className="bg-red-50 border border-red-300 rounded p-4">
        <p className="text-sm text-red-800">
          <strong>⚠️ Cảnh báo:</strong> Khi xóa tài sản, vui lòng xác nhận rằng tài sản đã được thu hồi hoặc thanh lý. Hành động này không thể hoàn tác.
        </p>
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[650px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center space-x-2">
                <Package size={20} className="text-gray-800" />
                <h3 className="text-lg text-gray-800">Thêm tài sản vào kho</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Ảnh tài sản</label>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 bg-gray-200 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-4xl">
                    🖼️
                  </div>
                  <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                    Tải ảnh lên
                  </button>
                </div>
              </div>

              {/* Asset Name */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tên tài sản *</label>
                <input 
                  type="text"
                  placeholder="VD: Điều hòa Daikin 12000BTU"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Asset Code with QR */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Mã tài sản (QR Code) *</label>
                <input 
                  type="text"
                  placeholder="VD: AC-003"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mã QR giúp quản lý và tracking tài sản dễ dàng hơn
                </p>
              </div>

              {/* Room Assignment */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Phòng *</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500">
                  <option value="">Chọn phòng...</option>
                  <option value="A-101">A-101</option>
                  <option value="A-102">A-102</option>
                  <option value="A-103">A-103</option>
                  <option value="B-201">B-201</option>
                  <option value="B-202">B-202</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Danh sách phòng được đồng bộ từ <strong>Cơ cấu tòa nhà & phòng</strong>
                </p>
              </div>

              {/* Purchase Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Ngày mua</label>
                  <input 
                    type="date"
                    defaultValue="2026-02-05"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Thời hạn bảo hành</label>
                  <input 
                    type="text"
                    placeholder="VD: 12 tháng, 24 tháng"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              {/* Compensation Price */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Đơn giá đền bù (VNĐ) *</label>
                <input 
                  type="text"
                  placeholder="VD: 8.000.000"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Giá này sẽ được sử dụng nếu cư dân làm hỏng/mất tài sản
                </p>
              </div>

              {/* Sync Info */}
              <div className="bg-blue-50 border border-blue-300 rounded p-4">
                <p className="text-xs text-blue-800">
                  💡 <strong>Đồng bộ dữ liệu:</strong> Tài sản này sẽ được liên kết với phòng đã chọn 
                  và có thể xem trong phần <strong>Vận hành & Sự cố → Lịch sử Bảo trì</strong> khi có sửa chữa
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Ghi chú</label>
                <textarea 
                  rows={2}
                  placeholder="Ghi chú về tài sản..."
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

      {/* Edit Asset Modal */}
      {showEditModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[650px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center space-x-2">
                <Edit2 size={20} className="text-gray-800" />
                <h3 className="text-lg text-gray-800">Chỉnh sửa tài sản - {selectedAsset.code}</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Ảnh tài sản</label>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 bg-gray-200 border-2 border-gray-300 rounded flex items-center justify-center text-4xl">
                    {selectedAsset.image}
                  </div>
                  <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                    Thay đổi ảnh
                  </button>
                </div>
              </div>

              {/* Asset Name */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tên tài sản *</label>
                <input 
                  type="text"
                  defaultValue={selectedAsset.name}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Asset Code (Read-only) */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Mã tài sản (QR Code)</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="text"
                    defaultValue={selectedAsset.code}
                    disabled
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 text-gray-500"
                  />
                  <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 flex items-center space-x-2">
                    <QrCode size={16} />
                    <span>Xem QR</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mã tài sản không thể thay đổi sau khi tạo
                </p>
              </div>

              {/* Room Assignment */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Phòng *</label>
                <select 
                  defaultValue={selectedAsset.room}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                >
                  <option value="A-101">A-101</option>
                  <option value="A-102">A-102</option>
                  <option value="A-103">A-103</option>
                  <option value="B-201">B-201</option>
                  <option value="B-202">B-202</option>
                </select>
              </div>

              {/* Purchase Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Ngày mua</label>
                  <input 
                    type="text"
                    defaultValue={selectedAsset.purchaseDate}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Thời hạn bảo hành</label>
                  <input 
                    type="text"
                    defaultValue={selectedAsset.warranty}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              {/* Compensation Price */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Đơn giá đền bù (VNĐ) *</label>
                <input 
                  type="text"
                  defaultValue={selectedAsset.price}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Condition Change Warning */}
              {selectedAsset.warranty === 'Không' && (
                <div className="bg-orange-50 border border-orange-300 rounded p-4">
                  <p className="text-xs text-orange-800">
                    <strong>⚠️ Lưu ý:</strong> Tài sản này đang ở trạng thái <strong>Hỏng</strong>. 
                    Nếu cần sửa chữa, hãy tạo yêu cầu trong <strong>Vận hành & Sự cố → Lịch sử Bảo trì</strong>
                  </p>
                </div>
              )}
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
      {showDeleteModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[550px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg text-gray-800">Xác nhận xóa tài sản</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Warning */}
              <div className="flex items-start space-x-3 bg-red-50 border border-red-300 rounded p-4">
                <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-bold mb-1">Bạn có chắc chắn muốn xóa tài sản này?</p>
                  <p className="text-sm text-red-700">Hành động này không thể hoàn tác!</p>
                </div>
              </div>

              {/* Asset Info */}
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <p className="text-sm text-gray-600 mb-3">Tài sản sẽ bị xóa:</p>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 border border-gray-300 rounded flex items-center justify-center text-3xl">
                    {selectedAsset.image}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-gray-800"><strong>Tên:</strong> {selectedAsset.name}</p>
                    <p className="text-sm text-gray-800"><strong>Mã:</strong> {selectedAsset.code}</p>
                    <p className="text-sm text-gray-800"><strong>Phòng:</strong> {selectedAsset.room}</p>
                    <p className="text-sm text-gray-800">
                      <strong>Tình trạng:</strong> 
                      <span className={`ml-2 inline-block px-2 py-0.5 text-xs rounded border ${selectedAsset.warranty === 'Không' ? 'bg-gray-100 text-gray-800 border-gray-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                        {selectedAsset.warranty === 'Không' ? 'Không bảo hành' : 'Bảo hành'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="bg-orange-50 border border-orange-300 rounded p-4 space-y-2">
                <p className="text-sm text-orange-800 font-bold mb-2">Vui lòng xác nhận:</p>
                <label className="flex items-start space-x-2 text-sm text-orange-800 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 mt-0.5" />
                  <span>Tài sản đã được thu hồi từ phòng</span>
                </label>
                <label className="flex items-start space-x-2 text-sm text-orange-800 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 mt-0.5" />
                  <span>Đã kiểm tra và xác nhận không còn sử dụng</span>
                </label>
              </div>
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
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
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