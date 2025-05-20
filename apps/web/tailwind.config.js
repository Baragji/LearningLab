const sharedConfig = require("@repo/config/tailwind.config.js");

module.exports = {
  // Extend the shared config
  ...sharedConfig,
  // Override the content paths with more specific ones for this app
  content: [
    // Include UI components from packages - be more specific to avoid node_modules
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/components/**/*.{js,ts,jsx,tsx}",
    // Local app files
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
};