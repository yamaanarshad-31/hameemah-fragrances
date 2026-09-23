import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "libsql"],
  images: { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
