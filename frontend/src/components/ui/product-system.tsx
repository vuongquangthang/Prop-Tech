import * as React from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { cn } from './utils';

type PageHeaderProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('product-page-header', className)}>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="product-page-actions">{actions}</div>}
    </div>
  );
}

type ToolbarProps = {
  children?: React.ReactNode;
  className?: string;
};

export function Toolbar({ children, className }: ToolbarProps) {
  return <div className={cn('product-toolbar', className)}>{children}</div>;
}

type SearchFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  containerClassName?: string;
};

export function SearchField({ className, containerClassName, ...props }: SearchFieldProps) {
  return (
    <div className={cn('product-search', containerClassName)}>
      <Search size={17} />
      <input type="search" className={className} {...props} />
    </div>
  );
}

type DataCardProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function DataCard({ title, description, actions, children, className }: DataCardProps) {
  return (
    <section className={cn('product-card', className)}>
      {(title || description || actions) && (
        <div className="product-card-header">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="product-card-actions">{actions}</div>}
        </div>
      )}
      <div className="product-card-body">{children}</div>
    </section>
  );
}

type DataTableProps = {
  children: React.ReactNode;
  className?: string;
};

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div className={cn('product-table-wrap', className)}>
      <table className="product-table">{children}</table>
    </div>
  );
}

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('product-empty-state', className)}>
      {icon && <div className="product-empty-icon">{icon}</div>}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

type LoadingStateProps = {
  label?: string;
  className?: string;
};

export function LoadingState({ label = 'Đang tải dữ liệu...', className }: LoadingStateProps) {
  return (
    <div className={cn('product-loading-state', className)}>
      <Loader2 size={28} className="animate-spin" />
      <span>{label}</span>
    </div>
  );
}

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand';

type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
};

export function StatusBadge({ children, tone = 'neutral', className }: StatusBadgeProps) {
  return <span className={cn('product-status-badge', `is-${tone}`, className)}>{children}</span>;
}

type TabsProps = {
  items: Array<{ key: string; label: React.ReactNode; count?: number }>;
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
};

export function SegmentedTabs({ items, activeKey, onChange, className }: TabsProps) {
  return (
    <div className={cn('product-tabs', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={cn(item.key === activeKey && 'is-active')}
          onClick={() => onChange(item.key)}
        >
          <span>{item.label}</span>
          {typeof item.count === 'number' && <b>{item.count}</b>}
        </button>
      ))}
    </div>
  );
}

type ProductModalProps = {
  open: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

export function ProductModal({ open, title, description, children, footer, onClose, size = 'lg' }: ProductModalProps) {
  if (!open) return null;

  return (
    <div className="admin-content-modal-overlay" onClick={onClose}>
      <div
        className={cn('admin-content-modal-panel product-modal-panel', `is-${size}`)}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-content-modal-header product-modal-header">
          <div>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="product-action-icon" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        <div className="product-modal-body">{children}</div>
        {footer && <div className="admin-content-modal-footer product-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

type FieldProps = {
  label: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Field({ label, helperText, error, children, className }: FieldProps) {
  return (
    <label className={cn('product-field', className)}>
      <span>{label}</span>
      {children}
      {helperText && !error && <small>{helperText}</small>}
      {error && <small className="is-error">{error}</small>}
    </label>
  );
}
