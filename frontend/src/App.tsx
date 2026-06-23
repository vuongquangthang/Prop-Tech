import { RouterProvider } from 'react-router';
import { router } from './routes.tsx';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Toaster } from 'sonner';
import { useEffect } from 'react';

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme} richColors position="top-right" closeButton />;
}

function ModalBackdropCloser() {
  useEffect(() => {
    const closeLabels = ['đóng', 'hủy', 'đã hiểu', 'cancel', 'close'];

    const handleBackdropClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.classList.contains('admin-content-modal-overlay')) return;

      const overlay = target;
      const xIcon = overlay.querySelector('svg.lucide-x');
      const xButton = xIcon?.closest('button') as HTMLButtonElement | null;
      if (xButton && !xButton.disabled) {
        xButton.click();
        return;
      }

      const closeButton = [...overlay.querySelectorAll('button')]
        .find((button) => closeLabels.includes(button.textContent?.trim().toLowerCase() ?? '')) as HTMLButtonElement | undefined;
      if (closeButton && !closeButton.disabled) {
        closeButton.click();
      }
    };

    document.addEventListener('mousedown', handleBackdropClick);
    return () => document.removeEventListener('mousedown', handleBackdropClick);
  }, []);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <ModalBackdropCloser />
          <ThemedToaster />
          <RouterProvider router={router} />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
