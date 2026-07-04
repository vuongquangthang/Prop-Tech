const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY || '';
const GOONG_REST = 'https://rsapi.goong.io';

// Sinh session token cho 1 luot nhap (autocomplete -> place detail dung chung token
// de Goong tinh 1 phien tim kiem, toi uu quota). V2 bo qua neu khong ho tro -> vo hai.
export function createSessionToken(): string {
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export type LatLng = {
  lat: number;
  lng: number;
};

export type GoongPrediction = {
  description: string;
  placeId: string;
};

export type ResolvedLocation = LatLng & {
  address: string;
  placeId?: string;
  source: 'goong-autocomplete' | 'goong-geocode' | 'manual' | 'manual-nearby-scan';
  accuracy?: string;
  distanceMeters?: number;
};

function hasValidKey() {
  return Boolean(GOONG_API_KEY);
}

function normalizePrediction(item: any): GoongPrediction | null {
  const description = item?.description;
  const placeId = item?.place_id;
  if (typeof description !== 'string' || typeof placeId !== 'string') {
    return null;
  }
  return { description, placeId };
}

function normalizeResult(item: any, fallbackAddress = ''): Omit<ResolvedLocation, 'source'> | null {
  const loc = item?.geometry?.location;
  if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
    return null;
  }

  return {
    lat: loc.lat,
    lng: loc.lng,
    address: item?.formatted_address || item?.name || fallbackAddress,
    placeId: item?.place_id,
  };
}

type AutocompleteOptions = {
  bias?: LatLng;
  sessionToken?: string;
  signal?: AbortSignal;
};

export async function autocompleteAddress(
  input: string,
  options: AutocompleteOptions = {},
): Promise<GoongPrediction[]> {
  const q = input.trim();
  if (!hasValidKey() || q.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    api_key: GOONG_API_KEY,
    input: q,
    limit: '8',
    more_compound: 'true',
    has_deprecated_administrative_unit: 'true',
  });
  if (options.bias) {
    params.set('location', `${options.bias.lat},${options.bias.lng}`);
    // origin de Goong sap xep theo khoang cach va tra distance_meters.
    params.set('origin', `${options.bias.lat},${options.bias.lng}`);
  }
  if (options.sessionToken) {
    params.set('sessiontoken', options.sessionToken);
  }

  try {
    const res = await fetch(`${GOONG_REST}/v2/place/autocomplete?${params.toString()}`, {
      signal: options.signal,
    });
    const data = await res.json();
    return (Array.isArray(data?.predictions) ? data.predictions : [])
      .map(normalizePrediction)
      .filter(Boolean) as GoongPrediction[];
  } catch {
    return [];
  }
}

export async function getPlaceDetail(
  placeId: string,
  sessionToken?: string,
): Promise<ResolvedLocation | null> {
  if (!hasValidKey() || !placeId) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY,
      place_id: placeId,
      has_deprecated_administrative_unit: 'true',
    });
    if (sessionToken) {
      params.set('sessiontoken', sessionToken);
    }
    const res = await fetch(`${GOONG_REST}/v2/place/detail?${params.toString()}`);
    const data = await res.json();
    const result = normalizeResult(data?.result);
    return result ? { ...result, source: 'goong-autocomplete', accuracy: 'place-detail' } : null;
  } catch {
    return null;
  }
}

export async function forwardGeocode(address: string): Promise<ResolvedLocation | null> {
  const q = address.trim();
  if (!hasValidKey() || !q) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY,
      address: q,
      has_deprecated_administrative_unit: 'true',
    });
    const res = await fetch(`${GOONG_REST}/v2/geocode?${params.toString()}`);
    const data = await res.json();
    const result = normalizeResult(data?.results?.[0], q);
    return result ? { ...result, source: 'goong-geocode', accuracy: 'geocode' } : null;
  } catch {
    return null;
  }
}

export async function reverseGeocode(point: LatLng): Promise<ResolvedLocation | null> {
  if (!hasValidKey()) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY,
      latlng: `${point.lat},${point.lng}`,
    });
    const res = await fetch(`${GOONG_REST}/v2/geocode?${params.toString()}`);
    const data = await res.json();
    const result = normalizeResult(data?.results?.[0], `${point.lat}, ${point.lng}`);
    return result ? { ...result, source: 'manual-nearby-scan', accuracy: 'reverse-geocode' } : null;
  } catch {
    return null;
  }
}

// Chi reverse-geocode 1 diem (tam) de lay dia chi gan nhat.
// Truoc day quet 9 diem trong ban kinh 5m -> ton 9 request/lan, de dinh 429 (rate limit Goong).
// Trong 5m cac diem gan nhu cung mot dia chi nen 1 request la du.
export async function scanNearbyAddressCandidates(point: LatLng, _radiusMeters = 5): Promise<ResolvedLocation[]> {
  const result = await reverseGeocode(point);
  if (!result || !result.address.trim()) {
    return [];
  }
  return [
    {
      ...result,
      lat: point.lat,
      lng: point.lng,
      distanceMeters: 0,
    },
  ];
}

export function hasGoongApiKey() {
  return hasValidKey();
}
