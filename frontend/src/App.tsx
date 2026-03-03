import { RouterProvider } from 'react-router';
import { router } from './routes.tsx';
import './styles/globals.css';
import { SearchProvider } from './contexts/SearchContext';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <SearchProvider>
          <RouterProvider router={router} />
        </SearchProvider>
      </DataProvider>
    </AuthProvider>
  );
}