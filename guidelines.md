# Project Guidelines for LearningLab

## Project Overview

LearningLab is a fullstack application built using a monorepo architecture with Turborepo. The project consists of a NestJS backend API, a NextJS frontend, and shared packages for UI components, configuration, and TypeScript definitions.

## Project Structure

```
LearningLab/
├── apps/                  # Application packages
│   ├── api/               # NestJS backend API
│   │   ├── src/           # Source code
│   │   │   ├── auth/      # Authentication modules with strategies (GitHub, Google, JWT, Local)
│   │   │   ├── common/    # Common utilities (filters, interceptors, middleware, pipes, services)
│   │   │   ├── config/    # Configuration settings
│   │   │   ├── controllers/# API controllers with DTOs
│   │   │   ├── middleware/# Custom middleware
│   │   │   ├── modules/   # Feature modules
│   │   │   ├── persistence/# Database access layer
│   │   │   ├── quiz/      # Quiz functionality
│   │   │   ├── routes/    # Route definitions
│   │   │   ├── search/    # Search functionality
│   │   │   ├── services/  # Service layer
│   │   │   ├── shared/    # Shared utilities
│   │   │   ├── user-groups/# User group management
│   │   │   ├── users/     # User management
│   │   │   └── ...        # Other modules
│   ├── web/               # NextJS frontend
│   │   ├── pages/         # Next.js pages
│   │   │   ├── admin/     # Admin pages
│   │   │   ├── courses/   # Course pages
│   │   │   ├── lessons/   # Lesson pages
│   │   │   └── quiz/      # Quiz pages
│   │   ├── src/           # Source code
│   │   │   ├── components/# React components
│   │   │   │   ├── auth/  # Authentication components
│   │   │   │   ├── common/# Common components
│   │   │   │   ├── content/# Content display components
│   │   │   │   ├── layout/# Layout components
│   │   │   │   ├── quiz/  # Quiz components
│   │   │   │   └── ui/    # UI components
│   │   │   ├── context/   # React context (Note: duplicate with contexts/)
│   │   │   ├── contexts/  # React contexts (Note: duplicate with context/)
│   │   │   ├── hooks/     # Custom React hooks
│   │   │   ├── lib/       # Utility libraries
│   │   │   ├── screens/   # Page components
│   │   │   │   ├── admin/ # Admin screens
│   │   │   │   ├── auth/  # Authentication screens
│   │   │   │   ├── common/# Common screens
│   │   │   │   └── employee/# Employee screens
│   │   │   ├── services/  # Service layer
│   │   │   ├── store/     # Redux store
│   │   │   ├── styles/    # CSS styles
│   │   │   └── utils/     # Utility functions
├── packages/              # Shared packages
│   ├── config/            # Shared configuration (eslint, tailwind, etc.)
│   ├── core/              # Core shared functionality
│   ├── create-solid-wow/  # Additional package not in original guidelines
│   ├── ui/                # Shared UI components
│   │   ├── components/    # UI components
│   │   └── utils/         # UI utilities
│   └── tsconfig/          # Shared TypeScript configurations
├── prisma/                # Prisma ORM configuration
│   ├── migrations/        # Database migrations
│   └── schema.prisma      # Database schema
├── scripts/               # Utility scripts
└── docker-compose.yml     # Docker configuration for API and database (web app missing)
```

## Tech Stack

- **Backend**: NestJS with TypeScript
- **Frontend**: NextJS with TypeScript, Tailwind CSS, and Redux Toolkit
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest
- **Package Management**: Yarn workspaces
- **Build System**: Turborepo
- **Deployment**: Docker
- **Authentication**: Multiple strategies including GitHub, Google, JWT, and Local

## Development Workflow

### Setup

1. Install NPS (Node Package Scripts) globally:
   ```
   npm i -g nps
   ```

2. Configure environment variables:
    - For frontend: `cd apps/web && cp .env.example .env`
    - For backend: `cd apps/api && cp .env.example .env`

3. Install dependencies:
   ```
   nps prepare
   ```

### Development

To run the development environment:
```
nps dev
```

This will start both the API and web applications in development mode with hot reloading.

### Database Management

- Run migrations: `yarn prisma:migrate`
- Generate Prisma client: `yarn prisma:generate`
- Open Prisma Studio: `yarn prisma:studio`
- Seed the database: `yarn seed`

## Testing

Run tests using:
```
nps test
```

For continuous testing during development:
```
nps test:watch
```

For CI/CD environments:
```
nps test:ci
```

## Build Process

To build all applications and packages:
```
nps build
```

## Deployment

### Using Docker (Current Implementation)

```bash
# Start both the database and API service
docker-compose up -d

# To view logs
docker-compose logs -f
```

This will start:
- PostgreSQL database on port 5432
- API service on port 3000

**Note**: The current Docker configuration does not include the web application or Nginx reverse proxy as mentioned in the original guidelines. This is a discrepancy that needs to be addressed.

## Code Style Guidelines

- Follow the ESLint and Prettier configurations provided in the project
- Run `yarn lint` to check for linting issues
- Run `yarn format` to automatically format code
- Write unit tests for all new features
- Follow the NestJS style guide for backend code
- Use TypeScript for type safety throughout the project

## Troubleshooting

If you encounter database connection issues:

1. Make sure the database container is running:
   ```bash
   docker ps
   ```

2. Check the database logs:
   ```bash
   docker-compose logs postgres
   ```

3. For the error "Can't reach database server at `localhost:5432`":
    - If running the API directly (not in Docker), make sure the database is started with `docker-compose up postgres -d`
    - If running in Docker, make sure both services are on the same network

## Known Structure Discrepancies

1. The web application has both `context/` and `contexts/` directories which appear to serve similar purposes.
2. The Docker configuration does not include the web application or Nginx reverse proxy as mentioned in the guidelines.
3. The API structure includes additional directories not mentioned in the original guidelines, such as `persistence/`, `search/`, and `user-groups/`.
4. There is an additional package `create-solid-wow` not mentioned in the original guidelines.