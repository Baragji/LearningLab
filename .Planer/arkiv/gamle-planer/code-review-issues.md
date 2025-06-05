# Code Review Issues

## Lint Issues

### API Package

1. **Unused Variables and Imports**:
   - `CsrfMiddleware` is defined but never used in `apps/api/src/app.module.ts` (line 10:10)
   - `consumer` is defined but never used in `apps/api/src/app.module.ts` (line 69:13)
   - `Matches` is defined but never used in `apps/api/src/auth/dto/login.dto.ts` (line 7:3)
   - `passwordHash`, `passwordResetToken`, and `passwordResetExpires` are assigned values but never used in `apps/api/src/auth/strategies/jwt/jwt.ts` (lines 29:13, 29:27, 29:47)
   - `User` is defined but never used in `apps/api/src/controllers/quizAttempt.controller.ts` (line 9:3)
   - `User` is defined but never used in `apps/api/src/controllers/userProgress.controller.ts` (line 5:10)
   - `PrismaClient` is defined but never used in `apps/api/src/persistence/prisma/prisma.service.spec.ts` (line 3:15)
   - `passwordHash`, `passwordResetToken`, and `passwordResetExpires` are assigned values but never used in `apps/api/src/users/users.service.ts` (lines 42:7, 43:7, 44:7)

## Test Issues

### Web Package

1. **Environment Variable Missing**:

   - Error: "FEJL: NEXT_PUBLIC_API_URL er ikke sat. API-kald vil fejle." in `src/store/services/api.ts` (line 28:11)
   - This indicates that the API URL environment variable is not set during tests, which could lead to API calls failing.

2. **Fetch Not Available in Test Environment**:
   - Warning: "`fetch` is not available. Please supply a custom `fetchFn` property to use `fetchBaseQuery` on SSR environments." in `src/store/services/api.ts` (line 35:28)
   - This suggests that the Redux Toolkit Query's `fetchBaseQuery` is not properly configured for the test environment.

## Build Issues

No critical build issues were found. The build process completed successfully for all packages.

## Recommendations

### Lint Issues

1. **Fix Unused Variables**:
   - Either use the defined variables or remove them to improve code cleanliness.
   - For variables that are intentionally unused but required by interfaces or function signatures, prefix them with an underscore (e.g., `_consumer`) to indicate they are intentionally unused.

### Test Issues

1. **Environment Variables in Tests**:

   - Set up a mock environment for tests that includes necessary environment variables like `NEXT_PUBLIC_API_URL`.
   - Consider using a `.env.test` file or setting environment variables programmatically in test setup.

2. **Mock Fetch API in Tests**:
   - Provide a custom `fetchFn` for tests when using Redux Toolkit Query.
   - Consider using libraries like `jest-fetch-mock` to mock fetch calls in tests.

### General Recommendations

1. **Improve Test Coverage**:

   - The web package has minimal tests (only one test for the login component).
   - Consider adding more tests for critical components and functionality.

2. **Update Dependencies**:

   - Turbo is outdated (v1.10.12) and an update is available (v2.5.3).
   - Consider updating dependencies to benefit from bug fixes and new features.

3. **Standardize Error Handling**:

   - The API error messages are in Danish. Consider standardizing error messages in one language (preferably English) for consistency.

4. **Environment Variable Management**:
   - Ensure all required environment variables are documented and properly set up in different environments (development, testing, production).
