# 📚 LearningLab Technical Overview

This document gives a brief technical description of the LearningLab platform. It replaces older drafts and reflects the current repository state.

## Architecture

LearningLab is organised as a **Turborepo** containing two applications and several shared packages:

```
apps/
  api/   # NestJS backend
  web/   # Next.js frontend
packages/
  core/  # Shared TypeScript utilities
  ui/    # Reusable React components
  config/ # Shared configuration (ESLint, Tailwind, etc.)
```

The backend and frontend share TypeScript types via the `@repo/core` package. Database access is handled through **Prisma** with a PostgreSQL database.

## Technology Stack

- **Node.js 22**
- **NestJS 10** for the API
- **Next.js 13** for the web client
- **Prisma 6** with PostgreSQL
- **Redis** for caching
- **Docker** and `docker-compose` for containerisation
- **Turborepo** for orchestrating scripts across packages

## Running Locally

1. Install dependencies and set up the database:
   ```bash
   yarn setup
   ```
2. Start development servers:
   ```bash
   yarn dev
   ```
   - Web: <http://localhost:3000>
   - API: <http://localhost:5002>

The API exposes Swagger docs at `/api/docs` when running locally.

## Deployment

Production builds use the Dockerfiles in the repository and are orchestrated via `docker-compose.yml`. Nginx acts as a reverse proxy exposing the application on port **80**.

## Testing

Tests are written with Jest. Run all tests with:

```bash
yarn test
```

## Additional Resources

More detailed documents about optimisation plans can be found in the `README.START.HER/Optimering` directory. The main README provides a step-by-step guide for new developers.
