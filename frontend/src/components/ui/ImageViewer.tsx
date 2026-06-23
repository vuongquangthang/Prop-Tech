import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  titlePrefix?: string;
  onClose: () => void;
}

export function ImageViewer({
  images,
  initialIndex = 0,
  titlePrefix = 'Ảnh',
  onClose,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0)),
  );
  const [zoom, setZoom] = useState(1);
  const overlayRef = useRef<HTMLDivElement>(null);

  const hasMultipleImages = images.length > 1;
  const showPrevious = () => {
    setCurrentIndex((index) => (index - 1 + images.length) % images.length);
    setZoom(1);
  };
  const showNext = () => {
    setCurrentIndex((index) => (index + 1) % images.length);
    setZoom(1);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && hasMultipleImages) showPrevious();
      if (event.key === 'ArrowRight' && hasMultipleImages) showNext();
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setZoom((value) => Math.min(value + 0.25, 3));
      }
      if (event.key === '-') {
        event.preventDefault();
        setZoom((value) => Math.max(value - 0.25, 0.5));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasMultipleImages, onClose]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      event.stopPropagation();
      setZoom((value) => {
        const nextZoom = value + (event.deltaY < 0 ? 0.1 : -0.1);
        return Math.min(Math.max(nextZoom, 0.5), 3);
      });
    };

    overlay.addEventListener('wheel', handleWheel, { passive: false });
    return () => overlay.removeEventListener('wheel', handleWheel);
  }, []);

  if (images.length === 0 || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 2147483647,
        background: 'var(--overlay)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh chi tiết"
    >
      <div
        className="relative overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateRows: '56px minmax(0, 1fr)',
          width: 'min(1200px, calc(100vw - 32px))',
          height: 'min(820px, calc(100vh - 32px))',
          minWidth: 0,
          minHeight: 0,
          border: '1px solid var(--surface-level-3-border)',
          borderRadius: 'var(--radius-modal)',
          background: 'var(--surface-level-3)',
          boxShadow: 'var(--shadow-strong)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex min-w-0 items-center justify-between gap-4 overflow-hidden px-4"
          style={{
            borderBottom: '1px solid var(--surface-level-4-border)',
            background: 'var(--surface-level-4)',
            color: 'var(--text-primary)',
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-sm font-semibold">{titlePrefix}</span>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-xs"
              style={{
                background: 'var(--brand-surface)',
                color: 'var(--brand-primary)',
              }}
            >
              {currentIndex + 1}/{images.length}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => setZoom((value) => Math.max(value - 0.25, 0.5))} className="product-action-icon" aria-label="Thu nhỏ ảnh" title="Thu nhỏ">
              <Minus size={20} />
            </button>
            <span className="w-14 text-center text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((value) => Math.min(value + 0.25, 3))} className="product-action-icon" aria-label="Phóng to ảnh" title="Phóng to">
              <Plus size={20} />
            </button>
            <button type="button" onClick={() => setZoom(1)} className="product-action-icon" aria-label="Đặt lại kích thước ảnh" title="Đặt lại">
              <RotateCcw size={20} />
            </button>
            <div className="mx-1 h-6 w-px" style={{ background: 'var(--surface-level-4-border)' }} />
            <button type="button" onClick={onClose} className="product-action-icon" aria-label="Đóng" title="Đóng">
              <X size={22} />
            </button>
          </div>
        </div>

        <div
          className="relative min-h-0 min-w-0 overflow-hidden"
          style={{
            background: 'var(--surface-level-2)',
          }}
        >
          <div
            className="flex h-full min-h-0 min-w-0 items-center justify-center overflow-hidden p-4"
            style={{
              background: 'color-mix(in srgb, var(--surface-level-1) 72%, transparent)',
            }}
          >
            <img
              src={images[currentIndex]}
              alt={`${titlePrefix} ${currentIndex + 1}`}
              className="block select-none object-contain"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                aspectRatio: 'auto',
                minWidth: 0,
                minHeight: 0,
                maxWidth: '100%',
                maxHeight: '100%',
                transform: `scale3d(${zoom}, ${zoom}, 1)`,
                transformOrigin: 'center',
                transition: 'transform 160ms ease',
              }}
              draggable={false}
            />
          </div>

          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={showPrevious}
                className="product-action-icon"
                style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  zIndex: 20,
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  transform: 'translateY(-50%)',
                  background: 'var(--surface-level-4)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-strong)',
                }}
                aria-label="Ảnh trước"
                title="Ảnh trước"
              >
                <ChevronLeft size={34} />
              </button>
              <button
                type="button"
                onClick={showNext}
                className="product-action-icon"
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  zIndex: 20,
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  transform: 'translateY(-50%)',
                  background: 'var(--surface-level-4)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-strong)',
                }}
                aria-label="Ảnh tiếp theo"
                title="Ảnh tiếp theo"
              >
                <ChevronRight size={34} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
