# 📝 LearningLab API Documentation

This document provides an overview of the REST API used by LearningLab. The API is built with **NestJS** and is fully documented using **Swagger**. When the API server is running you can access the interactive documentation at:

```
http://localhost:5002/api/docs
```

If you use the Docker setup the docs are available through the Nginx reverse proxy at:

```
http://localhost/api/docs
```

## Base URL

All endpoints are prefixed with `/api` and versioned under `/api/v1`.

- Local development: `http://localhost:5002/api/v1`
- Production (via Nginx): `http://localhost/api/v1`

## Authentication

Authentication is handled with **JWT** tokens. Use the `/auth/login` endpoint to obtain an access token and refresh token. Include the access token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Refresh tokens can be used with `/auth/refresh` to obtain new access tokens. Use `/auth/logout` to revoke tokens.

## Main Endpoints

The API exposes resources for:

- **Users** – management of user accounts
- **Education programs** – courses and lessons
- **Quizzes** – assessments and questions
- **Progress** – user progress tracking
- **Certificates** – certificate generation
- **Search** – global search across content
- **AI** – AI powered helpers (question generation, summaries)

Each resource follows standard REST conventions with `GET`, `POST`, `PUT` and `DELETE` operations. Detailed request and response examples are available in Swagger.

## Error Handling

Errors use standard HTTP status codes with a JSON body describing the error. Validation errors return status code `422` and include a list of field errors.

## Rate Limiting

The API uses rate limiting to prevent abuse. Unauthenticated requests are limited to **60** requests per minute while authenticated requests can perform up to **120** requests per minute.

## Pagination

List endpoints support pagination via the query parameters `page` and `limit`. The response contains metadata about total items and pages.

## Versioning

The current API version is **v1**. When a new version is released, older versions will remain available for a period of time to allow clients to migrate.

---

For full endpoint specifications and data models please refer to the Swagger UI mentioned above. These docs are generated directly from the source code and are therefore the most accurate reference.
