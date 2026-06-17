import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  LineChart,
  MessageSquareText,
  Play,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  UsersRound,
  WalletCards,
  Wrench,
  Zap,
} from 'lucide-react';
import { ComponentType } from 'react';
import { useNavigate } from 'react-router';

type IconType = ComponentType<{ size?: number; className?: string }>;

const navItems = [
  { label: 'Vấn đề', href: '#problems' },
  { label: 'Nền tảng', href: '#platform' },
  { label: 'Tính năng', href: '#features' },
  { label: 'Bảng giá', href: '#pricing' },
];

const logos = ['Sunrise Residence', 'Metrohome', 'An Phú Tower', 'GreenView', 'Urban Nest'];

const problems = [
  [ClipboardList, 'Quản lý thủ công rời rạc', 'Excel, Zalo, giấy tờ và nhiều file riêng khiến dữ liệu dễ lệch, khó bàn giao và khó kiểm soát.'],
  [MessageSquareText, 'Khiếu nại cư dân bị trôi', 'Phản ánh qua nhiều kênh không có SLA, không có trạng thái xử lý và thiếu lịch sử đối soát.'],
  [CreditCard, 'Thu phí thiếu minh bạch', 'Hóa đơn, chuyển khoản, công nợ và nhắc nợ mất nhiều thời gian nếu không có luồng tự động.'],
  [Wrench, 'Bảo trì không có quy trình', 'Thiếu phân công, thiếu ảnh nghiệm thu, không đo được thời gian xử lý và chất lượng vận hành.'],
] as const;

const managerFeatures = [
  [UsersRound, 'Quản lý cư dân', 'Hồ sơ cư dân, CCCD, phương tiện, lịch sử cư trú và tài khoản app.'],
  [Building2, 'Tòa nhà & phòng', 'Theo dõi tòa, tầng, phòng, trạng thái thuê, ảnh phòng, tiện nghi và tài sản.'],
  [ReceiptText, 'Hóa đơn & công nợ', 'Tạo hóa đơn định kỳ, duyệt nháp, nhắc nợ và đối soát giao dịch.'],
  [FileText, 'Hợp đồng', 'Quản lý hợp đồng thuê, thành viên cư trú, thay đổi hợp đồng và tất toán.'],
  [LineChart, 'Báo cáo', 'Dashboard doanh thu, lấp đầy, công nợ, bảo trì và lịch sử thao tác.'],
] as const;

const residentFeatures = [
  [WalletCards, 'Thanh toán phí', 'Xem hóa đơn, quét QR, theo dõi trạng thái thanh toán và lịch sử giao dịch.'],
  [Bell, 'Thông báo realtime', 'Nhận thông báo hóa đơn, bảo trì, hợp đồng và tin nhắn từ ban quản lý.'],
  [Wrench, 'Yêu cầu sửa chữa', 'Chụp ảnh sự cố, gửi yêu cầu, theo dõi tiến độ và xem phản hồi xử lý.'],
  [MessageSquareText, 'Giao tiếp cư dân', 'Trao đổi qua chatbot, thông báo nội bộ và tin nhắn liên quan đến phòng.'],
] as const;

const pricingPlans = [
  ['Starter', '2.9M', 'Cho tòa nhỏ hoặc nhà trọ bắt đầu số hóa.', ['Tối đa 80 phòng', 'Web dashboard', 'App cư dân', 'Hóa đơn cơ bản']],
  ['Business', '6.9M', 'Cho ban quản lý nhiều tòa cần quy trình đầy đủ.', ['Tối đa 500 phòng', 'PayOS/VietQR', 'Bảo trì SLA', 'Báo cáo nâng cao']],
  ['Enterprise', 'Liên hệ', 'Cho chuỗi căn hộ và công ty quản lý tài sản.', ['Không giới hạn phòng', 'Tích hợp hệ thống ngoài', 'SLA hỗ trợ riêng', 'Onboarding dữ liệu']],
] as const;

function scrollToSection(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="lp-section-title">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="lp-dashboard">
      <div className="lp-window-bar">
        <i />
        <i />
        <i />
        <span>app.proptech.vn/dashboard</span>
      </div>
      <div className="lp-dashboard-body">
        <aside>
          <div className="lp-dash-brand">
            <Building2 size={19} />
            <div>
              <b>Tòa A</b>
              <small>Operations</small>
            </div>
          </div>
          {['Tổng quan', 'Cư dân', 'Hóa đơn', 'Sự cố', 'Báo cáo'].map((item, index) => (
            <div key={item} className={index === 0 ? 'active' : ''}>{item}</div>
          ))}
        </aside>
        <main>
          <div className="lp-dash-header">
            <div>
              <small>Realtime command center</small>
              <h3>Tổng quan vận hành</h3>
            </div>
            <em>Live</em>
          </div>
          <div className="lp-metric-grid">
            {[
              ['92%', 'Thu phí'],
              ['14', 'Sự cố mới'],
              ['8', 'Phòng trống'],
            ].map(([value, label]) => (
              <div key={label} className="lp-metric">
                <b>{value}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="lp-chart-card">
            <div>
              <b>Dòng tiền tháng</b>
              <BarChart3 size={18} />
            </div>
            <div className="lp-chart">
              {[38, 52, 46, 71, 62, 88, 78, 96, 84].map((height, index) => (
                <i key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function PhoneMockup() {
  const shortcuts: Array<[IconType, string]> = [
    [Wrench, 'Sửa chữa'],
    [MessageSquareText, 'Tin nhắn'],
    [FileText, 'Hợp đồng'],
    [ReceiptText, 'Hóa đơn'],
  ];

  return (
    <div className="lp-phone">
      <div className="lp-phone-notch" />
      <div className="lp-phone-screen">
        <div className="lp-phone-top">
          <div>
            <small>Xin chào, Minh Anh</small>
            <b>Căn hộ A-1205</b>
          </div>
          <Bell size={18} />
        </div>
        <div className="lp-bill-card">
          <small>Hóa đơn cần thanh toán</small>
          <b>2.450.000đ</b>
          <button>Thanh toán QR</button>
        </div>
        <div className="lp-shortcuts">
          {shortcuts.map(([Icon, label]) => (
            <div key={label}>
              <Icon size={20} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const goLogin = () => navigate('/login');

  return (
    <div className="lp">
      <style>{`
        .lp {
          --brand: #1E4E8C;
          --brand-dark: #143B6D;
          --ink: #0B1220;
          --muted: #64748B;
          --line: rgba(148, 163, 184, 0.28);
          min-height: 100vh;
          overflow-x: hidden;
          background: #F6F9FC;
          color: var(--ink);
          font-family: Inter, Roboto, Arial, sans-serif;
        }

        .lp *,
        .lp *::before,
        .lp *::after {
          box-sizing: border-box;
          font-family: Inter, Roboto, Arial, sans-serif !important;
        }

        .lp h1,
        .lp h2,
        .lp h3,
        .lp p {
          margin: 0;
        }

        .lp a {
          color: inherit;
          text-decoration: none;
        }

        .lp button {
          border: 0;
          cursor: pointer;
        }

        .lp-nav {
          position: fixed;
          inset: 0 0 auto;
          z-index: 50;
          border-bottom: 1px solid rgba(226, 232, 240, 0.72);
          background: rgba(255, 255, 255, 0.86);
          backdrop-filter: blur(22px);
        }

        .lp-nav-inner {
          width: min(1180px, calc(100% - 32px));
          min-height: 76px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .lp-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: transparent;
          color: var(--ink);
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .lp-logo i {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: linear-gradient(135deg, #1E4E8C, #0EA5E9);
          color: white;
          box-shadow: 0 16px 36px rgba(30, 78, 140, 0.22);
        }

        .lp-menu {
          display: flex;
          align-items: center;
          gap: 28px;
          color: #475569;
          font-size: 14px;
          font-weight: 800;
        }

        .lp-menu a:hover {
          color: var(--brand);
        }

        .lp-nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .lp-login {
          height: 42px;
          padding: 0 18px;
          border-radius: 999px;
          background: white;
          color: #334155;
          font-weight: 900;
        }

        .lp-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 48px;
          padding: 0 22px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--brand), #0EA5E9);
          color: white;
          font-size: 15px;
          font-weight: 950;
          box-shadow: 0 18px 44px rgba(30, 78, 140, 0.24);
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .lp-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 24px 54px rgba(30, 78, 140, 0.30);
        }

        .lp-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 48px;
          padding: 0 22px;
          border: 1px solid rgba(148, 163, 184, 0.36);
          border-radius: 12px;
          background: rgba(255,255,255,0.82);
          color: #0F172A;
          font-size: 15px;
          font-weight: 950;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
          transition: transform 180ms ease;
        }

        .lp-secondary:hover {
          transform: translateY(-2px);
        }

        .lp-hero {
          position: relative;
          isolation: isolate;
          padding: 132px 0 56px;
          background:
            radial-gradient(circle at 12% 10%, rgba(14, 165, 233, 0.22), transparent 28%),
            radial-gradient(circle at 80% 6%, rgba(30, 78, 140, 0.24), transparent 30%),
            linear-gradient(180deg, #FFFFFF 0%, #EEF6FF 52%, #F8FBFF 100%);
        }

        .lp-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background-image:
            linear-gradient(rgba(30,78,140,0.075) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,78,140,0.075) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: linear-gradient(to bottom, black 0%, transparent 78%);
        }

        .lp-container {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
        }

        .lp-hero-grid {
          display: grid;
          grid-template-columns: 0.92fr 1.08fr;
          align-items: center;
          gap: 64px;
        }

        .lp-pill {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 24px;
          padding: 9px 14px;
          border: 1px solid rgba(30, 78, 140, 0.16);
          border-radius: 999px;
          background: rgba(255,255,255,0.78);
          color: var(--brand);
          font-size: 13px;
          font-weight: 950;
          box-shadow: 0 10px 30px rgba(30, 78, 140, 0.08);
        }

        .lp-hero h1 {
          max-width: 760px;
          color: #07111F;
          font-size: clamp(52px, 6vw, 82px);
          font-weight: 950;
          line-height: 0.96;
          letter-spacing: -0.075em;
        }

        .lp-hero p {
          max-width: 650px;
          margin-top: 26px;
          color: #475569;
          font-size: 19px;
          line-height: 1.85;
          font-weight: 600;
        }

        .lp-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 34px;
        }

        .lp-trust-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 28px;
          color: #475569;
          font-size: 13px;
          font-weight: 900;
        }

        .lp-trust-list span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .lp-visual {
          position: relative;
          min-height: 610px;
        }

        .lp-visual .lp-dashboard {
          position: absolute;
          top: 28px;
          right: 0;
          width: min(760px, 100%);
        }

        .lp-visual .lp-phone {
          position: absolute;
          left: -10px;
          bottom: 18px;
          animation: lp-float 7s ease-in-out infinite;
        }

        .lp-floating-card {
          position: absolute;
          right: 24px;
          bottom: 42px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 12px;
          background: rgba(255,255,255,0.92);
          box-shadow: 0 26px 70px rgba(15,23,42,0.16);
          backdrop-filter: blur(18px);
        }

        .lp-floating-card i {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #DCFCE7;
          color: #15803D;
        }

        .lp-floating-card b {
          display: block;
          color: #0F172A;
          font-size: 13px;
        }

        .lp-floating-card small {
          color: #64748B;
          font-size: 12px;
          font-weight: 800;
        }

        .lp-dashboard {
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 16px;
          background:
            radial-gradient(circle at 90% 8%, rgba(14,165,233,0.24), transparent 32%),
            linear-gradient(145deg, #07111F 0%, #0B1830 48%, #102A55 100%);
          box-shadow: 0 34px 110px rgba(15, 23, 42, 0.34);
        }

        .lp-window-bar {
          height: 48px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 18px;
          border-bottom: 1px solid rgba(255,255,255,0.09);
        }

        .lp-window-bar i {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.36);
        }

        .lp-window-bar span {
          margin-left: 10px;
          color: rgba(226,232,240,0.72);
          font-size: 12px;
          font-weight: 700;
        }

        .lp-dashboard-body {
          display: grid;
          grid-template-columns: 190px 1fr;
          gap: 16px;
          padding: 18px;
        }

        .lp-dashboard aside,
        .lp-dashboard main,
        .lp-chart-card,
        .lp-metric {
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(12px);
        }

        .lp-dashboard aside,
        .lp-dashboard main {
          border-radius: 12px;
          padding: 16px;
        }

        .lp-dash-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          color: white;
        }

        .lp-dash-brand svg {
          width: 40px;
          height: 40px;
          padding: 10px;
          border-radius: 10px;
          background: white;
          color: var(--brand);
        }

        .lp-dash-brand b,
        .lp-dash-header h3,
        .lp-chart-card b,
        .lp-metric b {
          color: white;
          font-weight: 950;
        }

        .lp-dash-brand small,
        .lp-dash-header small,
        .lp-metric span {
          display: block;
          color: rgba(203,213,225,0.78);
          font-size: 12px;
          font-weight: 800;
        }

        .lp-dashboard aside > div:not(.lp-dash-brand) {
          margin-top: 8px;
          padding: 10px 12px;
          border-radius: 10px;
          color: rgba(226,232,240,0.72);
          font-size: 13px;
          font-weight: 850;
        }

        .lp-dashboard aside .active {
          background: white;
          color: #0F172A !important;
        }

        .lp-dash-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .lp-dash-header h3 {
          margin-top: 5px;
          font-size: 22px;
          letter-spacing: -0.04em;
        }

        .lp-dash-header em {
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.16);
          color: #86EFAC;
          font-size: 12px;
          font-style: normal;
          font-weight: 950;
        }

        .lp-metric-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .lp-metric {
          border-radius: 12px;
          padding: 16px;
        }

        .lp-metric b {
          display: block;
          margin-bottom: 6px;
          font-size: 30px;
          letter-spacing: -0.055em;
        }

        .lp-chart-card {
          margin-top: 12px;
          border-radius: 12px;
          padding: 16px;
        }

        .lp-chart-card > div:first-child {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #BAE6FD;
        }

        .lp-chart {
          height: 150px;
          display: flex;
          align-items: end;
          gap: 8px;
          margin-top: 18px;
        }

        .lp-chart i {
          flex: 1;
          border-radius: 10px 10px 4px 4px;
          background: linear-gradient(180deg, #BAE6FD, #38BDF8 42%, #1E4E8C);
          box-shadow: 0 10px 24px rgba(14,165,233,0.18);
        }

        .lp-phone {
          width: 242px;
          border: 10px solid #07111F;
          border-radius: 16px;
          background: #07111F;
          box-shadow: 0 34px 90px rgba(15,23,42,0.30);
        }

        .lp-phone-notch {
          width: 62px;
          height: 5px;
          margin: 0 auto 12px;
          border-radius: 999px;
          background: #1E293B;
        }

        .lp-phone-screen {
          border-radius: 16px;
          padding: 16px;
          background: linear-gradient(180deg, #EAF3FF, white);
        }

        .lp-phone-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .lp-phone-top small {
          color: var(--brand);
          font-size: 11px;
          font-weight: 900;
        }

        .lp-phone-top b {
          display: block;
          margin-top: 2px;
          color: #0F172A;
          font-size: 14px;
          font-weight: 950;
        }

        .lp-phone-top svg {
          width: 38px;
          height: 38px;
          padding: 10px;
          border-radius: 50%;
          background: white;
          color: var(--brand);
          box-shadow: 0 10px 26px rgba(15,23,42,0.08);
        }

        .lp-bill-card {
          padding: 16px;
          border-radius: 12px;
          background: linear-gradient(135deg, #1E4E8C, #0EA5E9);
          color: white;
          box-shadow: 0 18px 42px rgba(30,78,140,0.24);
        }

        .lp-bill-card small {
          color: rgba(255,255,255,0.78);
          font-size: 12px;
          font-weight: 800;
        }

        .lp-bill-card b {
          display: block;
          margin-top: 6px;
          font-size: 25px;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .lp-bill-card button {
          width: 100%;
          margin-top: 14px;
          padding: 11px;
          border-radius: 12px;
          background: white;
          color: var(--brand);
          font-size: 13px;
          font-weight: 950;
        }

        .lp-shortcuts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 12px;
        }

        .lp-shortcuts div {
          padding: 12px 8px;
          border-radius: 12px;
          background: white;
          text-align: center;
          box-shadow: 0 8px 18px rgba(15,23,42,0.06);
        }

        .lp-shortcuts svg {
          color: var(--brand);
        }

        .lp-shortcuts span {
          display: block;
          margin-top: 5px;
          color: #334155;
          font-size: 11px;
          font-weight: 900;
        }

        .lp-logo-strip {
          border-top: 1px solid rgba(226,232,240,0.8);
          border-bottom: 1px solid rgba(226,232,240,0.8);
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(16px);
        }

        .lp-logo-inner {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: 24px;
          padding: 22px 0;
        }

        .lp-logo-inner p {
          color: #94A3B8;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .lp-logo-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }

        .lp-logo-grid span {
          padding: 12px;
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 12px;
          background: white;
          color: #64748B;
          text-align: center;
          font-size: 13px;
          font-weight: 950;
          box-shadow: 0 10px 24px rgba(15,23,42,0.04);
        }

        .lp-section {
          padding: 96px 0;
        }

        .lp-white {
          background: white;
        }

        .lp-blue {
          background: #EEF5FF;
        }

        .lp-dark {
          background:
            radial-gradient(circle at 18% 0%, rgba(56,189,248,0.20), transparent 28%),
            radial-gradient(circle at 86% 8%, rgba(30,78,140,0.32), transparent 30%),
            #07111F;
          color: white;
        }

        .lp-section-title {
          max-width: 790px;
          margin: 0 auto 52px;
          text-align: center;
        }

        .lp-section-title span {
          color: var(--brand);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .lp-dark .lp-section-title span {
          color: #7DD3FC;
        }

        .lp-section-title h2 {
          margin-top: 14px;
          color: #07111F;
          font-size: clamp(34px, 4.4vw, 58px);
          font-weight: 950;
          line-height: 1.02;
          letter-spacing: -0.06em;
        }

        .lp-dark .lp-section-title h2,
        .lp-dark h2,
        .lp-dark h3 {
          color: white;
        }

        .lp-section-title p {
          margin-top: 18px;
          color: #64748B;
          font-size: 17px;
          line-height: 1.8;
          font-weight: 600;
        }

        .lp-dark .lp-section-title p,
        .lp-dark p {
          color: #CBD5E1;
        }

        .lp-card-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .lp-card-grid.five {
          grid-template-columns: repeat(5, 1fr);
        }

        .lp-feature-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }

        .lp-card {
          padding: 26px;
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 12px;
          background: white;
          box-shadow: 0 16px 44px rgba(15,23,42,0.05);
          transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
        }

        .lp-card:hover {
          transform: translateY(-6px);
          border-color: rgba(30,78,140,0.24);
          box-shadow: 0 26px 74px rgba(15,23,42,0.12);
        }

        .lp-card-icon {
          width: 56px;
          height: 56px;
          display: grid;
          place-items: center;
          margin-bottom: 22px;
          border-radius: 12px;
          background: linear-gradient(135deg, #EAF3FF, white);
          color: var(--brand);
          box-shadow: inset 0 0 0 1px rgba(30,78,140,0.10);
        }

        .lp-card h3 {
          color: #07111F;
          font-size: 20px;
          font-weight: 950;
          line-height: 1.18;
          letter-spacing: -0.035em;
        }

        .lp-card p {
          margin-top: 12px;
          color: #64748B;
          font-size: 14px;
          line-height: 1.75;
          font-weight: 600;
        }

        .lp-platform {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          align-items: center;
          gap: 54px;
        }

        .lp-platform-copy h2,
        .lp-roi-copy h2 {
          font-size: clamp(36px, 4.8vw, 58px);
          font-weight: 950;
          line-height: 1.02;
          letter-spacing: -0.06em;
        }

        .lp-platform-copy p,
        .lp-roi-copy p {
          margin-top: 18px;
          font-size: 17px;
          line-height: 1.85;
          font-weight: 600;
        }

        .lp-platform-tags {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 28px;
        }

        .lp-platform-tags div {
          padding: 20px;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          background: rgba(255,255,255,0.07);
        }

        .lp-platform-tags b {
          display: block;
          color: white;
          font-size: 16px;
          font-weight: 950;
        }

        .lp-platform-tags span {
          display: block;
          margin-top: 8px;
          color: #94A3B8;
          font-size: 13px;
          line-height: 1.6;
          font-weight: 700;
        }

        .lp-platform-visual {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 18px;
        }

        .lp-platform-visual .lp-phone {
          margin-left: -56px;
        }

        .lp-resident {
          display: grid;
          grid-template-columns: 0.95fr 1.05fr;
          align-items: center;
          gap: 58px;
        }

        .lp-left-title {
          max-width: 620px;
          text-align: left;
          margin: 0 0 34px;
        }

        .lp-left-title h2 {
          font-size: clamp(34px, 4.4vw, 56px);
        }

        .lp-resident-visual {
          display: flex;
          justify-content: center;
          align-items: end;
          gap: 24px;
        }

        .lp-request-card {
          width: 290px;
          padding: 22px;
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 12px;
          background: white;
          box-shadow: 0 26px 70px rgba(15,23,42,0.10);
        }

        .lp-request-card h3 {
          color: #07111F;
          font-size: 17px;
          font-weight: 950;
        }

        .lp-request-card .status {
          float: right;
          padding: 6px 10px;
          border-radius: 999px;
          background: #DCFCE7;
          color: #15803D;
          font-size: 11px;
          font-weight: 950;
        }

        .lp-request-card div {
          clear: both;
          margin-top: 14px;
          padding: 14px;
          border-radius: 12px;
          background: #F8FAFC;
        }

        .lp-request-card b {
          display: block;
          color: #0F172A;
          font-size: 13px;
        }

        .lp-request-card small {
          color: #64748B;
          font-size: 11px;
          font-weight: 700;
        }

        .lp-showcase {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 24px;
          align-items: stretch;
        }

        .lp-showcase-panel {
          padding: 28px;
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 16px;
          background: white;
          box-shadow: 0 26px 80px rgba(15,23,42,0.08);
        }

        .lp-showcase-panel h3 {
          color: #07111F;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .lp-showcase-panel p {
          margin-top: 12px;
          color: #64748B;
          font-size: 15px;
          line-height: 1.75;
          font-weight: 600;
        }

        .lp-workflow {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .lp-step {
          position: relative;
          padding: 28px;
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 12px;
          background: #F8FAFC;
        }

        .lp-step em {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          margin-bottom: 24px;
          border-radius: 12px;
          background: #07111F;
          color: white;
          font-style: normal;
          font-size: 20px;
          font-weight: 950;
        }

        .lp-step h3 {
          color: #07111F;
          font-size: 19px;
          font-weight: 950;
          letter-spacing: -0.035em;
        }

        .lp-step p {
          margin-top: 11px;
          color: #64748B;
          font-size: 14px;
          line-height: 1.7;
          font-weight: 600;
        }

        .lp-roi {
          display: grid;
          grid-template-columns: 0.84fr 1.16fr;
          align-items: center;
          gap: 52px;
        }

        .lp-roi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .lp-roi-card {
          padding: 26px;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          background: rgba(255,255,255,0.07);
        }

        .lp-roi-card svg {
          color: #7DD3FC;
        }

        .lp-roi-card b {
          display: block;
          margin-top: 34px;
          color: white;
          font-size: 42px;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .lp-roi-card h3 {
          margin-top: 10px;
          color: white;
          font-size: 16px;
          font-weight: 950;
        }

        .lp-roi-card p {
          margin-top: 10px;
          color: #94A3B8;
          font-size: 13px;
          line-height: 1.7;
          font-weight: 600;
        }

        .lp-testimonials,
        .lp-pricing {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .lp-testimonial,
        .lp-price {
          padding: 28px;
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 12px;
          background: white;
          box-shadow: 0 16px 44px rgba(15,23,42,0.05);
        }

        .lp-stars {
          display: flex;
          gap: 4px;
          color: #F59E0B;
        }

        .lp-testimonial p {
          margin-top: 22px;
          color: #334155;
          font-size: 16px;
          line-height: 1.8;
          font-weight: 650;
        }

        .lp-testimonial footer {
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #E2E8F0;
        }

        .lp-testimonial b {
          color: #0F172A;
          font-weight: 950;
        }

        .lp-testimonial small {
          display: block;
          margin-top: 4px;
          color: #64748B;
          font-size: 12px;
          font-weight: 800;
        }

        .lp-price.featured {
          border-color: rgba(30,78,140,0.42);
          background: #07111F;
          color: white;
          box-shadow: 0 30px 90px rgba(15,23,42,0.24);
        }

        .lp-price h3 {
          color: #07111F;
          font-size: 25px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .lp-price.featured h3 {
          color: white;
        }

        .lp-price p {
          min-height: 52px;
          margin-top: 10px;
          color: #64748B;
          font-size: 14px;
          line-height: 1.7;
          font-weight: 650;
        }

        .lp-price.featured p {
          color: #CBD5E1;
        }

        .lp-price strong {
          display: block;
          margin-top: 26px;
          color: #07111F;
          font-size: 46px;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .lp-price.featured strong {
          color: white;
        }

        .lp-price button {
          width: 100%;
          margin-top: 24px;
        }

        .lp-price.featured button {
          background: white;
          color: #07111F;
          box-shadow: none;
        }

        .lp-price ul {
          display: grid;
          gap: 13px;
          margin: 24px 0 0;
          padding: 0;
          list-style: none;
        }

        .lp-price li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #475569;
          font-size: 13px;
          font-weight: 850;
        }

        .lp-price.featured li {
          color: #E2E8F0;
        }

        .lp-price li svg {
          flex: none;
          color: #16A34A;
        }

        .lp-cta {
          padding-bottom: 96px;
          background: #F6F9FC;
        }

        .lp-cta-box {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 36px;
          align-items: center;
          padding: 58px;
          border-radius: 16px;
          background:
            radial-gradient(circle at 85% 10%, rgba(125,211,252,0.28), transparent 28%),
            linear-gradient(135deg, #1E4E8C, #0F2D52);
          color: white;
          box-shadow: 0 34px 100px rgba(30,78,140,0.28);
        }

        .lp-cta-box h2 {
          max-width: 820px;
          color: white;
          font-size: clamp(34px, 4.4vw, 56px);
          font-weight: 950;
          line-height: 1.03;
          letter-spacing: -0.06em;
        }

        .lp-cta-box p {
          max-width: 660px;
          margin-top: 16px;
          color: #DBEAFE;
          font-size: 17px;
          line-height: 1.8;
          font-weight: 650;
        }

        .lp-cta-actions {
          display: grid;
          gap: 12px;
          min-width: 210px;
        }

        .lp-cta-actions .lp-secondary {
          background: rgba(255,255,255,0.12);
          color: white;
          border-color: rgba(255,255,255,0.26);
          box-shadow: none;
        }

        .lp-footer {
          border-top: 1px solid #E2E8F0;
          background: white;
        }

        .lp-footer-inner {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.6fr 0.7fr 0.7fr;
          gap: 42px;
          padding: 46px 0;
        }

        .lp-footer p,
        .lp-footer li {
          color: #64748B;
          font-size: 13px;
          line-height: 1.8;
          font-weight: 700;
        }

        .lp-footer h4 {
          margin: 0 0 14px;
          color: #0F172A;
          font-size: 15px;
          font-weight: 950;
        }

        .lp-footer ul {
          display: grid;
          gap: 9px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .lp-copyright {
          border-top: 1px solid #E2E8F0;
          padding: 18px;
          color: #64748B;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
        }

        .lp-reveal {
          animation: lp-fade-up both;
          animation-timeline: view();
          animation-range: entry 8% cover 26%;
        }

        @keyframes lp-fade-up {
          from { opacity: 0; transform: translateY(26px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        @keyframes lp-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .lp-reveal,
          .lp-visual .lp-phone {
            animation: none !important;
          }
        }

        @media (max-width: 1080px) {
          .lp-menu {
            display: none;
          }

          .lp-hero-grid,
          .lp-platform,
          .lp-resident,
          .lp-showcase,
          .lp-roi,
          .lp-cta-box {
            grid-template-columns: 1fr;
          }

          .lp-visual {
            min-height: 560px;
          }

          .lp-visual .lp-phone {
            left: 0;
          }

          .lp-card-grid,
          .lp-card-grid.five,
          .lp-workflow,
          .lp-roi-grid,
          .lp-testimonials,
          .lp-pricing {
            grid-template-columns: repeat(2, 1fr);
          }

          .lp-platform-visual .lp-phone {
            margin-left: 0;
          }
        }

        @media (max-width: 760px) {
          .lp-nav-inner {
            width: min(100% - 24px, 1180px);
            min-height: 66px;
          }

          .lp-logo {
            font-size: 17px;
          }

          .lp-logo i {
            width: 38px;
            height: 38px;
            border-radius: 10px;
          }

          .lp-login {
            display: none;
          }

          .lp-primary,
          .lp-secondary {
            min-height: 44px;
            padding: 0 16px;
            border-radius: 10px;
            font-size: 13px;
          }

          .lp-hero {
            padding-top: 104px;
          }

          .lp-hero-grid {
            gap: 34px;
          }

          .lp-hero h1 {
            font-size: 44px;
          }

          .lp-hero p,
          .lp-section-title p,
          .lp-platform-copy p,
          .lp-roi-copy p {
            font-size: 15px;
            line-height: 1.75;
          }

          .lp-hero-actions {
            display: grid;
          }

          .lp-trust-list,
          .lp-logo-inner,
          .lp-logo-grid,
          .lp-card-grid,
          .lp-card-grid.five,
          .lp-feature-grid,
          .lp-platform-tags,
          .lp-platform-visual,
          .lp-workflow,
          .lp-roi-grid,
          .lp-testimonials,
          .lp-pricing,
          .lp-footer-inner {
            grid-template-columns: 1fr;
          }

          .lp-visual {
            min-height: auto;
          }

          .lp-visual .lp-dashboard,
          .lp-visual .lp-phone {
            position: static;
          }

          .lp-visual .lp-phone {
            width: 220px;
            margin: 22px auto 0;
          }

          .lp-floating-card,
          .lp-dashboard aside,
          .lp-request-card {
            display: none;
          }

          .lp-dashboard-body {
            grid-template-columns: 1fr;
            padding: 12px;
          }

          .lp-dashboard main {
            padding: 12px;
          }

          .lp-dash-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .lp-metric-grid {
            grid-template-columns: 1fr;
          }

          .lp-chart {
            height: 120px;
          }

          .lp-section {
            padding: 72px 0;
          }

          .lp-section-title {
            margin-bottom: 34px;
          }

          .lp-section-title h2,
          .lp-platform-copy h2,
          .lp-roi-copy h2,
          .lp-left-title h2,
          .lp-cta-box h2 {
            font-size: 34px;
            letter-spacing: -0.052em;
          }

          .lp-card,
          .lp-showcase-panel,
          .lp-step,
          .lp-roi-card,
          .lp-testimonial,
          .lp-price {
            border-radius: 12px;
            padding: 22px;
          }

          .lp-resident-visual {
            display: block;
          }

          .lp-resident-visual .lp-phone {
            margin: 0 auto;
          }

          .lp-cta-box {
            padding: 28px;
            border-radius: 16px;
          }
        }
      `}</style>

      <header className="lp-nav">
        <nav className="lp-nav-inner">
          <button className="lp-logo" onClick={() => scrollToSection('#hero')}>
            <i><Building2 size={23} /></i>
            PropTech Suite
          </button>

          <div className="lp-menu">
            {navItems.map((item) => (
              <a key={item.href} href={item.href}>{item.label}</a>
            ))}
          </div>

          <div className="lp-nav-actions">
            <button className="lp-login" onClick={goLogin}>Đăng nhập</button>
            <button className="lp-primary" onClick={goLogin}>
              Dùng thử <ArrowRight size={16} />
            </button>
          </div>
        </nav>
      </header>

      <main>
        <section id="hero" className="lp-hero">
          <div className="lp-container lp-hero-grid">
            <div className="lp-reveal">
              <div className="lp-pill">
                <Sparkles size={16} />
                SaaS quản lý tòa nhà cho thị trường Việt Nam
              </div>
              <h1>Vận hành chung cư hiện đại trên một nền tảng duy nhất.</h1>
              <p>
                PropTech Suite giúp ban quản lý số hóa cư dân, hợp đồng, hóa đơn, thanh toán,
                bảo trì và truyền thông nội bộ — đồng bộ giữa web dashboard và app cư dân.
              </p>
              <div className="lp-hero-actions">
                <button className="lp-primary" onClick={goLogin}>
                  Bắt đầu dùng thử <ArrowRight size={18} />
                </button>
                <button className="lp-secondary" onClick={() => scrollToSection('#showcase')}>
                  <Play size={18} /> Xem giao diện sản phẩm
                </button>
              </div>
              <div className="lp-trust-list">
                {['Không cần thẻ tín dụng', 'Triển khai dữ liệu mẫu', 'Web + mobile đồng bộ'].map((item) => (
                  <span key={item}><CheckCircle2 size={17} color="#16A34A" />{item}</span>
                ))}
              </div>
            </div>

            <div className="lp-visual lp-reveal">
              <DashboardMockup />
              <PhoneMockup />
              <div className="lp-floating-card">
                <i><CheckCircle2 size={24} /></i>
                <div>
                  <b>128 giao dịch đã đối soát</b>
                  <small>Cập nhật từ PayOS/VietQR</small>
                </div>
              </div>
            </div>
          </div>

          <div className="lp-logo-strip">
            <div className="lp-logo-inner">
              <p>Được thiết kế cho</p>
              <div className="lp-logo-grid">
                {logos.map((logo) => <span key={logo}>{logo}</span>)}
              </div>
            </div>
          </div>
        </section>

        <section id="problems" className="lp-section lp-white">
          <div className="lp-container">
            <SectionTitle
              eyebrow="Problems We Solve"
              title="Những điểm nghẽn vận hành khiến ban quản lý mất thời gian mỗi ngày."
              description="PropTech Suite tập trung vào luồng vận hành: ai làm gì, trạng thái nào, số liệu nào cần hành động."
            />
            <div className="lp-card-grid">
              {problems.map(([Icon, title, description]) => (
                <article className="lp-card lp-reveal" key={title}>
                  <div className="lp-card-icon"><Icon size={26} /></div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="lp-section lp-dark">
          <div className="lp-container lp-platform">
            <div className="lp-platform-copy lp-reveal">
              <h2>Một hệ sinh thái cho cả ban quản lý và cư dân.</h2>
              <p>
                Web dashboard tập trung nghiệp vụ quản trị. Mobile app đưa hóa đơn,
                thông báo, phản ánh và giao tiếp đến cư dân. Mọi dữ liệu đi qua cùng backend.
              </p>
              <div className="lp-platform-tags">
                <div>
                  <b>Web Dashboard</b>
                  <span>Admin, quản lý, kế toán và nhân viên vận hành.</span>
                </div>
                <div>
                  <b>Resident App</b>
                  <span>Cư dân/khách thuê thanh toán và tương tác.</span>
                </div>
              </div>
            </div>

            <div className="lp-platform-visual lp-reveal">
              <DashboardMockup />
              <PhoneMockup />
            </div>
          </div>
        </section>

        <section id="features" className="lp-section lp-blue">
          <div className="lp-container">
            <SectionTitle
              eyebrow="Core Features for Managers"
              title="Từ vận hành tòa nhà đến tài chính, mọi nghiệp vụ được đặt đúng chỗ."
              description="Cấu trúc thông tin dễ hiểu cho vận hành, đủ mạnh cho quản trị và báo cáo."
            />
            <div className="lp-card-grid five">
              {managerFeatures.map(([Icon, title, description]) => (
                <article className="lp-card lp-reveal" key={title}>
                  <div className="lp-card-icon"><Icon size={26} /></div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-white">
          <div className="lp-container lp-resident">
            <div className="lp-reveal">
              <div className="lp-section-title lp-left-title">
                <span>Resident Experience</span>
                <h2>App cư dân giúp giảm cuộc gọi, giảm tin nhắn rời rạc.</h2>
                <p>Cư dân tự xem hóa đơn, thanh toán, gửi yêu cầu sửa chữa, nhận thông báo và theo dõi lịch sử tương tác.</p>
              </div>
              <div className="lp-feature-grid">
                {residentFeatures.map(([Icon, title, description]) => (
                  <article className="lp-card" key={title}>
                    <div className="lp-card-icon"><Icon size={24} /></div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="lp-resident-visual lp-reveal">
              <PhoneMockup />
              <div className="lp-request-card">
                <span className="status">Đã nhận</span>
                <h3>Yêu cầu sửa chữa</h3>
                {['Rò nước phòng tắm', 'Điện hành lang yếu', 'Thay khóa cửa'].map((item, index) => (
                  <div key={item}>
                    <b>{item}</b>
                    <small>#{index + 2401} · Cập nhật 12 phút trước</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="showcase" className="lp-section lp-blue">
          <div className="lp-container">
            <SectionTitle
              eyebrow="Product Showcase"
              title="Giao diện ưu tiên hành động, không chỉ hiển thị dữ liệu."
              description="Dashboard, analytics và workflow giúp ban quản lý nhìn thấy việc cần xử lý ngay khi mở hệ thống."
            />
            <div className="lp-showcase">
              <div className="lp-showcase-panel lp-reveal">
                <h3>Luồng vận hành rõ ràng</h3>
                <p>Quản lý cư dân, hợp đồng, hóa đơn, công nợ, bảo trì và thông báo theo cùng một cấu trúc dữ liệu.</p>
                <div className="lp-card-grid" style={{ gridTemplateColumns: '1fr', marginTop: 18 }}>
                  {['Tạo hóa đơn tháng', 'Duyệt và gửi thông báo', 'Cư dân thanh toán QR', 'Đối soát và báo cáo'].map((item, index) => (
                    <article className="lp-card" key={item} style={{ padding: 18, borderRadius: 20 }}>
                      <h3>{index + 1}. {item}</h3>
                    </article>
                  ))}
                </div>
              </div>
              <div className="lp-reveal">
                <DashboardMockup />
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section lp-white">
          <div className="lp-container">
            <SectionTitle
              eyebrow="Workflow"
              title="Từ manager đến cư dân: một luồng vận hành khép kín."
              description="Hệ thống liên kết dữ liệu phòng, hợp đồng, hóa đơn, thanh toán, thông báo và bảo trì."
            />
            <div className="lp-workflow">
              {[
                ['Thiết lập dữ liệu', 'Tạo tòa nhà, tầng, phòng, dịch vụ, tài sản và tài khoản nhân sự.'],
                ['Ký hợp đồng', 'Gắn cư dân vào phòng và cấp tài khoản mobile cho cư dân.'],
                ['Tính phí hằng tháng', 'Nhập chỉ số, tạo hóa đơn, duyệt nháp và gửi thông báo.'],
                ['Cư dân tương tác', 'Thanh toán, gửi yêu cầu sửa chữa, nhận thông báo và trao đổi.'],
              ].map(([title, description], index) => (
                <article className="lp-step lp-reveal" key={title}>
                  <em>{index + 1}</em>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-dark">
          <div className="lp-container lp-roi">
            <div className="lp-roi-copy lp-reveal">
              <h2>ROI đến từ việc giảm thao tác lặp và tăng tính minh bạch.</h2>
              <p>PropTech Suite giúp đội vận hành giảm lỗi dữ liệu, giảm thời gian phản hồi và tăng tỷ lệ thanh toán đúng hạn.</p>
            </div>
            <div className="lp-roi-grid">
              {[
                [TrendingDown, '65%', 'Giảm thời gian nhập liệu', 'Chuẩn hóa luồng hóa đơn, chỉ số và phản ánh cư dân.'],
                [TrendingUp, '2.5x', 'Tăng tốc phản hồi', 'Yêu cầu bảo trì có trạng thái, người phụ trách và thông báo realtime.'],
                [ShieldCheck, '100%', 'Dữ liệu theo tenant', 'Dữ liệu tách theo owner, role và quyền truy cập rõ ràng.'],
              ].map(([Icon, value, title, description]) => {
                const IconComponent = Icon as IconType;
                return (
                  <article className="lp-roi-card lp-reveal" key={String(title)}>
                    <IconComponent size={28} />
                    <b>{String(value)}</b>
                    <h3>{String(title)}</h3>
                    <p>{String(description)}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="lp-section lp-blue">
          <div className="lp-container">
            <SectionTitle
              eyebrow="Testimonials"
              title="Được thiết kế cho những đội vận hành cần dữ liệu rõ ràng."
              description="Các case study đại diện cho ban quản lý chung cư, công ty quản lý tài sản và chủ vận hành căn hộ."
            />
            <div className="lp-testimonials">
              {[
                ['Chúng tôi giảm đáng kể thời gian tổng hợp công nợ cuối tháng. Ban quản lý và cư dân đều nhìn thấy cùng một dữ liệu.', 'Nguyễn Minh Anh', 'Trưởng ban quản lý · An Phú Tower'],
                ['Phản ánh sửa chữa không còn trôi trong nhóm chat. Mỗi yêu cầu đều có lịch sử, ảnh và trạng thái xử lý.', 'Lê Quốc Huy', 'Property Manager · GreenView Residence'],
                ['App cư dân giúp tỷ lệ thanh toán đúng hạn tốt hơn vì mọi hóa đơn và nhắc nợ đều rõ ràng.', 'Trần Hoài Nam', 'Chủ vận hành · Metrohome'],
              ].map(([quote, name, role]) => (
                <article className="lp-testimonial lp-reveal" key={name}>
                  <div className="lp-stars">
                    {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={17} fill="currentColor" />)}
                  </div>
                  <p>“{quote}”</p>
                  <footer>
                    <b>{name}</b>
                    <small>{role}</small>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="lp-section lp-white">
          <div className="lp-container">
            <SectionTitle
              eyebrow="Pricing"
              title="Gói triển khai linh hoạt theo quy mô vận hành."
              description="Chi phí thực tế có thể điều chỉnh theo số phòng, tích hợp và nhu cầu onboarding dữ liệu."
            />
            <div className="lp-pricing">
              {pricingPlans.map(([name, price, description, features], index) => (
                <article className={`lp-price lp-reveal ${index === 1 ? 'featured' : ''}`} key={name}>
                  <h3>{name}</h3>
                  <p>{description}</p>
                  <strong>{price}</strong>
                  <button className="lp-primary" onClick={goLogin}>
                    {index === 2 ? 'Liên hệ tư vấn' : 'Bắt đầu'} <ArrowRight size={18} />
                  </button>
                  <ul>
                    {features.map((feature) => (
                      <li key={feature}><Check size={17} />{feature}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-cta">
          <div className="lp-cta-box">
            <div>
              <div className="lp-pill" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'rgba(255,255,255,0.22)' }}>
                <Zap size={16} />
                Sẵn sàng thay thế vận hành thủ công
              </div>
              <h2>Bắt đầu xây một trải nghiệm quản lý tòa nhà chuyên nghiệp hơn hôm nay.</h2>
              <p>Dùng thử dashboard với dữ liệu mẫu, kiểm tra luồng hóa đơn, bảo trì và app cư dân trước khi triển khai thật.</p>
            </div>
            <div className="lp-cta-actions">
              <button className="lp-primary" onClick={goLogin}>Dùng thử ngay <ArrowRight size={18} /></button>
              <button className="lp-secondary" onClick={() => scrollToSection('#showcase')}>Xem sản phẩm</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <button className="lp-logo" onClick={() => scrollToSection('#hero')}>
              <i><Home size={22} /></i>
              PropTech Suite
            </button>
            <p style={{ marginTop: 16, maxWidth: 460 }}>
              Nền tảng quản lý tòa nhà, căn hộ và cộng đồng cư dân dành cho đội vận hành tại Việt Nam.
            </p>
          </div>
          <div>
            <h4>Sản phẩm</h4>
            <ul>
              <li><a href="#platform">Nền tảng</a></li>
              <li><a href="#features">Tính năng</a></li>
              <li><a href="#pricing">Bảng giá</a></li>
            </ul>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <ul>
              <li>contact@proptech.vn</li>
              <li>1900 0000</li>
              <li>Hà Nội, Việt Nam</li>
            </ul>
          </div>
        </div>
        <div className="lp-copyright">© 2026 PropTech Suite. All rights reserved.</div>
      </footer>
    </div>
  );
}
