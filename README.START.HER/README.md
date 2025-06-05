# 🚀 LearningLab - Modern Educational Platform

LearningLab is a comprehensive educational platform built with modern technologies to provide an interactive and engaging learning experience. This monorepo contains both the frontend and backend applications, along with shared packages for UI components, configuration, and core utilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Docker](#docker)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

LearningLab is designed to provide a modern educational platform with features including:

- Interactive learning content
- Quiz and assessment system
- AI-powered question generation
- User progress tracking
- Certificate generation
- Content management system
- Search functionality

The platform is built as a monorepo using Turborepo for efficient build orchestration, with a Next.js frontend and NestJS backend.

## 📁 Project Structure

```
learninglab-monorepo/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── ui/           # Shared UI components (MUI-based)
│   ├── core/         # Shared types and utilities
│   ├── config/       # ESLint, Tailwind, PostCSS config
│   └── tsconfig/     # TypeScript configurations
├── prisma/           # Database schema and migrations
├── docker/           # Docker configuration
└── scripts/          # Utility scripts
```

## 💻 Technology Stack

### Core Technologies

- **Frontend**: Next.js 13.4.12, React 18.2.0
- **Backend**: NestJS 10.3.10, Node.js 22
- **Database**: PostgreSQL with Prisma 6.8.2
- **UI Libraries**: Material UI 5.14.3, Shadcn/UI components
- **State Management**: Redux Toolkit
- **Build System**: Turborepo 2.5.3
- **Package Manager**: Yarn 4.9.1

### AI & Machine Learning

- OpenAI integration for question generation
- Pinecone for vector database
- Cosine similarity for content matching

### DevOps & Infrastructure

- Docker for containerization
- Docker Compose for local development
- GitHub Actions for CI/CD

## 🚀 Getting Started

### Prerequisites

- Node.js 22.x
- Yarn 4.x
- Docker and Docker Compose (for local development with databases)
- PostgreSQL (if running locally without Docker)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/learninglab.git
   cd learninglab
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Set up the database:
   ```bash
   yarn db:setup
   ```

5. Start the development servers:
  ```bash
  yarn dev
  ```
   - Frontend: http://localhost:3000
   - API: http://localhost:5002

## 💻 Development

### Running the Applications

- **Start all applications**:
  ```bash
  yarn dev
  ```

- **Start only the backend**:
  ```bash
  yarn workspace api dev
  ```

- **Start only the frontend**:
  ```bash
  yarn workspace web dev
  ```

### Database Operations

- **Generate Prisma client**:
  ```bash
  yarn prisma:generate
  ```

- **Run migrations**:
  ```bash
  yarn prisma:migrate
  ```

- **Reset database**:
  ```bash
  yarn db:reset
  ```

- **Seed database**:
  ```bash
  yarn db:seed
  ```

- **Open Prisma Studio**:
  ```bash
  yarn prisma:studio
  ```

### Code Quality

- **Lint code**:
  ```bash
  yarn lint
  ```

- **Fix linting issues**:
  ```bash
  yarn lint:fix
  ```

- **Format code**:
  ```bash
  yarn format
  ```

- **Type check**:
  ```bash
  yarn typecheck
  ```

## 🧪 Testing

### Running Tests

- **Run all tests**:
  ```bash
  yarn test
  ```

- **Run tests in watch mode**:
  ```bash
  yarn test:watch
  ```

- **Run tests with coverage**:
  ```bash
  yarn test:ci
  ```

- **Run E2E tests**:
  ```bash
  yarn workspace web test:e2e
  ```

## 🚢 Deployment

### Building for Production

- **Build all applications**:
  ```bash
  yarn build
  ```

- **Build only the backend**:
  ```bash
  yarn build:api
  ```

- **Build only the frontend**:
  ```bash
  yarn build:web
  ```

### Docker Deployment

- **Build and run with Docker Compose**:
  ```bash
  docker-compose up -d
  ```

- **Build individual containers**:
  ```bash
  docker build -f Dockerfile.api -t learninglab/api .
  docker build -f Dockerfile.web -t learninglab/web .
  ```

## 🐳 Docker

The project includes Docker configuration for both development and production environments.

### Docker Compose

The `docker-compose.yml` file sets up the following services:
- **api**: NestJS backend
- **web**: Next.js frontend
- **postgres**: PostgreSQL database
- **redis**: Redis for caching
- **nginx**: Reverse proxy

### Optimized Docker Setup

The Docker configuration follows best practices:
- Multi-stage builds for smaller images
- Non-root users for security
- Health checks for reliability
- Resource limits for stability
- Proper caching for faster builds

## 🏗️ Architecture

### Backend Architecture

The NestJS backend follows a modular architecture:

- **Controllers**: Handle HTTP requests and define API endpoints
- **Services**: Contain business logic
- **DTOs**: Define data transfer objects for validation
- **Guards**: Handle authentication and authorization
- **Interceptors**: Transform responses and handle errors
- **Filters**: Process exceptions
- **Middleware**: Process requests before they reach the route handler

### Frontend Architecture

The Next.js frontend is organized as follows:

- **Pages**: Define routes and page components
- **Components**: Reusable UI components
- **Hooks**: Custom React hooks
- **Services**: API client and other services
- **Store**: Redux state management
- **Styles**: CSS and styling utilities
- **Utils**: Utility functions

### Database Schema

The database schema is defined using Prisma and includes the following main entities:

- **User**: User accounts and profiles
- **EducationProgram**: Educational programs and courses
- **Lesson**: Individual lessons within programs
- **ContentBlock**: Content blocks within lessons
- **Quiz**: Quizzes and assessments
- **Question**: Questions within quizzes
- **UserProgress**: User progress tracking
- **Certificate**: User certificates

## 🤝 Contributing

We welcome contributions to LearningLab! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

Please make sure your code follows our coding standards and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Optimization Plans

The project includes several optimization plans in the `Optimering` directory:

- **MASTER_IMPLEMENTERING_PLAN.md**: Overall implementation and coordination plan
- **DEPENDENCY_UPGRADE_PLAN.md**: Plan for upgrading and locking dependencies
- **UI_KONSOLIDERING_PLAN.md**: UI component consolidation plan
- **DOCKER_OPTIMERING_PLAN.md**: Docker optimization plan
- **KOMPLET_REFAKTORERING_PLAN.md**: Complete codebase refactoring plan
- **LEGACY_CLEANUP_PLAN.md**: Plan for cleaning up legacy code
- **AI_IMPLEMENTERING_PROMPT.md**: AI implementation prompt

