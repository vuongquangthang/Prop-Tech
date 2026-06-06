// User Roles
export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  RESIDENT = 'Resident',
  STAFF = 'Staff',
  ACCOUNTANT = 'Accountant',
}

// Role Display Names (Vietnamese)
export const ROLE_NAMES: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Quản trị viên',
  [UserRole.MANAGER]: 'Quản lý',
  [UserRole.RESIDENT]: 'Cư dân',
  [UserRole.STAFF]: 'Nhân viên',
  [UserRole.ACCOUNTANT]: 'Kế toán',
};

// Role Permissions
export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: [
    'dashboard.view',
    'buildings.manage',
    'residents.manage',
    'contracts.manage',
    'invoices.manage',
    'payments.manage',
    'services.manage',
    'assets.manage',
    'maintenance.manage',
    'reports.view',
    'users.manage',
    'audit.view',
    'settings.manage',
  ],
  [UserRole.MANAGER]: [
    'dashboard.view',
    'buildings.view',
    'residents.manage',
    'contracts.manage',
    'invoices.manage',
    'payments.view',
    'services.view',
    'assets.view',
    'maintenance.manage',
    'reports.view',
  ],
  [UserRole.ACCOUNTANT]: [
    'dashboard.view',
    'invoices.manage',
    'payments.manage',
    'reports.view',
    'debt.manage',
  ],
  [UserRole.STAFF]: [
    'dashboard.view',
    'maintenance.manage',
    'residents.view',
    'assets.view',
  ],
  [UserRole.RESIDENT]: [
    'resident.dashboard',
    'resident.bills',
    'resident.payments',
    'resident.incidents',
    'resident.chat',
    'resident.profile',
  ],
};

// Check if user has permission
export function hasPermission(userRole: string, permission: string): boolean {
  const role = userRole as UserRole;
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

// Check if user has any of the required roles
export function hasAnyRole(userRole: string, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole as UserRole);
}

// Get default redirect path based on role
export function getDefaultRoute(role: string): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/dashboard';
    case UserRole.MANAGER:
      return '/post-management';
    case UserRole.ACCOUNTANT:
    case UserRole.STAFF:
    case UserRole.RESIDENT:
      return '/unauthorized';
    default:
      return '/';
  }
}

// Route Access Rules
export const ROUTE_ACCESS = {
  // Admin web routes - admin only
  '/dashboard': [UserRole.ADMIN],
  '/building-management': [UserRole.ADMIN],
  '/resident-management': [UserRole.ADMIN],
  '/contract-management': [UserRole.ADMIN],
  '/invoice-management': [UserRole.ADMIN],
  '/transaction-history': [UserRole.ADMIN],
  '/payment-history': [UserRole.ADMIN],
  '/debt-management': [UserRole.ADMIN],
  '/service-pricing': [UserRole.ADMIN],
  '/asset-inventory': [UserRole.ADMIN],
  '/settlement': [UserRole.ADMIN],
  '/utility-reading': [UserRole.ADMIN],
  '/maintenance-request': [UserRole.ADMIN],
  '/post-management': [UserRole.ADMIN, UserRole.MANAGER],
  '/post-management/create': [UserRole.ADMIN, UserRole.MANAGER],
  '/messages': [UserRole.ADMIN, UserRole.MANAGER],
  '/knowledge-base': [UserRole.ADMIN],
  '/chat-history': [UserRole.ADMIN],
  '/revenue-report': [UserRole.ADMIN],
  '/occupancy-report': [UserRole.ADMIN],
  '/user-accounts': [UserRole.ADMIN],
  '/audit-logs': [UserRole.ADMIN, UserRole.MANAGER],
  
};
