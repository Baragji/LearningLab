const sharedConfig = require("@repo/config/tailwind.config.js");

module.exports = {
  // Extend the shared config
  ...sharedConfig,
  // Enable dark mode
  darkMode: 'class',
  // Override the content paths with more specific ones for this app
  content: [
    // Include UI components from packages - be more specific to avoid node_modules
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,css}",
    "../../packages/ui/components/**/*.{js,ts,jsx,tsx,css}",
    // Local app files
    "./src/**/*.{js,ts,jsx,tsx,css}",
    "./pages/**/*.{js,ts,jsx,tsx,css}",
    "./components/**/*.{js,ts,jsx,tsx,css}",
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
      backdropSaturate: {
        '0': '0',
        '50': '.5',
        '100': '1',
        '150': '1.5',
        '200': '2',
      },
      animation: {
        // Animations for replacing Framer Motion
        fadeIn: 'fadeIn 0.3s ease-in-out forwards',
        fadeOut: 'fadeOut 0.2s ease-in-out forwards',
        scaleIn: 'scaleIn 0.3s ease-out forwards',
        scaleOut: 'scaleOut 0.2s ease-in forwards',
        slideDown: 'slideDown 0.3s ease-out forwards',
        slideUp: 'slideUp 0.2s ease-in forwards',
        rotateIn: 'rotateIn 0.5s ease-out forwards',
        fadeInDown: 'fadeInDown 0.4s ease-out forwards',
        fadeInSlideRight: 'fadeInSlideRight 0.4s ease-out forwards',
        menuAppear: 'menuAppear 0.2s ease-out forwards',
        // Notification specific animations
        'notification-enter': 'notification-enter 0.3s cubic-bezier(0.21, 1.02, 0.73, 1) forwards',
         'notification-exit': 'notification-exit 0.3s cubic-bezier(0.06, 0.71, 0.55, 1) forwards',
         'enter': 'enter 200ms ease-out',
         'leave': 'leave 150ms ease-in forwards',
         'progress': 'progress 2s ease-in-out',
         'fadeInDown': 'fadeInDown 0.8s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.8)', opacity: '0' },
        },
        slideDown: {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'auto', opacity: '1' },
        },
        slideUp: {
          '0%': { height: 'auto', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
        rotateIn: {
          '0%': { transform: 'rotate(-90deg)' },
          '100%': { transform: 'rotate(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInSlideRight: {
          '0%': { opacity: '0', transform: 'translateX(-5px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        menuAppear: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(-10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'notification-enter': {
          '0%': { opacity: '0', transform: 'translateY(-100%) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'notification-exit': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-100%) scale(0.95)' },
        },
        'progress': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        'fadeInDown': {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  // Optimizations for production
  future: {
    hoverOnlyWhenSupported: true, // Reduces CSS by only applying hover styles on devices that support hover
  },
  // Tilføj custom utilities
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.transform-origin-top': {
          'transform-origin': 'top center',
        },
        '.transform-origin-bottom': {
          'transform-origin': 'bottom center',
        },
      }
      addUtilities(newUtilities)
    }
  ],
  // Disable unused core plugins to reduce bundle size
  corePlugins: {
    // Disable plugins that you don't use
    // Enable backdropBlur and backdropSaturate for glassmorphism effect
    backdropBlur: true,
    backdropBrightness: false,
    backdropContrast: false,
    backdropGrayscale: false,
    backdropHueRotate: false,
    backdropInvert: false,
    backdropOpacity: false,
    backdropSaturate: true, // Enable for glassmorphism effect
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
    ringOpacity: true, // Enable for focus rings
    ring: true, // Enable for focus rings
    ringOffsetWidth: true, // Enable for focus rings
    ringOffsetColor: true, // Enable for focus rings
    boxShadowColor: false,
    gradientColorStops: false,
    mixBlendMode: false,
    backgroundBlendMode: false,
  },
};