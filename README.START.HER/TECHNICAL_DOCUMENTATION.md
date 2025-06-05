# 📚 LearningLab Technical Documentation

This document provides detailed technical information about the LearningLab platform, including architecture, implementation details, and development guidelines.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack Details](#technology-stack-details)
- [Backend Implementation](#backend-implementation)
- [Frontend Implementation](#frontend-implementation)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Authentication & Authorization](#authentication--authorization)
- [AI Integration](#ai-integration)
- [Performance Optimization](#performance-optimization)
- [Testing Strategy](#testing-strategy)
- [Deployment Pipeline](#deployment-pipeline)
- [Monitoring & Logging](#monitoring--logging)
- [Security Considerations](#security-considerations)
- [Development Guidelines](#development-guidelines)

## 🏗️ Architecture Overview

LearningLab follows a modern microservices-inspired architecture within a monorepo structure:

### System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Next.js Web    │────▶│  NestJS API     │────▶│  PostgreSQL     │
│  Frontend       │     │  Backend        │     │  Database       │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │     ▲
                              │     │
                              ▼     │
                        ┌─────────────────┐     ┌─────────────────┐
                        │                 │     │                 │
                        │  Redis Cache    │     │  OpenAI API     │
                        │                 │     │                 │
                        └─────────────────┘     └─────────────────┘
                                                       │
                                                       │
                                                       ▼
                                               ┌─────────────────┐
                                               │                 │
                                               │  Pinecone       │
                                               │  Vector DB      │
                                               │                 │
                                               └─────────────────┘
```

### Monorepo Structure

The monorepo is organized using Turborepo for efficient build orchestration:

```
learninglab-monorepo/
├── apps/                  # Applications
│   ├── api/               # NestJS backend
│   │   ├── src/           # Source code
│   │   ├── prisma/        # Prisma client and seeds
│   │   └── test/          # Tests
│   └── web/               # Next.js frontend
│       ├── src/           # Source code
│       ├── public/        # Static assets
│       └── tests/         # Tests
├── packages/              # Shared packages
│   ├── ui/                # UI component library
│   │   ├── components/    # React components
│   │   ├── hooks/         # React hooks
│   │   └── theme/         # Theme configuration
│   ├── core/              # Shared core utilities
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── config/            # Shared configurations
│   │   ├── eslint/        # ESLint configuration
│   │   └── tailwind/      # Tailwind configuration
│   └── tsconfig/          # TypeScript configurations
├── prisma/                # Database schema
├── docker/                # Docker configuration
└── scripts/               # Utility scripts
```

## 💻 Technology Stack Details

### Frontend Technologies

- **Next.js 13.4.12**: React framework with server-side rendering and static site generation
- **React 18.2.0**: UI library with concurrent rendering support
- **Material UI 5.14.3**: Component library for consistent design
- **Shadcn/UI**: Customizable UI components
- **Redux Toolkit**: State management with simplified Redux implementation
- **Axios**: HTTP client for API requests
- **React Query**: Data fetching and caching
- **Tailwind CSS**: Utility-first CSS framework
- **Jest & React Testing Library**: Testing framework
- **Playwright**: End-to-end testing

### Backend Technologies

- **NestJS 10.3.10**: Progressive Node.js framework
- **Node.js 22**: JavaScript runtime
- **Express**: Web server framework
- **Prisma 6.8.2**: ORM for database access
- **PostgreSQL**: Relational database
- **Redis**: In-memory data store for caching
- **JWT**: Authentication mechanism
- **Passport.js**: Authentication middleware
- **Swagger**: API documentation
- **Jest**: Testing framework

### DevOps & Infrastructure

- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **GitHub Actions**: CI/CD pipeline
- **ESLint & Prettier**: Code quality tools
- **TypeScript 5.3.3**: Static type checking
- **Yarn 4.9.1**: Package manager
- **Turborepo 2.5.3**: Monorepo build system

## 🔧 Backend Implementation

### NestJS Modules

The backend is organized into the following modules:

- **AppModule**: Root module
- **AuthModule**: Authentication and authorization
- **UserModule**: User management
- **EducationModule**: Education program management
- **LessonModule**: Lesson management
- **QuizModule**: Quiz and assessment
- **AIModule**: AI integration
- **SearchModule**: Search functionality

### API Structure

The API follows RESTful principles with the following main endpoints:

- **/api/auth**: Authentication endpoints
- **/api/users**: User management
- **/api/programs**: Education program management
- **/api/lessons**: Lesson management
- **/api/quizzes**: Quiz and assessment
- **/api/progress**: User progress tracking
- **/api/certificates**: Certificate generation
- **/api/search**: Search functionality
- **/api/ai**: AI-powered features

### Authentication Flow

1. User submits credentials
2. Server validates credentials
3. Server generates JWT token
4. Client stores token in cookies/local storage
5. Client includes token in subsequent requests
6. Server validates token for protected routes

## 🎨 Frontend Implementation

### Next.js Pages

The frontend is organized using Next.js pages:

- **/pages/index.tsx**: Home page
- **/pages/auth/**: Authentication pages
- **/pages/dashboard/**: User dashboard
- **/pages/programs/**: Education programs
- **/pages/lessons/**: Lessons
- **/pages/quizzes/**: Quizzes and assessments
- **/pages/profile/**: User profile
- **/pages/certificates/**: User certificates
- **/pages/admin/**: Admin dashboard

### State Management

Redux Toolkit is used for global state management with the following slices:

- **authSlice**: Authentication state
- **userSlice**: User information
- **programsSlice**: Education programs
- **lessonsSlice**: Lessons
- **quizzesSlice**: Quizzes and assessments
- **progressSlice**: User progress
- **uiSlice**: UI state (modals, notifications, etc.)

### Component Architecture

UI components follow a hierarchical structure:

- **Layout Components**: Page layouts, navigation, etc.
- **Page Components**: Components specific to pages
- **Feature Components**: Components for specific features
- **UI Components**: Reusable UI components

## 📊 Database Schema

The database schema is defined using Prisma and includes the following main entities:

### User Management

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String?
  name          String?
  role          UserRole  @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  profile       Profile?
  progress      UserProgress[]
  quizAttempts  QuizAttempt[]
  certificates  Certificate[]
}

enum UserRole {
  USER
  INSTRUCTOR
  ADMIN
}

model Profile {
  id            String    @id @default(uuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  bio           String?
  avatar        String?
  preferences   Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Education Content

```prisma
model EducationProgram {
  id            String    @id @default(uuid())
  title         String
  description   String
  imageUrl      String?
  published     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lessons       Lesson[]
  enrollments   UserProgress[]
}

model Lesson {
  id            String    @id @default(uuid())
  title         String
  description   String
  order         Int
  programId     String
  program       EducationProgram @relation(fields: [programId], references: [id])
  contentBlocks ContentBlock[]
  quizzes       Quiz[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model ContentBlock {
  id            String    @id @default(uuid())
  type          BlockType
  content       String
  order         Int
  lessonId      String
  lesson        Lesson    @relation(fields: [lessonId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum BlockType {
  TEXT
  IMAGE
  VIDEO
  CODE
  MARKDOWN
  INTERACTIVE
}
```

### Assessment

```prisma
model Quiz {
  id            String    @id @default(uuid())
  title         String
  description   String
  timeLimit     Int?      // in minutes
  passingScore  Int       @default(70)
  lessonId      String?
  lesson        Lesson?   @relation(fields: [lessonId], references: [id])
  questions     Question[]
  attempts      QuizAttempt[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Question {
  id            String    @id @default(uuid())
  content       String
  type          QuestionType
  options       Json?     // for multiple choice
  correctAnswer String
  explanation   String?
  points        Int       @default(1)
  quizId        String
  quiz          Quiz      @relation(fields: [quizId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  SHORT_ANSWER
  ESSAY
}

model QuizAttempt {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  quizId        String
  quiz          Quiz      @relation(fields: [quizId], references: [id])
  answers       Json
  score         Int
  completed     Boolean   @default(false)
  startedAt     DateTime  @default(now())
  completedAt   DateTime?
}
```

### Progress Tracking

```prisma
model UserProgress {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  programId     String
  program       EducationProgram @relation(fields: [programId], references: [id])
  progress      Float     @default(0)
  completedLessons Json
  lastAccessed  DateTime  @default(now())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Certificate {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  programId     String
  title         String
  issueDate     DateTime  @default(now())
  pdfUrl        String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

## 📝 API Documentation

The API is documented using Swagger/OpenAPI. The documentation is available at `/api/docs` when running the backend.

### Sample Endpoints

#### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login a user
- `POST /api/auth/refresh`: Refresh access token
- `POST /api/auth/logout`: Logout a user

#### Users

- `GET /api/users/me`: Get current user
- `PUT /api/users/me`: Update current user
- `GET /api/users/:id`: Get user by ID (admin only)
- `PUT /api/users/:id`: Update user by ID (admin only)
- `DELETE /api/users/:id`: Delete user by ID (admin only)

#### Education Programs

- `GET /api/programs`: Get all programs
- `GET /api/programs/:id`: Get program by ID
- `POST /api/programs`: Create a new program (admin only)
- `PUT /api/programs/:id`: Update program by ID (admin only)
- `DELETE /api/programs/:id`: Delete program by ID (admin only)

#### Lessons

- `GET /api/lessons`: Get all lessons
- `GET /api/lessons/:id`: Get lesson by ID
- `POST /api/lessons`: Create a new lesson (admin only)
- `PUT /api/lessons/:id`: Update lesson by ID (admin only)
- `DELETE /api/lessons/:id`: Delete lesson by ID (admin only)

#### Quizzes

- `GET /api/quizzes`: Get all quizzes
- `GET /api/quizzes/:id`: Get quiz by ID
- `POST /api/quizzes`: Create a new quiz (admin only)
- `PUT /api/quizzes/:id`: Update quiz by ID (admin only)
- `DELETE /api/quizzes/:id`: Delete quiz by ID (admin only)
- `POST /api/quizzes/:id/attempt`: Start a quiz attempt
- `PUT /api/quizzes/:id/attempt/:attemptId`: Submit a quiz attempt

## 🔐 Authentication & Authorization

### Authentication Methods

- **Email/Password**: Traditional authentication
- **OAuth**: Social login (GitHub, Google)
- **JWT**: Token-based authentication

### Authorization Levels

- **Public**: Accessible without authentication
- **User**: Requires user authentication
- **Instructor**: Requires instructor role
- **Admin**: Requires admin role

### JWT Implementation

- **Access Token**: Short-lived token for API access
- **Refresh Token**: Long-lived token for refreshing access tokens
- **Token Storage**: HttpOnly cookies for security

## 🤖 AI Integration

### OpenAI Integration

The platform integrates with OpenAI for the following features:

- **Question Generation**: Automatically generate quiz questions from lesson content
- **Content Summarization**: Create summaries of lesson content
- **Personalized Learning**: Recommend content based on user progress

### Vector Database

Pinecone is used as a vector database for:

- **Semantic Search**: Find content based on meaning rather than keywords
- **Content Similarity**: Find similar content across the platform
- **Recommendation Engine**: Recommend content based on user interests

## ⚡ Performance Optimization

### Frontend Optimization

- **Code Splitting**: Split code into smaller chunks
- **Image Optimization**: Optimize images for faster loading
- **Lazy Loading**: Load components only when needed
- **Memoization**: Prevent unnecessary re-renders
- **Server-Side Rendering**: Improve initial load time
- **Static Site Generation**: Pre-render pages at build time

### Backend Optimization

- **Caching**: Cache responses with Redis
- **Database Indexing**: Optimize database queries
- **Connection Pooling**: Reuse database connections
- **Rate Limiting**: Prevent abuse
- **Compression**: Compress responses
- **Pagination**: Limit response size

### Docker Optimization

- **Multi-Stage Builds**: Reduce image size
- **Layer Caching**: Speed up builds
- **Resource Limits**: Prevent resource exhaustion
- **Health Checks**: Ensure service availability
- **Non-Root Users**: Improve security

## 🧪 Testing Strategy

### Testing Levels

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete user flows
- **Performance Tests**: Test system performance
- **Security Tests**: Test for vulnerabilities

### Testing Tools

- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing React components
- **Supertest**: HTTP testing
- **Playwright**: End-to-end testing
- **Lighthouse**: Performance testing

### Test Coverage

The project aims for at least 80% test coverage across all packages.

## 🚢 Deployment Pipeline

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

1. **Build**: Build the application
2. **Test**: Run tests
3. **Lint**: Check code quality
4. **Security Scan**: Check for vulnerabilities
5. **Deploy**: Deploy to staging/production

### Deployment Environments

- **Development**: Local development environment
- **Staging**: Pre-production environment
- **Production**: Live environment

### Deployment Process

1. **Build Docker Images**: Build optimized Docker images
2. **Push to Registry**: Push images to container registry
3. **Deploy to Kubernetes**: Deploy to Kubernetes cluster
4. **Run Migrations**: Run database migrations
5. **Health Checks**: Verify deployment health
6. **Rollback**: Rollback if deployment fails

## 📊 Monitoring & Logging

### Monitoring

- **Health Checks**: Regular health checks for all services
- **Performance Metrics**: Track system performance
- **Error Tracking**: Track and alert on errors
- **User Analytics**: Track user behavior

### Logging

- **Application Logs**: Log application events
- **Access Logs**: Log API access
- **Error Logs**: Log errors and exceptions
- **Audit Logs**: Log security-related events

## 🔒 Security Considerations

### Security Measures

- **HTTPS**: Secure communication
- **CSRF Protection**: Prevent cross-site request forgery
- **XSS Protection**: Prevent cross-site scripting
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Validate all user input
- **Output Encoding**: Encode all output
- **Content Security Policy**: Restrict resource loading
- **Dependency Scanning**: Check for vulnerable dependencies

### Data Protection

- **Encryption**: Encrypt sensitive data
- **Hashing**: Hash passwords
- **Data Minimization**: Collect only necessary data
- **Data Retention**: Delete data when no longer needed
- **Backup**: Regular data backups

## 📝 Development Guidelines

### Coding Standards

- **TypeScript**: Use TypeScript for all code
- **ESLint**: Follow ESLint rules
- **Prettier**: Format code with Prettier
- **Naming Conventions**: Follow consistent naming conventions
- **Documentation**: Document all public APIs
- **Comments**: Add comments for complex logic

### Git Workflow

- **Feature Branches**: Create a branch for each feature
- **Pull Requests**: Submit pull requests for review
- **Code Review**: Review all code changes
- **Continuous Integration**: Run tests on all pull requests
- **Semantic Versioning**: Follow semantic versioning for releases

### Development Process

1. **Requirements**: Define requirements
2. **Design**: Design the solution
3. **Implementation**: Implement the solution
4. **Testing**: Test the implementation
5. **Review**: Review the implementation
6. **Deployment**: Deploy the implementation
7. **Monitoring**: Monitor the deployment

## 🔄 Optimization Roadmap

The project includes several optimization plans in the `Optimering` directory:

### Phase 1: Foundation & Analysis

- Baseline metrics
- Dependency audit
- Code duplication analysis
- Security audit

### Phase 2: Dependency Upgrade

- Node.js upgrade
- React ecosystem update
- Next.js upgrade
- NestJS upgrade
- TypeScript update
- Version locking

### Phase 3: UI Consolidation

- Component enhancement
- Legacy cleanup
- Import migration
- UI system consolidation

### Phase 4: Docker Optimization

- Dockerfile optimization
- Docker Compose configuration
- Security implementation
- Health checks

### Phase 5: Testing & Validation

- Comprehensive testing
- Performance testing
- Security testing
- Load testing

### Phase 6: Documentation & Deployment

- Update documentation
- Final testing
- Deployment preparation
- Success metrics# 📚 LearningLab Technical Documentation

This document provides detailed technical information about the LearningLab platform, including architecture, implementation details, and development guidelines.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack Details](#technology-stack-details)
- [Backend Implementation](#backend-implementation)
- [Frontend Implementation](#frontend-implementation)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Authentication & Authorization](#authentication--authorization)
- [AI Integration](#ai-integration)
- [Performance Optimization](#performance-optimization)
- [Testing Strategy](#testing-strategy)
- [Deployment Pipeline](#deployment-pipeline)
- [Monitoring & Logging](#monitoring--logging)
- [Security Considerations](#security-considerations)
- [Development Guidelines](#development-guidelines)

## 🏗️ Architecture Overview

LearningLab follows a modern microservices-inspired architecture within a monorepo structure:

### System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Next.js Web    │────▶│  NestJS API     │────▶│  PostgreSQL     │
│  Frontend       │     │  Backend        │     │  Database       │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │     ▲
                              │     │
                              ▼     │
                        ┌─────────────────┐     ┌─────────────────┐
                        │                 │     │                 │
                        │  Redis Cache    │     │  OpenAI API     │
                        │                 │     │                 │
                        └─────────────────┘     └─────────────────┘
                                                       │
                                                       │
                                                       ▼
                                               ┌─────────────────┐
                                               │                 │
                                               │  Pinecone       │
                                               │  Vector DB      │
                                               │                 │
                                               └─────────────────┘
```

### Monorepo Structure

The monorepo is organized using Turborepo for efficient build orchestration:

```
learninglab-monorepo/
├── apps/                  # Applications
│   ├── api/               # NestJS backend
│   │   ├── src/           # Source code
│   │   ├── prisma/        # Prisma client and seeds
│   │   └── test/          # Tests
│   └── web/               # Next.js frontend
│       ├── src/           # Source code
│       ├── public/        # Static assets
│       └── tests/         # Tests
├── packages/              # Shared packages
│   ├── ui/                # UI component library
│   │   ├── components/    # React components
│   │   ├── hooks/         # React hooks
│   │   └── theme/         # Theme configuration
│   ├── core/              # Shared core utilities
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── config/            # Shared configurations
│   │   ├── eslint/        # ESLint configuration
│   │   └── tailwind/      # Tailwind configuration
│   └── tsconfig/          # TypeScript configurations
├── prisma/                # Database schema
├── docker/                # Docker configuration
└── scripts/               # Utility scripts
```

## 💻 Technology Stack Details

### Frontend Technologies

- **Next.js 13.4.12**: React framework with server-side rendering and static site generation
- **React 18.2.0**: UI library with concurrent rendering support
- **Material UI 5.14.3**: Component library for consistent design
- **Shadcn/UI**: Customizable UI components
- **Redux Toolkit**: State management with simplified Redux implementation
- **Axios**: HTTP client for API requests
- **React Query**: Data fetching and caching
- **Tailwind CSS**: Utility-first CSS framework
- **Jest & React Testing Library**: Testing framework
- **Playwright**: End-to-end testing

### Backend Technologies

- **NestJS 10.3.10**: Progressive Node.js framework
- **Node.js 22**: JavaScript runtime
- **Express**: Web server framework
- **Prisma 6.8.2**: ORM for database access
- **PostgreSQL**: Relational database
- **Redis**: In-memory data store for caching
- **JWT**: Authentication mechanism
- **Passport.js**: Authentication middleware
- **Swagger**: API documentation
- **Jest**: Testing framework

### DevOps & Infrastructure

- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **GitHub Actions**: CI/CD pipeline
- **ESLint & Prettier**: Code quality tools
- **TypeScript 5.3.3**: Static type checking
- **Yarn 4.9.1**: Package manager
- **Turborepo 2.5.3**: Monorepo build system

## 🔧 Backend Implementation

### NestJS Modules

The backend is organized into the following modules:

- **AppModule**: Root module
- **AuthModule**: Authentication and authorization
- **UserModule**: User management
- **EducationModule**: Education program management
- **LessonModule**: Lesson management
- **QuizModule**: Quiz and assessment
- **AIModule**: AI integration
- **SearchModule**: Search functionality

### API Structure

The API follows RESTful principles with the following main endpoints:

- **/api/auth**: Authentication endpoints
- **/api/users**: User management
- **/api/programs**: Education program management
- **/api/lessons**: Lesson management
- **/api/quizzes**: Quiz and assessment
- **/api/progress**: User progress tracking
- **/api/certificates**: Certificate generation
- **/api/search**: Search functionality
- **/api/ai**: AI-powered features

### Authentication Flow

1. User submits credentials
2. Server validates credentials
3. Server generates JWT token
4. Client stores token in cookies/local storage
5. Client includes token in subsequent requests
6. Server validates token for protected routes

## 🎨 Frontend Implementation

### Next.js Pages

The frontend is organized using Next.js pages:

- **/pages/index.tsx**: Home page
- **/pages/auth/**: Authentication pages
- **/pages/dashboard/**: User dashboard
- **/pages/programs/**: Education programs
- **/pages/lessons/**: Lessons
- **/pages/quizzes/**: Quizzes and assessments
- **/pages/profile/**: User profile
- **/pages/certificates/**: User certificates
- **/pages/admin/**: Admin dashboard

### State Management

Redux Toolkit is used for global state management with the following slices:

- **authSlice**: Authentication state
- **userSlice**: User information
- **programsSlice**: Education programs
- **lessonsSlice**: Lessons
- **quizzesSlice**: Quizzes and assessments
- **progressSlice**: User progress
- **uiSlice**: UI state (modals, notifications, etc.)

### Component Architecture

UI components follow a hierarchical structure:

- **Layout Components**: Page layouts, navigation, etc.
- **Page Components**: Components specific to pages
- **Feature Components**: Components for specific features
- **UI Components**: Reusable UI components

## 📊 Database Schema

The database schema is defined using Prisma and includes the following main entities:

### User Management

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String?
  name          String?
  role          UserRole  @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  profile       Profile?
  progress      UserProgress[]
  quizAttempts  QuizAttempt[]
  certificates  Certificate[]
}

enum UserRole {
  USER
  INSTRUCTOR
  ADMIN
}

model Profile {
  id            String    @id @default(uuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  bio           String?
  avatar        String?
  preferences   Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Education Content

```prisma
model EducationProgram {
  id            String    @id @default(uuid())
  title         String
  description   String
  imageUrl      String?
  published     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lessons       Lesson[]
  enrollments   UserProgress[]
}

model Lesson {
  id            String    @id @default(uuid())
  title         String
  description   String
  order         Int
  programId     String
  program       EducationProgram @relation(fields: [programId], references: [id])
  contentBlocks ContentBlock[]
  quizzes       Quiz[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model ContentBlock {
  id            String    @id @default(uuid())
  type          BlockType
  content       String
  order         Int
  lessonId      String
  lesson        Lesson    @relation(fields: [lessonId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum BlockType {
  TEXT
  IMAGE
  VIDEO
  CODE
  MARKDOWN
  INTERACTIVE
}
```

### Assessment

```prisma
model Quiz {
  id            String    @id @default(uuid())
  title         String
  description   String
  timeLimit     Int?      // in minutes
  passingScore  Int       @default(70)
  lessonId      String?
  lesson        Lesson?   @relation(fields: [lessonId], references: [id])
  questions     Question[]
  attempts      QuizAttempt[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Question {
  id            String    @id @default(uuid())
  content       String
  type          QuestionType
  options       Json?     // for multiple choice
  correctAnswer String
  explanation   String?
  points        Int       @default(1)
  quizId        String
  quiz          Quiz      @relation(fields: [quizId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  SHORT_ANSWER
  ESSAY
}

model QuizAttempt {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  quizId        String
  quiz          Quiz      @relation(fields: [quizId], references: [id])
  answers       Json
  score         Int
  completed     Boolean   @default(false)
  startedAt     DateTime  @default(now())
  completedAt   DateTime?
}
```

### Progress Tracking

```prisma
model UserProgress {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  programId     String
  program       EducationProgram @relation(fields: [programId], references: [id])
  progress      Float     @default(0)
  completedLessons Json
  lastAccessed  DateTime  @default(now())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Certificate {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  programId     String
  title         String
  issueDate     DateTime  @default(now())
  pdfUrl        String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

## 📝 API Documentation

The API is documented using Swagger/OpenAPI. The documentation is available at `/api/docs` when running the backend.

### Sample Endpoints

#### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login a user
- `POST /api/auth/refresh`: Refresh access token
- `POST /api/auth/logout`: Logout a user

#### Users

- `GET /api/users/me`: Get current user
- `PUT /api/users/me`: Update current user
- `GET /api/users/:id`: Get user by ID (admin only)
- `PUT /api/users/:id`: Update user by ID (admin only)
- `DELETE /api/users/:id`: Delete user by ID (admin only)

#### Education Programs

- `GET /api/programs`: Get all programs
- `GET /api/programs/:id`: Get program by ID
- `POST /api/programs`: Create a new program (admin only)
- `PUT /api/programs/:id`: Update program by ID (admin only)
- `DELETE /api/programs/:id`: Delete program by ID (admin only)

#### Lessons

- `GET /api/lessons`: Get all lessons
- `GET /api/lessons/:id`: Get lesson by ID
- `POST /api/lessons`: Create a new lesson (admin only)
- `PUT /api/lessons/:id`: Update lesson by ID (admin only)
- `DELETE /api/lessons/:id`: Delete lesson by ID (admin only)

#### Quizzes

- `GET /api/quizzes`: Get all quizzes
- `GET /api/quizzes/:id`: Get quiz by ID
- `POST /api/quizzes`: Create a new quiz (admin only)
- `PUT /api/quizzes/:id`: Update quiz by ID (admin only)
- `DELETE /api/quizzes/:id`: Delete quiz by ID (admin only)
- `POST /api/quizzes/:id/attempt`: Start a quiz attempt
- `PUT /api/quizzes/:id/attempt/:attemptId`: Submit a quiz attempt

## 🔐 Authentication & Authorization

### Authentication Methods

- **Email/Password**: Traditional authentication
- **OAuth**: Social login (GitHub, Google)
- **JWT**: Token-based authentication

### Authorization Levels

- **Public**: Accessible without authentication
- **User**: Requires user authentication
- **Instructor**: Requires instructor role
- **Admin**: Requires admin role

### JWT Implementation

- **Access Token**: Short-lived token for API access
- **Refresh Token**: Long-lived token for refreshing access tokens
- **Token Storage**: HttpOnly cookies for security

## 🤖 AI Integration

### OpenAI Integration

The platform integrates with OpenAI for the following features:

- **Question Generation**: Automatically generate quiz questions from lesson content
- **Content Summarization**: Create summaries of lesson content
- **Personalized Learning**: Recommend content based on user progress

### Vector Database

Pinecone is used as a vector database for:

- **Semantic Search**: Find content based on meaning rather than keywords
- **Content Similarity**: Find similar content across the platform
- **Recommendation Engine**: Recommend content based on user interests

## ⚡ Performance Optimization

### Frontend Optimization

- **Code Splitting**: Split code into smaller chunks
- **Image Optimization**: Optimize images for faster loading
- **Lazy Loading**: Load components only when needed
- **Memoization**: Prevent unnecessary re-renders
- **Server-Side Rendering**: Improve initial load time
- **Static Site Generation**: Pre-render pages at build time

### Backend Optimization

- **Caching**: Cache responses with Redis
- **Database Indexing**: Optimize database queries
- **Connection Pooling**: Reuse database connections
- **Rate Limiting**: Prevent abuse
- **Compression**: Compress responses
- **Pagination**: Limit response size

### Docker Optimization

- **Multi-Stage Builds**: Reduce image size
- **Layer Caching**: Speed up builds
- **Resource Limits**: Prevent resource exhaustion
- **Health Checks**: Ensure service availability
- **Non-Root Users**: Improve security

## 🧪 Testing Strategy

### Testing Levels

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete user flows
- **Performance Tests**: Test system performance
- **Security Tests**: Test for vulnerabilities

### Testing Tools

- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing React components
- **Supertest**: HTTP testing
- **Playwright**: End-to-end testing
- **Lighthouse**: Performance testing

### Test Coverage

The project aims for at least 80% test coverage across all packages.

## 🚢 Deployment Pipeline

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

1. **Build**: Build the application
2. **Test**: Run tests
3. **Lint**: Check code quality
4. **Security Scan**: Check for vulnerabilities
5. **Deploy**: Deploy to staging/production

### Deployment Environments

- **Development**: Local development environment
- **Staging**: Pre-production environment
- **Production**: Live environment

### Deployment Process

1. **Build Docker Images**: Build optimized Docker images
2. **Push to Registry**: Push images to container registry
3. **Deploy to Kubernetes**: Deploy to Kubernetes cluster
4. **Run Migrations**: Run database migrations
5. **Health Checks**: Verify deployment health
6. **Rollback**: Rollback if deployment fails

## 📊 Monitoring & Logging

### Monitoring

- **Health Checks**: Regular health checks for all services
- **Performance Metrics**: Track system performance
- **Error Tracking**: Track and alert on errors
- **User Analytics**: Track user behavior

### Logging

- **Application Logs**: Log application events
- **Access Logs**: Log API access
- **Error Logs**: Log errors and exceptions
- **Audit Logs**: Log security-related events

## 🔒 Security Considerations

### Security Measures

- **HTTPS**: Secure communication
- **CSRF Protection**: Prevent cross-site request forgery
- **XSS Protection**: Prevent cross-site scripting
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Validate all user input
- **Output Encoding**: Encode all output
- **Content Security Policy**: Restrict resource loading
- **Dependency Scanning**: Check for vulnerable dependencies

### Data Protection

- **Encryption**: Encrypt sensitive data
- **Hashing**: Hash passwords
- **Data Minimization**: Collect only necessary data
- **Data Retention**: Delete data when no longer needed
- **Backup**: Regular data backups

## 📝 Development Guidelines

### Coding Standards

- **TypeScript**: Use TypeScript for all code
- **ESLint**: Follow ESLint rules
- **Prettier**: Format code with Prettier
- **Naming Conventions**: Follow consistent naming conventions
- **Documentation**: Document all public APIs
- **Comments**: Add comments for complex logic

### Git Workflow

- **Feature Branches**: Create a branch for each feature
- **Pull Requests**: Submit pull requests for review
- **Code Review**: Review all code changes
- **Continuous Integration**: Run tests on all pull requests
- **Semantic Versioning**: Follow semantic versioning for releases

### Development Process

1. **Requirements**: Define requirements
2. **Design**: Design the solution
3. **Implementation**: Implement the solution
4. **Testing**: Test the implementation
5. **Review**: Review the implementation
6. **Deployment**: Deploy the implementation
7. **Monitoring**: Monitor the deployment

## 🔄 Optimization Roadmap

The project includes several optimization plans in the `Optimering` directory:

### Phase 1: Foundation & Analysis

- Baseline metrics
- Dependency audit
- Code duplication analysis
- Security audit

### Phase 2: Dependency Upgrade

- Node.js upgrade
- React ecosystem update
- Next.js upgrade
- NestJS upgrade
- TypeScript update
- Version locking

### Phase 3: UI Consolidation

- Component enhancement
- Legacy cleanup
- Import migration
- UI system consolidation

### Phase 4: Docker Optimization

- Dockerfile optimization
- Docker Compose configuration
- Security implementation
- Health checks

### Phase 5: Testing & Validation

- Comprehensive testing
- Performance testing
- Security testing
- Load testing

### Phase 6: Documentation & Deployment

- Update documentation
- Final testing
- Deployment preparation
- Success metrics