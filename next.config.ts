import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Reduce prefetch cache size to prevent excessive RSC requests
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
