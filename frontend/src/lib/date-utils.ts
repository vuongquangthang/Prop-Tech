export function formatLocalDateInput(value?: Date | string | null): string {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(value?: Date | string | null, fallback = '—'): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDisplayDateTime(value?: Date | string | null, fallback = '—'): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatDisplayDate(date, fallback)} ${hours}:${minutes}`;
}

export function toLocalIsoString(dateInput: Date | string): string {
  if (typeof dateInput === 'string') {
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0).toISOString();
    }
  }

  const date = dateInput instanceof Date ? new Date(dateInput.getTime()) : new Date(dateInput);
  return date.toISOString();
}
