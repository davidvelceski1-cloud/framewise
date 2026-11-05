import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Cover art is served from IGDB's CDN (IDs come from `npm run covers:sync`); nothing is bundled.
    remotePatterns: [{ protocol: "https", hostname: "images.igdb.com", pathname: "/igdb/image/upload/**" }],
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
