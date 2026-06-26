import { UserDto } from '../types/dto';

export const ADMIN_APP_ROLES = ['Admin', 'QuanLy', 'NhanVien', 'KeToan'];

export const isAdminAppUser = (user?: UserDto | null) => {
  if (!user?.role) return false;
  return ADMIN_APP_ROLES.includes(user.role);
};

export const getRoleLabel = (role?: string) => {
  switch (role) {
    case 'Admin':
      return 'Quản trị viên';
    case 'QuanLy':
      return 'Quản lý';
    case 'NhanVien':
      return 'Nhân viên';
    case 'KeToan':
      return 'Kế toán';
    default:
      return role || 'Người dùng';
  }
};
