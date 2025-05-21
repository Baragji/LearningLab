# Turborepo (NestJS + Prisma + NextJS + Tailwind + Typescript + Jest) Starter

This is fullstack turborepo starter. It comes with the following features. 

- ✅ Turborepo 
- ✅ Nestjs 
    - ✅ Env Config with Validation  
    - ✅ Prisma 
- ✅ NextJS 
    - ✅ Tailwind 
    - ✅ Redux Toolkit Query 
- ✅ Testing using Jest 
- ✅ Github Actions 
- ✅ Reverse Proxy using Nginx 
- ✅ Docker Integration 
- ✅ Postgres Database 
- ✅ Package scripts using NPS 

## What's inside?

This turborepo uses [Yarn](https://classic.yarnpkg.com/lang/en/) as a package manager. It includes the following packages/apps:

### Apps and Packages

- `api`: a [NestJS](https://nestjs.com/) app
- `web`: a [Next.js](https://nextjs.org) app
- `ui`: a stub React component library used by `web`.
- `config`: `eslint`, `nginx` and `tailwind` (includes `eslint-config-next` and `eslint-config-prettier`)
- `tsconfig`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This turborepo has some additional tools already setup for you:

- [Node Package Scripts](https://github.com/sezna/nps#readme) for automation scripts
- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

## Setup
This starter kit is using turborepo and yarn workspaces for monorepo workflow.

### Prerequisites 
- Install nps by running 
```
npm i -g nps
```
- Make sure docker and docker-compose are
 installed. Refer to docs for your operating system.

### Configure Environment
- Frontend 
    - `cd apps/web && cp .env.example .env`
- Backend 
    - `cd apps/api && cp .env.example .env`

### Install Dependencies
Make sure you are at root of the project and just run 

```
nps prepare
```
### Build

To build all apps and packages, run the following command at the root of project:

```
nps build
```

### Develop

To develop all apps and packages, run the following command at the root of project:

```
nps dev
```
The app should be running at `http://localhost` with reverse proxy configured.


## Other available commands
Run `nps` in the terminal to see list of all available commands. 

## Running the Application

### Using Docker (Recommended)

The easiest way to run the application is using Docker Compose:

```bash
# Start both the database and API service
docker-compose up -d

# To view logs
docker-compose logs -f
```

This will start:
- PostgreSQL database on port 5432
- API service on port 3000

### Running Locally

If you prefer to run the API service locally:

1. Start only the database:
   ```bash
   docker-compose up postgres -d
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the API service:
   ```bash
   cd apps/api
   yarn dev
   ```

### Troubleshooting

If you encounter database connection issues:

1. Make sure the database container is running:
   ```bash
   docker ps
   ```

2. Check the database logs:
   ```bash
   docker-compose logs postgres
   ```

3. For the error "Can't reach database server at `localhost:5432`":
   - If running the API directly (not in Docker), make sure the database is started with `docker-compose up postgres -d`
   - If running in Docker, make sure both services are on the same network
