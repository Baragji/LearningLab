const sharedConfig = require("@repo/config/tailwind.config.js");

module.exports = {
  // Extend the shared config
  ...sharedConfig,
  // Enable dark mode
  darkMode: 'class',
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
  theme: {
    extend: {
      colors: {
        // Add custom colors for your theme
        primary: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066ff',
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
        },
      },
    },
  },
};