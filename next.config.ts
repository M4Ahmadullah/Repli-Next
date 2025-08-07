import type { NextConfig } from "next";
import webpack from 'webpack';

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

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Explicitly define environment variables
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': JSON.stringify(
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
        ),
        'process.env.CLERK_SECRET_KEY': JSON.stringify(
          process.env.CLERK_SECRET_KEY || ''
        ),
      })
    );

    // Add fallback for node core modules if needed
    config.resolve.fallback = { 
      ...config.resolve.fallback, 
      fs: false,  // Disable file system module for client-side
      net: false,
      tls: false,
    };

    return config;
  },

  // Optional: Add runtime configuration
  publicRuntimeConfig: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
};

export default nextConfig;
