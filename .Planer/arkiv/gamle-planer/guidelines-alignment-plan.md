# Guidelines Alignment Plan

This document outlines a structured plan to address the mismatches between the project guidelines and the actual codebase structure in the LearningLab project.

## 1. Project Structure Alignment

### Phase 1: Documentation Update (1-2 days)

- [x] Update the guidelines.md file to accurately reflect the current directory structure
- [x] Document all additional directories not mentioned in the original guidelines
- [x] Create visual diagrams of the actual project structure for better clarity

### Phase 2: Structure Optimization (3-5 days)

- [x] Resolve duplicate directories (e.g., `context/` and `contexts/` in the web app)
- [x] Standardize module organization in the API
- [x] Consider restructuring certain components to better match the documented architecture
- [x] Update import paths as needed after restructuring

## 2. Development Workflow Standardization

### Phase 1: Command Standardization (1-2 days)

- [x] Decide on a consistent approach: either fully adopt NPS or standardize on yarn scripts
- [x] Update all scripts in package.json to follow the chosen approach
- [x] Update the package-scripts.js file if continuing with NPS
- [x] Document all available commands with examples and expected outcomes

### Phase 2: Environment Setup (1 day)

- [x] Create missing .env.example files (particularly for the web application)
- [x] Ensure all required environment variables are documented
- [x] Add comments to .env.example files explaining each variable's purpose
- [x] Update setup instructions in the guidelines

## 3. Deployment Configuration

### Phase 1: Docker Configuration (2-3 days)

- [x] Update docker-compose.yml to include the web application as mentioned in guidelines
- [x] Add Nginx reverse proxy configuration
- [ ] Test the complete Docker setup to ensure all services work together
- [x] Document the Docker deployment process with step-by-step instructions

### Phase 2: CI/CD Integration (2-3 days)

- [x] Review and update GitHub Actions workflows (ci.yml and qodana_code_quality.yml)
- [x] Document the CI/CD pipeline for both Render (API) and Vercel (Web) deployments
- [x] Create environment-specific deployment guides (development, staging, production)
- [x] Add documentation for required secrets and environment variables in CI/CD
- [x] Ensure alignment between Docker deployment and cloud deployment processes
- [x] Create troubleshooting guides for common CI/CD and deployment issues

## 4. Testing Framework

### Phase 1: Testing Documentation (1-2 days)

- [ ] Document the current testing approach and structure
- [ ] Update guidelines with information about test organization
- [ ] Add examples of writing tests for different components

### Phase 2: Testing Enhancement (3-4 days)

- [ ] Review current test coverage
- [ ] Implement additional tests where needed
- [ ] Standardize testing patterns across the codebase
- [ ] Document best practices for testing different types of components

## 5. Authentication and Security

### Phase 1: Documentation (1 day)

- [ ] Document all authentication strategies currently in use (GitHub, Google)
- [ ] Update guidelines with security best practices
- [ ] Document the authentication flow with diagrams

### Phase 2: Implementation Review (2-3 days)

- [ ] Review current authentication implementation
- [ ] Ensure security best practices are followed
- [ ] Address any security concerns
- [ ] Update implementation if needed

## 6. Database Management

### Phase 1: Documentation Update (1 day)

- [ ] Update database management instructions in guidelines
- [ ] Document the actual implementation of database scripts
- [ ] Create a database schema diagram

### Phase 2: Script Optimization (1-2 days)

- [ ] Review and optimize database management scripts
- [ ] Ensure consistency between documentation and implementation
- [ ] Add additional helper scripts if needed

## 7. Final Review and Validation

### Phase 1: Comprehensive Review (1-2 days)

- [ ] Conduct a full review of the updated guidelines
- [ ] Verify all documented commands and workflows
- [ ] Ensure all aspects of the codebase are properly documented

### Phase 2: Team Validation (1 day)

- [ ] Have team members follow the updated guidelines for a new setup
- [ ] Collect feedback on clarity and completeness
- [ ] Make final adjustments based on feedback

## Timeline and Resources

- **Total Estimated Time**: 17-28 days
- **Priority Order**:
  1. Documentation Updates (immediate)
  2. Environment and Workflow Standardization
  3. Structure Optimization
  4. Deployment Configuration
  5. Testing and Security Enhancements

## Tracking Progress

Progress on this plan will be tracked using GitHub issues and project boards. Each task will be converted to an issue with appropriate labels and assigned to team members based on expertise and availability.

## Conclusion

This plan aims to systematically address the mismatches between the project guidelines and the actual codebase. By following this structured approach, we can ensure that our documentation accurately reflects our implementation, making it easier for current and future team members to understand and contribute to the project.
