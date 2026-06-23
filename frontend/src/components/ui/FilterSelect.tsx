import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

interface FilterSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

export function FilterSelect({
  children,
  className = '',
  wrapperClassName = '',
  ...props
}: FilterSelectProps) {
  return (
    <label className={`filter-select-wrapper ${wrapperClassName}`.trim()}>
      <select className={`filter-select ${className}`.trim()} {...props}>
        {children}
      </select>
      <ChevronDown size={16} aria-hidden="true" />
    </label>
  );
}
