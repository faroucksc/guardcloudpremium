"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

export default function TopNavbar() {
  const [jwt, setJwt] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [lang, setLang] = useState<"fr" | "en">("fr");

  useEffect(() => {
    const stored = localStorage.getItem("YGC_JWT");
    if (stored) {
      setJwt(stored);
      try {
        const decoded: any = jwtDecode(stored);
        setRole(decoded.role || null);
        if (decoded.lang) setLang(decoded.lang);
      } catch {}
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("YGC_JWT");
    window.location.href = "/admin/login";
  };

  return (
    <nav className="w-full bg-slate-900 text-white px-6 py-3 flex justify-between items-center shadow-xl">
      <Link href="/">
        <span className="text-xl font-bold">Yarmotek GuardCloud</span>
      </Link>

      <div className="flex items-center gap-6">
        {/* Appareils */}
        <Link href="/map/devices" className="hover:text-emerald-400">
          {lang === "fr" ? "Appareils" : "Devices"}
        </Link>

        {/* Facturation visibles pour SUPER_ADMIN / ADMIN / RESELLER */}
        {["SUPER_ADMIN", "ADMIN", "RESELLER"].includes(role || "") && (
          <Link href="/billing" className="hover:text-emerald-400">
            {lang === "fr" ? "Facturation" : "Billing"}
          </Link>
        )}

        {/* Langue */}
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as any)}
          className="bg-slate-800 border border-slate-700 px-2 py-1 rounded"
        >
          <option value="fr">FR</option>
          <option value="en">EN</option>
        </select>

        {/* Connexion / Déconnexion */}
        {!jwt ? (
          <button
            onClick={() => {
              const token = prompt("Collez votre JWT :");
              if (token) {
                localStorage.setItem("YGC_JWT", token);
                window.location.reload();
              }
            }}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-black rounded"
          >
            Coller un JWT
          </button>
        ) : (
          <button
            onClick={logout}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
          >
            {lang === "fr" ? "Déconnexion" : "Logout"}
          </button>
        )}
      </div>
    </nav>
  );
}
