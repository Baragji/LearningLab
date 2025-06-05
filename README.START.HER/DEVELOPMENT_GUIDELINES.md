# 🛠️ LearningLab Development Guidelines

This document describes the conventions used when working on the LearningLab code base. It should reflect the current setup of the repository.

## Development Environment

- **Node.js 22** and **Yarn 4** are required.
- Docker is recommended for running databases but is not mandatory.
- Install dependencies and set up the database using:

```bash
yarn setup
```

Start both the API and the web application in watch mode with:

```bash
yarn dev
```

The frontend runs on [http://localhost:3000](http://localhost:3000) and the API on [http://localhost:5002](http://localhost:5002).

## Coding Standards

- All code is written in **TypeScript** with `strict` mode enabled.
- Linting is enforced with **ESLint** and formatting with **Prettier**. Run:

```bash
yarn lint
yarn format
```

- Commit messages follow the **Conventional Commits** style, e.g. `feat(auth): add JWT login`.
- Use descriptive variable and function names and keep functions small.

## Git Workflow

1. Create a branch from `main` using the pattern `feature/<name>` or `fix/<name>`.
2. Commit regularly with clear messages.
3. Open a Pull Request and request review before merging.
4. Squash merge after approval.

## Testing

- Unit tests and integration tests are written with **Jest**.
- Run all tests with `yarn test` or in watch mode with `yarn test:watch`.
- Aim for at least 80% coverage on critical modules.

## Documentation

- Keep README files up to date when behaviour changes.
- Significant features should include comments and, if relevant, additional markdown docs under `docs/`.

## Troubleshooting

- If dependencies act up, run `yarn clean` followed by `yarn install`.
- For database issues you can reset the local DB with `yarn db:reset`.

---

These guidelines are intentionally brief. Refer to the main README for project overview and the technical documentation for architecture details. When in doubt, prefer clarity and maintainability over clever solutions.
