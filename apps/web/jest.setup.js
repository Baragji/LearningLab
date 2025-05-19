// apps/web/jest.setup.js
// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/extend-expect";

// Tilføj denne linje for at mocke next/router globalt for dine tests i web-appen
jest.mock('next/router', () => require('next-router-mock'));

// Valgfrit: Du kan initialisere den mockede router med en default rute her,
// hvis mange af dine tests forventer at starte på en bestemt side.
// require('next-router-mock').default.mockImplementation(() => ({
//   pathname: '/',
//   asPath: '/',
//   query: {},
//   route: '/',
//   push: jest.fn(),
//   replace: jest.fn(),
//   reload: jest.fn(),
//   back: jest.fn(),
//   prefetch: jest.fn().mockResolvedValue(undefined),
//   beforePopState: jest.fn(),
//   events: {
//     on: jest.fn(),
//     off: jest.fn(),
//     emit: jest.fn(),
//   },
//   isFallback: false,
//   isLocaleDomain: false,
//   isReady: true,
//   basePath: '',
// }));