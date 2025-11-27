import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";

import TopNavbar from "@/components/TopNavbar";

export const metadata: Metadata = {
  title: "Yarmotek GuardCloud Premium",
  description: "Suivi temps réel multi-clients et multi-revendeurs Yarmotek",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-[#05060f] text-white min-h-screen flex flex-col">

        {/* 🔥 Barre JWT */}
        <TopNavbar />

        {/* 🔥 Zone principale */}
        <main className="flex-1 px-6 py-6">
          {children}
        </main>

      </body>
    </html>
  );
}
