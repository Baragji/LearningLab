# CI/CD and Deployment Troubleshooting Guide

This guide provides solutions for common issues encountered during CI/CD processes and deployments for the LearningLab project.

## GitHub Actions Issues

### Build Failures

#### Issue: Dependency Installation Fails

**Symptoms**:
- Error messages like `Cannot find module` or `Failed to install dependencies`
- Build process terminates during the installation step

**Solutions**:
1. Check if the yarn.lock file is committed to the repository
2. Verify Node.js version in the workflow matches the project requirements
3. Check for private npm packages that might require authentication
4. Try clearing the GitHub Actions cache

```yaml
# Example fix in workflow file
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: 'yarn'

- name: Clear cache # Add this step if cache issues persist
  run: yarn cache clean

- name: Install dependencies
  run: yarn install --immutable
```

#### Issue: Build Step Fails

**Symptoms**:
- Error messages during the build process
- TypeScript compilation errors

**Solutions**:
1. Run the build locally to reproduce and fix the issue
2. Check for environment variables required during build
3. Verify that all dependencies are correctly installed
4. Look for TypeScript errors that might only appear in strict mode

```bash
# Commands to debug locally
yarn install
yarn turbo run build --verbose
```

### Test Failures

#### Issue: Tests Fail in CI but Pass Locally

**Symptoms**:
- Tests pass on local machine but fail in GitHub Actions
- Inconsistent test failures

**Solutions**:
1. Check for environment-specific code or tests
2. Verify that all required environment variables are set in the workflow
3. Look for timing issues or race conditions in tests
4. Check for differences in Node.js versions

```yaml
# Example of setting environment variables for tests
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL_CI }}
  JWT_SECRET: ${{ secrets.JWT_SECRET_CI }}
  NODE_ENV: test
```

#### Issue: Playwright E2E Test Failures

**Symptoms**:
- Playwright tests fail in CI but pass locally
- Browser-specific errors

**Solutions**:
1. Make sure all required browsers are installed in the workflow
2. Check for missing dependencies for browser automation
3. Increase timeouts for network operations
4. Use Playwright's debug artifacts to investigate failures

```yaml
# Example fix for Playwright setup
- name: Install Playwright Browsers
  run: npx playwright install --with-deps chromium firefox webkit

- name: Run Playwright E2E tests
  run: yarn workspace web test:e2e
  env:
    PLAYWRIGHT_TIMEOUT: 60000 # Increase timeout if needed
```

## Deployment Issues

### Render Deployment Issues

#### Issue: API Deployment Fails

**Symptoms**:
- Build succeeds but application crashes on startup
- Health checks fail after deployment

**Solutions**:
1. Check Render logs for specific error messages
2. Verify that all required environment variables are set
3. Check database connection and migrations
4. Verify the start command is correct

```bash
# Correct start command for Render
cd ../.. && yarn workspace api start:prod
```

#### Issue: Database Connection Failures

**Symptoms**:
- Application logs show database connection errors
- API returns 500 errors for database operations

**Solutions**:
1. Verify the DATABASE_URL environment variable
2. Check if the database service is running and accessible
3. Verify IP allowlisting if using a managed database
4. Check for database credential issues

### Vercel Deployment Issues

#### Issue: Web App Build Fails

**Symptoms**:
- Vercel build logs show errors
- Deployment fails to complete

**Solutions**:
1. Check Vercel build logs for specific errors
2. Verify that all required environment variables are set
3. Check for issues with Next.js configuration
4. Verify the project structure and build settings

```
# Vercel build settings to check
- Root Directory: apps/web
- Framework Preset: Next.js
- Build Command: (leave empty to use Next.js defaults)
```

#### Issue: API Connection Failures

**Symptoms**:
- Web app deploys but cannot connect to the API
- Network errors in the browser console

**Solutions**:
1. Verify the NEXT_PUBLIC_API_URL environment variable
2. Check CORS configuration in the API
3. Ensure the API is deployed and accessible
4. Check for protocol mismatches (http vs https)

## Docker Deployment Issues

#### Issue: Container Startup Failures

**Symptoms**:
- Containers exit immediately after starting
- Health checks fail

**Solutions**:
1. Check container logs: `docker-compose logs [service_name]`
2. Verify environment variables in docker-compose.yml
3. Check for port conflicts
4. Ensure volumes are correctly configured

#### Issue: Inter-Service Communication Failures

**Symptoms**:
- Services start but cannot communicate with each other
- Network-related errors in logs

**Solutions**:
1. Verify the Docker network configuration
2. Check service names used for communication
3. Ensure ports are correctly exposed
4. Check for firewall or security group issues

```yaml
# Example fix in docker-compose.yml
services:
  api:
    # ...
    networks:
      - app-network
    depends_on:
      - postgres
  
  web:
    # ...
    networks:
      - app-network
    environment:
      - NEXT_PUBLIC_API_URL=http://api:3000/api

networks:
  app-network:
    driver: bridge
```

## General Troubleshooting Steps

1. **Check Logs**: Always start by examining the logs for the specific service or build step that's failing
2. **Verify Environment**: Ensure all required environment variables are set correctly
3. **Test Locally**: Try to reproduce the issue in a local environment
4. **Incremental Changes**: Make small, incremental changes to isolate and fix issues
5. **Review Recent Changes**: Check recent commits that might have introduced the issue

## Getting Help

If you're unable to resolve an issue using this guide:

1. Search the project's GitHub issues for similar problems
2. Check the documentation for the specific tools or services involved
3. Reach out to the team on the project's communication channels
4. Consider opening a new GitHub issue with detailed information about the problem