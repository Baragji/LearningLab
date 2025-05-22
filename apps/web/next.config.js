const withTM = require("next-transpile-modules")(["ui"]);
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(withTM({
  reactStrictMode: true,
}));
