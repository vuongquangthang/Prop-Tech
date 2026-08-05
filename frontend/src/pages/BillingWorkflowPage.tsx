import { useState } from 'react';
import { Calculator, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { UtilityReadingTable } from '../components/finance/UtilityReadingTable';
import { InvoiceTable } from '../components/finance/InvoiceTable';

type BillingSection = 'readings' | 'invoices';

export function BillingWorkflowPage() {
  // Mac dinh dong het, nguoi dung tu mo tung muc
  const [openSections, setOpenSections] = useState<Record<BillingSection, boolean>>({
    readings: false,
    invoices: false,
  });

  const toggleSection = (section: BillingSection) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-page)]" style={{ padding: 'var(--space-layout)', gap: '14px' }}>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-4">
          <section className="border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection('readings')}
              className="flex w-full items-center justify-between gap-4 border-b border-[var(--surface-border)] bg-[var(--surface-muted)] px-5 py-4 text-left transition-colors hover:bg-[var(--brand-surface)]"
              aria-expanded={openSections.readings}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center bg-[var(--brand-surface)] text-[var(--brand-primary)]">
                  <Calculator size={18} />
                </span>
                <span className="text-lg font-semibold text-[var(--primary)]">Nhập chỉ số điện/nước</span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)]">
                {openSections.readings ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </span>
            </button>
            <div className={openSections.readings ? 'p-4' : 'hidden'}>
              <UtilityReadingTable embedded />
            </div>
          </section>

          <section className="border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection('invoices')}
              className="flex w-full items-center justify-between gap-4 border-b border-[var(--surface-border)] bg-[var(--surface-muted)] px-5 py-4 text-left transition-colors hover:bg-[var(--brand-surface)]"
              aria-expanded={openSections.invoices}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center bg-[var(--brand-surface)] text-[var(--brand-primary)]">
                  <FileText size={18} />
                </span>
                <span className="text-lg font-semibold text-[var(--primary)]">Kiểm tra và gửi hóa đơn</span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)]">
                {openSections.invoices ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </span>
            </button>
            <div className={openSections.invoices ? 'p-4' : 'hidden'}>
              <InvoiceTable embedded />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
