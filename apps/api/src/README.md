# API Module Organization

This document outlines the standardized structure for the LearningLab API.

## Directory Structure

```
src/
├── auth/                 # Authentication-related functionality
│   ├── decorators/       # Custom decorators for auth
│   ├── dto/              # Data Transfer Objects for auth
│   ├── guards/           # Guards for protecting routes
│   └── strategies/       # Auth strategies (GitHub, Google, JWT, Local)
├── common/               # Common utilities and shared code
│   ├── filters/          # Exception filters
│   ├── interceptors/     # Request/response interceptors
│   ├── middleware/       # Custom middleware
│   ├── pipes/            # Validation pipes
│   └── services/         # Common services
├── config/               # Configuration settings
├── controllers/          # API controllers (endpoints)
│   └── dto/              # Data Transfer Objects for controllers
├── modules/              # Feature modules
├── persistence/          # Database access layer
│   └── prisma/           # Prisma ORM configuration
├── services/             # Service layer (business logic)
├── shared/               # Shared utilities
└── types/                # TypeScript type definitions
```

## Module Organization Guidelines

1. **Feature-based Organization**:

   - Each major feature should have its own directory (e.g., `users/`, `quiz/`, `user-groups/`)
   - Feature directories should follow a consistent structure

2. **Standard Module Structure**:

   ```
   feature-name/
   ├── dto/                # Data Transfer Objects
   ├── entities/           # Entity definitions
   ├── feature-name.controller.ts  # Controller
   ├── feature-name.service.ts     # Service
   ├── feature-name.module.ts      # Module definition
   └── feature-name.types.ts       # Type definitions
   ```

3. **Naming Conventions**:

   - Use kebab-case for directory names
   - Use camelCase for file names
   - Use PascalCase for class names
   - Suffix files according to their purpose:
     - `.controller.ts` for controllers
     - `.service.ts` for services
     - `.module.ts` for modules
     - `.dto.ts` for DTOs
     - `.entity.ts` for entities
     - `.guard.ts` for guards
     - `.middleware.ts` for middleware
     - `.pipe.ts` for pipes
     - `.filter.ts` for filters
     - `.interceptor.ts` for interceptors
     - `.types.ts` for type definitions

4. **Import Organization**:
   - Use absolute imports with path aliases where possible
   - Group imports in the following order:
     1. External libraries
     2. NestJS framework imports
     3. Application modules
     4. Relative imports

## Standardization Plan

1. **Phase 1**: Document the current structure (this document)
2. **Phase 2**: Gradually refactor existing modules to follow the standardized structure
3. **Phase 3**: Implement linting rules to enforce the standardized structure

## Migration Guidelines

When migrating existing code to the standardized structure:

1. Create the new directory structure
2. Move files to their new locations
3. Update imports
4. Test thoroughly
5. Update documentation

## Best Practices

1. **Single Responsibility Principle**: Each file should have a single responsibility
2. **Dependency Injection**: Use NestJS dependency injection for all services
3. **Validation**: Use DTOs with class-validator for input validation
4. **Error Handling**: Use exception filters for consistent error responses
5. **Documentation**: Use Swagger annotations for API documentation
