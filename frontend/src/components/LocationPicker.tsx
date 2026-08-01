import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  autocompleteAddress,
  createSessionToken,
  forwardGeocode,
  getPlaceDetail,
  hasGoongApiKey,
  scanNearbyAddressCandidates,
  type GoongPrediction,
  type LatLng,
  type ResolvedLocation,
} from '../services/goongLocation.service';

// Key MapTiles cua Goong (nen ban do vector). Neu thieu se fallback ve OpenStreetMap.
const GOONG_MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY || '';

// Icon ghim tuong minh (khong phu thuoc Default cua Leaflet, tranh marker khong hien khi dung Vite).
const PIN_ICON = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type Props = {
  lat?: number | null;
  lng?: number | null;
  // Goi y tu dia chi nhap o form (de bam "tim tren ban do")
  addressQuery?: string;
  onChange: (lat: number, lng: number, location?: ResolvedLocation) => void;
  // Chi xem: khong cho keo/click/tim/nhap toa do. Dung khi phong lay vi tri theo toa nha.
  readOnly?: boolean;
};

const DEFAULT_CENTER: [number, number] = [21.0278, 105.8342]; // Ha Noi

export function LocationPicker({ lat, lng, addressQuery, onChange, readOnly = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  // Debounce quet dia chi khi click/keo ghim lien tuc -> tranh 429 (rate limit Goong).
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Session token dung chung cho chuoi autocomplete -> place detail cua 1 luot tim.
  const sessionTokenRef = useRef<string>(createSessionToken());
  // Huy request autocomplete cu khi nguoi dung tim lai.
  const searchAbortRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState(addressQuery || '');
  const [suggestions, setSuggestions] = useState<GoongPrediction[]>([]);
  const [nearbySuggestions, setNearbySuggestions] = useState<ResolvedLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualLat, setManualLat] = useState<string>(typeof lat === 'number' ? String(lat) : '');
  const [manualLng, setManualLng] = useState<string>(typeof lng === 'number' ? String(lng) : '');
  const [message, setMessage] = useState('');

  // Khoi tao ban do 1 lan
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const start: [number, number] =
      typeof lat === 'number' && typeof lng === 'number' ? [lat, lng] : DEFAULT_CENTER;
    const map = L.map(containerRef.current).setView(start, lat && lng ? 16 : 12);

    if (GOONG_MAPTILES_KEY) {
      // Nen ban do Goong MapTiles (vector) render qua MapLibre GL, van giu Leaflet cho marker/click/drag.
      (L as any).maplibreGL({
        style: `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAPTILES_KEY}`,
        // Dinh kem api_key cho moi request tile/style cua Goong.
        transformRequest: (url: string) => {
          if (url.includes('tiles.goong.io') && !url.includes('api_key=')) {
            return { url: `${url}${url.includes('?') ? '&' : '?'}api_key=${GOONG_MAPTILES_KEY}` };
          }
          return { url };
        },
      }).addTo(map);
    } else {
      // Fallback: khong co key Goong -> dung OpenStreetMap.
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
    }

    // Marker co dinh: KEO MAP chi de xem (Leaflet khong bat 'click' khi pan), CLICK moi dat ghim.
    // Marker co the keo de tinh chinh. Sau khi dat, zoom/pan xem duong KHONG lam doi vi tri da chon.
    const marker = L.marker(start, { draggable: !readOnly, icon: PIN_ICON }).addTo(map);
    if (!readOnly) {
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        applyManualPoint({ lat: p.lat, lng: p.lng }, true);
      });
      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        applyManualPoint({ lat: e.latlng.lat, lng: e.latlng.lng }, true);
      });
    }

    mapRef.current = map;
    markerRef.current = marker;
    // Sua loi ban do xam khi container vua mount trong modal
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dong bo marker khi lat/lng tu ngoai thay doi (vd sua toa nha).
  useEffect(() => {
    if (typeof lat === 'number' && typeof lng === 'number' && markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], 16);
      setManualLat(String(lat));
      setManualLng(String(lng));
    }
  }, [lat, lng]);

  useEffect(() => {
    if (!query && addressQuery) {
      setQuery(addressQuery);
    }
  }, [addressQuery, query]);

  // Dat marker + dua map ve diem do (chon goi y / nhap tay / quet).
  function setMarker(point: LatLng, zoom = 16) {
    markerRef.current?.setLatLng([point.lat, point.lng]);
    mapRef.current?.setView([point.lat, point.lng], zoom);
    setManualLat(String(point.lat));
    setManualLng(String(point.lng));
  }

  async function runSearch(text: string) {
    const q = text.trim();
    if (!q) return;
    setSearching(true);
    setMessage('');
    setNearbySuggestions([]);
    // Huy luot tim truoc do (neu con dang chay) va bat dau 1 phien token moi.
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    sessionTokenRef.current = createSessionToken();
    try {
      const res = await autocompleteAddress(q, {
        bias: currentPoint(),
        sessionToken: sessionTokenRef.current,
        signal: controller.signal,
      });
      setSuggestions(res);
      if (res.length === 0) {
        const geocoded = await forwardGeocode(q);
        if (geocoded) {
          pickResolved(geocoded);
        } else {
          setMessage('Không tìm thấy địa chỉ chính xác. Hãy nhập toạ độ thủ công hoặc click/kéo ghim trên bản đồ, rồi quét gợi ý trong bán kính 5m.');
        }
      }
    } finally {
      setSearching(false);
    }
  }

  async function pick(item: GoongPrediction) {
    const detail = await getPlaceDetail(item.placeId, sessionTokenRef.current);
    if (!detail) {
      setMessage('Không lấy được toạ độ từ gợi ý này. Hãy thử gợi ý khác hoặc chọn thủ công.');
      return;
    }
    pickResolved(detail);
  }

  function pickResolved(location: ResolvedLocation) {
    setMarker(location);
    onChange(location.lat, location.lng, location);
    setSuggestions([]);
    setNearbySuggestions([]);
    setQuery(location.address);
    setMessage('Đã xác định vị trí từ Goong.');
    // Ket thuc phien tim kiem: luot sau dung token moi.
    sessionTokenRef.current = createSessionToken();
  }

  function currentPoint(): LatLng | undefined {
    const lat2 = Number(manualLat);
    const lng2 = Number(manualLng);
    return Number.isFinite(lat2) && Number.isFinite(lng2) ? { lat: lat2, lng: lng2 } : undefined;
  }

  function applyManualPoint(point: LatLng, scanAfter = false) {
    setMarker(point);
    const location: ResolvedLocation = {
      ...point,
      address: query || addressQuery || `${point.lat}, ${point.lng}`,
      source: 'manual',
      accuracy: 'manual-marker',
    };
    onChange(point.lat, point.lng, location);
    setMessage('Đã chọn toạ độ thủ công. Đang tìm địa chỉ gần nhất...');
    if (scanAfter) {
      scheduleScan(point);
    }
  }

  // Debounce 500ms: click/keo ghim lien tuc chi goi quet 1 lan.
  function scheduleScan(point: LatLng) {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    scanTimerRef.current = setTimeout(() => {
      void scanAround(point);
    }, 500);
  }

  async function applyManualInputs() {
    const lat2 = Number(manualLat);
    const lng2 = Number(manualLng);
    if (!Number.isFinite(lat2) || !Number.isFinite(lng2) || lat2 < -90 || lat2 > 90 || lng2 < -180 || lng2 > 180) {
      setMessage('Toạ độ không hợp lệ. Vĩ độ từ -90 đến 90, kinh độ từ -180 đến 180.');
      return;
    }

    applyManualPoint({ lat: lat2, lng: lng2 }, true);
  }

  async function scanAround(point = currentPoint()) {
    if (!point) {
      setMessage('Hãy chọn hoặc nhập toạ độ trước khi quét 5m.');
      return;
    }

    setScanning(true);
    setNearbySuggestions([]);
    try {
      const results = await scanNearbyAddressCandidates(point, 5);
      setNearbySuggestions(results);
      setMessage(
        results.length > 0
          ? 'Chọn một địa chỉ gợi ý gần ghim để lưu làm địa chỉ chuẩn.'
          : 'Chưa có địa chỉ gợi ý quanh điểm này. Có thể lưu theo toạ độ thủ công.',
      );
    } finally {
      setScanning(false);
    }
  }

  function pickNearby(location: ResolvedLocation) {
    setMarker({ lat: location.lat, lng: location.lng });
    setQuery(location.address);
    setNearbySuggestions([]);
    setSuggestions([]);
    onChange(location.lat, location.lng, {
      ...location,
      source: 'manual-nearby-scan',
      accuracy: 'nearest-address-5m',
    });
    setMessage('Đã chọn địa chỉ gần nhất quanh toạ độ thủ công.');
  }

  return (
    <div className="space-y-3">
      {!readOnly && !hasGoongApiKey() && (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Chưa cấu hình VITE_GOONG_API_KEY, phần tìm địa chỉ bằng Goong sẽ không hoạt động. Vẫn có thể chọn ghim/toạ độ thủ công.
        </p>
      )}

      {!readOnly && (
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void runSearch(query || addressQuery || '');
              }
            }}
            placeholder="Tìm địa chỉ bằng Goong..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
          />
          <button
            type="button"
            onClick={() => void runSearch(query || addressQuery || '')}
            disabled={searching}
            className="px-3 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 whitespace-nowrap"
          >
            {searching ? 'Đang tìm...' : 'Tìm'}
          </button>
        </div>
      )}

      {!readOnly && suggestions.length > 0 && (
        <div className="rounded border border-gray-200 bg-white shadow-sm">
          {suggestions.map((s, i) => (
            <button
              key={`${s.placeId}-${i}`}
              type="button"
              onClick={() => void pick(s)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              {s.description}
            </button>
          ))}
        </div>
      )}

      <div ref={containerRef} className="h-64 w-full overflow-hidden rounded border border-gray-300" />
      {readOnly ? (
        <p className="text-xs text-gray-500">Vị trí lấy theo toà nhà. Muốn đổi, hãy cập nhật toạ độ ở phần quản lý toà nhà.</p>
      ) : (
        <p className="text-xs text-gray-500">Kéo bản đồ để xem, bấm vào vị trí để đặt ghim. Có thể kéo ghim để tinh chỉnh; phóng to/thu nhỏ không làm đổi vị trí đã chọn.</p>
      )}

      {!readOnly && (
        <div className="rounded border border-gray-200 bg-gray-50 p-3 space-y-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-xs text-gray-600">
              Vĩ độ
              <input
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                placeholder="VD: 21.0278"
              />
            </label>
            <label className="text-xs text-gray-600">
              Kinh độ
              <input
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                placeholder="VD: 105.8342"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void applyManualInputs()}
              className="rounded bg-white px-3 py-2 text-xs font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-100"
            >
              Áp dụng toạ độ thủ công
            </button>
            <button
              type="button"
              onClick={() => void scanAround()}
              disabled={scanning}
              className="rounded bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {scanning ? 'Đang quét...' : 'Quét địa chỉ quanh 5m'}
            </button>
          </div>
        </div>
      )}

      {!readOnly && nearbySuggestions.length > 0 && (
        <div className="rounded border border-blue-100 bg-blue-50">
          {nearbySuggestions.map((item, i) => (
            <button
              key={`${item.address}-${i}`}
              type="button"
              onClick={() => pickNearby(item)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-100"
            >
              <span className="font-medium">{item.address}</span>
              <span className="ml-2 text-xs text-gray-500">
                ~{Math.round(item.distanceMeters ?? 0)}m
              </span>
            </button>
          ))}
        </div>
      )}

      {!readOnly && message && <p className="text-xs text-gray-600">{message}</p>}
      {!readOnly && (
        <p className="text-xs text-gray-500">
          Nếu địa chỉ/tên toà nhà/mã đất không tìm được, hãy click/kéo ghim hoặc nhập toạ độ thủ công, quét 5m quanh ghim rồi chọn địa chỉ gần nhất để lưu.
        </p>
      )}
    </div>
  );
}
