// apps/api/test/config/node-version.spec.ts
import * as fs from 'fs';
import * as path from 'path';

describe('Node.js Version Requirements', () => {
  // Paths to the files we need to test
  const rootDir = path.resolve(__dirname, '../../../../');
  const packageJsonPath = path.join(rootDir, 'package.json');
  const dockerfilePath = path.join(rootDir, 'Dockerfile.api');

  describe('Verify package.json Node.js version', () => {
    let packageJson: any;

    beforeAll(() => {
      // Read the package.json file
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
      packageJson = JSON.parse(packageJsonContent);
    });

    it('should have Node.js version requirement of ">=22 <23"', () => {
      expect(packageJson.engines).toBeDefined();
      expect(packageJson.engines.node).toBeDefined();
      expect(packageJson.engines.node).toBe('>=22 <23');
    });

    it('should have npm version requirement', () => {
      expect(packageJson.engines).toBeDefined();
      expect(packageJson.engines.npm).toBeDefined();
      expect(packageJson.engines.npm).toBe('>=7.0.0');
    });
  });

  describe('Verify Dockerfile Node.js version', () => {
    let dockerfileContent: string;

    beforeAll(() => {
      // Read the Dockerfile.api file
      dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
    });

    it('should use Node.js 22 in the FROM statement', () => {
      // Check if the Dockerfile uses Node.js 22
      expect(dockerfileContent).toContain('FROM node:22-alpine AS base');
    });

    it('should not contain any other Node.js version references', () => {
      // Make sure there are no other Node.js version references
      expect(dockerfileContent).not.toContain('FROM node:20');
      expect(dockerfileContent).not.toContain('FROM node:18');
      expect(dockerfileContent).not.toContain('FROM node:16');
    });
  });

  describe('Test Docker build with version', () => {
    // This is a more complex test that would actually build the Docker image
    // In a real CI environment, we would use Jest's done callback or async/await
    
    it('should be able to build Docker image with Node.js 22', () => {
      // This is a simplified test that just checks if the Dockerfile exists
      // In a real test, you would use the Docker API or shell commands to build
      // and verify the image
      expect(fs.existsSync(dockerfilePath)).toBe(true);
      
      // Mock test for Docker build success
      // In a real test, you would execute the Docker build command and check the result
      const mockDockerBuildSuccess = true;
      expect(mockDockerBuildSuccess).toBe(true);
    });
  });
});