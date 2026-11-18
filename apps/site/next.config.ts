import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // A cached build shipped a stale globals.css after the workspace stylesheet changed.
    turbopackFileSystemCacheForBuild: false,
  },
  turbopack: {
    // Workspace root, where npm hoists node_modules.
    root: path.join(import.meta.dirname, "../.."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
