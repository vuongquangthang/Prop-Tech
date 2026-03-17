export function WireframeOverviewPage() {
  const wireframes = [
    { title: '1. Dashboard - Bảng điều khiển', path: '/' },
    { title: '2. Quản lý Hạ tầng - Cơ cấu Tòa nhà & Phòng', path: '/building-management' },
    { title: '3. Quản lý Hạ tầng - Danh mục Dịch vụ & Đơn giá', path: '/service-pricing' },
    { title: '4. Quản lý Hạ tầng - Quản lý Kho tài sản', path: '/asset-inventory' },
    { title: '5. Cư dân & Hợp đồng - Danh sách Cư dân', path: '/resident-management' },
    { title: '6. Cư dân & Hợp đồng - Quản lý Hợp đồng', path: '/contract-management' },
    { title: '7. Cư dân & Hợp đồng - Tất toán & Thanh lý', path: '/settlement' },
    { title: '8. Hóa đơn & Tài chính - Chốt chỉ số Điện/Nước', path: '/utility-reading' },
    { title: '9. Hóa đơn & Tài chính - Quản lý Hóa đơn', path: '/invoice-management' },
    { title: '10. Hóa đơn & Tài chính - Lịch sử Giao dịch', path: '/transaction-history' },
    { title: '11. Hóa đơn & Tài chính - Công nợ & Nhắc nợ', path: '/debt-management' },
    { title: '12. Vận hành & Sự cố - Quản lý Yêu cầu sửa chữa', path: '/maintenance-request' },
    { title: '13. Vận hành & Sự cố - Lịch sử Bảo trì & Đánh giá', path: '/maintenance-history' },
    { title: '14. Trợ lý ảo AI - Quản lý Kho tri thức', path: '/knowledge-base' },
    { title: '15. Trợ lý ảo AI - Lịch sử hội thoại', path: '/chat-history' },
    { title: '16. Báo cáo & Thống kê - Báo cáo Doanh thu', path: '/revenue-report' },
    { title: '17. Báo cáo & Thống kê - Báo cáo Lấp đầy', path: '/occupancy-report' },
    { title: '18. Quản lý Tài khoản - Danh sách Tài khoản', path: '/user-accounts' },
    { title: '19. Quản lý Tài khoản - Hồ sơ cá nhân', path: '/my-profile' },
    { title: '20. Quản lý Tài khoản - Nhật ký hoạt động', path: '/audit-logs' },
  ];

  return (
    <div className="bg-gray-100 p-8" style={{ minHeight: '100vh' }}>
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="bg-white border-2 border-gray-800 rounded-lg p-6 mb-8 sticky top-8 z-50 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🖼️ WIREFRAME OVERVIEW - HỆ THỐNG QUẢN LÝ CHUNG CƯ
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Tổng hợp <strong>20 màn hình wireframe</strong> từ 8 phân hệ. 
            Desktop 1440x1024px. Đen-Trắng-Xám.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-300 rounded p-3">
              <p className="text-xs text-gray-600">Tổng số màn hình</p>
              <p className="text-2xl font-bold text-gray-900">20</p>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded p-3">
              <p className="text-xs text-gray-600">Tổng số phân hệ</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded p-3">
              <p className="text-xs text-gray-600">Kích thước</p>
              <p className="text-xl font-bold text-gray-900">1440×1024</p>
            </div>
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-300 rounded p-3">
            <p className="text-xs text-blue-800">
              💡 <strong>Hướng dẫn:</strong> Scroll xuống để xem tất cả wireframe. 
              Click vào từng màn hình để xem chi tiết và tương tác. 
              Sử dụng browser zoom để xem toàn cảnh hoặc chi tiết.
            </p>
          </div>
        </div>

        {/* Wireframe Grid */}
        <div className="space-y-8">
          {wireframes.map((wireframe, index) => (
            <div key={index} className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden shadow-md">
              <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">{wireframe.title}</h2>
                <a 
                  href={wireframe.path}
                  className="px-4 py-2 bg-white text-gray-800 text-sm rounded hover:bg-gray-100"
                >
                  Mở màn hình →
                </a>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="border-2 border-gray-400 rounded overflow-hidden">
                  <iframe 
                    src={wireframe.path}
                    style={{ 
                      width: '1440px', 
                      height: '1024px',
                      transform: 'scale(0.7)',
                      transformOrigin: 'top left',
                      border: 'none'
                    }}
                    title={wireframe.title}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Wireframe #{index + 1} • 1440×1024px • {wireframe.path}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-white border-2 border-gray-800 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Danh sách 8 phân hệ:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 border border-gray-300 rounded p-3">
              <p className="font-bold text-gray-900 mb-2">1️⃣ Bảng điều khiển (1 màn hình)</p>
              <p className="text-xs text-gray-600">Dashboard tổng quan</p>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded p-3">
              <p className="font-bold text-gray-900 mb-2">2️⃣ Quản lý Hạ tầng (4 màn hình)</p>
              <p className="text-xs text-gray-600">Cơ cấu tòa nhà • Dịch vụ • Đơn giá • Kho tài sản</p>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded p-3">
              <p className="font-bold text-gray-900 mb-2">3️⃣ Cư dân & Hợp đồng (3 màn hình)</p>
              <p className="text-xs text-gray-600">Danh sách • Hợp đồng • Tất toán</p>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded p-3">
              <p className="font-bold text-gray-900 mb-2">4️⃣ Hóa đơn & Tài chính (5 màn hình)</p>
              <p className="text-xs text-gray-600">Chốt chỉ số • Hóa đơn • Giao dịch • Công nợ • Thanh toán</p>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded p-3">
              <p className="font-bold text-gray-900 mb-2">5️⃣ Vận hành & Sự cố (2 màn hình)</p>
              <p className="text-xs text-gray-600">Yêu cầu sửa chữa • Lịch bảo trì</p>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded p-3">
              <p className="font-bold text-gray-900 mb-2">6️⃣ Trợ lý ảo AI (2 màn hình)</p>
              <p className="text-xs text-gray-600">Kho tri thức • Lịch sử hội thoại</p>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded p-3">
              <p className="font-bold text-gray-900 mb-2">7️⃣ Báo cáo & Thống kê (3 màn hình)</p>
              <p className="text-xs text-gray-600">Doanh thu • Lấp đầy • Công nợ</p>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded p-3">
              <p className="font-bold text-gray-900 mb-2">8️⃣ Quản lý Tài khoản (3 màn hình)</p>
              <p className="text-xs text-gray-600">Tài khoản • Hồ sơ • Nhật ký</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}