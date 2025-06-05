# 🐳 LearningLab Docker Guide

This document summarises the current Docker setup for LearningLab. It reflects the configuration found in `docker-compose.yml` and the Dockerfiles in this repository.

## Overview

- **api** – NestJS backend running on port `3000` inside the container
- **web** – Next.js frontend running on port `3001` inside the container
- **postgres** – PostgreSQL database
- **redis** – Redis cache
- **nginx** – Reverse proxy exposing the application on port **80**

The `nginx` service forwards `/api` traffic to the `api` container and serves the Next.js frontend for other routes.

## Development

Use Docker only if you prefer not to run PostgreSQL locally. The application itself runs with `yarn dev` outside of Docker. To start only the supporting services run:

```bash
docker-compose up postgres redis
```

## Production Build

Production images are defined by `Dockerfile.api` and `Dockerfile.web`. A minimal `nginx` image serves as reverse proxy. Build and run everything with:

```bash
docker-compose up -d
```

Environment variables such as database credentials and JWT secrets are defined in `.env` files or Docker secrets.

## Health Checks

- API: `GET /health`
- Web: `GET /api/health`
- Nginx: `GET /health`

## Security Notes

- Containers run as non-root users where possible.
- Secrets are not baked into the images.
- Remember to keep dependencies up to date to pick up security patches.

---

For advanced deployment (e.g. Kubernetes or Swarm) you can derive manifests from `docker-compose.yml`. The provided configuration serves as a reference implementation.
