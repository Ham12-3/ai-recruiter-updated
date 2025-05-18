import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve these modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        http2: false,
        child_process: false,
      };
    }

    // Add this to disable source maps for node modules
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules/,
      use: {
        loader: "source-map-loader",
        options: { filterSourceMappingUrl: () => false },
      },
      enforce: "pre",
    });

    return config;
  },
};

export default nextConfig;
