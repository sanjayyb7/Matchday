import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "media.api-sports.io" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Explicitly allow the Geolocation API — some mobile browsers
          // block it when Permissions-Policy is missing or restrictive.
          {
            key: "Permissions-Policy",
            value: "geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
