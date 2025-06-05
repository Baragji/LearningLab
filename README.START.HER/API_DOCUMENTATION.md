# 📝 LearningLab API Documentation

This document provides comprehensive documentation for the LearningLab API, including endpoints, request/response formats, authentication, and error handling.

## 📋 Table of Contents

- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Pagination](#pagination)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#users-endpoints)
  - [Education Programs](#education-programs-endpoints)
  - [Lessons](#lessons-endpoints)
  - [Content Blocks](#content-blocks-endpoints)
  - [Quizzes](#quizzes-endpoints)
  - [Questions](#questions-endpoints)
  - [Quiz Attempts](#quiz-attempts-endpoints)
  - [User Progress](#user-progress-endpoints)
  - [Certificates](#certificates-endpoints)
  - [Search](#search-endpoints)
  - [AI](#ai-endpoints)
- [Data Models](#data-models)
- [Webhooks](#webhooks)
- [API Versioning](#api-versioning)

## 🌟 API Overview

The LearningLab API is a RESTful API built with NestJS. It provides endpoints for managing users, education programs, lessons, quizzes, and more.

### Base URL

- Development: `http://localhost:3001/api`
- Production: `https://api.learninglab.com/api`

### API Versioning

The API uses URL versioning. The current version is v1.

```
https://api.learninglab.com/api/v1
```

### Content Type

All requests and responses use JSON format.

```
Content-Type: application/json
```

## 🔐 Authentication

The API uses JWT (JSON Web Token) for authentication.

### Token Types

- **Access Token**: Short-lived token for API access (expires in 15 minutes)
- **Refresh Token**: Long-lived token for refreshing access tokens (expires in 7 days)

### Authentication Flow

1. User logs in with email and password
2. Server returns access token and refresh token
3. Client includes access token in Authorization header for subsequent requests
4. When access token expires, client uses refresh token to get a new access token

### Authorization Header

```
Authorization: Bearer <access_token>
```

## ❌ Error Handling

The API uses standard HTTP status codes and returns error details in the response body.

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "email must be a valid email address"
    }
  ]
}
```

### Common Status Codes

- **200 OK**: Request succeeded
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation error
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

## ⏱️ Rate Limiting

The API implements rate limiting to prevent abuse.

### Rate Limits

- **Public API**: 60 requests per minute
- **Authenticated API**: 120 requests per minute

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1620000000
```

## 📄 Pagination

The API supports pagination for endpoints that return multiple resources.

### Pagination Parameters

- **page**: Page number (default: 1)
- **limit**: Number of items per page (default: 10, max: 100)

### Pagination Response

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/users?page=1&limit=10",
    "prev": null,
    "next": "/api/v1/users?page=2&limit=10",
    "last": "/api/v1/users?page=10&limit=10"
  }
}
```

## 🔄 Endpoints

### Authentication Endpoints

#### Register a new user

```
POST /api/v1/auth/register
```

Request:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "createdAt": "2023-01-01T00:00:00.000Z"
}
```

#### Login

```
POST /api/v1/auth/login
```

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

#### Refresh Token

```
POST /api/v1/auth/refresh
```

Request:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout

```
POST /api/v1/auth/logout
```

Request:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response:
```json
{
  "message": "Logged out successfully"
}
```

### Users Endpoints

#### Get Current User

```
GET /api/v1/users/me
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "profile": {
    "bio": "Software developer",
    "avatar": "https://example.com/avatar.jpg"
  },
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update Current User

```
PUT /api/v1/users/me
```

Request:
```json
{
  "name": "John Smith",
  "profile": {
    "bio": "Senior software developer",
    "avatar": "https://example.com/new-avatar.jpg"
  }
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "name": "John Smith",
  "role": "USER",
  "profile": {
    "bio": "Senior software developer",
    "avatar": "https://example.com/new-avatar.jpg"
  },
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Get User by ID (Admin only)

```
GET /api/v1/users/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "profile": {
    "bio": "Software developer",
    "avatar": "https://example.com/avatar.jpg"
  },
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Get All Users (Admin only)

```
GET /api/v1/users
```

Query Parameters:
- **page**: Page number (default: 1)
- **limit**: Number of items per page (default: 10, max: 100)
- **search**: Search term for name or email
- **role**: Filter by role (USER, INSTRUCTOR, ADMIN)

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More users...
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/users?page=1&limit=10",
    "prev": null,
    "next": "/api/v1/users?page=2&limit=10",
    "last": "/api/v1/users?page=10&limit=10"
  }
}
```

#### Update User by ID (Admin only)

```
PUT /api/v1/users/:id
```

Request:
```json
{
  "name": "John Smith",
  "role": "INSTRUCTOR",
  "profile": {
    "bio": "Senior software developer",
    "avatar": "https://example.com/new-avatar.jpg"
  }
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "name": "John Smith",
  "role": "INSTRUCTOR",
  "profile": {
    "bio": "Senior software developer",
    "avatar": "https://example.com/new-avatar.jpg"
  },
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Delete User by ID (Admin only)

```
DELETE /api/v1/users/:id
```

Response:
```json
{
  "message": "User deleted successfully"
}
```

### Education Programs Endpoints

#### Get All Programs

```
GET /api/v1/programs
```

Query Parameters:
- **page**: Page number (default: 1)
- **limit**: Number of items per page (default: 10, max: 100)
- **search**: Search term for title or description
- **published**: Filter by published status (true/false)

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Introduction to Programming",
      "description": "Learn the basics of programming",
      "imageUrl": "https://example.com/program.jpg",
      "published": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More programs...
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/programs?page=1&limit=10",
    "prev": null,
    "next": "/api/v1/programs?page=2&limit=10",
    "last": "/api/v1/programs?page=10&limit=10"
  }
}
```

#### Get Program by ID

```
GET /api/v1/programs/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Introduction to Programming",
  "description": "Learn the basics of programming",
  "imageUrl": "https://example.com/program.jpg",
  "published": true,
  "lessons": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "title": "Variables and Data Types",
      "description": "Learn about variables and data types",
      "order": 1
    },
    // More lessons...
  ],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Create Program (Admin/Instructor only)

```
POST /api/v1/programs
```

Request:
```json
{
  "title": "Introduction to Programming",
  "description": "Learn the basics of programming",
  "imageUrl": "https://example.com/program.jpg",
  "published": false
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Introduction to Programming",
  "description": "Learn the basics of programming",
  "imageUrl": "https://example.com/program.jpg",
  "published": false,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update Program (Admin/Instructor only)

```
PUT /api/v1/programs/:id
```

Request:
```json
{
  "title": "Introduction to Programming 101",
  "description": "Learn the basics of programming with hands-on examples",
  "imageUrl": "https://example.com/program-updated.jpg",
  "published": true
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Introduction to Programming 101",
  "description": "Learn the basics of programming with hands-on examples",
  "imageUrl": "https://example.com/program-updated.jpg",
  "published": true,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Delete Program (Admin/Instructor only)

```
DELETE /api/v1/programs/:id
```

Response:
```json
{
  "message": "Program deleted successfully"
}
```

### Lessons Endpoints

#### Get All Lessons

```
GET /api/v1/lessons
```

Query Parameters:
- **page**: Page number (default: 1)
- **limit**: Number of items per page (default: 10, max: 100)
- **search**: Search term for title or description
- **programId**: Filter by program ID

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "title": "Variables and Data Types",
      "description": "Learn about variables and data types",
      "order": 1,
      "programId": "123e4567-e89b-12d3-a456-426614174000",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More lessons...
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/lessons?page=1&limit=10",
    "prev": null,
    "next": "/api/v1/lessons?page=2&limit=10",
    "last": "/api/v1/lessons?page=10&limit=10"
  }
}
```

#### Get Lesson by ID

```
GET /api/v1/lessons/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "title": "Variables and Data Types",
  "description": "Learn about variables and data types",
  "order": 1,
  "programId": "123e4567-e89b-12d3-a456-426614174000",
  "contentBlocks": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "type": "TEXT",
      "content": "Variables are used to store data in programming.",
      "order": 1
    },
    // More content blocks...
  ],
  "quizzes": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "title": "Variables Quiz",
      "description": "Test your knowledge of variables",
      "timeLimit": 10,
      "passingScore": 70
    }
  ],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Create Lesson (Admin/Instructor only)

```
POST /api/v1/lessons
```

Request:
```json
{
  "title": "Variables and Data Types",
  "description": "Learn about variables and data types",
  "order": 1,
  "programId": "123e4567-e89b-12d3-a456-426614174000"
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "title": "Variables and Data Types",
  "description": "Learn about variables and data types",
  "order": 1,
  "programId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update Lesson (Admin/Instructor only)

```
PUT /api/v1/lessons/:id
```

Request:
```json
{
  "title": "Variables, Constants, and Data Types",
  "description": "Learn about variables, constants, and data types in programming",
  "order": 1
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "title": "Variables, Constants, and Data Types",
  "description": "Learn about variables, constants, and data types in programming",
  "order": 1,
  "programId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Delete Lesson (Admin/Instructor only)

```
DELETE /api/v1/lessons/:id
```

Response:
```json
{
  "message": "Lesson deleted successfully"
}
```

### Content Blocks Endpoints

#### Get All Content Blocks for a Lesson

```
GET /api/v1/lessons/:lessonId/content-blocks
```

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "type": "TEXT",
      "content": "Variables are used to store data in programming.",
      "order": 1,
      "lessonId": "123e4567-e89b-12d3-a456-426614174001",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More content blocks...
  ]
}
```

#### Get Content Block by ID

```
GET /api/v1/content-blocks/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "type": "TEXT",
  "content": "Variables are used to store data in programming.",
  "order": 1,
  "lessonId": "123e4567-e89b-12d3-a456-426614174001",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Create Content Block (Admin/Instructor only)

```
POST /api/v1/lessons/:lessonId/content-blocks
```

Request:
```json
{
  "type": "TEXT",
  "content": "Variables are used to store data in programming.",
  "order": 1
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "type": "TEXT",
  "content": "Variables are used to store data in programming.",
  "order": 1,
  "lessonId": "123e4567-e89b-12d3-a456-426614174001",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update Content Block (Admin/Instructor only)

```
PUT /api/v1/content-blocks/:id
```

Request:
```json
{
  "type": "MARKDOWN",
  "content": "# Variables\n\nVariables are used to store data in programming.",
  "order": 1
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "type": "MARKDOWN",
  "content": "# Variables\n\nVariables are used to store data in programming.",
  "order": 1,
  "lessonId": "123e4567-e89b-12d3-a456-426614174001",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Delete Content Block (Admin/Instructor only)

```
DELETE /api/v1/content-blocks/:id
```

Response:
```json
{
  "message": "Content block deleted successfully"
}
```

### Quizzes Endpoints

#### Get All Quizzes

```
GET /api/v1/quizzes
```

Query Parameters:
- **page**: Page number (default: 1)
- **limit**: Number of items per page (default: 10, max: 100)
- **search**: Search term for title or description
- **lessonId**: Filter by lesson ID

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "title": "Variables Quiz",
      "description": "Test your knowledge of variables",
      "timeLimit": 10,
      "passingScore": 70,
      "lessonId": "123e4567-e89b-12d3-a456-426614174001",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More quizzes...
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/quizzes?page=1&limit=10",
    "prev": null,
    "next": "/api/v1/quizzes?page=2&limit=10",
    "last": "/api/v1/quizzes?page=10&limit=10"
  }
}
```

#### Get Quiz by ID

```
GET /api/v1/quizzes/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "title": "Variables Quiz",
  "description": "Test your knowledge of variables",
  "timeLimit": 10,
  "passingScore": 70,
  "lessonId": "123e4567-e89b-12d3-a456-426614174001",
  "questions": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174004",
      "content": "What is a variable?",
      "type": "MULTIPLE_CHOICE",
      "options": [
        "A container for storing data",
        "A mathematical operation",
        "A programming language",
        "A type of function"
      ],
      "correctAnswer": "A container for storing data",
      "explanation": "Variables are used to store data in programming.",
      "points": 1
    },
    // More questions...
  ],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Create Quiz (Admin/Instructor only)

```
POST /api/v1/quizzes
```

Request:
```json
{
  "title": "Variables Quiz",
  "description": "Test your knowledge of variables",
  "timeLimit": 10,
  "passingScore": 70,
  "lessonId": "123e4567-e89b-12d3-a456-426614174001"
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "title": "Variables Quiz",
  "description": "Test your knowledge of variables",
  "timeLimit": 10,
  "passingScore": 70,
  "lessonId": "123e4567-e89b-12d3-a456-426614174001",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update Quiz (Admin/Instructor only)

```
PUT /api/v1/quizzes/:id
```

Request:
```json
{
  "title": "Variables and Constants Quiz",
  "description": "Test your knowledge of variables and constants",
  "timeLimit": 15,
  "passingScore": 80
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "title": "Variables and Constants Quiz",
  "description": "Test your knowledge of variables and constants",
  "timeLimit": 15,
  "passingScore": 80,
  "lessonId": "123e4567-e89b-12d3-a456-426614174001",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Delete Quiz (Admin/Instructor only)

```
DELETE /api/v1/quizzes/:id
```

Response:
```json
{
  "message": "Quiz deleted successfully"
}
```

### Questions Endpoints

#### Get All Questions for a Quiz

```
GET /api/v1/quizzes/:quizId/questions
```

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174004",
      "content": "What is a variable?",
      "type": "MULTIPLE_CHOICE",
      "options": [
        "A container for storing data",
        "A mathematical operation",
        "A programming language",
        "A type of function"
      ],
      "correctAnswer": "A container for storing data",
      "explanation": "Variables are used to store data in programming.",
      "points": 1,
      "quizId": "123e4567-e89b-12d3-a456-426614174003",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More questions...
  ]
}
```

#### Get Question by ID

```
GET /api/v1/questions/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "content": "What is a variable?",
  "type": "MULTIPLE_CHOICE",
  "options": [
    "A container for storing data",
    "A mathematical operation",
    "A programming language",
    "A type of function"
  ],
  "correctAnswer": "A container for storing data",
  "explanation": "Variables are used to store data in programming.",
  "points": 1,
  "quizId": "123e4567-e89b-12d3-a456-426614174003",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Create Question (Admin/Instructor only)

```
POST /api/v1/quizzes/:quizId/questions
```

Request:
```json
{
  "content": "What is a variable?",
  "type": "MULTIPLE_CHOICE",
  "options": [
    "A container for storing data",
    "A mathematical operation",
    "A programming language",
    "A type of function"
  ],
  "correctAnswer": "A container for storing data",
  "explanation": "Variables are used to store data in programming.",
  "points": 1
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "content": "What is a variable?",
  "type": "MULTIPLE_CHOICE",
  "options": [
    "A container for storing data",
    "A mathematical operation",
    "A programming language",
    "A type of function"
  ],
  "correctAnswer": "A container for storing data",
  "explanation": "Variables are used to store data in programming.",
  "points": 1,
  "quizId": "123e4567-e89b-12d3-a456-426614174003",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update Question (Admin/Instructor only)

```
PUT /api/v1/questions/:id
```

Request:
```json
{
  "content": "What is a variable in programming?",
  "type": "MULTIPLE_CHOICE",
  "options": [
    "A container for storing data",
    "A mathematical operation",
    "A programming language",
    "A type of function"
  ],
  "correctAnswer": "A container for storing data",
  "explanation": "Variables are used to store data values in programming.",
  "points": 2
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "content": "What is a variable in programming?",
  "type": "MULTIPLE_CHOICE",
  "options": [
    "A container for storing data",
    "A mathematical operation",
    "A programming language",
    "A type of function"
  ],
  "correctAnswer": "A container for storing data",
  "explanation": "Variables are used to store data values in programming.",
  "points": 2,
  "quizId": "123e4567-e89b-12d3-a456-426614174003",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Delete Question (Admin/Instructor only)

```
DELETE /api/v1/questions/:id
```

Response:
```json
{
  "message": "Question deleted successfully"
}
```

### Quiz Attempts Endpoints

#### Start Quiz Attempt

```
POST /api/v1/quizzes/:quizId/attempts
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "quizId": "123e4567-e89b-12d3-a456-426614174003",
  "answers": {},
  "score": 0,
  "completed": false,
  "startedAt": "2023-01-01T00:00:00.000Z",
  "completedAt": null
}
```

#### Submit Quiz Attempt

```
PUT /api/v1/quizzes/:quizId/attempts/:attemptId
```

Request:
```json
{
  "answers": {
    "123e4567-e89b-12d3-a456-426614174004": "A container for storing data",
    "123e4567-e89b-12d3-a456-426614174006": "true"
  }
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "quizId": "123e4567-e89b-12d3-a456-426614174003",
  "answers": {
    "123e4567-e89b-12d3-a456-426614174004": "A container for storing data",
    "123e4567-e89b-12d3-a456-426614174006": "true"
  },
  "score": 100,
  "completed": true,
  "startedAt": "2023-01-01T00:00:00.000Z",
  "completedAt": "2023-01-01T00:10:00.000Z"
}
```

#### Get Quiz Attempt by ID

```
GET /api/v1/quiz-attempts/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "quizId": "123e4567-e89b-12d3-a456-426614174003",
  "answers": {
    "123e4567-e89b-12d3-a456-426614174004": "A container for storing data",
    "123e4567-e89b-12d3-a456-426614174006": "true"
  },
  "score": 100,
  "completed": true,
  "startedAt": "2023-01-01T00:00:00.000Z",
  "completedAt": "2023-01-01T00:10:00.000Z"
}
```

#### Get All Quiz Attempts for a User

```
GET /api/v1/users/me/quiz-attempts
```

Query Parameters:
- **page**: Page number (default: 1)
- **limit**: Number of items per page (default: 10, max: 100)
- **quizId**: Filter by quiz ID
- **completed**: Filter by completion status (true/false)

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174005",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "quizId": "123e4567-e89b-12d3-a456-426614174003",
      "quiz": {
        "id": "123e4567-e89b-12d3-a456-426614174003",
        "title": "Variables Quiz",
        "description": "Test your knowledge of variables"
      },
      "score": 100,
      "completed": true,
      "startedAt": "2023-01-01T00:00:00.000Z",
      "completedAt": "2023-01-01T00:10:00.000Z"
    },
    // More quiz attempts...
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/users/me/quiz-attempts?page=1&limit=10",
    "prev": null,
    "next": "/api/v1/users/me/quiz-attempts?page=2&limit=10",
    "last": "/api/v1/users/me/quiz-attempts?page=10&limit=10"
  }
}
```

### User Progress Endpoints

#### Get User Progress

```
GET /api/v1/users/me/progress
```

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174007",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "programId": "123e4567-e89b-12d3-a456-426614174000",
      "program": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Introduction to Programming",
        "description": "Learn the basics of programming"
      },
      "progress": 50,
      "completedLessons": [
        "123e4567-e89b-12d3-a456-426614174001"
      ],
      "lastAccessed": "2023-01-01T00:00:00.000Z",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More progress entries...
  ]
}
```

#### Get User Progress for a Program

```
GET /api/v1/users/me/progress/:programId
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174007",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "programId": "123e4567-e89b-12d3-a456-426614174000",
  "program": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Introduction to Programming",
    "description": "Learn the basics of programming"
  },
  "progress": 50,
  "completedLessons": [
    "123e4567-e89b-12d3-a456-426614174001"
  ],
  "lastAccessed": "2023-01-01T00:00:00.000Z",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update User Progress

```
PUT /api/v1/users/me/progress/:programId
```

Request:
```json
{
  "completedLessons": [
    "123e4567-e89b-12d3-a456-426614174001",
    "123e4567-e89b-12d3-a456-426614174008"
  ]
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174007",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "programId": "123e4567-e89b-12d3-a456-426614174000",
  "progress": 100,
  "completedLessons": [
    "123e4567-e89b-12d3-a456-426614174001",
    "123e4567-e89b-12d3-a456-426614174008"
  ],
  "lastAccessed": "2023-01-01T00:00:00.000Z",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Certificates Endpoints

#### Get User Certificates

```
GET /api/v1/users/me/certificates
```

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174009",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "programId": "123e4567-e89b-12d3-a456-426614174000",
      "program": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Introduction to Programming",
        "description": "Learn the basics of programming"
      },
      "title": "Introduction to Programming Certificate",
      "issueDate": "2023-01-01T00:00:00.000Z",
      "pdfUrl": "https://example.com/certificates/123e4567-e89b-12d3-a456-426614174009.pdf",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More certificates...
  ]
}
```

#### Get Certificate by ID

```
GET /api/v1/certificates/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174009",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "programId": "123e4567-e89b-12d3-a456-426614174000",
  "program": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Introduction to Programming",
    "description": "Learn the basics of programming"
  },
  "title": "Introduction to Programming Certificate",
  "issueDate": "2023-01-01T00:00:00.000Z",
  "pdfUrl": "https://example.com/certificates/123e4567-e89b-12d3-a456-426614174009.pdf",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Generate Certificate

```
POST /api/v1/users/me/certificates
```

Request:
```json
{
  "programId": "123e4567-e89b-12d3-a456-426614174000"
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174009",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "programId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Introduction to Programming Certificate",
  "issueDate": "2023-01-01T00:00:00.000Z",
  "pdfUrl": "https://example.com/certificates/123e4567-e89b-12d3-a456-426614174009.pdf",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Search Endpoints

#### Search All Content

```
GET /api/v1/search
```

Query Parameters:
- **q**: Search query
- **type**: Filter by content type (PROGRAM, LESSON, QUIZ)
- **page**: Page number (default: 1)
- **limit**: Number of items per page (default: 10, max: 100)

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "type": "PROGRAM",
      "title": "Introduction to Programming",
      "description": "Learn the basics of programming",
      "url": "/programs/123e4567-e89b-12d3-a456-426614174000"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "type": "LESSON",
      "title": "Variables and Data Types",
      "description": "Learn about variables and data types",
      "url": "/lessons/123e4567-e89b-12d3-a456-426614174001"
    },
    // More search results...
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/search?q=programming&page=1&limit=10",
    "prev": null,
    "next": "/api/v1/search?q=programming&page=2&limit=10",
    "last": "/api/v1/search?q=programming&page=10&limit=10"
  }
}
```

### AI Endpoints

#### Generate Quiz Questions

```
POST /api/v1/ai/generate-questions
```

Request:
```json
{
  "content": "Variables are used to store data in programming. There are different types of variables, such as integers, strings, and booleans.",
  "count": 3,
  "type": "MULTIPLE_CHOICE"
}
```

Response:
```json
{
  "questions": [
    {
      "content": "What is the primary purpose of variables in programming?",
      "type": "MULTIPLE_CHOICE",
      "options": [
        "To store data",
        "To perform calculations",
        "To define functions",
        "To create loops"
      ],
      "correctAnswer": "To store data",
      "explanation": "Variables are used to store data in programming."
    },
    // More generated questions...
  ]
}
```

#### Summarize Content

```
POST /api/v1/ai/summarize
```

Request:
```json
{
  "content": "Variables are used to store data in programming. There are different types of variables, such as integers, strings, and booleans. Integers are used to store whole numbers, strings are used to store text, and booleans are used to store true/false values. Variables must be declared before they can be used. In many programming languages, variables must also be given a type when they are declared.",
  "maxLength": 100
}
```

Response:
```json
{
  "summary": "Variables store data in programming, including integers (whole numbers), strings (text), and booleans (true/false). They require declaration before use, often with a specified type."
}
```

## 📊 Data Models

### User

```json
{
  "id": "string",
  "email": "string",
  "password": "string (hashed)",
  "name": "string",
  "role": "USER | INSTRUCTOR | ADMIN",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Profile

```json
{
  "id": "string",
  "userId": "string",
  "bio": "string",
  "avatar": "string (URL)",
  "preferences": "json",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### EducationProgram

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "imageUrl": "string (URL)",
  "published": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Lesson

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "order": "integer",
  "programId": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### ContentBlock

```json
{
  "id": "string",
  "type": "TEXT | IMAGE | VIDEO | CODE | MARKDOWN | INTERACTIVE",
  "content": "string",
  "order": "integer",
  "lessonId": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Quiz

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "timeLimit": "integer (minutes)",
  "passingScore": "integer (percentage)",
  "lessonId": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Question

```json
{
  "id": "string",
  "content": "string",
  "type": "MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER | ESSAY",
  "options": "json (array of strings)",
  "correctAnswer": "string",
  "explanation": "string",
  "points": "integer",
  "quizId": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### QuizAttempt

```json
{
  "id": "string",
  "userId": "string",
  "quizId": "string",
  "answers": "json (map of questionId to answer)",
  "score": "integer (percentage)",
  "completed": "boolean",
  "startedAt": "datetime",
  "completedAt": "datetime",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### UserProgress

```json
{
  "id": "string",
  "userId": "string",
  "programId": "string",
  "progress": "float (percentage)",
  "completedLessons": "json (array of lessonIds)",
  "lastAccessed": "datetime",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Certificate

```json
{
  "id": "string",
  "userId": "string",
  "programId": "string",
  "title": "string",
  "issueDate": "datetime",
  "pdfUrl": "string (URL)",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## 🔄 Webhooks

The API supports webhooks for certain events. Webhooks can be configured in the admin dashboard.

### Webhook Events

- **user.created**: Triggered when a new user is created
- **user.updated**: Triggered when a user is updated
- **program.published**: Triggered when a program is published
- **quiz.completed**: Triggered when a user completes a quiz
- **certificate.issued**: Triggered when a certificate is issued

### Webhook Payload

```json
{
  "event": "user.created",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "data": {
    // Event-specific data
  }
}
```

### Webhook Configuration

```
POST /api/v1/webhooks
```

Request:
```json
{
  "url": "https://example.com/webhook",
  "events": ["user.created", "user.updated"],
  "secret": "your_webhook_secret"
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174010",
  "url": "https://example.com/webhook",
  "events": ["user.created", "user.updated"],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

## 🔢 API Versioning

The API uses URL versioning. The current version is v1.

```
https://api.learninglab.com/api/v1
```

When a new version is released, the old version will be maintained for a period of time to allow clients to migrate to the new version.

### Version Lifecycle

- **Current**: The latest version of the API
- **Deprecated**: A version that is still supported but will be removed in the future
- **Sunset**: A version that is no longer supported and will be removed soon

### Version Headers

```
X-API-Version: v1
X-API-Deprecated: false
X-API-Sunset-Date: null
```

For deprecated versions:

```
X-API-Version: v1
X-API-Deprecated: true
X-API-Sunset-Date: 2024-01-01T00:00:00.000Z
```# 📝 LearningLab API Documentation

This document provides comprehensive documentation for the LearningLab API, including endpoints, request/response formats, authentication, and error handling.

## 📋 Table of Contents

- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Pagination](#pagination)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#users-endpoints)
  - [Education Programs](#education-programs-endpoints)
  - [Lessons](#lessons-endpoints)
  - [Content Blocks](#content-blocks-endpoints)
  - [Quizzes](#quizzes-endpoints)
  - [Questions](#questions-endpoints)
  - [Quiz Attempts](#quiz-attempts-endpoints)
  - [User Progress](#user-progress-endpoints)
  - [Certificates](#certificates-endpoints)
  - [Search](#search-endpoints)
  - [AI](#ai-endpoints)
- [Data Models](#data-models)
- [Webhooks](#webhooks)
- [API Versioning](#api-versioning)

## 🌟 API Overview

The LearningLab API is a RESTful API built with NestJS. It provides endpoints for managing users, education programs, lessons, quizzes, and more.

### Base URL

- Development: `http://localhost:3001/api`
- Production: `https://api.learninglab.com/api`

### API Versioning

The API uses URL versioning. The current version is v1.

```
https://api.learninglab.com/api/v1
```

### Content Type

All requests and responses use JSON format.

```
Content-Type: application/json
```

## 🔐 Authentication

The API uses JWT (JSON Web Token) for authentication.

### Token Types

- **Access Token**: Short-lived token for API access (expires in 15 minutes)
- **Refresh Token**: Long-lived token for refreshing access tokens (expires in 7 days)

### Authentication Flow

1. User logs in with email and password
2. Server returns access token and refresh token
3. Client includes access token in Authorization header for subsequent requests
4. When access token expires, client uses refresh token to get a new access token

### Authorization Header

```
Authorization: Bearer <access_token>
```

## ❌ Error Handling

The API uses standard HTTP status codes and returns error details in the response body.

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "email must be a valid email address"
    }
  ]
}
```

### Common Status Codes

- **200 OK**: Request succeeded
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation error
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

## ⏱️ Rate Limiting

The API implements rate limiting to prevent abuse.

### Rate Limits

- **Public API**: 60 requests per minute
- **Authenticated API**: 120 requests per minute

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1620000000
```

## 📄 Pagination

The API supports pagination for endpoints that return multiple resources.

### Pagination Parameters

- **page**: Page number (default: 1)
- **limit**: Number of items per page (default: 10, max: 100)

### Pagination Response

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/users?page=1&limit=10",
    "prev": null,
    "next": "/api/v1/users?page=2&limit=10",
    "last": "/api/v1/users?page=10&limit=10"
  }
}
```

## 🔄 Endpoints

### Authentication Endpoints

#### Register a new user

```
POST /api/v1/auth/register
```

Request:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "createdAt": "2023-01-01T00:00:00.000Z"
}
```

#### Login

```
POST /api/v1/auth/login
```

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

#### Refresh Token

```
POST /api/v1/auth/refresh
```

Request:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout

```
POST /api/v1/auth/logout
```

Request:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response:
```json
{
  "message": "Logged out successfully"
}
```

### Users Endpoints

#### Get Current User

```
GET /api/v1/users/me
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "profile": {
    "bio": "Software developer",
    "avatar": "https://example.com/avatar.jpg"
  },
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update Current User

```
PUT /api/v1/users/me
```

Request:
```json
{
  "name": "John Smith",
  "profile": {
    "bio": "Senior software developer",
    "avatar": "https://example.com/new-avatar.jpg"
  }
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "name": "John Smith",
  "role": "USER",
  "profile": {
    "bio": "Senior software developer",
    "avatar": "https://example.com/new-avatar.jpg"
  },
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Get User by ID (Admin only)

```
GET /api/v1/users/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "profile": {
    "bio": "Software developer",
    "avatar": "https://example.com/avatar.jpg"
  },
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Get All Users (Admin only)

```
GET /api/v1/users
```

Query Parameters:
- **page**: Page number (default: 1)
- **limit**: Number of items per page (default: 10, max: 100)
- **search**: Search term for name or email
- **role**: Filter by role (USER, INSTRUCTOR, ADMIN)

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More users...
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/users?page=1&limit=10",
    "prev": null,
    "next": "/api/v1/users?page=2&limit=10",
    "last": "/api/v1/users?page=10&limit=10"
  }
}
```

#### Update User by ID (Admin only)

```
PUT /api/v1/users/:id
```

Request:
```json
{
  "name": "John Smith",
  "role": "INSTRUCTOR",
  "profile": {
    "bio": "Senior software developer",
    "avatar": "https://example.com/new-avatar.jpg"
  }
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "name": "John Smith",
  "role": "INSTRUCTOR",
  "profile": {
    "bio": "Senior software developer",
    "avatar": "https://example.com/new-avatar.jpg"
  },
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Delete User by ID (Admin only)

```
DELETE /api/v1/users/:id
```

Response:
```json
{
  "message": "User deleted successfully"
}
```

### Education Programs Endpoints

#### Get All Programs

```
GET /api/v1/programs
```

Query Parameters:
- **page**: Page number (default: 1)
- **limit**: Number of items per page (default: 10, max: 100)
- **search**: Search term for title or description
- **published**: Filter by published status (true/false)

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Introduction to Programming",
      "description": "Learn the basics of programming",
      "imageUrl": "https://example.com/program.jpg",
      "published": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More programs...
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/programs?page=1&limit=10",
    "prev": null,
    "next": "/api/v1/programs?page=2&limit=10",
    "last": "/api/v1/programs?page=10&limit=10"
  }
}
```

#### Get Program by ID

```
GET /api/v1/programs/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Introduction to Programming",
  "description": "Learn the basics of programming",
  "imageUrl": "https://example.com/program.jpg",
  "published": true,
  "lessons": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "title": "Variables and Data Types",
      "description": "Learn about variables and data types",
      "order": 1
    },
    // More lessons...
  ],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Create Program (Admin/Instructor only)

```
POST /api/v1/programs
```

Request:
```json
{
  "title": "Introduction to Programming",
  "description": "Learn the basics of programming",
  "imageUrl": "https://example.com/program.jpg",
  "published": false
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Introduction to Programming",
  "description": "Learn the basics of programming",
  "imageUrl": "https://example.com/program.jpg",
  "published": false,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update Program (Admin/Instructor only)

```
PUT /api/v1/programs/:id
```

Request:
```json
{
  "title": "Introduction to Programming 101",
  "description": "Learn the basics of programming with hands-on examples",
  "imageUrl": "https://example.com/program-updated.jpg",
  "published": true
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Introduction to Programming 101",
  "description": "Learn the basics of programming with hands-on examples",
  "imageUrl": "https://example.com/program-updated.jpg",
  "published": true,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Delete Program (Admin/Instructor only)

```
DELETE /api/v1/programs/:id
```

Response:
```json
{
  "message": "Program deleted successfully"
}
```

### Lessons Endpoints

#### Get All Lessons

```
GET /api/v1/lessons
```

Query Parameters:
- **page**: Page number (default: 1)
- **limit**: Number of items per page (default: 10, max: 100)
- **search**: Search term for title or description
- **programId**: Filter by program ID

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "title": "Variables and Data Types",
      "description": "Learn about variables and data types",
      "order": 1,
      "programId": "123e4567-e89b-12d3-a456-426614174000",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More lessons...
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/lessons?page=1&limit=10",
    "prev": null,
    "next": "/api/v1/lessons?page=2&limit=10",
    "last": "/api/v1/lessons?page=10&limit=10"
  }
}
```

#### Get Lesson by ID

```
GET /api/v1/lessons/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "title": "Variables and Data Types",
  "description": "Learn about variables and data types",
  "order": 1,
  "programId": "123e4567-e89b-12d3-a456-426614174000",
  "contentBlocks": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "type": "TEXT",
      "content": "Variables are used to store data in programming.",
      "order": 1
    },
    // More content blocks...
  ],
  "quizzes": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "title": "Variables Quiz",
      "description": "Test your knowledge of variables",
      "timeLimit": 10,
      "passingScore": 70
    }
  ],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Create Lesson (Admin/Instructor only)

```
POST /api/v1/lessons
```

Request:
```json
{
  "title": "Variables and Data Types",
  "description": "Learn about variables and data types",
  "order": 1,
  "programId": "123e4567-e89b-12d3-a456-426614174000"
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "title": "Variables and Data Types",
  "description": "Learn about variables and data types",
  "order": 1,
  "programId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update Lesson (Admin/Instructor only)

```
PUT /api/v1/lessons/:id
```

Request:
```json
{
  "title": "Variables, Constants, and Data Types",
  "description": "Learn about variables, constants, and data types in programming",
  "order": 1
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "title": "Variables, Constants, and Data Types",
  "description": "Learn about variables, constants, and data types in programming",
  "order": 1,
  "programId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Delete Lesson (Admin/Instructor only)

```
DELETE /api/v1/lessons/:id
```

Response:
```json
{
  "message": "Lesson deleted successfully"
}
```

### Content Blocks Endpoints

#### Get All Content Blocks for a Lesson

```
GET /api/v1/lessons/:lessonId/content-blocks
```

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "type": "TEXT",
      "content": "Variables are used to store data in programming.",
      "order": 1,
      "lessonId": "123e4567-e89b-12d3-a456-426614174001",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More content blocks...
  ]
}
```

#### Get Content Block by ID

```
GET /api/v1/content-blocks/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "type": "TEXT",
  "content": "Variables are used to store data in programming.",
  "order": 1,
  "lessonId": "123e4567-e89b-12d3-a456-426614174001",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Create Content Block (Admin/Instructor only)

```
POST /api/v1/lessons/:lessonId/content-blocks
```

Request:
```json
{
  "type": "TEXT",
  "content": "Variables are used to store data in programming.",
  "order": 1
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "type": "TEXT",
  "content": "Variables are used to store data in programming.",
  "order": 1,
  "lessonId": "123e4567-e89b-12d3-a456-426614174001",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update Content Block (Admin/Instructor only)

```
PUT /api/v1/content-blocks/:id
```

Request:
```json
{
  "type": "MARKDOWN",
  "content": "# Variables\n\nVariables are used to store data in programming.",
  "order": 1
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "type": "MARKDOWN",
  "content": "# Variables\n\nVariables are used to store data in programming.",
  "order": 1,
  "lessonId": "123e4567-e89b-12d3-a456-426614174001",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Delete Content Block (Admin/Instructor only)

```
DELETE /api/v1/content-blocks/:id
```

Response:
```json
{
  "message": "Content block deleted successfully"
}
```

### Quizzes Endpoints

#### Get All Quizzes

```
GET /api/v1/quizzes
```

Query Parameters:
- **page**: Page number (default: 1)
- **limit**: Number of items per page (default: 10, max: 100)
- **search**: Search term for title or description
- **lessonId**: Filter by lesson ID

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "title": "Variables Quiz",
      "description": "Test your knowledge of variables",
      "timeLimit": 10,
      "passingScore": 70,
      "lessonId": "123e4567-e89b-12d3-a456-426614174001",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More quizzes...
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/quizzes?page=1&limit=10",
    "prev": null,
    "next": "/api/v1/quizzes?page=2&limit=10",
    "last": "/api/v1/quizzes?page=10&limit=10"
  }
}
```

#### Get Quiz by ID

```
GET /api/v1/quizzes/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "title": "Variables Quiz",
  "description": "Test your knowledge of variables",
  "timeLimit": 10,
  "passingScore": 70,
  "lessonId": "123e4567-e89b-12d3-a456-426614174001",
  "questions": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174004",
      "content": "What is a variable?",
      "type": "MULTIPLE_CHOICE",
      "options": [
        "A container for storing data",
        "A mathematical operation",
        "A programming language",
        "A type of function"
      ],
      "correctAnswer": "A container for storing data",
      "explanation": "Variables are used to store data in programming.",
      "points": 1
    },
    // More questions...
  ],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Create Quiz (Admin/Instructor only)

```
POST /api/v1/quizzes
```

Request:
```json
{
  "title": "Variables Quiz",
  "description": "Test your knowledge of variables",
  "timeLimit": 10,
  "passingScore": 70,
  "lessonId": "123e4567-e89b-12d3-a456-426614174001"
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "title": "Variables Quiz",
  "description": "Test your knowledge of variables",
  "timeLimit": 10,
  "passingScore": 70,
  "lessonId": "123e4567-e89b-12d3-a456-426614174001",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update Quiz (Admin/Instructor only)

```
PUT /api/v1/quizzes/:id
```

Request:
```json
{
  "title": "Variables and Constants Quiz",
  "description": "Test your knowledge of variables and constants",
  "timeLimit": 15,
  "passingScore": 80
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "title": "Variables and Constants Quiz",
  "description": "Test your knowledge of variables and constants",
  "timeLimit": 15,
  "passingScore": 80,
  "lessonId": "123e4567-e89b-12d3-a456-426614174001",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Delete Quiz (Admin/Instructor only)

```
DELETE /api/v1/quizzes/:id
```

Response:
```json
{
  "message": "Quiz deleted successfully"
}
```

### Questions Endpoints

#### Get All Questions for a Quiz

```
GET /api/v1/quizzes/:quizId/questions
```

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174004",
      "content": "What is a variable?",
      "type": "MULTIPLE_CHOICE",
      "options": [
        "A container for storing data",
        "A mathematical operation",
        "A programming language",
        "A type of function"
      ],
      "correctAnswer": "A container for storing data",
      "explanation": "Variables are used to store data in programming.",
      "points": 1,
      "quizId": "123e4567-e89b-12d3-a456-426614174003",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More questions...
  ]
}
```

#### Get Question by ID

```
GET /api/v1/questions/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "content": "What is a variable?",
  "type": "MULTIPLE_CHOICE",
  "options": [
    "A container for storing data",
    "A mathematical operation",
    "A programming language",
    "A type of function"
  ],
  "correctAnswer": "A container for storing data",
  "explanation": "Variables are used to store data in programming.",
  "points": 1,
  "quizId": "123e4567-e89b-12d3-a456-426614174003",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Create Question (Admin/Instructor only)

```
POST /api/v1/quizzes/:quizId/questions
```

Request:
```json
{
  "content": "What is a variable?",
  "type": "MULTIPLE_CHOICE",
  "options": [
    "A container for storing data",
    "A mathematical operation",
    "A programming language",
    "A type of function"
  ],
  "correctAnswer": "A container for storing data",
  "explanation": "Variables are used to store data in programming.",
  "points": 1
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "content": "What is a variable?",
  "type": "MULTIPLE_CHOICE",
  "options": [
    "A container for storing data",
    "A mathematical operation",
    "A programming language",
    "A type of function"
  ],
  "correctAnswer": "A container for storing data",
  "explanation": "Variables are used to store data in programming.",
  "points": 1,
  "quizId": "123e4567-e89b-12d3-a456-426614174003",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update Question (Admin/Instructor only)

```
PUT /api/v1/questions/:id
```

Request:
```json
{
  "content": "What is a variable in programming?",
  "type": "MULTIPLE_CHOICE",
  "options": [
    "A container for storing data",
    "A mathematical operation",
    "A programming language",
    "A type of function"
  ],
  "correctAnswer": "A container for storing data",
  "explanation": "Variables are used to store data values in programming.",
  "points": 2
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "content": "What is a variable in programming?",
  "type": "MULTIPLE_CHOICE",
  "options": [
    "A container for storing data",
    "A mathematical operation",
    "A programming language",
    "A type of function"
  ],
  "correctAnswer": "A container for storing data",
  "explanation": "Variables are used to store data values in programming.",
  "points": 2,
  "quizId": "123e4567-e89b-12d3-a456-426614174003",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Delete Question (Admin/Instructor only)

```
DELETE /api/v1/questions/:id
```

Response:
```json
{
  "message": "Question deleted successfully"
}
```

### Quiz Attempts Endpoints

#### Start Quiz Attempt

```
POST /api/v1/quizzes/:quizId/attempts
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "quizId": "123e4567-e89b-12d3-a456-426614174003",
  "answers": {},
  "score": 0,
  "completed": false,
  "startedAt": "2023-01-01T00:00:00.000Z",
  "completedAt": null
}
```

#### Submit Quiz Attempt

```
PUT /api/v1/quizzes/:quizId/attempts/:attemptId
```

Request:
```json
{
  "answers": {
    "123e4567-e89b-12d3-a456-426614174004": "A container for storing data",
    "123e4567-e89b-12d3-a456-426614174006": "true"
  }
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "quizId": "123e4567-e89b-12d3-a456-426614174003",
  "answers": {
    "123e4567-e89b-12d3-a456-426614174004": "A container for storing data",
    "123e4567-e89b-12d3-a456-426614174006": "true"
  },
  "score": 100,
  "completed": true,
  "startedAt": "2023-01-01T00:00:00.000Z",
  "completedAt": "2023-01-01T00:10:00.000Z"
}
```

#### Get Quiz Attempt by ID

```
GET /api/v1/quiz-attempts/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "quizId": "123e4567-e89b-12d3-a456-426614174003",
  "answers": {
    "123e4567-e89b-12d3-a456-426614174004": "A container for storing data",
    "123e4567-e89b-12d3-a456-426614174006": "true"
  },
  "score": 100,
  "completed": true,
  "startedAt": "2023-01-01T00:00:00.000Z",
  "completedAt": "2023-01-01T00:10:00.000Z"
}
```

#### Get All Quiz Attempts for a User

```
GET /api/v1/users/me/quiz-attempts
```

Query Parameters:
- **page**: Page number (default: 1)
- **limit**: Number of items per page (default: 10, max: 100)
- **quizId**: Filter by quiz ID
- **completed**: Filter by completion status (true/false)

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174005",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "quizId": "123e4567-e89b-12d3-a456-426614174003",
      "quiz": {
        "id": "123e4567-e89b-12d3-a456-426614174003",
        "title": "Variables Quiz",
        "description": "Test your knowledge of variables"
      },
      "score": 100,
      "completed": true,
      "startedAt": "2023-01-01T00:00:00.000Z",
      "completedAt": "2023-01-01T00:10:00.000Z"
    },
    // More quiz attempts...
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/users/me/quiz-attempts?page=1&limit=10",
    "prev": null,
    "next": "/api/v1/users/me/quiz-attempts?page=2&limit=10",
    "last": "/api/v1/users/me/quiz-attempts?page=10&limit=10"
  }
}
```

### User Progress Endpoints

#### Get User Progress

```
GET /api/v1/users/me/progress
```

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174007",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "programId": "123e4567-e89b-12d3-a456-426614174000",
      "program": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Introduction to Programming",
        "description": "Learn the basics of programming"
      },
      "progress": 50,
      "completedLessons": [
        "123e4567-e89b-12d3-a456-426614174001"
      ],
      "lastAccessed": "2023-01-01T00:00:00.000Z",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More progress entries...
  ]
}
```

#### Get User Progress for a Program

```
GET /api/v1/users/me/progress/:programId
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174007",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "programId": "123e4567-e89b-12d3-a456-426614174000",
  "program": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Introduction to Programming",
    "description": "Learn the basics of programming"
  },
  "progress": 50,
  "completedLessons": [
    "123e4567-e89b-12d3-a456-426614174001"
  ],
  "lastAccessed": "2023-01-01T00:00:00.000Z",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update User Progress

```
PUT /api/v1/users/me/progress/:programId
```

Request:
```json
{
  "completedLessons": [
    "123e4567-e89b-12d3-a456-426614174001",
    "123e4567-e89b-12d3-a456-426614174008"
  ]
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174007",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "programId": "123e4567-e89b-12d3-a456-426614174000",
  "progress": 100,
  "completedLessons": [
    "123e4567-e89b-12d3-a456-426614174001",
    "123e4567-e89b-12d3-a456-426614174008"
  ],
  "lastAccessed": "2023-01-01T00:00:00.000Z",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Certificates Endpoints

#### Get User Certificates

```
GET /api/v1/users/me/certificates
```

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174009",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "programId": "123e4567-e89b-12d3-a456-426614174000",
      "program": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Introduction to Programming",
        "description": "Learn the basics of programming"
      },
      "title": "Introduction to Programming Certificate",
      "issueDate": "2023-01-01T00:00:00.000Z",
      "pdfUrl": "https://example.com/certificates/123e4567-e89b-12d3-a456-426614174009.pdf",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More certificates...
  ]
}
```

#### Get Certificate by ID

```
GET /api/v1/certificates/:id
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174009",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "programId": "123e4567-e89b-12d3-a456-426614174000",
  "program": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Introduction to Programming",
    "description": "Learn the basics of programming"
  },
  "title": "Introduction to Programming Certificate",
  "issueDate": "2023-01-01T00:00:00.000Z",
  "pdfUrl": "https://example.com/certificates/123e4567-e89b-12d3-a456-426614174009.pdf",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Generate Certificate

```
POST /api/v1/users/me/certificates
```

Request:
```json
{
  "programId": "123e4567-e89b-12d3-a456-426614174000"
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174009",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "programId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Introduction to Programming Certificate",
  "issueDate": "2023-01-01T00:00:00.000Z",
  "pdfUrl": "https://example.com/certificates/123e4567-e89b-12d3-a456-426614174009.pdf",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Search Endpoints

#### Search All Content

```
GET /api/v1/search
```

Query Parameters:
- **q**: Search query
- **type**: Filter by content type (PROGRAM, LESSON, QUIZ)
- **page**: Page number (default: 1)
- **limit**: Number of items per page (default: 10, max: 100)

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "type": "PROGRAM",
      "title": "Introduction to Programming",
      "description": "Learn the basics of programming",
      "url": "/programs/123e4567-e89b-12d3-a456-426614174000"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "type": "LESSON",
      "title": "Variables and Data Types",
      "description": "Learn about variables and data types",
      "url": "/lessons/123e4567-e89b-12d3-a456-426614174001"
    },
    // More search results...
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/search?q=programming&page=1&limit=10",
    "prev": null,
    "next": "/api/v1/search?q=programming&page=2&limit=10",
    "last": "/api/v1/search?q=programming&page=10&limit=10"
  }
}
```

### AI Endpoints

#### Generate Quiz Questions

```
POST /api/v1/ai/generate-questions
```

Request:
```json
{
  "content": "Variables are used to store data in programming. There are different types of variables, such as integers, strings, and booleans.",
  "count": 3,
  "type": "MULTIPLE_CHOICE"
}
```

Response:
```json
{
  "questions": [
    {
      "content": "What is the primary purpose of variables in programming?",
      "type": "MULTIPLE_CHOICE",
      "options": [
        "To store data",
        "To perform calculations",
        "To define functions",
        "To create loops"
      ],
      "correctAnswer": "To store data",
      "explanation": "Variables are used to store data in programming."
    },
    // More generated questions...
  ]
}
```

#### Summarize Content

```
POST /api/v1/ai/summarize
```

Request:
```json
{
  "content": "Variables are used to store data in programming. There are different types of variables, such as integers, strings, and booleans. Integers are used to store whole numbers, strings are used to store text, and booleans are used to store true/false values. Variables must be declared before they can be used. In many programming languages, variables must also be given a type when they are declared.",
  "maxLength": 100
}
```

Response:
```json
{
  "summary": "Variables store data in programming, including integers (whole numbers), strings (text), and booleans (true/false). They require declaration before use, often with a specified type."
}
```

## 📊 Data Models

### User

```json
{
  "id": "string",
  "email": "string",
  "password": "string (hashed)",
  "name": "string",
  "role": "USER | INSTRUCTOR | ADMIN",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Profile

```json
{
  "id": "string",
  "userId": "string",
  "bio": "string",
  "avatar": "string (URL)",
  "preferences": "json",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### EducationProgram

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "imageUrl": "string (URL)",
  "published": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Lesson

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "order": "integer",
  "programId": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### ContentBlock

```json
{
  "id": "string",
  "type": "TEXT | IMAGE | VIDEO | CODE | MARKDOWN | INTERACTIVE",
  "content": "string",
  "order": "integer",
  "lessonId": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Quiz

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "timeLimit": "integer (minutes)",
  "passingScore": "integer (percentage)",
  "lessonId": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Question

```json
{
  "id": "string",
  "content": "string",
  "type": "MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER | ESSAY",
  "options": "json (array of strings)",
  "correctAnswer": "string",
  "explanation": "string",
  "points": "integer",
  "quizId": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### QuizAttempt

```json
{
  "id": "string",
  "userId": "string",
  "quizId": "string",
  "answers": "json (map of questionId to answer)",
  "score": "integer (percentage)",
  "completed": "boolean",
  "startedAt": "datetime",
  "completedAt": "datetime",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### UserProgress

```json
{
  "id": "string",
  "userId": "string",
  "programId": "string",
  "progress": "float (percentage)",
  "completedLessons": "json (array of lessonIds)",
  "lastAccessed": "datetime",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Certificate

```json
{
  "id": "string",
  "userId": "string",
  "programId": "string",
  "title": "string",
  "issueDate": "datetime",
  "pdfUrl": "string (URL)",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## 🔄 Webhooks

The API supports webhooks for certain events. Webhooks can be configured in the admin dashboard.

### Webhook Events

- **user.created**: Triggered when a new user is created
- **user.updated**: Triggered when a user is updated
- **program.published**: Triggered when a program is published
- **quiz.completed**: Triggered when a user completes a quiz
- **certificate.issued**: Triggered when a certificate is issued

### Webhook Payload

```json
{
  "event": "user.created",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "data": {
    // Event-specific data
  }
}
```

### Webhook Configuration

```
POST /api/v1/webhooks
```

Request:
```json
{
  "url": "https://example.com/webhook",
  "events": ["user.created", "user.updated"],
  "secret": "your_webhook_secret"
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174010",
  "url": "https://example.com/webhook",
  "events": ["user.created", "user.updated"],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

## 🔢 API Versioning

The API uses URL versioning. The current version is v1.

```
https://api.learninglab.com/api/v1
```

When a new version is released, the old version will be maintained for a period of time to allow clients to migrate to the new version.

### Version Lifecycle

- **Current**: The latest version of the API
- **Deprecated**: A version that is still supported but will be removed in the future
- **Sunset**: A version that is no longer supported and will be removed soon

### Version Headers

```
X-API-Version: v1
X-API-Deprecated: false
X-API-Sunset-Date: null
```

For deprecated versions:

```
X-API-Version: v1
X-API-Deprecated: true
X-API-Sunset-Date: 2024-01-01T00:00:00.000Z
```