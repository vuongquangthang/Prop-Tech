import { Home, Search, Building2, DollarSign, Clock, MessageSquare, Grid3x3, CreditCard, CheckCircle, Shield, Bell, BarChart3, ArrowRight, Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import heroBackground from 'figma:asset/448c9a2ba148c0dc3b8aa82af3f2aee545fda8d0.png';

export function LandingPage() {
  const navigate = useNavigate();
  const [searchCity, setSearchCity] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc muốn reset toàn bộ dữ liệu demo về ban đầu?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Reset Button - Fixed Position */}
      <button
        onClick={handleResetData}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-[#FF5733] hover:bg-[#E64A2E] text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        title="Reset dữ liệu demo"
      >
        <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
      </button>

      {/* Header / Navigation */}
      <header className="bg-[#2C3E50] shadow-lg relative z-50">
        <nav className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-[#FF5733] rounded-xl flex items-center justify-center shadow-lg">
                <Home size={28} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold text-white">SmartHome Hub</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-10">
              <a href="#features" className="text-[15px] text-gray-300 hover:text-white transition-colors font-medium">Tính năng</a>
              <a href="#types" className="text-[15px] text-gray-300 hover:text-white transition-colors font-medium">Loại hình</a>
              <a href="#clients" className="text-[15px] text-gray-300 hover:text-white transition-colors font-medium">Khách hàng</a>
              <a href="#contact" className="text-[15px] text-gray-300 hover:text-white transition-colors font-medium">Liên hệ</a>
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-3 bg-[#1A4B84] text-white rounded-lg hover:bg-[#153A6B] transition-colors font-bold shadow-lg text-[15px]"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[700px] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBackground}
            alt="Modern Glass Building"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/97 via-white/90 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            {/* Left Content */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 mb-8">
                <span className="text-[15px] font-bold text-[#1A4B84] uppercase tracking-wide">
                  Giải pháp sống thông minh và bền vững
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-6xl font-bold text-[#2C3E50] mb-8 leading-[1.15]">
                Hệ thống quản lý<br />
                chung cư thông minh
              </h1>

              {/* Description */}
              <p className="text-[18px] text-gray-600 mb-12 leading-[1.75]">
                Giải pháp toàn diện giúp bạn quản lý chung cư hiệu quả với QR thanh toán, báo cáo sự cố tự động bằng AI, và tự động hóa từ tài chính đến bảo trì
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-16">
                <button 
                  onClick={() => navigate('/login')}
                  className="px-10 py-4 bg-[#1A4B84] text-white rounded-xl hover:bg-[#153A6B] transition-all font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-[15px]"
                >
                  Dùng thử miễn phí
                </button>
                <button className="px-10 py-4 bg-transparent text-[#2C3E50] rounded-xl hover:bg-gray-50 transition-all font-semibold border-2 border-gray-300 text-[15px] flex items-center gap-2">
                  <Play size={18} />
                  Xem demo
                </button>
              </div>

              {/* Search Bar - Moved to bottom with smaller size */}
              <div className="bg-white rounded-xl shadow-md p-3 border border-gray-200">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-[180px]">
                    <input
                      type="text"
                      placeholder="Tìm tòa nhà, khu chung cư..."
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-[#1A4B84] text-[14px]"
                    />
                  </div>
                  <div className="min-w-[130px]">
                    <select
                      value={searchDistrict}
                      onChange={(e) => setSearchDistrict(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-[#1A4B84] text-[14px]"
                    >
                      <option value="">Khu vực</option>
                      <option value="hanoi">Hà Nội</option>
                      <option value="hcm">TP. HCM</option>
                      <option value="danang">Đà Nẵng</option>
                    </select>
                  </div>
                  <button className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    <Search size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right - Feature Cards */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
                <div className="mb-8">
                  <h3 className="text-[22px] font-bold text-[#2C3E50]">Tính năng nổi bật</h3>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {/* Feature 1 */}
                  <div className="bg-[#2C3E50] rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                    <div className="w-14 h-14 bg-[#FF5733] rounded-xl flex items-center justify-center mb-5">
                      <Grid3x3 size={26} className="text-white" strokeWidth={2.5} />
                    </div>
                    <h4 className="text-white font-bold mb-3 text-[14px] tracking-wide">QUẢN LÝ TẬP TRUNG</h4>
                    <p className="text-gray-400 text-[13px] leading-relaxed font-normal">
                      Tất cả chức năng quản lý tài chính, cư dân, tài sản trên một nền tảng
                    </p>
                  </div>

                  {/* Feature 2 */}
                  <div className="bg-[#2C3E50] rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                    <div className="w-14 h-14 bg-[#D32F2F] rounded-xl flex items-center justify-center mb-5">
                      <CreditCard size={26} className="text-white" strokeWidth={2.5} />
                    </div>
                    <h4 className="text-white font-bold mb-3 text-[14px] tracking-wide">THANH TOÁN TỰ ĐỘNG</h4>
                    <p className="text-gray-400 text-[13px] leading-relaxed font-normal">
                      Thanh toán qua QR code, tích hợp cổng thanh toán trực tuyến
                    </p>
                  </div>

                  {/* Feature 3 */}
                  <div className="bg-[#2C3E50] rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                    <div className="w-14 h-14 bg-[#FF5733] rounded-xl flex items-center justify-center mb-5">
                      <Clock size={26} className="text-white" strokeWidth={2.5} />
                    </div>
                    <h4 className="text-white font-bold mb-3 text-[14px] tracking-wide">BÁO CÁO SỰ CỐ 24/7</h4>
                    <p className="text-gray-400 text-[13px] leading-relaxed font-normal">
                      Gửi phản ánh sự cố mọi lúc, theo dõi tiến độ xử lý real-time
                    </p>
                  </div>

                  {/* Feature 4 */}
                  <div className="bg-[#2C3E50] rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                    <div className="w-14 h-14 bg-[#FF5733] rounded-xl flex items-center justify-center mb-5">
                      <MessageSquare size={26} className="text-white" strokeWidth={2.5} />
                    </div>
                    <h4 className="text-white font-bold mb-3 text-[14px] tracking-wide">AI CHATBOT</h4>
                    <p className="text-gray-400 text-[13px] leading-relaxed font-normal">
                      Trợ lý ảo thông minh hỗ trợ 24/7, giải đáp thắc mắc nhanh chóng
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#1A4B84] rounded-full opacity-10 blur-3xl"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#FF5733] rounded-full opacity-10 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlight Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
            <div className="bg-[#2C3E50] rounded-3xl p-12 text-white">
              <Building2 size={48} className="mb-6 text-[#FF5733]" />
              <h3 className="text-3xl font-bold mb-4">Web dành cho Quản lý</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Quản lý toàn diện mọi hoạt động của chung cư từ thu chi tài chính, cư dân, tài sản đến sự cố bảo trì trên một nền tảng duy nhất
              </p>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle size={20} className="text-[#FF5733]" />
                  <span>8 phân hệ quản lý chuyên nghiệp</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle size={20} className="text-[#FF5733]" />
                  <span>21 màn hình tối ưu cho desktop</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle size={20} className="text-[#FF5733]" />
                  <span>Dashboard với biểu đồ thống kê real-time</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#2C3E50] rounded-3xl p-12 text-white">
              <Home size={48} className="mb-6 text-[#FF5733]" />
              <h3 className="text-3xl font-bold mb-4">App dành cho Cư dân</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Ứng dụng di động tiện lợi giúp cư dân tra cứu hóa đơn, thanh toán trực tuyến, báo cáo sự cố và nhận thông báo nhanh chóng
              </p>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle size={20} className="text-[#FF5733]" />
                  <span>Giao diện mobile thân thiện 360x700px</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle size={20} className="text-[#FF5733]" />
                  <span>Thanh toán QR, lịch sử giao dịch</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle size={20} className="text-[#FF5733]" />
                  <span>Báo cáo sự cố có ảnh, theo dõi tiến độ</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Property Types Section */}
      <section id="types" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1A4B84] mb-4">Khám phá các loại hình</h2>
            <p className="text-xl text-gray-600">Giải pháp linh hoạt cho mọi loại hình bất động sản</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Nhà trọ */}
            <div className="group bg-[#2C3E50] rounded-3xl p-8 text-white hover:bg-[#1A4B84] transition-all cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl">
              <div className="w-16 h-16 bg-[#FF5733] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Home size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Nhà trọ</h3>
              <p className="text-gray-300 leading-relaxed">
                Quản lý nhà trọ đơn giản, hiệu quả với tính năng thu tiền phòng, điện nước tự động
              </p>
            </div>

            {/* Chung cư */}
            <div className="group bg-[#2C3E50] rounded-3xl p-8 text-white hover:bg-[#1A4B84] transition-all cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl">
              <div className="w-16 h-16 bg-[#FF5733] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Chung cư</h3>
              <p className="text-gray-300 leading-relaxed">
                Giải pháp toàn diện cho chung cư với quản lý cư dân, tài chính, tiện ích và bảo trì
              </p>
            </div>

            {/* Cao ốc */}
            <div className="group bg-[#2C3E50] rounded-3xl p-8 text-white hover:bg-[#1A4B84] transition-all cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl">
              <div className="w-16 h-16 bg-[#FF5733] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Cao ốc văn phòng</h3>
              <p className="text-gray-300 leading-relaxed">
                Quản lý cao ốc văn phòng chuyên nghiệp với hệ thống phân quyền và báo cáo chi tiết
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Benefits */}
      <section className="py-20 bg-gradient-to-br from-[#1A4B84] to-[#2C5282]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1663756915301-2ba688e078cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzcxNjkxMzkxfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Modern Interior"
                className="rounded-3xl shadow-2xl"
              />
            </div>
            <div className="text-white order-1 md:order-2">
              <h2 className="text-4xl font-bold mb-6">Quản lý tập trung<br />trên một nền tảng</h2>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                Tất cả thông tin và nghiệp vụ được tập trung trên một hệ thống duy nhất, giúp bạn tiết kiệm thời gian và nâng cao hiệu quả quản lý
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#FF5733] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Bảo mật tuyệt đối</h4>
                    <p className="text-gray-300">Dữ liệu được mã hóa và lưu trữ an toàn</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#FF5733] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bell size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Thông báo thông minh</h4>
                    <p className="text-gray-300">Cập nhật real-time cho cả admin và cư dân</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#FF5733] rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Báo cáo chi tiết</h4>
                    <p className="text-gray-300">Dashboard với biểu đồ trực quan, dễ hiểu</p>
                  </div>
                </div>
              </div>
              <button className="mt-8 px-8 py-4 bg-[#FF5733] text-white rounded-lg hover:bg-[#E64A2E] transition-all font-semibold flex items-center space-x-2">
                <span>Tìm hiểu thêm</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Resident Experience */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-[#1A4B84] mb-6">Trải nghiệm tuyệt vời<br />cho cư dân</h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Ứng dụng di động hiện đại giúp cư dân dễ dàng tương tác với ban quản lý, tra cứu thông tin và thanh toán mọi lúc mọi nơi
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle size={24} className="text-[#FF5733]" />
                  <span className="text-lg">Tra cứu hóa đơn và thanh toán trực tuyến</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle size={24} className="text-[#FF5733]" />
                  <span className="text-lg">Báo cáo sự cố có ảnh, theo dõi tiến độ xử lý</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle size={24} className="text-[#FF5733]" />
                  <span className="text-lg">Nhận thông báo quan trọng ngay lập tức</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle size={24} className="text-[#FF5733]" />
                  <span className="text-lg">Chat AI hỗ trợ 24/7 giải đáp thắc mắc</span>
                </div>
              </div>
              <button className="mt-8 px-8 py-4 bg-[#1A4B84] text-white rounded-lg hover:bg-[#153A6B] transition-all font-semibold">
                Trải nghiệm ngay
              </button>
            </div>
            <div>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758448511533-e1502259fff6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb25kb21pbml1bSUyMGxvYmJ5fGVufDF8fHx8MTc3MTc2ODY5NHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Luxury Lobby"
                className="rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Clients */}
      <section id="clients" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1A4B84] mb-4">Khách hàng nổi bật</h2>
            <p className="text-xl text-gray-600">Được tin dùng bởi hàng trăm chung cư trên toàn quốc</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1599412965471-e5f860059f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnQlMjBidWlsZGluZyUyMGV4dGVyaW9yfGVufDF8fHx8MTc3MTc2NzE3NHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Vinhomes Sky Lake"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                <h4 className="text-white font-bold text-lg">Vinhomes Sky Lake</h4>
                <p className="text-gray-300 text-sm">Hà Nội - 1,200 căn hộ</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1640689441050-4d86b173d7df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWdoJTIwcmlzZSUyMGJ1aWxkaW5nJTIwbmlnaHR8ZW58MXx8fHwxNzcxNzQ2MzI5fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Masteri Thảo Điền"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                <h4 className="text-white font-bold text-lg">Masteri Thảo Điền</h4>
                <p className="text-gray-300 text-sm">TP.HCM - 850 căn hộ</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1717245233317-4a2e7c4a71e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXNpZGVudGlhbCUyMGJ1aWxkaW5nJTIwZmFjYWRlfGVufDF8fHx8MTc3MTY1Mzc0Mnww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Sunshine City"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                <h4 className="text-white font-bold text-lg">Sunshine City</h4>
                <p className="text-gray-300 text-sm">Hà Nội - 2,000 căn hộ</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758448511533-e1502259fff6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb25kb21pbml1bSUyMGxvYmJ5fGVufDF8fHx8MTc3MTc2ODY5NHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="The Manor Central Park"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                <h4 className="text-white font-bold text-lg">The Manor Central Park</h4>
                <p className="text-gray-300 text-sm">TP.HCM - 680 căn hộ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A4B84] to-[#FF5733]">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-5xl font-bold mb-6">Sẵn sàng bắt đầu?</h2>
          <p className="text-2xl mb-10 text-gray-100">
            Đăng ký ngay hôm nay để trải nghiệm 30 ngày miễn phí
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <button 
              onClick={() => navigate('/login')}
              className="px-10 py-5 bg-white text-[#1A4B84] rounded-xl hover:bg-gray-100 transition-all text-lg font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Dùng thử miễn phí
            </button>
            <button className="px-10 py-5 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white/10 transition-all text-lg font-bold">
              Liên hệ tư vấn
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#2C3E50] text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-[#FF5733] rounded-lg flex items-center justify-center">
                  <Home size={24} className="text-white" />
                </div>
                <span className="text-xl font-bold">SmartHome Hub</span>
              </div>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Giải pháp quản lý chung cư thông minh hàng đầu Việt Nam. Chúng tôi cam kết mang đến trải nghiệm quản lý tốt nhất cho ban quản lý và cư dân.
              </p>
              <div className="space-y-2">
                <p className="text-gray-400">📞 Hotline: 1900 xxxx</p>
                <p className="text-gray-400">📧 Email: contact@smarthomehub.vn</p>
                <p className="text-gray-400">📍 Địa chỉ: Số 2 Ngõ 69, Lò Đúc, Hà Nội</p>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-lg mb-4">Công ty</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Giới thiệu</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tính năng</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Bảng giá</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Liên hệ</a></li>
              </ul>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-lg mb-4">Liên kết</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Hướng dẫn sử dụng</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <p className="text-center text-gray-400">
              © 2026 SmartHome Hub. All rights reserved. Phát triển bởi Figma Make.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}