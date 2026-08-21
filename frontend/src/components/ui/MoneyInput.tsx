import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type MoneyScale = 'unit' | 'thousand' | 'million';

const SCALE_MULTIPLIERS: Record<MoneyScale, number> = {
  unit: 1,
  thousand: 1_000,
  million: 1_000_000,
};

interface MoneyInputProps {
  value: string | number;
  onChange: (valueVnd: string) => void;
  defaultScale?: MoneyScale;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function MoneyInput({
  value,
  onChange,
  defaultScale = 'thousand',
  className = '',
  compact = false,
  disabled = false,
  placeholder,
}: MoneyInputProps) {
  const [scale, setScale] = useState<MoneyScale>(defaultScale);
  const [amount, setAmount] = useState(() => {
    const numericValue = Number(value || 0);
    return numericValue ? String(numericValue / SCALE_MULTIPLIERS[defaultScale]) : '';
  });

  useEffect(() => {
    const numericValue = Number(value || 0);
    const currentValue = Number(amount || 0) * SCALE_MULTIPLIERS[scale];
    if (numericValue !== currentValue) {
      setAmount(numericValue ? String(numericValue / SCALE_MULTIPLIERS[scale]) : '');
    }
  }, [value, scale]);

  const handleAmountChange = (nextValue: string) => {
    const normalized = nextValue.replace(',', '.');
    if (!/^\d*(?:\.\d{0,2})?$/.test(normalized)) return;
    setAmount(normalized);
    const valueVnd = normalized ? Math.round(Number(normalized) * SCALE_MULTIPLIERS[scale]) : 0;
    onChange(String(valueVnd));
  };

  const handleScaleChange = (nextScale: MoneyScale) => {
    const currentValueVnd = Number(value || 0);
    setScale(nextScale);
    setAmount(currentValueVnd ? String(currentValueVnd / SCALE_MULTIPLIERS[nextScale]) : '');
  };

  return (
    <div className={`money-input-control ${compact ? 'is-compact' : ''} ${className}`.trim()}>
      <input
        type="text"
        inputMode="decimal"
        value={amount}
        onChange={(event) => handleAmountChange(event.target.value)}
        placeholder={placeholder ?? (scale === 'million' ? 'VD: 8.5' : scale === 'thousand' ? 'VD: 250' : 'VD: 500')}
        disabled={disabled}
        aria-label="Số tiền"
      />
      <span className="money-input-unit">
        <select
          value={scale}
          onChange={(event) => handleScaleChange(event.target.value as MoneyScale)}
          disabled={disabled}
          aria-label="Đơn vị tiền"
        >
          <option value="unit">VNĐ</option>
          <option value="thousand">nghìn</option>
          <option value="million">triệu</option>
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </span>
    </div>
  );
}
