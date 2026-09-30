import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Offline server: the build carries its own node_modules. No npm install there.
  output: "standalone",
};

export default nextConfig;
