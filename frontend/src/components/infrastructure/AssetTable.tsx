import { Plus, Edit2, Trash2, X, AlertTriangle, Package, Link2, Loader2, Pencil, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';
import { PageHeader } from '../ui/product-system';

interface TaiSanDto {
  id: number;
  assetName: string;
  assetCode: string;
  totalRooms: number;
  totalQuantity: number;
}

interface FormData {
  assetName: string;
  assetCode: string;
}

interface RoomItem {
  id: number;
  roomCode: string;
  status: string;
  buildingName?: string;
  floorNumber?: number;
}

interface RoomAssignment {
  roomId: number;
  assetId: number;
  quantity: number;
  condition?: string;
  note?: string;
  roomCode?: string;
  assetName?: string;
  assetCode?: string;
}

export function AssetTable() {
  const [assets, setAssets] = useState<TaiSanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<TaiSanDto | null>(null);
  const [formData, setFormData] = useState<FormData>({ assetName: '', assetCode: '' });

  // Assign to room state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignAsset, setAssignAsset] = useState<TaiSanDto | null>(null);
  const [assignments, setAssignments] = useState<RoomAssignment[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  // New assignment form
  const [addRoomId, setAddRoomId] = useState<number>(0);
  const [addQty, setAddQty] = useState('1');
  const [addCondition, setAddCondition] = useState('Tốt');
  const [addNote, setAddNote] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  // Edit row state
  const [editingRow, setEditingRow] = useState<number | null>(null); // roomId being edited
  const [editQty, setEditQty] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editRowSaving, setEditRowSaving] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<TaiSanDto[]>(API_ENDPOINTS.ASSETS.BASE);
      setAssets(res.data);
    } catch {
      setError('Không thể tải danh sách tài sản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleAdd = async () => {
    if (!formData.assetName.trim() || !formData.assetCode.trim()) return;
    try {
      setSaving(true);
      await api.post(API_ENDPOINTS.ASSETS.BASE, formData);
      setShowAddModal(false);
      setFormData({ assetName: '', assetCode: '' });
      await fetchAssets();
    } catch {
      alert('Thêm tài sản thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAsset || !formData.assetName.trim()) return;
    try {
      setSaving(true);
      await api.put(API_ENDPOINTS.ASSETS.BY_ID(selectedAsset.id), formData);
      setShowEditModal(false);
      setSelectedAsset(null);
      await fetchAssets();
    } catch {
      alert('Cập nhật tài sản thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;
    try {
      setSaving(true);
      await api.delete(API_ENDPOINTS.ASSETS.BY_ID(selectedAsset.id));
      setShowDeleteModal(false);
      setSelectedAsset(null);
      await fetchAssets();
    } catch {
      alert('Xóa tài sản thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (asset: TaiSanDto) => {
    setSelectedAsset(asset);
    setFormData({ assetName: asset.assetName, assetCode: asset.assetCode });
    setShowEditModal(true);
  };

  const handleDeleteClick = (asset: TaiSanDto) => {
    setSelectedAsset(asset);
    setShowDeleteModal(true);
  };

  const handleAssignClick = async (asset: TaiSanDto) => {
    setAssignAsset(asset);
    setAssignError(null);
    setEditingRow(null);
    setAddRoomId(0);
    setAddQty('1');
    setAddCondition('Tốt');
    setAddNote('');
    setShowAssignModal(true);
    setAssignLoading(true);
    try {
      const [assignRes, roomRes] = await Promise.all([
        api.get<RoomAssignment[]>(API_ENDPOINTS.ASSETS.ROOM_ASSETS_BY_ASSET(asset.id)),
        api.get<any[]>(API_ENDPOINTS.ROOMS.BASE),
      ]);
      setAssignments(assignRes.data);
      const mappedRooms: RoomItem[] = roomRes.data.map((r: any) => ({
        id: r.id,
        roomCode: r.roomCode || r.code || '',
        status: r.status || '',
        buildingName: r.buildingName || '',
        floorNumber: r.floorNumber,
      })).filter((r: RoomItem) => r.status === 'Đã thuê');
      setRooms(mappedRooms);
      if (mappedRooms.length > 0) setAddRoomId(mappedRooms[0].id);
    } catch {
      setAssignError('Không thể tải dữ liệu');
    } finally {
      setAssignLoading(false);
    }
  };

  const fetchAssignments = async (assetId: number) => {
    const res = await api.get<RoomAssignment[]>(API_ENDPOINTS.ASSETS.ROOM_ASSETS_BY_ASSET(assetId));
    setAssignments(res.data);
  };

  const handleAddAssignment = async () => {
    if (!assignAsset || !addRoomId) return;
    setAddSaving(true);
    setAssignError(null);
    try {
      await api.post(API_ENDPOINTS.ASSETS.ROOM_ASSETS, {
        roomId: addRoomId,
        assetId: assignAsset.id,
        quantity: parseInt(addQty) || 1,
        condition: addCondition,
        note: addNote.trim() || undefined,
      });
      await fetchAssignments(assignAsset.id);
      setAddQty('1'); setAddCondition('Tốt'); setAddNote('');
      await fetchAssets();
    } catch (e: any) {
      setAssignError(e.response?.data?.message || e.message || 'Gán thất bại');
    } finally {
      setAddSaving(false);
    }
  };

  const handleStartEditRow = (row: RoomAssignment) => {
    setEditingRow(row.roomId);
    setEditQty(String(row.quantity));
    setEditCondition(row.condition || 'Tốt');
    setEditNote(row.note || '');
  };

  const handleSaveEditRow = async (row: RoomAssignment) => {
    if (!assignAsset) return;
    setEditRowSaving(true);
    setAssignError(null);
    try {
      await api.put(API_ENDPOINTS.ASSETS.ROOM_ASSETS_UPDATE(row.roomId, assignAsset.id), {
        quantity: parseInt(editQty) || 1,
        condition: editCondition,
        note: editNote.trim() || undefined,
      });
      setEditingRow(null);
      await fetchAssignments(assignAsset.id);
      await fetchAssets();
    } catch (e: any) {
      setAssignError(e.response?.data?.message || e.message || 'Cập nhật thất bại');
    } finally {
      setEditRowSaving(false);
    }
  };

  const handleRemoveAssignment = async (row: RoomAssignment) => {
    if (!assignAsset) return;
    setAssignError(null);
    try {
      await api.delete(API_ENDPOINTS.ASSETS.ROOM_ASSETS_DELETE(row.roomId, assignAsset.id));
      await fetchAssignments(assignAsset.id);
      await fetchAssets();
    } catch (e: any) {
      setAssignError(e.response?.data?.message || e.message || 'Xóa thất bại');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quản lý hạ tầng"
        title="Tài sản trong phòng"
        description="Quản lý danh mục tài sản, số lượng và các phòng đang sử dụng."
        actions={
          <button
            onClick={() => { setFormData({ assetName: '', assetCode: '' }); setShowAddModal(true); }}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded flex items-center space-x-2 hover:bg-gray-700"
          >
            <Plus size={16} />
            <span>Thêm tài sản</span>
          </button>
        }
      />
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-lg text-gray-800">Danh sách tài sản - {assets.length} loại tài sản</h2>
        </div>
        
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">Đang tải...</div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={fetchAssets} className="px-4 py-2 bg-gray-800 text-white text-sm rounded">Thử lại</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">STT</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Tên tài sản</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Mã tài sản</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Số phòng sử dụng</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Tổng số lượng</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Chưa có tài sản nào. Nhấn "Thêm tài sản" để bắt đầu.
                    </td>
                  </tr>
                ) : assets.map((asset, index) => (
                  <tr key={asset.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">{asset.assetName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-mono">{asset.assetCode}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">{asset.totalRooms}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">{asset.totalQuantity}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button className="p-2 hover:bg-blue-50 rounded" title="Gán vào phòng" onClick={() => handleAssignClick(asset)}>
                          <Link2 size={16} className="text-blue-600" />
                        </button>
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
        )}
      </div>
      
      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package size={20} className="text-gray-800" />
                <h3 className="text-lg text-gray-800">Thêm tài sản vào kho</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tên tài sản *</label>
                <input 
                  type="text"
                  value={formData.assetName}
                  onChange={e => setFormData(f => ({ ...f, assetName: e.target.value }))}
                  placeholder="VD: Điều hòa Daikin 12000BTU"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Mã tài sản *</label>
                <input 
                  type="text"
                  value={formData.assetCode}
                  onChange={e => setFormData(f => ({ ...f, assetCode: e.target.value }))}
                  placeholder="VD: AC-001"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Mã tài sản phải là duy nhất trong hệ thống</p>
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
                disabled={saving || !formData.assetName.trim() || !formData.assetCode.trim()}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Xác nhận thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditModal && selectedAsset && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit2 size={20} className="text-gray-800" />
                <h3 className="text-lg text-gray-800">Chỉnh sửa tài sản</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tên tài sản *</label>
                <input 
                  type="text"
                  value={formData.assetName}
                  onChange={e => setFormData(f => ({ ...f, assetName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Mã tài sản</label>
                <input 
                  type="text"
                  value={formData.assetCode}
                  onChange={e => setFormData(f => ({ ...f, assetCode: e.target.value }))}
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
                onClick={handleEdit}
                disabled={saving || !formData.assetName.trim()}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAsset && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg text-gray-800">Xác nhận xóa tài sản</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3 bg-red-50 border border-red-300 rounded p-4">
                <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-bold mb-1">Bạn có chắc chắn muốn xóa tài sản này?</p>
                  <p className="text-sm text-red-700">Hành động này không thể hoàn tác!</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4 space-y-1">
                <p className="text-sm text-gray-800"><strong>Tên:</strong> {selectedAsset.assetName}</p>
                <p className="text-sm text-gray-800"><strong>Mã:</strong> {selectedAsset.assetCode}</p>
                <p className="text-sm text-gray-800"><strong>Số phòng sử dụng:</strong> {selectedAsset.totalRooms}</p>
                <p className="text-sm text-gray-800"><strong>Tổng số lượng:</strong> {selectedAsset.totalQuantity}</p>
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
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign to Room Modal */}
      {showAssignModal && assignAsset && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[700px] max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Link2 size={20} className="text-blue-600" />
                <div>
                  <h3 className="text-lg text-gray-800">Gán tài sản vào phòng</h3>
                  <p className="text-sm text-gray-500">{assignAsset.assetName} · <span className="font-mono">{assignAsset.assetCode}</span></p>
                </div>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {assignError && (
                <div className="bg-red-50 border border-red-300 rounded px-3 py-2 text-sm text-red-700">{assignError}</div>
              )}

              {/* Current assignments */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Phòng đang sử dụng tài sản này</h4>
                {assignLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                  </div>
                ) : assignments.length === 0 ? (
                  <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded px-4 py-3">Chưa gán vào phòng nào.</p>
                ) : (
                  <div className="border border-gray-300 rounded overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-300">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs text-gray-600">Phòng</th>
                          <th className="px-4 py-2 text-center text-xs text-gray-600">Số lượng</th>
                          <th className="px-4 py-2 text-center text-xs text-gray-600">Tình trạng</th>
                          <th className="px-4 py-2 text-left text-xs text-gray-600">Ghi chú</th>
                          <th className="px-4 py-2 text-center text-xs text-gray-600">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.map(row => (
                          <tr key={row.roomId} className="border-b border-gray-200 last:border-0">
                            <td className="px-4 py-2 text-sm font-medium text-gray-800">{row.roomCode || `P-${row.roomId}`}</td>
                            {editingRow === row.roomId ? (
                              <>
                                <td className="px-4 py-2 text-center">
                                  <input type="number" min={1} value={editQty} onChange={e => setEditQty(e.target.value)}
                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:outline-none focus:border-blue-500" />
                                </td>
                                <td className="px-4 py-2">
                                  <select value={editCondition} onChange={e => setEditCondition(e.target.value)}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500">
                                    <option value="Tốt">Tốt</option>
                                    <option value="Trung bình">Trung bình</option>
                                    <option value="Hỏng">Hỏng</option>
                                  </select>
                                </td>
                                <td className="px-4 py-2">
                                  <input type="text" value={editNote} onChange={e => setEditNote(e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center justify-center space-x-1">
                                    <button onClick={() => handleSaveEditRow(row)} disabled={editRowSaving}
                                      className="p-1 hover:bg-green-50 rounded" title="Lưu">
                                      {editRowSaving ? <Loader2 size={14} className="animate-spin text-green-600" /> : <Check size={14} className="text-green-600" />}
                                    </button>
                                    <button onClick={() => setEditingRow(null)} className="p-1 hover:bg-gray-100 rounded" title="Hủy">
                                      <X size={14} className="text-gray-500" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-2 text-sm text-center text-gray-700">{row.quantity}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    row.condition === 'Tốt' ? 'bg-green-100 text-green-700' :
                                    row.condition === 'Hỏng' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>{row.condition || 'Tốt'}</span>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">{row.note || '—'}</td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center justify-center space-x-1">
                                    <button onClick={() => handleStartEditRow(row)} className="p-1 hover:bg-gray-100 rounded" title="Sửa">
                                      <Pencil size={14} className="text-gray-600" />
                                    </button>
                                    <button onClick={() => handleRemoveAssignment(row)} className="p-1 hover:bg-red-50 rounded" title="Gỡ khỏi phòng">
                                      <Trash2 size={14} className="text-red-500" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Add new assignment */}
              <div className="border-t border-gray-200 pt-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Gán vào phòng mới</h4>
                {rooms.length === 0 && !assignLoading ? (
                  <p className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded px-4 py-3">
                    Không có phòng nào đang được thuê. Chỉ có thể gán tài sản vào phòng đang có người ở.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Phòng đang thuê *</label>
                      <select value={addRoomId} onChange={e => setAddRoomId(parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
                        {rooms.filter(r => !assignments.some(a => a.roomId === r.id)).map(r => (
                          <option key={r.id} value={r.id}>{r.roomCode}{r.buildingName ? ` - ${r.buildingName}` : ''}</option>
                        ))}
                        {rooms.filter(r => !assignments.some(a => a.roomId === r.id)).length === 0 && (
                          <option value={0}>Tất cả phòng đã được gán</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Số lượng *</label>
                      <input type="number" min={1} value={addQty} onChange={e => setAddQty(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tình trạng</label>
                      <select value={addCondition} onChange={e => setAddCondition(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
                        <option value="Tốt">Tốt</option>
                        <option value="Trung bình">Trung bình</option>
                        <option value="Hỏng">Hỏng</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Ghi chú</label>
                      <input type="text" placeholder="Không bắt buộc" value={addNote} onChange={e => setAddNote(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button onClick={handleAddAssignment}
                        disabled={addSaving || !addRoomId || rooms.filter(r => !assignments.some(a => a.roomId === r.id)).length === 0}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2">
                        {addSaving && <Loader2 size={14} className="animate-spin" />}
                        <span>Gán vào phòng</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
