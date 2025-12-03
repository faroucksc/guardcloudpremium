import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  // ⚙️ Static export pour Cloudflare Pages
  output: "export",

  // ⚙️ Pas d’optimisation d’images côté Next (Cloudflare s’en charge très bien)
  images: {
    unoptimized: true,
  },

  // ⚙️ IMPORTANT : on désactive ESLint pendant le build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
