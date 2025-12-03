'use client';

import React, { useEffect, useMemo, useState } from 'react';

// ATTENTION : PAS d'import "leaflet/dist/leaflet.css" ici !
// On va charger la CSS via <link> CDN dans app/layout.tsx.

// Types simples
type LatLngTuple = [number, number];

type ApiDevice = {
  id?: string;
  deviceId?: string;
  name?: string;
  type?: string;
  category?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  battery?: number | null;
  status?: string;
  online?: boolean;
  isOnline?: boolean;
};

type ApiResponse = {
  ok: boolean;
  devices?: ApiDevice[];
  items?: ApiDevice[];
};

const API_BASE =
  'https://yarmotek-guardcloud-api.myarbanga.workers.dev';

export default function DevicesMapClient() {
  const [devices, setDevices] = useState<ApiDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultCenter: LatLngTuple = [12.3657, -1.5339];
  const defaultZoom = 12;

  // ==== Chargement depuis l'API GuardCloud ====
  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/device/list`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json: ApiResponse = await res.json();

      const rawList =
        json.devices && json.devices.length
          ? json.devices
          : json.items && json.items.length
          ? json.items
          : [];

      const cleaned = rawList.filter((d) => {
        const lat =
          typeof d.lat === 'number'
            ? d.lat
            : typeof d.latitude === 'number'
            ? d.latitude
            : NaN;
        const lng =
          typeof d.lng === 'number'
            ? d.lng
            : typeof d.longitude === 'number'
            ? d.longitude
            : NaN;
        return Number.isFinite(lat) && Number.isFinite(lng);
      });

      setDevices(cleaned);
    } catch (e: any) {
      console.error('Erreur chargement devices:', e);
      setError(e?.message ?? 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const id = setInterval(fetchDevices, 20000);
    return () => clearInterval(id);
  }, []);

  const mapCenter: LatLngTuple = useMemo(() => {
    if (!devices.length) return defaultCenter;
    const d = devices[0];
    const lat =
      (typeof d.lat === 'number' ? d.lat : d.latitude) ??
      defaultCenter[0];
    const lng =
      (typeof d.lng === 'number' ? d.lng : d.longitude) ??
      defaultCenter[1];
    return [lat as number, lng as number];
  }, [devices]);

  // Important : ne rien faire lié au DOM côté serveur
  if (typeof window === 'undefined') {
    return (
      <div className="w-full h-[calc(100vh-140px)] flex items-center justify-center bg-slate-900 text-white">
        Chargement de la carte GuardCloud...
      </div>
    );
  }

  // Import dynamique de Leaflet uniquement côté client
  const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');
  const L = require('leaflet');

  const defaultIcon = new L.Icon({
    iconUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  L.Icon.Default.mergeOptions({
    iconUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  return (
    <div className="w-full h-[calc(100vh-140px)] relative bg-slate-900">
      {/* Bandeau debug */}
      <div className="absolute z-[500] left-4 top-4 bg-black/70 text-white px-4 py-2 rounded-xl text-sm space-y-1 shadow-lg">
        <div className="font-semibold">
          🌍 Yarmotek GuardCloud – DEBUG LIVE
        </div>
        <div>
          Devices chargés :{' '}
          <span className="font-bold text-emerald-300">
            {devices.length}
          </span>
        </div>
        {loading && (
          <div className="text-xs text-blue-300">Chargement…</div>
        )}
        {error && (
          <div className="text-xs text-red-300">
            Erreur API : {error}
          </div>
        )}
        <button
          onClick={fetchDevices}
          className="mt-1 text-xs border border-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/20"
        >
          Rafraîchir maintenant
        </button>
      </div>

      {/* Carte */}
      <MapContainer
        center={mapCenter}
        zoom={defaultZoom}
        className="w-full h-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {devices.map((d) => {
          const lat =
            (typeof d.lat === 'number' ? d.lat : d.latitude) ??
            null;
          const lng =
            (typeof d.lng === 'number' ? d.lng : d.longitude) ??
            null;
          if (lat === null || lng === null) return null;

          const key = d.deviceId || d.id || `${lat}-${lng}`;
          const label =
            d.name ||
            d.deviceId ||
            d.id ||
            `Device-${String(key).slice(-4)}`;

          const status =
            d.status ||
            (d.online || d.isOnline ? 'ONLINE' : 'OFFLINE');

          return (
            <Marker
              key={key}
              position={[lat, lng]}
              icon={defaultIcon}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold mb-1">
                    {label}
                  </div>
                  <div>Type : {d.type || d.category || 'N/A'}</div>
                  <div>Statut : {status}</div>
                  {typeof d.battery === 'number' && (
                    <div>Batterie : {d.battery}%</div>
                  )}
                  <div>
                    Lat/Lng : {lat.toFixed(5)} / {lng.toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
