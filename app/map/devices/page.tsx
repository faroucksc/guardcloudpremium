"use client";

import { useEffect, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://yarmotek-guardcloud-api.myarbanga.workers.dev";

// On tape les composants Leaflet en `any` pour éviter les conflits de types côté app router.
const MapContainer: any = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer: any = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker: any = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup: any = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

type Device = {
  deviceId: string;
  hardwareId?: string | null;
  type?: string | null;
  category?: string | null;
  name?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  lat?: number | null;
  lng?: number | null;
  battery?: number | null;
  charging?: boolean | null;
  lastHeartbeat?: string | null;
};

type DevicesResponse = {
  devices: Device[];
};

const DEFAULT_CENTER: [number, number] = [12.3657, -1.5339]; // Ouagadougou

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "table">("map");

  useEffect(() => {
    async function loadDevices() {
      try {
        setError(null);
        const res = await fetch(`${API_BASE}/map/devices`, {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status} – ${txt}`);
        }

        const data = (await res.json()) as DevicesResponse;
        setDevices(Array.isArray(data.devices) ? data.devices : []);
      } catch (e: any) {
        console.error("Erreur /map/devices:", e);
        setError(e?.message ?? "Erreur inconnue");
      }
    }

    loadDevices();
  }, []);

  const geoDevices = devices.filter(
    (d) => typeof d.lat === "number" && typeof d.lng === "number"
  );

  const center: [number, number] =
    geoDevices.length > 0
      ? [geoDevices[0].lat as number, geoDevices[0].lng as number]
      : DEFAULT_CENTER;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        padding: "24px",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>
          Yarmotek GuardCloud – Appareils
        </h1>
        <p style={{ opacity: 0.8 }}>
          Données provenant de l&apos;API GuardCloud (/map/devices).
        </p>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setView("map")}
            style={{
              marginRight: 8,
              padding: "6px 14px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: view === "map" ? "#22c55e" : "#111827",
              color: view === "map" ? "#022c22" : "#e5e7eb",
            }}
          >
            Carte
          </button>
          <button
            onClick={() => setView("table")}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: view === "table" ? "#22c55e" : "#111827",
              color: view === "table" ? "#022c22" : "#e5e7eb",
            }}
          >
            Tableau
          </button>
        </div>
      </header>

      {error && (
        <pre
          style={{
            background: "#111827",
            padding: 16,
            borderRadius: 8,
            color: "#f97373",
            fontSize: 13,
            marginBottom: 16,
            whiteSpace: "pre-wrap",
          }}
        >
{`{
  "error": "Failed to load devices",
  "message": "${error}"
}`}
        </pre>
      )}

      {view === "map" ? (
        <div style={{ height: "70vh", borderRadius: 12, overflow: "hidden" }}>
          {/* MapContainer rendu uniquement côté client grâce à dynamic() */}
          <MapContainer
            center={center}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {geoDevices.map((d) => (
              <Marker
                key={d.deviceId}
                position={[d.lat as number, d.lng as number]}
              >
                <Popup>
                  <div style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {d.name || d.deviceId}
                    </div>
                    <div>Client : {d.clientName || d.clientId || "-"}</div>
                    <div>Type : {d.type || d.category || "-"}</div>
                    {typeof d.battery === "number" && (
                      <div>Batterie : {d.battery}%</div>
                    )}
                    {typeof d.charging === "boolean" && (
                      <div>
                        Charge : {d.charging ? "En charge" : "Sur batterie"}
                      </div>
                    )}
                    {d.lastHeartbeat && (
                      <div>
                        Dernier signal :{" "}
                        {new Date(d.lastHeartbeat).toLocaleString("fr-FR")}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#020617",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <thead style={{ background: "#020617" }}>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Nom</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Client</th>
              <th style={thStyle}>Lat</th>
              <th style={thStyle}>Lng</th>
              <th style={thStyle}>Dernier signal</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.deviceId}>
                <td style={tdStyle}>{d.deviceId}</td>
                <td style={tdStyle}>{d.name || "-"}</td>
                <td style={tdStyle}>{d.type || d.category || "-"}</td>
                <td style={tdStyle}>{d.clientName || d.clientId || "-"}</td>
                <td style={tdStyle}>
                  {typeof d.lat === "number" ? d.lat.toFixed(5) : "-"}
                </td>
                <td style={tdStyle}>
                  {typeof d.lng === "number" ? d.lng.toFixed(5) : "-"}
                </td>
                <td style={tdStyle}>
                  {d.lastHeartbeat
                    ? new Date(d.lastHeartbeat).toLocaleString("fr-FR")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 13,
  borderBottom: "1px solid #111827",
};

const tdStyle: CSSProperties = {
  padding: "8px 12px",
  fontSize: 13,
  borderBottom: "1px solid #020617",
};
