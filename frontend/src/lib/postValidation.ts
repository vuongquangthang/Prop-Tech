export interface PostFormDraft {
  title: string;
  roomId: string;
  baseRentPrice: string;
  moveInType: 'immediate' | 'from-date';
  moveInDate: string;
  floodProne: 'yes' | 'no';
  landlordRequirements: string;
  contactType: 'current' | 'other';
  contactName: string;
  contactPhone: string;
  servicePrices: Record<string, string>;
  imageUrls: string[];
}

export interface PostValidationResult {
  isValid: boolean;
  errors: {
    title?: string;
    roomId?: string;
    baseRentPrice?: string;
    moveInDate?: string;
    contactName?: string;
    contactPhone?: string;
    servicePrices: Record<string, string>;
  };
}

const vietnamPhonePattern = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;
const moneyFormatter = new Intl.NumberFormat('vi-VN');

export function normalizeVietnamPhone(value: string): string {
  return value.replace(/[\s.()-]/g, '');
}

export function isVietnamPhoneNumber(value: string): boolean {
  const normalized = normalizeVietnamPhone(value);
  const domestic = normalized.startsWith('+84') ? `0${normalized.slice(3)}` : normalized;
  return vietnamPhonePattern.test(domestic);
}

export function parseMoneyInput(value: string): number {
  const digitsOnly = value.replace(/[^\d]/g, '');
  return digitsOnly ? Number(digitsOnly) : 0;
}

export function formatMoneyVnd(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0';
  }

  return moneyFormatter.format(Math.max(0, Math.round(value)));
}

export function validatePostDraft(draft: PostFormDraft, serviceKeys: string[]): PostValidationResult {
  const serviceErrors: Record<string, string> = {};
  const errors: PostValidationResult['errors'] = {
    servicePrices: serviceErrors,
  };

  if (!draft.title.trim()) {
    errors.title = 'Vui lòng nhập tiêu đề bài đăng.';
  }

  if (!draft.roomId) {
    errors.roomId = 'Vui lòng chọn phòng để đăng bài.';
  }

  if (parseMoneyInput(draft.baseRentPrice) <= 0) {
    errors.baseRentPrice = 'Vui lòng nhập giá thuê hợp lệ.';
  }

  if (draft.moveInType === 'from-date' && !draft.moveInDate) {
    errors.moveInDate = 'Vui lòng chọn ngày có thể vào ở.';
  }

  if (draft.contactType === 'other' && !draft.contactName.trim()) {
    errors.contactName = 'Vui lòng nhập tên người liên hệ.';
  }

  if (!isVietnamPhoneNumber(draft.contactPhone)) {
    errors.contactPhone = 'Số điện thoại phải là số Việt Nam hợp lệ.';
  }

  for (const key of serviceKeys) {
    const priceValue = draft.servicePrices[key] ?? '';
    if (parseMoneyInput(priceValue) <= 0) {
      serviceErrors[key] = 'Giá dịch vụ phải lớn hơn 0.';
    }
  }

  const isValid =
    !errors.title &&
    !errors.roomId &&
    !errors.baseRentPrice &&
    !errors.moveInDate &&
    !errors.contactName &&
    !errors.contactPhone &&
    Object.keys(serviceErrors).length === 0;

  return {
    isValid,
    errors,
  };
}