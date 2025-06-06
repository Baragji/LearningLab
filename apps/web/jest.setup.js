// apps/web/jest.setup.js
require('@testing-library/jest-dom');

// Mock next/router globalt for dine tests i web-appen
const mockRouter = require('next-router-mock');
jest.mock("next/router", () => mockRouter);

// Valgfrit: Initialiser routeren til en bestemt sti, hvis mange tests har brug for det
mockRouter.default.push('/');
