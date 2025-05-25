# Deployment Alignment Guide

This guide ensures consistency between Docker-based deployments and cloud-based deployments (Render and Vercel) for the LearningLab project.

## Deployment Methods Comparison

| Aspect | Docker Deployment | Cloud Deployment (Render/Vercel) |
|--------|------------------|--------------------------------|
| Infrastructure | Self-managed servers or VMs | Managed PaaS |
| Configuration | docker-compose.yml | Platform-specific settings |
| Environment Variables | .env files and docker-compose.yml | Platform UI or API |
| Build Process | Docker build | Platform-specific build steps |
| Database | PostgreSQL container | Managed PostgreSQL service |
| Networking | Docker network | Platform-managed networking |
| SSL/TLS | Manual configuration via Nginx | Automatic with platform |

## Ensuring Consistency

### Application Code

The application code should be environment-agnostic. Use environment variables for all configuration that might differ between environments:

```typescript
// Example configuration in NestJS
@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL');
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }
}
```

```typescript
// Example configuration in Next.js
export const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
```

### Environment Variables

Maintain a single source of truth for environment variables:

1. Keep `.env.example` files up-to-date in both `apps/api` and `apps/web` directories
2. Document all environment variables in the CI/CD Secrets Guide
3. Ensure the same variables are used in:
   - Local development
   - Docker Compose configuration
   - Render environment settings
   - Vercel environment settings
   - GitHub Actions workflow files

### Build and Start Commands

Ensure build and start commands are consistent across environments:

#### API

- **Local**: `yarn dev` or `yarn start:dev`
- **Docker**: `yarn start:prod` (after build)
- **Render**: `yarn start:prod` (after build)

#### Web

- **Local**: `yarn dev` or `yarn start:dev`
- **Docker**: `yarn start` (after build)
- **Vercel**: Automatic (uses Next.js defaults)

### Database Migrations

Database migrations should be handled consistently:

- **Local**: `yarn prisma:migrate`
- **Docker**: `docker-compose exec api yarn prisma:migrate`
- **Render**: Configure as a startup script or run manually after deployment

## Deployment Checklist

Use this checklist when deploying to any environment:

1. **Code Preparation**
   - [ ] All changes committed and pushed to the appropriate branch
   - [ ] All tests passing locally and in CI

2. **Environment Variables**
   - [ ] All required environment variables set for the target environment
   - [ ] Secrets properly secured and not committed to the repository

3. **Database**
   - [ ] Database migrations prepared
   - [ ] Backup strategy in place (for production)

4. **Build and Deployment**
   - [ ] Build process completes successfully
   - [ ] Application starts without errors
   - [ ] Health checks pass

5. **Verification**
   - [ ] API endpoints accessible and functioning
   - [ ] Web application loads and functions correctly
   - [ ] Authentication flows working

## Troubleshooting Common Alignment Issues

### Environment Variable Mismatches

**Symptom**: Application works in one environment but not another.

**Solution**: 
1. Compare environment variables between environments
2. Check for missing variables or different values
3. Update the environment configuration as needed

### Database Connection Issues

**Symptom**: Application cannot connect to the database in one environment.

**Solution**:
1. Verify database connection string
2. Check network configuration (especially in Docker)
3. Ensure database service is running and accessible

### Build Process Differences

**Symptom**: Application builds successfully in one environment but fails in another.

**Solution**:
1. Compare build commands and environment
2. Check for dependencies that might be missing
3. Review build logs for specific errors