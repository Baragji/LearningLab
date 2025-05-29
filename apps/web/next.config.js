const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ["ui", "@repo/core", "@repo/config"],
  webpack: (config, { isServer, dev }) => {
    // Add aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@repo/core': path.resolve(__dirname, '../../packages/core/dist'),
      '@repo/config': path.resolve(__dirname, '../../packages/config/dist'),
      '@repo/ui': path.resolve(__dirname, '../../packages/ui'),
    };

    // Tilføj PnP-understøttelse hvis nødvendigt
    if (!isServer && !dev) {
      // Optimer client-side bundling i production
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      };
    }
    
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
