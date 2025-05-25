# CI/CD Secrets and Environment Variables Guide

This document provides a comprehensive guide to the secrets and environment variables required for the CI/CD pipeline in the LearningLab project.

## GitHub Actions Secrets

The following secrets need to be configured in your GitHub repository settings (Settings > Secrets and variables > Actions):

### Database Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DATABASE_URL_CI` | Database connection string for CI environment | `postgresql://postgres:postgres@localhost:5432/learninglab_test` |

### JWT Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `JWT_SECRET_CI` | JWT secret key for CI environment | `ci_jwt_secret_key` |

### Render Deployment

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `RENDER_DEPLOY_HOOK_URL_API` | Render deploy hook URL for API service | `https://api.render.com/deploy/srv-abc123?key=abcdef` |

### Vercel Deployment

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VERCEL_TOKEN` | Vercel API token | `vercel_token_value` |
| `VERCEL_ORG_ID` | Vercel organization ID | `team_abcdefg` |
| `VERCEL_PROJECT_ID_WEB` | Vercel project ID for web app | `prj_abcdefg` |

### Code Quality

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `QODANA_TOKEN` | JetBrains Qodana token | `qodana_token_value` |

## Environment Variables in CI/CD Workflow

The following environment variables are used in the CI/CD workflow files:

### Build and Test Job

```yaml
env:
  NEXT_PUBLIC_API_URL: http://localhost:5002/api # Used by web tests/build
  DATABASE_URL: ${{ secrets.DATABASE_URL_CI }}   # Used by API tests/prisma
  JWT_SECRET: ${{ secrets.JWT_SECRET_CI }}       # Used by API tests
  JWT_EXPIRES_IN: "15m"                          # Used by API tests
  SALT_ROUNDS: "10"                              # Used by API tests
```

### Vercel Deployment Job

```yaml
env:
  VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID_WEB }}
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  # NEXT_PUBLIC_API_URL: ${{ secrets.PROD_NEXT_PUBLIC_API_URL }} # Optional override
```

## Setting Up Secrets

### GitHub Repository Secrets

1. Navigate to your GitHub repository
2. Go to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret with its appropriate value

### Render Environment Variables

1. Log in to your Render dashboard
2. Select your API service
3. Go to the Environment tab
4. Add each environment variable with its appropriate value

### Vercel Environment Variables

1. Log in to your Vercel dashboard
2. Select your web project
3. Go to Settings > Environment Variables
4. Add each environment variable with its appropriate value

## Obtaining Secret Values

### Render Deploy Hook URL

1. Log in to your Render dashboard
2. Select your API service
3. Go to Settings > Deploy Hooks
4. Create a new deploy hook and copy the URL

### Vercel Tokens and IDs

1. Log in to your Vercel dashboard
2. Go to Settings > Tokens to create a new token
3. For Project ID: Go to your project settings and copy the ID
4. For Organization ID: Go to your team settings and copy the ID

### Qodana Token

1. Log in to Qodana Cloud (https://qodana.cloud)
2. Go to your project settings
3. Generate a new token

## Security Best Practices

1. **Never commit secrets to the repository**
2. Rotate secrets periodically
3. Use different secrets for different environments
4. Limit access to who can view and manage secrets
5. Consider using a secrets manager for production environments