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
  // Minimal safelist - only include what's absolutely necessary
  safelist: [
    // Only include specific classes that are dynamically generated
    'text-primary-500',
    'text-primary-600',
    'bg-primary-500',
    'bg-primary-600',
    'dark:text-gray-200',
    'dark:bg-gray-750'
  ],
  theme: {
    extend: {
      colors: {
        // Add custom colors for your theme - only include the ones you actually use
        primary: {
          500: '#0066ff',
          600: '#0052cc',
        },
        gray: {
          750: '#2d3748', // Adding the custom gray-750 color
        },
      },
    },
  },
  // Optimizations for production
  future: {
    hoverOnlyWhenSupported: true, // Reduces CSS by only applying hover styles on devices that support hover
  },
  // Disable unused core plugins to reduce bundle size
  corePlugins: {
    // Disable plugins that you don't use
    // Enable backdropBlur for glassmorphism effect
    backdropBlur: true,
    backdropBrightness: false,
    backdropContrast: false,
    backdropGrayscale: false,
    backdropHueRotate: false,
    backdropInvert: false,
    backdropOpacity: false,
    backdropSaturate: false,
    backdropSepia: false,
    rotate: false,
    skew: false,
    blur: true, // Enable blur for potential UI effects
    brightness: false,
    contrast: false,
    grayscale: false,
    hueRotate: false,
    invert: false,
    saturate: false,
    sepia: false,
    transitionDelay: false,
    animation: true, // Enable animation for shimmer effect
    // Disable additional plugins that might not be used
    fontVariantNumeric: false,
    textOpacity: false,
    backgroundOpacity: true, // Enable for glassmorphism
    borderOpacity: true, // Enable for glassmorphism
    divideOpacity: false,
    placeholderOpacity: false,
    ringOpacity: false,
    ringOffsetWidth: false,
    ringOffsetColor: false,
    boxShadowColor: false,
    gradientColorStops: false,
    mixBlendMode: false,
    backgroundBlendMode: false,
  },
};