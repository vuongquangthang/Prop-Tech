import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Home,
  LayoutDashboard,
  LockKeyhole,
  MessageSquareText,
  Play,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UsersRound,
  Wrench,
  Zap,
} from 'lucide-react';
import { ComponentType, useState } from 'react';
import { useNavigate } from 'react-router';
import heroBackground from 'figma:asset/448c9a2ba148c0dc3b8aa82af3f2aee545fda8d0.png';

const PRIMARY = '#1e4e8c';

const navItems = [
  { label: 'Tính năng', href: '#features' },
  { label: 'Quy trình', href: '#preview' },
  { label: 'Lợi ích', href: '#benefits' },
  { label: 'Liên hệ', href: '#contact' },
];

const stats = [
  { value: '99.9%', label: 'Uptime hệ thống' },
  { value: '10k+', label: 'Yêu cầu cư dân được xử lý' },
  { value: '65%', label: 'Giảm thời gian vận hành thủ công' },
  { value: '24/7', label: 'Thông báo và hỗ trợ liên tục' },
];

const features: Array<{
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  accent: string;
}> = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard vận hành tập trung',
    description: 'Theo dõi cư dân, hợp đồng, hóa đơn, công nợ và sự cố trên một màn hình trực quan.',
    accent: 'from-blue-50 to-white',
  },
  {
    icon: CreditCard,
    title: 'Thu phí và đối soát nhanh',
    description: 'Tạo hóa đơn, thanh toán QR, ghi nhận giao dịch và kiểm soát công nợ minh bạch.',
    accent: 'from-cyan-50 to-white',
  },
  {
    icon: Wrench,
    title: 'Bảo trì không thất lạc việc',
    description: 'Tiếp nhận phản ánh, phân công xử lý, cập nhật tiến độ và lưu lịch sử bảo trì rõ ràng.',
    accent: 'from-indigo-50 to-white',
  },
  {
    icon: MessageSquareText,
    title: 'Kết nối cư dân tức thời',
    description: 'Thông báo, tin nhắn và chatbot giúp ban quản lý phản hồi nhanh hơn, ít gián đoạn hơn.',
    accent: 'from-slate-50 to-white',
  },
];

const previewTabs = [
  {
    key: 'finance',
    title: 'Tài chính',
    icon: CreditCard,
    headline: 'Tự động hóa hóa đơn và công nợ',
    items: ['Tạo hóa đơn định kỳ', 'Quét QR thanh toán', 'Đối soát giao dịch', 'Nhắc nợ đúng hạn'],
  },
  {
    key: 'resident',
    title: 'Cư dân',
    icon: UsersRound,
    headline: 'Quản lý cư dân và hợp đồng rõ ràng',
    items: ['Hồ sơ cư dân', 'Hợp đồng thuê', 'Tất toán thanh lý', 'Lịch sử thay đổi'],
  },
  {
    key: 'maintenance',
    title: 'Sự cố',
    icon: Wrench,
    headline: 'Xử lý phản ánh có quy trình',
    items: ['Tiếp nhận ảnh sự cố', 'Phân công nhân sự', 'Theo dõi trạng thái', 'Báo cáo SLA'],
  },
];

const benefits = [
  { icon: ShieldCheck, title: 'Bảo mật dữ liệu', description: 'Phân quyền theo vai trò, JWT và kiểm soát truy cập theo nghiệp vụ.' },
  { icon: Bell, title: 'Realtime notification', description: 'Cập nhật giao dịch, hóa đơn, sự cố và thông báo cư dân ngay khi phát sinh.' },
  { icon: Smartphone, title: 'Web + Mobile đồng bộ', description: 'Ban quản lý dùng web, cư dân dùng app, dữ liệu thống nhất trên cùng backend.' },
];

function scrollToSection(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function LandingPage() {
  const navigate = useNavigate();
  const [activePreview, setActivePreview] = useState(previewTabs[0]);

  const goLogin = () => navigate('/login');

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900" style={{ fontFamily: 'Roboto, ui-sans-serif, system-ui, sans-serif' }}>
      <style>{`
        @media (min-width: 980px) {
          .landing-hero-grid {
            grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          }
        }
        .landing-hero-copy,
        .landing-hero-copy p {
          color: rgba(255, 255, 255, 0.92);
        }
        .landing-dashboard,
        .landing-dashboard p,
        .landing-dashboard h3,
        .landing-dashboard span {
          color: #fff;
        }
      `}</style>
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button onClick={() => scrollToSection('#hero')} className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg shadow-blue-900/20" style={{ backgroundColor: PRIMARY }}>
              <Building2 size={24} className="text-white" />
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-950">PropTech Suite</span>
          </button>

          <div className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-[#1e4e8c]">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={goLogin} className="hidden rounded-full px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex">
              Đăng nhập
            </button>
            <button onClick={goLogin} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5" style={{ backgroundColor: PRIMARY }}>
              Bắt đầu ngay
              <ArrowRight size={16} />
            </button>
          </div>
        </nav>
      </header>

      <main>
        <section
          id="hero"
          className="relative isolate overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(2, 6, 23, 0.96) 0%, rgba(15, 23, 42, 0.90) 42%, rgba(30, 78, 140, 0.58) 100%), url(${heroBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >

          <div className="landing-hero-grid relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="landing-hero-copy rounded-3xl border border-white/15 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-md sm:p-8" style={{ backgroundColor: 'rgba(2, 6, 23, 0.72)' }}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
                <Sparkles size={16} />
                Nền tảng quản lý tòa nhà hiện đại cho đội vận hành tinh gọn
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Quản lý tòa nhà bớt thủ công, minh bạch hơn, nhanh hơn.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8" style={{ color: 'rgba(255,255,255,0.86)' }}>
                PropTech Suite gom cư dân, hợp đồng, hóa đơn, công nợ, sự cố và thông báo vào một hệ thống duy nhất — giúp ban quản lý kiểm soát vận hành theo thời gian thực.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button onClick={goLogin} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-base font-bold shadow-xl shadow-blue-950/20 transition hover:-translate-y-1 hover:bg-blue-50" style={{ color: PRIMARY }}>
                  Trải nghiệm miễn phí
                  <ArrowRight size={18} />
                </button>
                <button onClick={() => scrollToSection('#preview')} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 px-7 py-4 text-base font-bold text-white shadow-sm backdrop-blur transition hover:-translate-y-1" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}>
                  <Play size={18} />
                  Xem Demo
                </button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-cyan-200" />Không cần thẻ tín dụng</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-cyan-200" />Thiết lập nhanh</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-cyan-200" />Dùng được trên web và app</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 top-12 hidden h-44 w-28 rotate-[-10deg] rounded-[2rem] border border-white/20 bg-white/15 p-2 shadow-2xl backdrop-blur md:block">
                <div className="h-full rounded-[1.5rem] bg-slate-950 p-3">
                  <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/30" />
                  <div className="space-y-3">
                    <div className="rounded-xl bg-[#1e4e8c] p-3 text-xs font-bold text-white">Hóa đơn mới</div>
                    <div className="rounded-xl bg-white/10 p-3 text-xs text-slate-200">Sự cố đã nhận</div>
                    <div className="rounded-xl bg-white/10 p-3 text-xs text-slate-200">Thông báo BQL</div>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 rounded-3xl bg-cyan-200/30 blur-2xl" />
              <div className="relative rounded-3xl border border-white/35 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur-xl" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
                <div className="landing-dashboard rounded-[1.5rem] border border-white/10 p-4" style={{ backgroundColor: 'rgba(2,6,23,0.95)', color: '#fff' }}>
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Dashboard hôm nay</p>
                      <h3 className="text-lg font-bold">Tòa A - Tổng quan vận hành</h3>
                    </div>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">Realtime</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['98%', 'Tỷ lệ thu phí'],
                      ['37', 'Yêu cầu mới'],
                      ['12', 'Hợp đồng sắp hết hạn'],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <p className="text-2xl font-black">{value}</p>
                        <p className="mt-1 text-xs text-slate-300">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="font-semibold">Dòng tiền tháng</p>
                        <BarChart3 size={18} className="text-blue-200" />
                      </div>
                      <div className="flex h-36 items-end gap-2">
                        {[35, 64, 52, 78, 61, 88, 72, 94].map((height, index) => (
                          <div key={index} className="flex-1 rounded-t-lg bg-gradient-to-t from-[#1e4e8c] to-cyan-300" style={{ height: `${height}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {['Hóa đơn tháng 6 đã gửi', 'Bảo trì thang máy Tòa B', 'Cư dân phản hồi sự cố nước'].map((text) => (
                        <div key={text} className="rounded-2xl border border-white/10 bg-white/10 p-3">
                          <p className="text-sm font-medium">{text}</p>
                          <p className="mt-1 text-xs text-slate-400">Vừa cập nhật</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-8 -right-5 hidden rounded-3xl border border-white/30 bg-white/90 p-4 shadow-2xl shadow-blue-950/20 md:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-950">Đối soát xong</p>
                    <p className="text-xs text-slate-500">128 giao dịch hôm nay</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl bg-slate-50 p-6 text-center">
                <p className="text-3xl font-black text-[#1e4e8c]">{stat.value}</p>
                <p className="mt-2 text-sm font-medium text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#eef5ff] py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {[
              {
                icon: ClipboardList,
                title: 'Hồ sơ cư dân',
                description: 'Thông tin cư dân, hợp đồng và lịch sử cư trú được gom trong một hồ sơ.',
                image: 'linear-gradient(135deg,#1e4e8c,#38bdf8)',
              },
              {
                icon: CreditCard,
                title: 'Thanh toán QR',
                description: 'Hóa đơn, công nợ và giao dịch hiển thị rõ theo từng phòng.',
                image: 'linear-gradient(135deg,#0f172a,#1e4e8c)',
              },
              {
                icon: Wrench,
                title: 'Xử lý sự cố',
                description: 'Ảnh hiện trường, trạng thái xử lý và người phụ trách được theo dõi trực quan.',
                image: 'linear-gradient(135deg,#164e63,#22c55e)',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-xl shadow-blue-950/5">
                  <div className="relative h-48 p-5" style={{ background: item.image }}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.35),transparent_28%)]" />
                    <div className="relative rounded-2xl border border-white/20 bg-white/15 p-4 text-white backdrop-blur">
                      <div className="mb-8 flex items-center justify-between">
                        <Icon size={28} />
                        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">Preview</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-2/3 rounded-full bg-white/80" />
                        <div className="h-3 w-1/2 rounded-full bg-white/45" />
                        <div className="grid grid-cols-3 gap-2 pt-3">
                          <div className="h-12 rounded-xl bg-white/20" />
                          <div className="h-12 rounded-xl bg-white/20" />
                          <div className="h-12 rounded-xl bg-white/20" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
                    <p className="mt-2 leading-7 text-slate-600">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1e4e8c]">Core Features</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Một nền tảng cho toàn bộ vòng đời vận hành</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Tập trung dữ liệu, chuẩn hóa quy trình và giảm phụ thuộc vào Excel, Zalo, giấy tờ rời rạc.</p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className={`group rounded-[2rem] border border-slate-200 bg-gradient-to-br ${feature.accent} p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl`}>
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1e4e8c] text-white shadow-lg shadow-blue-900/20 transition group-hover:scale-105">
                    <Icon size={26} />
                  </div>
                  <h3 className="text-xl font-black text-slate-950">{feature.title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="preview" className="bg-slate-950 py-20 text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Interactive Preview</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Click qua từng nghiệp vụ để thấy luồng quản lý rõ hơn.</h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">Mỗi phân hệ được thiết kế để giảm thao tác lặp, tăng khả năng kiểm soát và tạo trải nghiệm tốt hơn cho cư dân.</p>

              <div className="mt-8 space-y-3">
                {previewTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activePreview.key === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActivePreview(tab)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                        active ? 'border-cyan-300 bg-white text-slate-950' : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-3 font-bold">
                        <Icon size={20} className={active ? 'text-[#1e4e8c]' : 'text-cyan-200'} />
                        {tab.title}
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-[1.5rem] bg-white p-6 text-slate-950">
                <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-5">
                  <div>
                    <p className="text-sm font-semibold text-[#1e4e8c]">{activePreview.title}</p>
                    <h3 className="mt-1 text-2xl font-black">{activePreview.headline}</h3>
                  </div>
                  <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-[#1e4e8c]">Live flow</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {activePreview.items.map((item, index) => (
                    <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e4e8c] text-sm font-black text-white">
                        {index + 1}
                      </div>
                      <p className="font-bold text-slate-900">{item}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Trạng thái được đồng bộ và lưu lịch sử phục vụ kiểm tra sau này.</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="benefits" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1e4e8c]">Why PropTech</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Xây nền vận hành đáng tin cậy trước khi mở rộng quy mô.</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">Hệ thống được thiết kế cho mô hình nhiều vai trò: admin, kế toán, nhân sự vận hành, chủ bài đăng và cư dân.</p>
            </div>
            <div className="grid gap-5">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-blue-50 text-[#1e4e8c]">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-950">{benefit.title}</h3>
                      <p className="mt-2 leading-7 text-slate-600">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#1e4e8c] p-8 text-white shadow-2xl shadow-blue-950/20 sm:p-12 lg:p-16">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                  <Zap size={16} />
                  Thiết lập trong 2 phút
                </p>
                <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Sẵn sàng thay thế bảng tính rời rạc bằng một hệ thống vận hành rõ ràng?</h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-blue-100">Bắt đầu miễn phí, không cần thẻ tín dụng. Đội quản lý có thể thử ngay với dữ liệu mẫu.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button onClick={goLogin} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-[#1e4e8c] transition hover:-translate-y-1 hover:bg-blue-50">
                  Bắt đầu ngay
                  <ArrowRight size={18} />
                </button>
                <button onClick={() => scrollToSection('#features')} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 px-7 py-4 font-bold text-white transition hover:bg-white/10">
                  Xem tính năng
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1e4e8c] text-white">
                <Home size={22} />
              </span>
              <span className="text-lg font-black text-slate-950">PropTech Suite</span>
            </div>
            <p className="mt-4 max-w-md leading-7 text-slate-600">Giải pháp quản lý tòa nhà cho ban quản lý muốn vận hành minh bạch, nhanh và ít thủ công hơn.</p>
          </div>
          <div>
            <h4 className="font-black text-slate-950">Sản phẩm</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><a href="#features" className="hover:text-[#1e4e8c]">Tính năng</a></li>
              <li><a href="#preview" className="hover:text-[#1e4e8c]">Demo</a></li>
              <li><button onClick={goLogin} className="hover:text-[#1e4e8c]">Đăng nhập</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-slate-950">Liên hệ</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>contact@proptech.vn</li>
              <li>1900 0000</li>
              <li>Hà Nội, Việt Nam</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 py-5 text-center text-sm text-slate-500">
          © 2026 PropTech Suite. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
