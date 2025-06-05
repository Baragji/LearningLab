# 3. Update Web package.json

echo -e "${YELLOW}Updating Web package.json...${NC}"
cat > apps/web/package.json << 'EOF'
{
"name": "web",
"version": "0.0.0",
"private": true,
"packageManager": "yarn@4.9.1",
"scripts": {
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "next lint",
"test": "jest",
"test:watch": "jest --watch",
"test:ci": "jest --ci",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:debug": "playwright test --debug",
"test:e2e:report": "playwright show-report",
"clean": "rimraf .next coverage .turbo"
},
"dependencies": {
"@emotion/react": "^11.11.1",
"@emotion/styled": "^11.11.0",
"@mui/icons-material": "^5.14.3",
"@mui/material": "^5.14.3",
"@radix-ui/react-checkbox": "^1.0.4",
"@radix-ui/react-dialog": "^1.0.5",
"@radix-ui/react-label": "^2.0.2",
"@radix-ui/react-select": "^2.0.0",
"@radix-ui/react-separator": "^1.0.3",
"@radix-ui/react-slot": "^1.0.2",
"@radix-ui/react-tabs": "^1.0.4",
"@reduxjs/toolkit": "^1.9.5",
"@repo/config": "workspace:_",
"@repo/core": "workspace:_",
"axios": "^1.6.2",
"class-variance-authority": "^0.7.0",
"clsx": "^2.0.0",
"lucide-react": "^0.294.0",
"next": "13.4.12",
"nookies": "^2.5.2",
"react": "18.2.0",
"react-dom": "18.2.0",
"react-hot-toast": "^2.4.1",
"react-markdown": "^9.0.1",
"react-redux": "^8.1.2",
"rehype-raw": "^7.0.0",
"sonner": "^1.2.4",
"tailwind-merge": "^2.1.0",
"ui": "workspace:_",
"uuid": "^9.0.1"
},
"devDependencies": {
"@faker-js/faker": "^8.3.1",
"@next/bundle-analyzer": "^13.4.12",
"@playwright/test": "^1.40.1",
"@testing-library/dom": "^9.3.3",
"@testing-library/jest-dom": "^6.1.5",
"@testing-library/react": "^14.1.2",
"@testing-library/user-event": "14.5.1",
"@types/node": "^20.4.5",
"@types/react": "18.2.18",
"@types/react-dom": "18.2.18",
"@types/uuid": "^9.0.7",
"@typescript-eslint/eslint-plugin": "^6.2.1",
"@typescript-eslint/parser": "^6.2.1",
"autoprefixer": "^10.4.16",
"eslint": "8.46.0",
"eslint-config-next": "13.4.12",
"eslint-config-prettier": "^8.9.0",
"jest": "^29.6.2",
"jest-environment-jsdom": "^29.6.2",
"next-router-mock": "^0.9.10",
"postcss": "^8.4.32",
"prettier": "^3.0.0",
"rimraf": "^5.0.1",
"tailwindcss": "^3.3.6",
"tsconfig": "workspace:_",
"typescript": "5.3.3"
}
}
EOF
check_status "Updated Web package.json"

# 4. Update packages/config/package.json

echo -e "${YELLOW}Updating packages/config/package.json...${NC}"
cat > packages/config/package.json << 'EOF'
{
"name": "@repo/config",
"version": "0.0.0",
"private": true,
"packageManager": "yarn@4.9.1",
"main": "./dist/index.js",
"types": "./dist/index.d.ts",
"files": [
"eslint-preset.js",
"nginx.conf",
"postcss.config.js",
"tailwind.config.js",
"src",
"dist"
],
"scripts": {
"build": "tsc -p tsconfig.json",
"lint": "eslint . --ext .ts,.tsx",
"clean": "rimraf dist"
},
"dependencies": {
"eslint-config-next": "^13.4.12",
"eslint-config-prettier": "^8.9.0",
"eslint-plugin-react": "^7.33.1",
"zod": "^3.22.4"
},
"devDependencies": {
"@types/node": "^20.4.5",
"@typescript-eslint/eslint-plugin": "^6.2.1",
"@typescript-eslint/parser": "^6.2.1",
"eslint": "^8.46.0",
"rimraf": "^5.0.1",
"tsconfig": "workspace:\*",
"typescript": "5.3.3"
},
"license": "MIT"
}
EOF
check_status "Updated packages/config/package.json"

# 5. Update packages/core/package.json

echo -e "${YELLOW}Updating packages/core/package.json...${NC}"
cat > packages/core/package.json << 'EOF'
{
"name": "@repo/core",
"version": "0.0.0",
"private": true,
"packageManager": "yarn@4.9.1",
"main": "./dist/index.js",
"types": "./dist/index.d.ts",
"scripts": {
"build": "tsc -p tsconfig.json --declaration --declarationMap",
"clean": "rimraf dist",
"prebuild": "yarn clean",
"lint": "eslint . --ext .ts,.tsx",
"test": "jest",
"test:watch": "jest --watch",
"test:ci": "jest --ci"
},
"devDependencies": {
"@types/jest": "^29.5.14",
"@types/node": "^20.4.5",
"@typescript-eslint/eslint-plugin": "^6.2.1",
"@typescript-eslint/parser": "^6.2.1",
"eslint": "^8.46.0",
"jest": "^29.6.2",
"rimraf": "^5.0.1",
"ts-jest": "^29.1.1",
"tsconfig": "workspace:\*",
"typescript": "5.3.3"
}
}
EOF
check_status "Updated packages/core/package.json"

# 6. Update packages/ui/package.json

echo -e "${YELLOW}Updating packages/ui/package.json...${NC}"
cat > packages/ui/package.json << 'EOF'
{
"name": "ui",
"version": "0.0.0",
"private": true,
"packageManager": "yarn@4.9.1",
"main": "./index.tsx",
"types": "./index.tsx",
"license": "MIT",
"scripts": {
"test": "jest",
"test:watch": "jest --watch",
"test:ci": "jest --ci",
"lint": "eslint . --ext .ts,.tsx",
"build": "echo 'No build step required for UI package'",
"clean": "rimraf coverage"
},
"dependencies": {
"@emotion/react": "^11.11.1",
"@emotion/styled": "^11.11.0",
"@mui/icons-material": "^5.14.3",
"@mui/material": "^5.14.3",
"@radix-ui/react-slot": "^1.0.2",
"class-variance-authority": "^0.7.0",
"clsx": "^2.0.0",
"tailwind-merge": "^2.1.0"
},
"devDependencies": {
"@repo/config": "workspace:_",
"@testing-library/dom": "^9.3.3",
"@testing-library/jest-dom": "^6.1.5",
"@testing-library/react": "^14.1.2",
"@testing-library/user-event": "^14.5.1",
"@types/jest": "^29.5.14",
"@types/node": "^20.4.5",
"@types/react": "18.2.18",
"@types/react-dom": "18.2.18",
"@typescript-eslint/eslint-plugin": "^6.2.1",
"@typescript-eslint/parser": "^6.2.1",
"eslint": "^8.46.0",
"eslint-plugin-react": "^7.33.1",
"identity-obj-proxy": "^3.0.0",
"jest": "^29.6.2",
"jest-environment-jsdom": "^29.6.2",
"react": "18.2.0",
"react-dom": "18.2.0",
"rimraf": "^5.0.1",
"ts-jest": "^29.1.1",
"tsconfig": "workspace:_",
"typescript": "5.3.3"
},
"peerDependencies": {
"@types/react": "18.2.18",
"@types/react-dom": "18.2.18",
"react": "18.2.0",
"react-dom": "18.2.0"
}
}
EOF
check_status "Updated packages/ui/package.json"

# 7. Update .gitignore

echo -e "${YELLOW}Updating .gitignore...${NC}"
cat > .gitignore << 'EOF'

# Dependencies

node_modules
.pnp
.pnp.js
.pnp.cjs
.pnp.loader.mjs

# Testing

coverage
\*.lcov
.nyc_output

# Next.js

.next
out
next-env.d.ts

# Production

build
dist

# Misc

.DS_Store
\*.pem
.idea
.vscode

# Debug

npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Environment files

.env
.env.local
.env.development
.env.development.local
.env.test
.env.test.local
.env.production
.env.production.local

# Turbo

.turbo
\*\*/.turbo

# Vercel

.vercel

# TypeScript

\*.tsbuildinfo
next-env.d.ts

# Prisma

prisma/_.db
prisma/_.db-journal

# Yarn Berry

.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz

# Playwright

test-results
playwright-report

# Editor directories and files

.idea
.vscode
_.suo
_.ntvs\*
_.njsproj
_.sln
\*.sw?

# OS files

.DS_Store
Thumbs.db

# Logs

logs
\*.log

# Output files

repomix-output.xml

# Temporary files

tmp
temp
_.tmp
_.temp
EOF
check_status "Updated .gitignore"

# 8. Create/Update root .env.example

echo -e "${YELLOW}Creating root .env.example...${NC}"
cat > .env.example << 'EOF'

# LearningLab Environment Configuration

# Copy this file to .env and update with your values

# Database Configuration

DATABASE_URL="postgresql://username:password@localhost:5432/learninglab_dev?schema=public"

# API Configuration

API_PORT=5002
NODE_ENV=development

# Authentication

JWT_SECRET=your_jwt_secret_key_min_32_chars_long
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_min_32_chars_long
JWT_REFRESH_EXPIRES_IN=7d
SALT_ROUNDS=10

# CORS Configuration

CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Social Authentication (Optional)

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5002/api/auth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5002/api/auth/github/callback

# Rate Limiting

THROTTLE_TTL=60000
THROTTLE_LIMIT=10

# Cache Configuration

CACHE_TTL=60
CACHE_MAX_ITEMS=100

# Frontend Configuration

NEXT_PUBLIC_API_URL=http://localhost:5002/api

# Docker Configuration (if using Docker)

POSTGRES_USER=test
POSTGRES_PASSWORD=test
POSTGRES_DB=learninglab_dev
EOF
check_status "Created root .env.example"
