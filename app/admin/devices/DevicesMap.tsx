"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";

type Device = {
  deviceId: string;
  name: string;
  clientName?: string;
  category: string;
  lat: number | null;
  lng: number | null;
  battery: number | null;
  charging: boolean | null;
  lastHeartbeat?: string;
};

const { BaseLayer } = LayersControl;

/* ============================================================
   🌍 Centre par défaut : Ouagadougou
============================================================ */
const DEFAULT_CENTER: [number, number] = [12.3657, -1.5339];

/* ============================================================
   🔧 Icône Leaflet par défaut (OK Next.js / Cloudflare)
============================================================ */
const defaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// On applique cette icône à tous les markers
L.Marker.prototype.options.icon = defaultIcon;

/* ============================================================
   🗺️ Composant principal
============================================================ */
export default function DevicesMap({ devices }: { devices: Device[] }) {
  // On garde uniquement les devices avec coordonnées valides
  const coords = (devices || []).filter(
    (d) =>
      typeof d.lat === "number" &&
      !Number.isNaN(d.lat) &&
      typeof d.lng === "number" &&
      !Number.isNaN(d.lng)
  );

  // Centre moyen des devices, sinon centre par défaut
  let center: [number, number] = DEFAULT_CENTER;
  if (coords.length > 0) {
    const sumLat = coords.reduce(
      (sum, d) => sum + (d.lat as number),
      0
    );
    const sumLng = coords.reduce(
      (sum, d) => sum + (d.lng as number),
      0
    );
    center = [sumLat / coords.length, sumLng / coords.length];
  }

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      style={{ width: "100%", height: "100%" }}
    >
      <LayersControl position="topright">
        <BaseLayer checked name="Routier (OSM)">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </BaseLayer>

        <BaseLayer name="Satellite (Esri)">
          <TileLayer
            attribution="Tiles &copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </BaseLayer>
      </LayersControl>

      {/* Marqueurs */}
      {coords.map((d) => (
        <Marker
          key={d.deviceId}
          position={[d.lat as number, d.lng as number]}
        >
          <Popup>
            <div className="text-xs leading-tight">
              <div className="font-semibold mb-1">{d.name}</div>

              <div className="mb-1">
                <span className="font-medium">Client&nbsp;:</span>{" "}
                {d.clientName || "-"}
              </div>

              <div className="mb-1">
                <span className="font-medium">Catégorie&nbsp;:</span>{" "}
                {d.category}
              </div>

              {typeof d.battery === "number" && (
                <div className="mb-1">
                  <span className="font-medium">Batterie&nbsp;:</span>{" "}
                  {d.battery}%{" "}
                  <span className="text-[10px] text-gray-500">
                    {d.charging === true
                      ? "(En charge)"
                      : d.charging === false
                      ? "(Sur batterie)"
                      : ""}
                  </span>
                </div>
              )}

              {d.lastHeartbeat && (
                <div className="text-[10px] text-gray-500">
                  Dernier HB&nbsp;:
                  {new Date(d.lastHeartbeat).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
