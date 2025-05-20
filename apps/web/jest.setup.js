// apps/web/jest.setup.js
import "@testing-library/jest-dom/extend-expect";

// Mock next/router globalt for dine tests i web-appen
jest.mock('next/router', () => require('next-router-mock'));

// Valgfrit: Initialiser routeren til en bestemt sti, hvis mange tests har brug for det
// require('next-router-mock').default.push('/');
