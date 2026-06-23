import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Sua duong dan icon mac dinh cua Leaflet khi dung voi bundler (Vite).
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type Props = {
  lat?: number | null;
  lng?: number | null;
  // Goi y tu dia chi nhap o form (de bam "tim tren ban do")
  addressQuery?: string;
  onChange: (lat: number, lng: number) => void;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: { name?: string; city?: string; district?: string; state?: string; street?: string };
};

const DEFAULT_CENTER: [number, number] = [21.0278, 105.8342]; // Ha Noi

export function LocationPicker({ lat, lng, addressQuery, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [searching, setSearching] = useState(false);

  // Khoi tao ban do 1 lan
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const start: [number, number] =
      typeof lat === 'number' && typeof lng === 'number' ? [lat, lng] : DEFAULT_CENTER;
    const map = L.map(containerRef.current).setView(start, lat && lng ? 16 : 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(start, { draggable: true }).addTo(map);
    marker.on('dragend', () => {
      const p = marker.getLatLng();
      onChange(p.lat, p.lng);
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    });

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

  // Dong bo marker khi lat/lng tu ngoai thay doi (vd sua toa nha)
  useEffect(() => {
    if (typeof lat === 'number' && typeof lng === 'number' && markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], 16);
    }
  }, [lat, lng]);

  async function runSearch(text: string) {
    const q = text.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=default`,
      );
      const data = await res.json();
      setSuggestions(Array.isArray(data?.features) ? data.features : []);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }

  function pick(feature: PhotonFeature) {
    const [lng2, lat2] = feature.geometry.coordinates;
    markerRef.current?.setLatLng([lat2, lng2]);
    mapRef.current?.setView([lat2, lng2], 16);
    onChange(lat2, lng2);
    setSuggestions([]);
    setQuery(featureLabel(feature));
  }

  function featureLabel(f: PhotonFeature): string {
    const p = f.properties || {};
    return [p.name, p.street, p.district, p.city, p.state].filter(Boolean).join(', ');
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void runSearch(query);
            }
          }}
          placeholder="Tìm địa chỉ trên bản đồ..."
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

      {suggestions.length > 0 && (
        <div className="rounded border border-gray-200 bg-white shadow-sm">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => pick(s)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              {featureLabel(s)}
            </button>
          ))}
        </div>
      )}

      <div ref={containerRef} className="h-64 w-full overflow-hidden rounded border border-gray-300" />
      <p className="text-xs text-gray-500">
        Kéo ghim hoặc bấm trên bản đồ để chỉnh đúng vị trí toà nhà.
      </p>
    </div>
  );
}
