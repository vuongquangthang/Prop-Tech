import { ContractDetail } from '../services/contract.service';

const normalizeText = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const isPrimaryResidentRole = (role?: string | null) => {
  const normalized = normalizeText(role);
  return (
    normalized.includes('nguoi thue chinh') ||
    normalized.includes('chu ho') ||
    normalized.includes('chu phong') ||
    normalized.includes('primary') ||
    normalized.includes('owner')
  );
};

export const canResidentManageFinancialActions = (
  contract: ContractDetail | null | undefined,
  residentId?: number | null
) => {
  if (!contract || !residentId) {
    return false;
  }

  const resident = contract.residents?.find(item => item.residentId === residentId);
  return isPrimaryResidentRole(resident?.residencyRole);
};
