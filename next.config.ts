import type { NextConfig } from "next";

const isPreview = process.env.NEXT_PUBLIC_SITE_ENV !== "production";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1600],
    remotePatterns: process.env.STORAGE_PUBLIC_HOST
      ? [{ protocol: "https", hostname: process.env.STORAGE_PUBLIC_HOST }]
      : [],
  },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  async headers() {
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
