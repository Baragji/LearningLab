# Bidrag til LearningLab 🤝

Tak for din interesse i at bidrage til LearningLab! Dette dokument indeholder retningslinjer for at bidrage til projektet.

## 🚀 Kom i Gang

### Forudsætninger

- Node.js (v18 eller nyere)
- Yarn (v4.9.1 eller nyere)
- PostgreSQL (v14 eller nyere)
- Git

### Setup Udviklings Miljø

1. **Fork repositoriet**
   - Gå til [LearningLab repository](https://github.com/yourusername/learninglab)
   - Klik på "Fork" knappen

2. **Klon dit fork**
   ```bash
   git clone https://github.com/dit-brugernavn/learninglab.git
   cd learninglab
   ```

3. **Tilføj upstream remote**
   ```bash
   git remote add upstream https://github.com/yourusername/learninglab.git
   ```

4. **Setup projektet**
   ```bash
   yarn setup
   ```

5. **Start udviklings servere**
   ```bash
   yarn dev
   ```

## 📋 Bidrag Proces

### 1. Opret et Issue

Før du starter på en ny feature eller bugfix:
- Check om der allerede eksisterer et issue
- Hvis ikke, opret et nyt issue med:
  - Klar beskrivelse af problemet/featuren
  - Acceptkriterier (hvis relevant)
  - Screenshots eller eksempler (hvis relevant)

### 2. Opret en Branch

```bash
# Sync med upstream
git checkout main
git pull upstream main

# Opret ny branch
git checkout -b feature/beskrivelse-af-feature
# eller
git checkout -b bugfix/beskrivelse-af-bug
```

### Branch Navngivning

- `feature/` - Nye features
- `bugfix/` - Bug fixes
- `hotfix/` - Kritiske fixes
- `docs/` - Dokumentation ændringer
- `refactor/` - Code refactoring
- `test/` - Test forbedringer

### 3. Lav Dine Ændringer

#### Code Style

- Følg eksisterende code style
- Kør `yarn lint` og `yarn format` før commit
- Skriv beskrivende commit beskeder

#### Commit Beskeder

Brug [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): beskrivelse

[optional body]

[optional footer]
```

Eksempler:
```
feat(auth): add social login with Google
bugfix(quiz): fix question navigation issue
docs(readme): update installation instructions
refactor(api): simplify user service methods
```

Types:
- `feat` - Ny feature
- `fix` - Bug fix
- `docs` - Dokumentation
- `style` - Formatting, missing semi colons, etc
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance

#### Testing

- Skriv tests for nye features
- Sørg for at alle tests passerer: `yarn test`
- Test manuelt i browseren

#### Database Ændringer

- Hvis du ændrer database schema:
  ```bash
  yarn prisma:migrate:dev
  ```
- Opdater seed data hvis nødvendigt

### 4. Push og Opret Pull Request

```bash
# Push til dit fork
git push origin feature/din-branch
```

- Gå til GitHub og opret en Pull Request
- Udfyld PR template med:
  - Beskrivelse af ændringer
  - Link til relaterede issues
  - Screenshots (hvis UI ændringer)
  - Test instruktioner

## 🧪 Testing Guidelines

### Unit Tests

- Skriv tests for alle nye funktioner
- Test edge cases og error scenarios
- Brug beskrivende test navne

```typescript
// ✅ God test
describe('UserService', () => {
  it('should create user with valid email and password', async () => {
    // test implementation
  });
  
  it('should throw error when email is already taken', async () => {
    // test implementation
  });
});
```

### Integration Tests

- Test API endpoints
- Test database interactions
- Test authentication flows

### E2E Tests

- Test kritiske user flows
- Test på forskellige browsere
- Test responsive design

## 📝 Code Review Process

### Som Contributor

- Sørg for at din PR er klar til review
- Responder på feedback konstruktivt
- Lav ændringer baseret på review kommentarer

### Review Kriterier

- [ ] Code følger projekt conventions
- [ ] Tests er inkluderet og passerer
- [ ] Dokumentation er opdateret
- [ ] Ingen breaking changes (medmindre planlagt)
- [ ] Performance påvirkning er vurderet
- [ ] Security implications er overvejet

## 🏗️ Arkitektur Guidelines

### Backend (NestJS)

- Følg NestJS best practices
- Brug dependency injection
- Implementer proper error handling
- Brug DTOs for validation
- Følg RESTful API conventions

### Frontend (Next.js)

- Brug TypeScript
- Følg React best practices
- Implementer proper state management
- Brug responsive design
- Optimer for performance

### Database (Prisma)

- Brug descriptive model names
- Implementer proper relations
- Add appropriate indexes
- Brug migrations for schema changes

## 🚫 Hvad Ikke at Gøre

- Commit direkte til main branch
- Ignore linting errors
- Skip tests
- Hardcode sensitive data
- Make breaking changes uden diskussion
- Copy-paste code uden forståelse

## 🆘 Få Hjælp

- Opret et issue for spørgsmål
- Tag maintainers i PR kommentarer
- Join vores Discord/Slack (hvis tilgængelig)
- Check eksisterende dokumentation

## 📚 Ressourcer

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

## 🎉 Anerkendelse

Alle bidragydere vil blive anerkendt i vores README og release notes.

Tak for at hjælpe med at gøre LearningLab bedre! 🚀