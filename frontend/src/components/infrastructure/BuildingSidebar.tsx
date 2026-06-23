import { Plus, ChevronRight, ChevronDown, X, Loader2, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { buildingService, floorService } from '../../services/api.service';
import { LocationPicker } from '../LocationPicker';

interface FloorData {
  id: number;
  floorNumber: number;
  floorCode: string;
}

interface BuildingData {
  id: number;
  buildingName: string;
  buildingCode: string;
  totalFloors: number;
  floors: FloorData[];
}

interface BuildingSidebarProps {
  selectedFloor: number | null;
  onSelectFloor: (floorId: number | null) => void;
  selectedBuilding: number | null;
  onSelectBuilding: (buildingId: number | null) => void;
}

export function BuildingSidebar({ selectedFloor, onSelectFloor, selectedBuilding, onSelectBuilding }: BuildingSidebarProps) {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBuilding, setExpandedBuilding] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'building' | 'floor'>('building');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Building form fields
  const [buildingName, setBuildingName] = useState('');
  const [totalFloorsInput, setTotalFloorsInput] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  // Floor form fields
  const [selectedBuildingId, setSelectedBuildingId] = useState<number>(0);
  const [floorCode, setFloorCode] = useState('');
  const [floorNumber, setFloorNumber] = useState('');

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      setError(null);
      const buildingsData = await buildingService.getAll();
      
      // Fetch floors for each building
      const buildingsWithFloors = await Promise.all(
        buildingsData.map(async (building) => {
          try {
            const floors = await floorService.getByBuilding(building.id);
            return {
              ...building,
              id: building.id || building.toaNhaId || 0,
              buildingName: building.buildingName || building.tenToaNha || '',
              buildingCode: building.buildingCode || building.maToaNha || '',
              totalFloors: (building as any).numberOfFloors || building.totalFloors || building.soTang || 0,
              floors: floors.map((f: any) => ({
                id: f.id || f.tangId || 0,
                floorNumber: f.floorNumber || f.soTang || 0,
                floorCode: f.floorCode || f.maTang || '',
              }))
            };
          } catch {
            return {
              ...building,
              id: building.id || building.toaNhaId || 0,
              buildingName: building.buildingName || building.tenToaNha || '',
              buildingCode: building.buildingCode || building.maToaNha || '',
              totalFloors: (building as any).numberOfFloors || building.totalFloors || building.soTang || 0,
              floors: []
            };
          }
        })
      );
      
      setBuildings(buildingsWithFloors);
      
      // Auto-expand first building
      if (buildingsWithFloors.length > 0) {
        setExpandedBuilding(buildingsWithFloors[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách tòa nhà');
      console.error('Error fetching buildings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setShowAddModal(true);
    setAddType('building');
    setBuildingName('');
    setTotalFloorsInput('');
    setAddress('');
    setLatitude(null);
    setLongitude(null);
    setFloorCode('');
    setFloorNumber('');
    setSelectedBuildingId(buildings.length > 0 ? buildings[0].id : 0);
    setFormError(null);
  };

  const handleSubmit = async () => {
    setFormError(null);
    setFormLoading(true);
    try {
      if (addType === 'building') {
        if (!buildingName.trim() || !totalFloorsInput) {
          setFormError('Vui lòng nhập tên tòa nhà và số tầng');
          setFormLoading(false);
          return;
        }
        await buildingService.create({
          buildingName: buildingName.trim(),
          address: address.trim() || '',
          numberOfFloors: parseInt(totalFloorsInput),
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
        } as any);
      } else {
        const bid = selectedBuildingId || (buildings[0]?.id ?? 0);
        if (!bid || !floorNumber) {
          setFormError('Vui lòng chọn tòa nhà và nhập số thứ tự tầng');
          setFormLoading(false);
          return;
        }
        await floorService.create({
          buildingId: bid,
          floorNumber: parseInt(floorNumber),
        } as any);
      }
      await fetchBuildings();
      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ 
      height: '100%',
      backgroundColor: 'var(--surface-card)', 
      border: '1px solid var(--surface-border)',
      borderRadius: 'var(--radius-card)'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '20px', 
        borderBottom: '1px solid var(--surface-border)' 
      }}>
        <button 
          onClick={handleAddClick}
          className="w-full rounded transition-colors flex items-center justify-center"
          style={{
            height: 'var(--input-height)',
            padding: '0 16px',
            backgroundColor: 'var(--brand-primary)',
            color: 'var(--text-on-color)',
            fontSize: 'var(--type-body)',
            fontWeight: 600,
            borderRadius: 'var(--radius-button)',
            gap: '8px'
          }}
        >
          <Plus size={20} />
          <span>Thêm Tòa nhà/Tầng</span>
        </button>
      </div>
      
      {/* Tree View */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 size={32} className="animate-spin text-gray-400 mb-3" />
            <span className="text-gray-600 text-sm">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Building2 size={32} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm mb-3">{error}</p>
            <button 
              onClick={fetchBuildings}
              className="px-3 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
            >
              Thử lại
            </button>
          </div>
        ) : buildings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Building2 size={32} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Chưa có tòa nhà nào</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Show all rooms button */}
            <button
              onClick={() => { onSelectFloor(null); onSelectBuilding(null); }}
              className="w-full text-left rounded transition-colors"
              style={{
                padding: '10px 16px',
                fontSize: 'var(--type-body)',
                backgroundColor: selectedFloor === null && selectedBuilding === null ? 'var(--brand-surface)' : 'transparent',
                color: selectedFloor === null && selectedBuilding === null ? 'var(--brand-primary)' : 'var(--text-secondary)',
                fontWeight: selectedFloor === null && selectedBuilding === null ? 600 : 400,
              }}
            >
              Tất cả phòng
            </button>
            {buildings.map((building) => (
              <div key={building.id}>
                {/* Building */}
                <button
                  onClick={() => {
                    setExpandedBuilding(expandedBuilding === building.id ? null : building.id);
                    onSelectBuilding(selectedBuilding === building.id ? null : building.id);
                    onSelectFloor(null);
                  }}
                  className="w-full flex items-center justify-between rounded transition-colors hover:bg-[var(--brand-surface)]"
                  style={{
                    padding: '12px 16px',
                    fontSize: 'var(--type-body)',
                    color: selectedBuilding === building.id && selectedFloor === null ? 'var(--brand-primary)' : 'var(--text-primary)',
                    backgroundColor: selectedBuilding === building.id && selectedFloor === null ? 'var(--brand-surface)' : 'transparent',
                    fontWeight: selectedBuilding === building.id && selectedFloor === null ? 700 : 600,
                    gap: '8px'
                  }}
                >
                  <div className="flex items-center" style={{ gap: '8px' }}>
                    {expandedBuilding === building.id ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                    <span style={{ fontWeight: 600 }}>
                      {building.buildingName} ({building.floors.length}/{building.totalFloors} tầng)
                    </span>
                  </div>
                </button>
                
                {/* Floors */}
                {expandedBuilding === building.id && (
                  <div style={{ marginLeft: '24px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {building.floors.length === 0 ? (
                      <div className="text-sm text-gray-400 px-4 py-2">Chưa có tầng nào</div>
                    ) : (
                      building.floors.map((floor) => (
                        <button
                          key={floor.id}
                          onClick={() => { onSelectFloor(selectedFloor === floor.id ? null : floor.id); onSelectBuilding(null); }}
                          className="w-full text-left rounded transition-colors"
                          style={{
                            padding: '10px 16px',
                            fontSize: 'var(--type-body)',
                            backgroundColor: selectedFloor === floor.id ? 'var(--brand-surface)' : 'transparent',
                            color: selectedFloor === floor.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                            fontWeight: selectedFloor === floor.id ? 600 : 400
                          }}
                        >
                          Tầng {floor.floorNumber}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Building/Floor Modal */}
      {showAddModal && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg text-gray-800">Thêm Tòa nhà/Tầng mới</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Loại *</label>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setAddType('building')}
                    className={`flex-1 px-4 py-2 text-sm rounded border transition-colors ${
                      addType === 'building' 
                        ? 'bg-gray-800 text-white border-gray-800' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Tòa nhà
                  </button>
                  <button 
                    onClick={() => setAddType('floor')}
                    className={`flex-1 px-4 py-2 text-sm rounded border transition-colors ${
                      addType === 'floor' 
                        ? 'bg-gray-800 text-white border-gray-800' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Tầng
                  </button>
                </div>
              </div>

              {addType === 'building' ? (
                <>
                  {/* Building Name */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Tên tòa nhà *</label>
                    <input 
                      type="text"
                      placeholder="VD: Tòa D, Tòa E..."
                      value={buildingName}
                      onChange={e => setBuildingName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  {/* Number of Floors */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Số tầng *</label>
                    <input 
                      type="number"
                      placeholder="VD: 5"
                      min="1"
                      value={totalFloorsInput}
                      onChange={e => setTotalFloorsInput(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Địa chỉ</label>
                    <textarea
                      rows={2}
                      placeholder="Nhập địa chỉ chi tiết..."
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  {/* Vi tri tren ban do */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Vị trí trên bản đồ {latitude && longitude ? '(đã chọn)' : '(tuỳ chọn)'}
                    </label>
                    <LocationPicker
                      lat={latitude}
                      lng={longitude}
                      addressQuery={address}
                      onChange={(la, ln) => {
                        setLatitude(la);
                        setLongitude(ln);
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Select Building */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Chọn tòa nhà *</label>
                    <select
                      value={selectedBuildingId}
                      onChange={e => setSelectedBuildingId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
                      {loading ? (
                        <option>Đang tải...</option>
                      ) : buildings.length === 0 ? (
                        <option>Chưa có tòa nhà</option>
                      ) : (
                        buildings.map(building => (
                          <option key={building.id} value={building.id}>
                            {building.buildingName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Floor Code */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Mã tầng *</label>
                    <input 
                      type="text"
                      placeholder="VD: T1, T2, TH..."
                      value={floorCode}
                      onChange={e => setFloorCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  {/* Floor Number */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Số thứ tự tầng *</label>
                    <input 
                      type="number"
                      placeholder="VD: 1, 2, 3..."
                      min="1"
                      value={floorNumber}
                      onChange={e => setFloorNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>
                </>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Ghi chú</label>
                <textarea 
                  rows={2}
                  placeholder="Thông tin bổ sung..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{formError}</p>
              )}
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowAddModal(false)}
                disabled={formLoading}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleSubmit}
                disabled={formLoading}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {formLoading && <Loader2 size={14} className="animate-spin" />}
                <span>Xác nhận thêm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}