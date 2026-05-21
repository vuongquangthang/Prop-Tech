export const DEFAULT_AMENITIES = [
  'Máy giặt',
  'Tủ lạnh',
  'Điều hòa',
  'Bình nóng lạnh',
  'Tủ quần áo',
  'Giường',
];

export const mergeAmenities = (primary: string[], secondary: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];

  const push = (value: string) => {
    const normalized = (value || '').trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  };

  primary.forEach(push);
  secondary.forEach(push);

  return result;
};
