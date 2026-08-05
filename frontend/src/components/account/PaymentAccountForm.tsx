import { useEffect, useState } from 'react';
import { Loader2, Save, CheckCircle, Landmark, AlertTriangle } from 'lucide-react';
import {
  paymentAccountService,
  type PaymentAccount,
  type VietQrBank,
} from '../../services/paymentAccount.service';

/**
 * Form chủ nhà kết nối tài khoản ngân hàng nhận tiền.
 * Chỉ cần: chọn ngân hàng (ra BIN) + số tài khoản + tên chủ tài khoản.
 * QR thanh toán của cư dân sẽ trỏ vào tài khoản này.
 */
export function PaymentAccountForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [banks, setBanks] = useState<VietQrBank[]>([]);
  const [bankBin, setBankBin] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [existing, setExisting] = useState<PaymentAccount | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [bankList, current] = await Promise.all([
          paymentAccountService.getBanks(),
          paymentAccountService.get(),
        ]);
        setBanks(bankList);
        if (current) {
          setExisting(current);
          setBankBin(current.bankBin);
          setBankAccountNo(current.bankAccountNo);
          setAccountHolder(current.accountHolder);
        }
      } catch (err: any) {
        setError(err?.message || 'Không tải được thông tin tài khoản');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedBank = banks.find((b) => b.bin === bankBin);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    if (!bankBin) return setError('Vui lòng chọn ngân hàng');
    if (!bankAccountNo.trim()) return setError('Vui lòng nhập số tài khoản');
    if (!accountHolder.trim()) return setError('Vui lòng nhập tên chủ tài khoản');

    try {
      setSaving(true);
      const saved = await paymentAccountService.connect({
        bankBin,
        bankAccountNo: bankAccountNo.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
        bankName: selectedBank?.shortName,
      });
      setExisting(saved);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không lưu được tài khoản');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Landmark className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-[var(--primary)]">Tài khoản nhận tiền</h2>
      </div>
      <p className="mb-5 text-sm text-gray-500">
        Cư dân thanh toán hóa đơn sẽ chuyển khoản trực tiếp vào tài khoản này. Vui lòng nhập
        chính xác thông tin ngân hàng của bạn.
      </p>

      {existing && (
        <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Đang dùng: <b>{existing.bankName || existing.bankBin}</b> — {existing.bankAccountNo} — {existing.accountHolder}
        </div>
      )}

      <div className="space-y-4">
        {/* Ngân hàng */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Ngân hàng *</label>
          <select
            value={bankBin}
            onChange={(e) => setBankBin(e.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          >
            <option value="">-- Chọn ngân hàng --</option>
            {banks.map((b) => (
              <option key={b.bin} value={b.bin}>
                {b.shortName} — {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Số tài khoản */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Số tài khoản *</label>
          <input
            value={bankAccountNo}
            onChange={(e) => setBankAccountNo(e.target.value.replace(/\s/g, ''))}
            disabled={saving}
            placeholder="Nhập số tài khoản ngân hàng"
            inputMode="numeric"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          />
        </div>

        {/* Tên chủ tài khoản */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Tên chủ tài khoản *</label>
          <input
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            disabled={saving}
            placeholder="VD: NGUYEN VAN A"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">Viết IN HOA, không dấu, đúng như đăng ký ngân hàng.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4 shrink-0" /> Đã lưu tài khoản nhận tiền thành công.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {existing ? 'Cập nhật tài khoản' : 'Kết nối tài khoản'}
        </button>
      </div>
    </div>
  );
}
