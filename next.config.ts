import type { NextConfig } from "next";

const isPreview = process.env.NEXT_PUBLIC_SITE_ENV !== "production";

// Le site ne charge ni script, ni police, ni cadre venant d'ailleurs : tout reste sur son propre domaine.
// 'unsafe-inline' est nécessaire aux scripts et styles intégrés par Next.js ; l'évaluation de code ('unsafe-eval')
// n'est autorisée qu'en développement.
const storageHost = process.env.STORAGE_PUBLIC_HOST ? ` https://${process.env.STORAGE_PUBLIC_HOST}` : "";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${storageHost}`,
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1600],
    remotePatterns: process.env.STORAGE_PUBLIC_HOST
      ? [{ protocol: "https", hostname: process.env.STORAGE_PUBLIC_HOST }]
      : [],
  },
  // Polices et logo lus sur le disque pour générer les badges ambassadeur.
  outputFileTracingIncludes: {
    "/p/[code]/badge": ["./assets/fonts/**", "./public/brand/logo-kalima.png"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  async headers() {
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
    ];
    if (isPreview) {
      // Préproduction : jamais indexée par les moteurs de recherche.
      headers.push({ key: "X-Robots-Tag", value: "noindex, nofollow" });
    }
    return [
      { source: "/:path*", headers },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
