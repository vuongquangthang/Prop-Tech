import { RouterProvider } from 'react-router';
import { router } from './routes.tsx';
import { SearchProvider } from './contexts/SearchContext';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <SearchProvider>
          <Toaster richColors position="top-right" closeButton />
          <RouterProvider router={router} />
        </SearchProvider>
      </DataProvider>
    </AuthProvider>
  );
}
