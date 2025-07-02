import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Use the correct configuration options
  turbopack: {
    // Turbopack configuration (now stable)
    resolveAlias: {
      // Add any needed aliases here
    }
  },
  // Font optimization is enabled by default in Next.js 13+
};

export default nextConfig;
