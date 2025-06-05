# Projekt Guidelines for LearningLab

## Projekt Oversigt

LearningLab er en fullstack applikation bygget med en monorepo arkitektur ved hjælp af Turborepo. Projektet består af et NestJS backend API, en NextJS frontend og delte pakker til UI-komponenter, konfiguration og TypeScript definitioner.

## Systemkrav

- **Node.js**: Version 22.x (LTS)
- **Yarn**: Version 4.9.1 (pakke manager)
- **Docker**: Nyeste version (til containerisering)
- **Docker Compose**: Nyeste version (til orkestrering af containere)

## Projekt Struktur

```
LearningLab/
├── apps/                  # Applikationspakker
│   ├── api/               # NestJS backend API
│   │   ├── src/           # Kildekode
│   │   │   ├── auth/      # Autentifikationsmoduler med strategier (GitHub, Google, JWT, Local)
│   │   │   ├── common/    # Fælles utilities (filters, interceptors, middleware, pipes, services)
│   │   │   ├── config/    # Konfigurationsindstillinger
│   │   │   ├── controllers/# API controllers med DTOs
│   │   │   ├── middleware/# Brugerdefineret middleware
│   │   │   ├── modules/   # Funktionsmoduler
│   │   │   ├── persistence/# Database adgangslag
│   │   │   ├── quiz/      # Quiz funktionalitet
│   │   │   ├── routes/    # Rutedefinitioner
│   │   │   ├── search/    # Søgefunktionalitet
│   │   │   ├── services/  # Servicelag
│   │   │   ├── shared/    # Delte utilities
│   │   │   ├── user-groups/# Brugergruppeadministration
│   │   │   ├── users/     # Brugeradministration
│   │   │   └── ...        # Andre moduler
│   ├── web/               # NextJS frontend
│   │   ├── pages/         # Next.js sider
│   │   │   ├── admin/     # Admin sider
│   │   │   ├── courses/   # Kursus sider
│   │   │   ├── lessons/   # Lektions sider
│   │   │   └── quiz/      # Quiz sider
│   │   ├── src/           # Kildekode
│   │   │   ├── components/# React komponenter
│   │   │   │   ├── auth/  # Autentifikationskomponenter
│   │   │   │   ├── common/# Fælles komponenter
│   │   │   │   ├── content/# Indholdsvisningskomponenter
│   │   │   │   ├── layout/# Layout komponenter
│   │   │   │   ├── quiz/  # Quiz komponenter
│   │   │   │   └── ui/    # UI komponenter
│   │   │   ├── contexts/  # React contexts (konsolideret fra context/ og contexts/)
│   │   │   ├── hooks/     # Brugerdefinerede React hooks
│   │   │   ├── lib/       # Utility biblioteker
│   │   │   ├── screens/   # Sidekomponenter
│   │   │   │   ├── admin/ # Admin skærme
│   │   │   │   ├── auth/  # Autentifikationsskærme
│   │   │   │   ├── common/# Fælles skærme
│   │   │   │   └── employee/# Medarbejderskærme
│   │   │   ├── services/  # Servicelag
│   │   │   ├── store/     # Redux store
│   │   │   ├── styles/    # CSS styles
│   │   │   └── utils/     # Utility funktioner
├── packages/              # Delte pakker
│   ├── config/            # Delt konfiguration (eslint, tailwind, osv.)
│   ├── core/              # Kernekomponenter til delt funktionalitet
│   ├── create-solid-wow/  # Yderligere pakke
│   ├── ui/                # Delte UI komponenter
│   │   ├── components/    # UI komponenter
│   │   └── utils/         # UI utilities
│   └── tsconfig/          # Delte TypeScript konfigurationer
├── prisma/                # Prisma ORM konfiguration
│   ├── migrations/        # Database migrationer
│   └── schema.prisma      # Database skema
├── scripts/               # Utility scripts
├── docs/                  # Dokumentation
│   └── deployment/        # Deployment guides og dokumentation
├── docker-compose.yml     # Docker konfiguration for API, web og database
├── Dockerfile.api         # Dockerfile til API
├── Dockerfile.web         # Dockerfile til web applikation
└── nginx.conf             # Nginx reverse proxy konfiguration
```

## Tech Stack

### Backend (API)

- **Framework**: NestJS v10.3.10
- **Sprog**: TypeScript v5.3.3
- **Database**: PostgreSQL v15 med Prisma ORM v6.8.2
- **Autentifikation**: JWT, Passport med GitHub og Google OAuth
- **API Dokumentation**: Swagger/OpenAPI
- **Caching**: Redis (via @nestjs/cache-manager)
- **Rate Limiting**: @nestjs/throttler med Redis storage

### Frontend (Web)

- **Framework**: Next.js v13.4.12
- **Sprog**: TypeScript v5.1.6
- **UI Biblioteker**:
  - Material UI v7.1.0
  - Radix UI (forskellige komponenter)
  - Tailwind CSS v3.3.3
- **State Management**: Redux Toolkit v1.9.5
- **HTTP Client**: Axios v1.9.0
- **Komponent Bibliotek**: Eget UI bibliotek (workspace:ui)

### Delte Pakker

- **Konfiguration**: ESLint v8/v9, Prettier v3.0.0, TypeScript konfigurationer
- **Core**: Delte typer og utilities
- **UI**: Delte UI komponenter

### DevOps & Infrastruktur

- **Containerisering**: Docker med multi-stage builds
- **Orkestrering**: Docker Compose
- **CI/CD**: GitHub Actions
- **Kvalitetssikring**: JetBrains Qodana
- **Deployment**:
  - API: Render
  - Web: Vercel
  - Lokal: Docker Compose med Nginx reverse proxy

### Test

- **Unit Testing**: Jest v29.6.2
- **E2E Testing**: Playwright v1.52.0
- **API Testing**: Supertest v6.3.3

### Pakke Management

- **Monorepo**: Turborepo v2.3.5
- **Pakke Manager**: Yarn v4.9.1 med Workspaces

## Udviklingsworkflow

### Setup

1. Sørg for at have Node.js v22 installeret:

   ```bash
   # Tjek Node.js version
   node -v
   # Skal vise v22.x.x
   ```

2. Aktiver Corepack for at bruge Yarn v4:

   ```bash
   corepack enable
   ```

3. Klon repository og installer afhængigheder:

   ```bash
   git clone <repository-url>
   cd LearningLab
   yarn install
   ```

4. Konfigurer miljøvariabler:
   - For frontend: `cp apps/web/.env.example apps/web/.env.local`
   - For backend: `cp apps/api/.env.example apps/api/.env`
   - Gennemgå og opdater miljøvariablerne i hver fil i henhold til din lokale opsætning
   - Vigtige variabler at konfigurere:
     - Database forbindelsesstreng (API)
     - JWT hemmeligheder (API)
     - OAuth legitimationsoplysninger for GitHub og Google (hvis du bruger social login)
     - API URL for frontend

### Udvikling

Start udviklingsmiljøet:

```bash
yarn dev
```

Dette vil starte både API og web applikationerne i udviklingstilstand med hot reloading.

For at starte kun API:

```bash
yarn workspace api dev
```

For at starte kun web:

```bash
yarn workspace web dev
```

### Database Administration

- Kør migrationer: `yarn prisma:migrate`
- Generer Prisma klient: `yarn prisma:generate`
- Åbn Prisma Studio: `yarn prisma:studio`
- Seed databasen: `yarn seed`

## Test

Kør tests:

```bash
yarn test
```

For kontinuerlig test under udvikling:

```bash
yarn test:watch
```

For CI/CD miljøer:

```bash
yarn test:ci
```

For E2E tests (web):

```bash
yarn workspace web test:e2e
```

## Build Proces

For at bygge alle applikationer og pakker:

```bash
yarn build
```

For at bygge kun API:

```bash
yarn build:api
```

## Deployment

### Lokal Deployment med Docker

```bash
# Start alle services (database, API, web og Nginx)
docker-compose up -d

# Se logs
docker-compose logs -f

# Stop alle services
docker-compose down
```

Dette vil starte:

- PostgreSQL database på port 5432
- API service på port 3000 (internt)
- Web applikation på port 3001 (internt)
- Nginx reverse proxy på port 80 (eksponeret)

Applikationen vil være tilgængelig på:

- Web: http://localhost
- API: http://localhost/api

### Cloud Deployment

Projektet er konfigureret til deployment på:

- **API**: Render
- **Web**: Vercel

Se detaljerede deployment guides i `/docs/deployment/` mappen:

- Environment-specifikke deployment guides
- CI/CD hemmeligheder og miljøvariabler
- Deployment alignment guide
- CI/CD fejlfindingsguide

## Kodestil Guidelines

- Følg ESLint og Prettier konfigurationerne i projektet
- Kør `yarn lint` for at tjekke for linting problemer
- Kør `yarn format` for automatisk at formatere kode
- Skriv unit tests for alle nye funktioner
- Følg NestJS stilguiden for backend kode
- Brug TypeScript for typesikkerhed i hele projektet

## Fejlfinding

### Database Forbindelsesproblemer

1. Sørg for at databasecontaineren kører:

   ```bash
   docker ps
   ```

2. Tjek database logs:

   ```bash
   docker-compose logs postgres
   ```

3. For fejlen "Can't reach database server at `localhost:5432`":
   - Hvis du kører API direkte (ikke i Docker), skal du sørge for at databasen er startet med `docker-compose up postgres -d`
   - Hvis du kører i Docker, skal du sørge for at begge services er på samme netværk

### API Forbindelsesproblemer

1. Tjek API logs:

   ```bash
   docker-compose logs api
   ```

2. Sørg for at CORS er konfigureret korrekt i API'en
3. Tjek at miljøvariablen `NEXT_PUBLIC_API_URL` er korrekt i web applikationen

### Web Applikationsproblemer

1. Tjek web logs:

   ```bash
   docker-compose logs web
   ```

2. Tjek browser konsollen for fejl
3. Sørg for at API'en er tilgængelig og fungerer korrekt

## CI/CD Pipeline

Projektet bruger GitHub Actions til CI/CD:

1. **Build og Test**: Kører på alle pull requests og pushes til main

   - Installerer afhængigheder
   - Bygger alle pakker og applikationer
   - Kører unit tests
   - Kører E2E tests med Playwright

2. **Deploy til Render (API)**: Kører kun på pushes til main

   - Trigger et deploy via Render deploy hook

3. **Deploy til Vercel (Web)**: Kører kun på pushes til main

   - Deployer web applikationen til Vercel

4. **Kodekvalitet**: Kører Qodana kodekvalitetsanalyse

Se `.github/workflows/` mappen for detaljerede konfigurationer.

## Dokumentation

Yderligere dokumentation findes i `/docs/` mappen:

- Deployment guides
- Miljøspecifikke konfigurationer
- CI/CD hemmeligheder og miljøvariabler
- Fejlfindingsguides

## Kendte Problemer og Løsninger

1. **Duplikerede Context Mapper**: Web applikationen havde tidligere både `context/` og `contexts/` mapper, som er blevet konsolideret til `contexts/`.

2. **Docker Konfiguration**: Docker konfigurationen er blevet opdateret til at inkludere web applikationen og Nginx reverse proxy.

3. **Node.js Version**: Projektet kræver Node.js v22. Ældre versioner understøttes ikke.

4. **Yarn Version**: Projektet bruger Yarn v4.9.1 via Corepack. Sørg for at aktivere Corepack før installation.

## Bidrag til Projektet

1. Fork repository
2. Opret en feature branch (`git checkout -b feature/amazing-feature`)
3. Commit dine ændringer (`git commit -m 'Add some amazing feature'`)
4. Push til branch (`git push origin feature/amazing-feature`)
5. Åbn en Pull Request

## Licens

Dette projekt er licenseret under [LICENSE] - se LICENSE filen for detaljer.
