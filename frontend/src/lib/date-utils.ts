export function formatLocalDateInput(value?: Date | string | null): string {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toLocalIsoString(dateInput: Date | string): string {
  const date = dateInput instanceof Date ? new Date(dateInput.getTime()) : new Date(dateInput);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString();
}