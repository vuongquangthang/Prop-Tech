import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme, type ThemePreference } from '../contexts/ThemeContext';

const options: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}> = [
  { value: 'light', label: 'Sáng', icon: Sun },
  { value: 'dark', label: 'Tối', icon: Moon },
  { value: 'system', label: 'Hệ thống', icon: Monitor },
];

export function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const ActiveIcon = resolvedTheme === 'dark' ? Moon : Sun;

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="theme-switcher">
      <button
        ref={triggerRef}
        type="button"
        className="theme-switcher-trigger"
        aria-label="Chọn giao diện"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <ActiveIcon size={18} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="theme-switcher-menu"
          role="menu"
          style={{ position: 'fixed', top: menuPosition.top, right: menuPosition.right }}
        >
          <p>Giao diện</p>
          {options.map((option) => {
            const Icon = option.icon;
            const selected = theme === option.value;
            return (
              <button
                type="button"
                key={option.value}
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setTheme(option.value);
                  setOpen(false);
                }}
              >
                <Icon size={16} />
                <span>{option.label}</span>
                {selected && <Check size={15} />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
