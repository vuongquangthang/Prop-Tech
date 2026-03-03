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
    case UserRole.MANAGER:
    case UserRole.ACCOUNTANT:
    case UserRole.STAFF:
      return '/dashboard';
    case UserRole.RESIDENT:
      return '/resident';
    default:
      return '/';
  }
}

// Route Access Rules
export const ROUTE_ACCESS = {
  // Admin routes - require admin/manager
  '/dashboard': [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.STAFF],
  '/building-management': [UserRole.ADMIN, UserRole.MANAGER],
  '/resident-management': [UserRole.ADMIN, UserRole.MANAGER],
  '/contract-management': [UserRole.ADMIN, UserRole.MANAGER],
  '/invoice-management': [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT],
  '/transaction-history': [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT],
  '/payment-history': [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT],
  '/debt-management': [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT],
  '/service-pricing': [UserRole.ADMIN, UserRole.MANAGER],
  '/asset-inventory': [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
  '/settlement': [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT],
  '/utility-reading': [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
  '/maintenance-request': [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
  '/knowledge-base': [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
  '/chat-history': [UserRole.ADMIN, UserRole.MANAGER],
  '/revenue-report': [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT],
  '/occupancy-report': [UserRole.ADMIN, UserRole.MANAGER],
  '/debt-report': [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT],
  '/user-accounts': [UserRole.ADMIN],
  '/audit-logs': [UserRole.ADMIN],
  
  // Resident routes - only residents
  '/resident': [UserRole.RESIDENT],
  '/resident/*': [UserRole.RESIDENT],
};
