
# LearningLab 🎓

En moderne uddannelsesplatform bygget med NestJS, Next.js og Prisma.

## 🚀 Hurtig Start

### Forudsætninger

 - **Node.js** (v22)
- **Yarn** (v4.9.1 eller nyere)
- **PostgreSQL** (v14 eller nyere)
- **Git**

### Installation

1. **Klon repositoriet**
   ```bash
   git clone https://github.com/yourusername/learninglab.git
   cd learninglab
   ```

2. **Installer dependencies og setup database**
   ```bash
   yarn setup
   ```
   
   Dette kommando vil:
   - Installere alle dependencies
   - Oprette og migrere databasen
   - Seede databasen med test data

3. **Start udviklings servere**
   ```bash
   yarn dev
   ```
   
   Dette starter:
   - API server på `http://localhost:5002`
   - Web app på `http://localhost:3000`
   - API dokumentation på `http://localhost:5002/api/docs`

## 📁 Projekt Struktur

```
learninglab/
├── apps/
│   ├── api/          # NestJS backend API
│   └── web/          # Next.js frontend
├── packages/         # Delte pakker
├── prisma/           # Database schema og migrationer
├── scripts/          # Utility scripts
└── docs/            # Dokumentation
```

## 🛠️ Tilgængelige Scripts

### Hovedkommandoer
- `yarn setup` - Komplet setup af projektet (første gang)
- `yarn dev` - Start udviklings servere
- `yarn build` - Byg alle apps til produktion
- `yarn test` - Kør alle tests
- `yarn lint` - Kør linting
- `yarn format` - Formater kode

### Database kommandoer
- `yarn db:setup` - Setup database (migrate + generate)
- `yarn db:reset` - Reset database og seed data
- `yarn db:seed` - Seed database med test data
- `yarn prisma:studio` - Åbn Prisma Studio på `http://localhost:5555`
- `yarn prisma:migrate` - Kør database migrationer
- `yarn prisma:generate` - Generer Prisma client

### Utility kommandoer
- `yarn clean` - Ryd op i build filer
- `yarn clean:all` - Ryd op i alle node_modules
- `yarn typecheck` - Kør TypeScript type checking

## 🗄️ Database

### Lokal PostgreSQL Setup

1. **Installer PostgreSQL**
   ```bash
   # macOS med Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Opret database og bruger**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE learninglab;
   CREATE USER learninglab_user WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE learninglab TO learninglab_user;
   \q
   ```

3. **Konfigurer miljøvariabler**
   
   Kopier `.env.example` til `.env` og opdater database URL:
   ```bash
   cp .env.example .env
   ```
   
   Rediger `.env`:
   ```
   DATABASE_URL="postgresql://learninglab_user:password@localhost:5432/learninglab"
   ```

### Database Schema

Databasen indeholder følgende hovedentiteter:
- **EducationPrograms** - Uddannelsesprogrammer
- **Courses** - Kurser
- **Topics** - Emner
- **Lessons** - Lektioner
- **ContentBlocks** - Indholdsblokke
- **Quizzes** - Quiz
- **Questions** - Spørgsmål
- **Answers** - Svar

## 🧪 Testing

```bash
# Kør alle tests
yarn test

# Kør tests i watch mode
yarn test:watch

# Kør tests for CI
yarn test:ci
```

## 📝 Code Style

Projektet bruger:
- **ESLint** for linting
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **lint-staged** for staged files

```bash
# Formater kode
yarn format

# Check formatting
yarn format:check

# Fix linting issues
yarn lint:fix
```

## 🚀 Deployment

### Byg til produktion
```bash
yarn build
```

### Miljøvariabler til produktion
Sørg for at sætte følgende miljøvariabler:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret til JWT tokens
- `NODE_ENV=production`

## 🤝 Bidrag

1. Fork projektet
2. Opret en feature branch (`git checkout -b feature/amazing-feature`)
3. Commit dine ændringer (`git commit -m 'Add amazing feature'`)
4. Push til branchen (`git push origin feature/amazing-feature`)
5. Åbn en Pull Request

## 📚 Dokumentation

- **API Dokumentation**: `http://localhost:5002/api/docs` (når serveren kører)
- **Database Schema**: Se `prisma/schema.prisma`
- **Prisma Studio**: `yarn prisma:studio`

## 🆘 Fejlfinding

### Almindelige problemer

**Database connection fejl:**
```bash
# Check om PostgreSQL kører
ps aux | grep postgres

# Restart PostgreSQL (macOS)
brew services restart postgresql

# Test database connection
psql -h localhost -U learninglab_user -d learninglab
```

**Port allerede i brug:**
```bash
# Find proces der bruger port 3000/5002
lsof -ti:3000
lsof -ti:5002

# Dræb proces
kill -9 <PID>
```

**Yarn cache problemer:**
```bash
yarn clean:all
yarn install
```

## 📄 Licens

MIT License - se [LICENSE](LICENSE) filen for detaljer.

## 👥 Team

LearningLab Team

---

**Har du spørgsmål?** Opret et issue eller kontakt teamet.