const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["ui", "@repo/core", "@repo/config"],
  webpack: (config, { isServer, dev }) => {
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
