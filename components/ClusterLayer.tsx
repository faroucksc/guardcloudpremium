"use client";

/**
 * ClusterLayer neutre (placeholder)
 * ---------------------------------
 * - Pas de supercluster
 * - Pas de @ts-ignore
 * - Pas de `any`
 * - Ne gêne pas la carte existante
 *
 * Tu peux réactiver un clustering avancé plus tard
 * en réécrivant ce composant.
 */

export interface ClusterDevice {
  lat: number;
  lng: number;
}

export interface ClusterLayerProps {
  devices: ClusterDevice[];
  onClusterClick?: (lat: number, lng: number) => void;
}

export default function ClusterLayer(_props: ClusterLayerProps) {
  // Pour le moment, aucun rendu spécifique de cluster.
  // La carte affiche déjà les markers individuellement.
  return null;
}
