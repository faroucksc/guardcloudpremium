'use client';

import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Device = {
  deviceId: string;
  clientId?: string;
  clientName?: string;
  name?: string;
  deviceType?: string;
  category?: string;
  lat?: number;
  lng?: number;
  battery?: number;
  updatedAt?: string;
  lastHeartbeat?: string;
  lastUpdatedAt?: string;
  source?: string;
};

// Fix icônes Leaflet sur Next
const DefaultIcon = L.icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function DevicesMapClient() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const center: LatLngTuple = [12.3657, -1.5339]; // Ouaga par défaut

  async function loadDevices() {
    try {
      setError(null);
      const res = await fetch('/api/devices', { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erreur API');
      }

      const list: Device[] = (data.devices || []).filter(
        (d: any) => typeof d.lat === 'number' && typeof d.lng === 'number'
      );

      setDevices(list);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 1er chargement
    loadDevices();

    // Rafraîchissement toutes les 15s
    const id = setInterval(loadDevices, 15000);
    return () => clearInterval(id);
  }, []);

  async function ringDevice(device: Device) {
    if (!device.deviceId) return;
    try {
      setSendingId(device.deviceId);
      setError(null);

      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device.deviceId,
          action: 'RING',
          message: 'Téléphone volé – SahelGuard Yarmotek',
          durationSec: 20,
          level: 'HIGH',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Commande refusée');
      }

      alert(
        `Commande de sonnerie envoyée à ${device.clientName || device.name || device.deviceId}`
      );
    } catch (e: any) {
      console.error(e);
      alert(`Erreur envoi commande: ${e.message || e}`);
    } finally {
      setSendingId(null);
    }
  }

  const lastUpdateText = (d: Device) =>
    d.updatedAt || d.lastUpdatedAt || d.lastHeartbeat || '—';

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col">
      <div className="p-3 flex items-center justify-between border-b">
        <div>
          <h1 className="text-lg font-semibold">
            Carte des appareils SahelGuard / GuardCloud
          </h1>
          <p className="text-xs text-gray-500">
            Appareils actifs : {devices.length}{' '}
            {loading && '· chargement…'}
          </p>
          {error && (
            <p className="text-xs text-red-500 mt-1">
              Erreur : {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1">
        <MapContainer
          center={center}
          zoom={12}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {devices.map((d) => (
            <Marker
              key={d.deviceId}
              position={[d.lat!, d.lng!] as LatLngTuple}
            >
              <Popup>
                <div className="space-y-1 text-xs">
                  <div className="font-semibold">
                    {d.name || d.deviceType || 'Appareil'}
                  </div>
                  <div>
                    Client :{' '}
                    <span className="font-medium">
                      {d.clientName || d.clientId || '—'}
                    </span>
                  </div>
                  <div>
                    ID : <span className="font-mono">{d.deviceId}</span>
                  </div>
                  <div>
                    Batterie : {d.battery ?? '—'}%
                  </div>
                  <div>
                    Dernier signal : {lastUpdateText(d)}
                  </div>
                  <button
                    className="mt-2 px-3 py-1 rounded bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60"
                    onClick={() => ringDevice(d)}
                    disabled={sendingId === d.deviceId}
                  >
                    {sendingId === d.deviceId
                      ? 'Envoi…'
                      : 'Faire sonner (ANTIVOL)'}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
