"use client";

import React from "react";
import DevicesMapClient from "@/app/admin/devices/DevicesMapClient";

export type DevicesViewMode = "client" | "reseller" | "global";

/**
 * Vue générique réutilisable pour :
 *  - /admin/devices                  (mode = "global")
 *  - /admin/clients/[clientId]       (mode = "client")
 *  - /admin/resellers/[resellerId]   (mode = "reseller")
 *
 * Pour l’instant, on affiche la même Live Map Premium
 * et on adapte seulement le titre / sous-titre.
 * Plus tard, on pourra filtrer côté API selon mode/clientId/resellerId.
 */
export type DevicesViewProps = {
  mode?: DevicesViewMode;
  title?: string;
  subtitle?: string;
  clientId?: string;
  resellerId?: string;
};

const DevicesView: React.FC<DevicesViewProps> = ({
  mode = "global",
  title,
  subtitle,
  clientId,
  resellerId,
}) => {
  // 🔎 Déterminer un titre / sous-titre par défaut selon le mode
  let finalTitle = title;
  let finalSubtitle = subtitle;

  if (!finalTitle) {
    if (mode === "client") {
      finalTitle = "Appareils du client";
    } else if (mode === "reseller") {
      finalTitle = "Appareils des clients revendeur";
    } else {
      finalTitle = "Appareils GuardCloud – Vue Globale";
    }
  }

  if (!finalSubtitle) {
    if (mode === "client" && clientId) {
      finalSubtitle = `Vue temps réel des appareils pour le client ${clientId}.`;
    } else if (mode === "reseller" && resellerId) {
      finalSubtitle = `Vue temps réel des appareils gérés par le revendeur ${resellerId}.`;
    } else if (mode === "client") {
      finalSubtitle = "Vue temps réel des appareils pour ce client.";
    } else if (mode === "reseller") {
      finalSubtitle =
        "Vue temps réel des appareils rattachés aux clients de ce revendeur.";
    } else {
      finalSubtitle =
        "Supervision temps réel de tous les appareils GuardCloud (phones, PC, drones, IoT…).";
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* En-tête contextuel */}
      <header className="flex flex-col gap-1">
        <h1 className="text-lg md:text-xl font-semibold text-white">
          {finalTitle}
        </h1>
        <p className="text-xs md:text-sm text-slate-300">{finalSubtitle}</p>
      </header>

      {/* Carte Live Premium */}
      <div className="flex-1 min-h-[360px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60">
        <DevicesMapClient />
      </div>
    </div>
  );
};

export default DevicesView;
