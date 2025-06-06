# Codex Environment Setup Guide

This guide explains how to prepare the LearningLab repository so that Codex can run lint and test commands automatically.

## 1. Ensure Internet Access
Codex must be able to fetch dependencies from the public npm registry. If you run Codex inside Docker, start the container with network access enabled. Example:

```bash
docker run --network=host -v $(pwd):/workspace learninglab-codex
```

If your organization requires a proxy, configure the `HTTP_PROXY` and `HTTPS_PROXY` environment variables inside the container.

## 2. Run the Setup Script
A helper script `scripts/setup-codex.sh` installs dependencies and prepares the database.

```bash
chmod +x scripts/setup-codex.sh
./scripts/setup-codex.sh
```

This will:
1. Install all Node.js packages via `yarn install`.
2. Apply Prisma migrations and generate the client (`yarn db:setup`).
3. Build the workspace so tests and linting have the necessary artifacts.

## 3. Execute Lint and Tests
After the setup completes, Codex can run:

```bash
yarn lint
yarn test
```

If any step fails due to missing permissions or network issues, verify that the container has outbound internet access and that the database service is reachable.
