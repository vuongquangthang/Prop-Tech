import { useState } from 'react';
import { UtilityReadingTable } from '../components/finance/UtilityReadingTable';
import { InvoiceTable } from '../components/finance/InvoiceTable';

type BillingSection = 'readings' | 'invoices';

export function BillingWorkflowPage() {
  const [activeSection, setActiveSection] = useState<BillingSection>('readings');

  const tabs: Array<{ key: BillingSection; label: string }> = [
    { key: 'readings', label: 'Nhập chỉ số điện/nước' },
    { key: 'invoices', label: 'Kiểm tra và gửi hóa đơn' },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-page)]" style={{ paddingTop: '20px', paddingRight: 'var(--space-layout)', paddingBottom: '32px', paddingLeft: 'var(--space-layout)', gap: '14px' }}>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <section className="border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-sm">
          <div className="border-b border-[var(--surface-border)] bg-[var(--surface-muted)] p-3">
            <div className="product-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={activeSection === tab.key ? 'is-active' : ''}
                  onClick={() => setActiveSection(tab.key)}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            {activeSection === 'readings' && (
              <UtilityReadingTable embedded />
            )}
            {activeSection === 'invoices' && (
              <InvoiceTable embedded />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
