import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["apache-arrow"],
  devIndicators: false,
};

export default nextConfig;
