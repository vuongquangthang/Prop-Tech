import { describe, expect, it } from 'vitest';
import { isVietnamPhoneNumber, normalizeVietnamPhone, parseMoneyInput, validatePostDraft } from './postValidation';

describe('postValidation helpers', () => {
  it('normalizes and validates Vietnamese phone numbers', () => {
    expect(normalizeVietnamPhone('(+84) 912 345 678')).toBe('+84912345678');
    expect(isVietnamPhoneNumber('0912345678')).toBe(true);
    expect(isVietnamPhoneNumber('+84912345678')).toBe(true);
    expect(isVietnamPhoneNumber('123456')).toBe(false);
  });

  it('parses money input with separators', () => {
    expect(parseMoneyInput('8.500.000')).toBe(8500000);
    expect(parseMoneyInput('25,000')).toBe(25000);
  });

  it('flags invalid post drafts', () => {
    const result = validatePostDraft(
      {
        title: '',
        roomId: '',
        baseRentPrice: '',
        moveInType: 'from-date',
        moveInDate: '',
        floodProne: 'no',
        landlordRequirements: '',
        contactType: 'other',
        contactName: '',
        contactPhone: '123',
        servicePrices: { electricity: '', water: '' },
        imageUrls: [],
      },
      ['electricity', 'water']
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.title).toBeTruthy();
    expect(result.errors.roomId).toBeTruthy();
    expect(result.errors.baseRentPrice).toBeTruthy();
    expect(result.errors.moveInDate).toBeTruthy();
    expect(result.errors.contactName).toBeTruthy();
    expect(result.errors.contactPhone).toBeTruthy();
    expect(result.errors.servicePrices.electricity).toBeTruthy();
  });
});