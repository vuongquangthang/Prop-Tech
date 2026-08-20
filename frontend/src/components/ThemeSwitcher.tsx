import { Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const [doorPhase, setDoorPhase] = useState<'idle' | 'closing' | 'opening'>('idle');
  const [targetTheme, setTargetTheme] = useState<'light' | 'dark'>(resolvedTheme);
  const timersRef = useRef<number[]>([]);
  const isDark = resolvedTheme === 'dark';
  const NextIcon = isDark ? Sun : Moon;
  const DoorIcon = targetTheme === 'dark' ? Moon : Sun;
  const isAnimating = doorPhase !== 'idle';

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const handleToggleTheme = () => {
    if (isAnimating) return;

    const nextTheme = isDark ? 'light' : 'dark';
    setTargetTheme(nextTheme);
    setDoorPhase('closing');

    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [
      window.setTimeout(() => {
        setTheme(nextTheme);
        setDoorPhase('opening');
      }, 520),
      window.setTimeout(() => {
        setDoorPhase('idle');
      }, 1120),
    ];
  };

  return (
    <div className="theme-switcher">
      <button
        type="button"
        className={`theme-switcher-trigger theme-toggle-button ${isDark ? 'is-dark' : 'is-light'}`}
        aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
        title={isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
        disabled={isAnimating}
        onClick={handleToggleTheme}
      >
        <span className="theme-toggle-icon" key={resolvedTheme}>
          <NextIcon size={18} />
        </span>
      </button>

      {isAnimating && createPortal(
        <div className={`theme-door-transition is-${doorPhase} to-${targetTheme}`} aria-hidden="true">
          <div className="theme-door-panel theme-door-panel-left" />
          <div className="theme-door-panel theme-door-panel-right">
            <span className="theme-door-handle">
              <DoorIcon size={28} />
            </span>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
