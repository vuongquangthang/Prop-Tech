import { CalendarDays } from 'lucide-react';
import { forwardRef, useEffect, useRef, useState, type CSSProperties, type InputHTMLAttributes } from 'react';
import { formatDisplayDate } from '../../lib/date-utils';

type DateTextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
};

const toDisplayDate = (value?: string) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  return formatDisplayDate(value, '');
};

const toInputDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const DateTextInput = forwardRef<HTMLInputElement, DateTextInputProps>(function DateTextInput(
  { value, onChange, onBlur, placeholder = 'dd/mm/yyyy', className, style, disabled, readOnly, min, max, ...props },
  ref,
) {
  const [text, setText] = useState(() => toDisplayDate(value));
  const pickerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setText(toDisplayDate(value));
  }, [value]);

  const openPicker = () => {
    if (disabled || readOnly) return;
    const picker = pickerRef.current;
    if (!picker) return;

    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
      return;
    }

    picker.click();
  };

  const inputStyle: CSSProperties = {
    ...style,
    paddingRight: style?.paddingRight ?? '2.35rem',
  };
  const wrapperClassName = className?.split(/\s+/).includes('w-full')
    ? 'relative block w-full'
    : 'relative inline-block align-middle';

  return (
    <span className={wrapperClassName}>
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        readOnly={readOnly}
        className={className}
        style={inputStyle}
        onChange={(event) => setText(event.target.value)}
        onBlur={(event) => {
          const nextValue = toInputDate(text);
          if (nextValue !== null) {
            onChange(nextValue);
            setText(toDisplayDate(nextValue));
          } else {
            setText(toDisplayDate(value));
          }
          onBlur?.(event);
        }}
      />
      <button
        type="button"
        aria-label="Chọn ngày"
        disabled={disabled || readOnly}
        onClick={openPicker}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-40"
        style={{ border: 0, background: 'transparent', padding: 0, lineHeight: 0 }}
      >
        <CalendarDays size={16} />
      </button>
      <input
        ref={pickerRef}
        type="date"
        value={value || ''}
        min={min}
        max={max}
        disabled={disabled || readOnly}
        onChange={(event) => {
          onChange(event.target.value);
          setText(toDisplayDate(event.target.value));
        }}
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{ width: 1, height: 1 }}
      />
    </span>
  );
});
