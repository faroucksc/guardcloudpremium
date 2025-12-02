"use client";

import { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";

// ❗ supercluster n'a PAS de types officiels compatibles Cloudflare
// on force l'import JS pur :
/* @ts-ignore */
import Supercluster from "supercluster";

interface ClusterLayerProps {
  devices: {
    id: string;
    lat: number;
    lng: number;
    category: string;
  }[];
  onClusterClick?: (ids: string[]) => void;
}

export default function ClusterLayer({ devices, onClusterClick }: ClusterLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Nettoyage des anciens clusters
    map.eachLayer((layer) => {
      // On garde les layers de base (tiles) seulement
      // @ts-ignore
      if (!layer._url) map.removeLayer(layer);
    });

    if (!devices || devices.length === 0) return;

    // Transforme les devices pour supercluster
    const points = devices.map((d) => ({
      type: "Feature",
      properties: {
        id: d.id,
        category: d.category,
      },
      geometry: {
        type: "Point",
        coordinates: [d.lng, d.lat],
      },
    }));

    const clusterIndex = new Supercluster({
      radius: 60,
      maxZoom: 20,
    }).load(points);

    const bounds = map.getBounds();
    const zoom = map.getZoom();

    const clusters = clusterIndex.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    );

    clusters.forEach((c: any) => {
      const [lng, lat] = c.geometry.coordinates;

      if (c.properties.cluster) {
        const count = c.properties.point_count;

        const icon = L.divIcon({
          html: `<div style="
            background: rgba(0,0,0,0.7);
            color: white;
            border-radius: 50%;
            padding: 10px;
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: bold;
          ">${count}</div>`,
          className: "",
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);

        marker.on("click", () => {
          const leaves = clusterIndex.getLeaves(c.id, Infinity);
          const ids = leaves.map((l: any) => l.properties.id);

          if (onClusterClick) onClusterClick(ids);

          map.flyTo([lat, lng], zoom + 2);
        });
      } else {
        // Point normal
        const marker = L.circleMarker([lat, lng], {
          radius: 6,
          color: "#00d2ff",
          fillColor: "#00d2ff",
          fillOpacity: 0.8,
        }).addTo(map);

        marker.on("click", () => {
          if (onClusterClick) onClusterClick([c.properties.id]);
        });
      }
    });
  }, [map, devices]);

  return null;
}
