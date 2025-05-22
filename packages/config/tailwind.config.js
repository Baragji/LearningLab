module.exports = {
  content: [
    // Shared UI components - be more specific to avoid node_modules
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/components/**/*.{js,ts,jsx,tsx}",
    // App-specific files
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Optimizations for production
  future: {
    hoverOnlyWhenSupported: true,
  },
};
