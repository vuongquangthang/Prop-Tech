import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, hasAnyRole, getDefaultRoute } from '../lib/roles';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated and auth is required
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no specific roles required, just check authentication
  if (!allowedRoles) {
    return <>{children}</>;
  }

  // Check if user has required role
  if (user && !hasAnyRole(user.role, allowedRoles)) {
    // Redirect to appropriate default route based on user's role
    const defaultRoute = getDefaultRoute(user.role);
    return (
      <Navigate 
        to={defaultRoute} 
        replace 
        state={{ 
          error: 'Bạn không có quyền truy cập trang này',
          from: location 
        }} 
      />
    );
  }

  return <>{children}</>;
}

// Wrapper for Admin-only routes
export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      {children}
    </ProtectedRoute>
  );
}

// Wrapper for Accountant routes
export function AccountantRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      {children}
    </ProtectedRoute>
  );
}

// Wrapper for Staff routes
export function StaffRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      {children}
    </ProtectedRoute>
  );
}

// Public route - accessible without authentication
export function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  // If already authenticated, redirect to default route
  if (isAuthenticated && user) {
    const defaultRoute = getDefaultRoute(user.role);
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
}
