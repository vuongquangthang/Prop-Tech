import { RouterProvider } from 'react-router';
import { router } from './routes.tsx';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Toaster richColors position="top-right" closeButton />
        <RouterProvider router={router} />
      </DataProvider>
    </AuthProvider>
  );
}
