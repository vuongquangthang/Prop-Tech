import { Plus, ChevronRight, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

const buildingsData = [
  {
    name: 'Tòa A',
    floors: ['Tầng 1', 'Tầng 2', 'Tầng 3', 'Tầng 4', 'Tầng 5'],
  },
  {
    name: 'Tòa B',
    floors: ['Tầng 1', 'Tầng 2', 'Tầng 3', 'Tầng 4'],
  },
  {
    name: 'Tòa C',
    floors: ['Tầng 1', 'Tầng 2', 'Tầng 3'],
  },
];

export function BuildingSidebar() {
  const [expandedBuilding, setExpandedBuilding] = useState<string>('Tòa A');
  const [selectedFloor, setSelectedFloor] = useState<string>('Tầng 1');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'building' | 'floor'>('building');

  const handleAddClick = () => {
    setShowAddModal(true);
    setAddType('building');
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {buildingsData.map((building, index) => (
            <div key={index}>
              {/* Building */}
              <button
                onClick={() => setExpandedBuilding(expandedBuilding === building.name ? '' : building.name)}
                className="w-full flex items-center justify-between rounded transition-colors hover:bg-[var(--brand-surface)]"
                style={{
                  padding: '12px 16px',
                  fontSize: 'var(--type-body)',
                  color: 'var(--text-primary)',
                  gap: '8px'
                }}
              >
                <div className="flex items-center" style={{ gap: '8px' }}>
                  {expandedBuilding === building.name ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                  <span style={{ fontWeight: 600 }}>{building.name}</span>
                </div>
              </button>
              
              {/* Floors */}
              {expandedBuilding === building.name && (
                <div style={{ marginLeft: '24px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {building.floors.map((floor, floorIndex) => (
                    <button
                      key={floorIndex}
                      onClick={() => setSelectedFloor(floor)}
                      className="w-full text-left rounded transition-colors"
                      style={{
                        padding: '10px 16px',
                        fontSize: 'var(--type-body)',
                        backgroundColor: selectedFloor === floor ? 'var(--brand-surface)' : 'transparent',
                        color: selectedFloor === floor ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        fontWeight: selectedFloor === floor ? 600 : 400
                      }}
                    >
                      {floor}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Building/Floor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Địa chỉ</label>
                    <textarea 
                      rows={2}
                      placeholder="Nhập địa chỉ chi tiết..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Select Building */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Chọn tòa nhà *</label>
                    <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
                      <option>Tòa A</option>
                      <option>Tòa B</option>
                      <option>Tòa C</option>
                    </select>
                  </div>

                  {/* Floor Name */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Tên tầng *</label>
                    <input 
                      type="text"
                      placeholder="VD: Tầng 6, Tầng Hầm..."
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
    </div>
  );
}