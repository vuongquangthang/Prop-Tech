import { Plus, Edit2, Trash2, X, AlertTriangle, Tag } from 'lucide-react';
import { useState } from 'react';

interface Amenity {
  id: number;
  name: string;
  icon: string;
  defaultChecked: boolean;
}

let nextId = 1;

export function AmenityManager() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [addName, setAddName] = useState('');
  const [addIcon, setAddIcon] = useState('');
  const [addDefault, setAddDefault] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editDefault, setEditDefault] = useState(false);

  const handleEditClick = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setEditName(amenity.name);
    setEditIcon(amenity.icon);
    setEditDefault(amenity.defaultChecked);
    setShowEditModal(true);
  };

  const handleDeleteClick = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setShowDeleteModal(true);
  };

  const handleAdd = () => {
    if (!addName.trim() || !addIcon.trim()) return;
    setAmenities(prev => [...prev, { id: nextId++, name: addName.trim(), icon: addIcon.trim(), defaultChecked: addDefault }]);
    setAddName('');
    setAddIcon('');
    setAddDefault(false);
    setShowAddModal(false);
  };

  const handleEdit = () => {
    if (!selectedAmenity || !editName.trim()) return;
    setAmenities(prev => prev.map(a => a.id === selectedAmenity.id
      ? { ...a, name: editName.trim(), icon: editIcon.trim(), defaultChecked: editDefault }
      : a));
    setShowEditModal(false);
    setSelectedAmenity(null);
  };

  const handleDelete = () => {
    if (!selectedAmenity) return;
    setAmenities(prev => prev.filter(a => a.id !== selectedAmenity.id));
    setShowDeleteModal(false);
    setSelectedAmenity(null);
  };

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-300 rounded p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Hướng dẫn:</strong> Danh mục tiện nghi này sẽ được sử dụng khi thêm/sửa phòng. 
          Các tiện nghi được đánh dấu "Mặc định" sẽ tự động được chọn khi thêm phòng mới.
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg text-gray-800">
          Danh sách tiện nghi ({amenities.length} tiện nghi)
        </h2>
        
        <button 
          onClick={() => { setAddName(''); setAddIcon(''); setAddDefault(false); setShowAddModal(true); }}
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded flex items-center space-x-2 hover:bg-gray-700"
        >
          <Plus size={16} />
          <span>Thêm tiện nghi</span>
        </button>
      </div>
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">STT</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Icon</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Tên tiện nghi</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Mặc định khi thêm phòng</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {amenities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Chưa có tiện nghi nào. Nhấn "Thêm tiện nghi" để bắt đầu.
                  </td>
                </tr>
              ) : amenities.map((amenity, index) => (
                <tr key={amenity.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                  <td className="px-6 py-4 text-2xl">{amenity.icon}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{amenity.name}</td>
                  <td className="px-6 py-4 text-center">
                    {amenity.defaultChecked ? (
                      <span className="inline-block px-3 py-1 text-xs rounded border bg-green-100 text-green-800 border-green-300">
                        Có
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 text-xs rounded border bg-gray-100 text-gray-600 border-gray-300">
                        Không
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => handleEditClick(amenity)}
                        className="p-2 hover:bg-gray-100 rounded" 
                        title="Sửa"
                      >
                        <Edit2 size={16} className="text-gray-600" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(amenity)}
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
      </div>

      {/* Add Amenity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag size={20} className="text-gray-800" />
                <h3 className="text-lg text-gray-800">Thêm tiện nghi mới</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tên tiện nghi *</label>
                <input 
                  type="text"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  placeholder="VD: Bình lọc nước, TV, Lò vi sóng..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Icon (emoji) *</label>
                <input 
                  type="text"
                  value={addIcon}
                  onChange={e => setAddIcon(e.target.value)}
                  placeholder="VD: 💧, 📺, 🔥..."
                  maxLength={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nhập 1 emoji để làm icon. 
                  Gợi ý: Win + . (Windows) hoặc Control + Command + Space (Mac)
                </p>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="defaultChecked" 
                  checked={addDefault}
                  onChange={e => setAddDefault(e.target.checked)}
                  className="w-4 h-4 mt-1" 
                />
                <div>
                  <label htmlFor="defaultChecked" className="text-sm text-gray-700 cursor-pointer">
                    Đặt làm mặc định khi thêm phòng mới
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tiện nghi này sẽ tự động được tick khi tạo phòng mới
                  </p>
                </div>
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
                onClick={handleAdd}
                disabled={!addName.trim() || !addIcon.trim()}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Xác nhận thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Amenity Modal */}
      {showEditModal && selectedAmenity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag size={20} className="text-gray-800" />
                <h3 className="text-lg text-gray-800">Chỉnh sửa tiện nghi</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tên tiện nghi *</label>
                <input 
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Icon (emoji) *</label>
                <input 
                  type="text"
                  value={editIcon}
                  onChange={e => setEditIcon(e.target.value)}
                  maxLength={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nhập 1 emoji để làm icon
                </p>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="defaultCheckedEdit" 
                  checked={editDefault}
                  onChange={e => setEditDefault(e.target.checked)}
                  className="w-4 h-4 mt-1" 
                />
                <div>
                  <label htmlFor="defaultCheckedEdit" className="text-sm text-gray-700 cursor-pointer">
                    Đặt làm mặc định khi thêm phòng mới
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tiện nghi này sẽ tự động được tick khi tạo phòng mới
                  </p>
                </div>
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
                onClick={handleEdit}
                disabled={!editName.trim()}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAmenity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg text-gray-800">Xác nhận xóa</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3 bg-red-50 border border-red-300 rounded p-4">
                <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-bold mb-1">Bạn có chắc chắn muốn xóa tiện nghi này?</p>
                  <p className="text-sm text-red-700">Hành động này không thể hoàn tác!</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <p className="text-sm text-gray-600 mb-2">Tiện nghi sẽ bị xóa:</p>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{selectedAmenity.icon}</span>
                  <div>
                    <p className="text-sm text-gray-800"><strong>{selectedAmenity.name}</strong></p>
                    <p className="text-xs text-gray-600">
                      {selectedAmenity.defaultChecked ? 'Mặc định: Có' : 'Mặc định: Không'}
                    </p>
                  </div>
                </div>
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
                onClick={handleDelete}
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
