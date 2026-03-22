import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const tailwindcssRoot = path.join(projectRoot, "node_modules", "tailwindcss");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: tailwindcssRoot,
    };
    return config;
  },
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      tailwindcss: tailwindcssRoot,
    },
  },
};

export default nextConfig;
