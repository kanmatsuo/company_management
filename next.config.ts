import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Offline server: the build carries its own node_modules. No npm install there.
  output: "standalone",
  // Dev HMR from the public IP is cross-origin to the browser.
  allowedDevOrigins: ["13.140.168.156"],
};

export default nextConfig;
