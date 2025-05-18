// package-scripts.js
const path = require("path");

// Stier til de forskellige applikationer i monorepoet
// Bruges til at konstruere kommandoer, der køres i de specifikke mapper
const apiPath = path.resolve(__dirname, "apps/api");
const webPath = path.resolve(__dirname, "apps/web");

// Stier til output-mapper for CI (Continuous Integration) builds
// Bruges typisk efter 'turbo prune' har isoleret en app og dens dependencies
const ciApiPath = path.resolve(__dirname, "out/apps/api");
const ciWebPath = path.resolve(__dirname, "out/apps/web");

module.exports = {
  scripts: {
    // 'prepare' scripts køres typisk for at sætte projektet op
    prepare: {
      // Default 'prepare' script kører forberedelsesscripts for både web og api
      default: `nps prepare.web prepare.api`,
      // Forberedelsesscript for 'web' appen (kører 'yarn install')
      web: `yarn`,
      // Forberedelsesscript for 'api' appen (kører nu kun prisma migrate dev)
      api: `nps prisma.migrate.dev`, 
      // CI specifikke forberedelsesscripts
      ci: {
        // For 'web': Pruner monorepoet, navigerer til output mappen, og installerer dependencies
        web: `npx turbo prune --scope=web && cd out && yarn install --frozen-lockfile`,
        // For 'api': Pruner, navigerer, installerer, og genererer Prisma client
        api: `npx turbo prune --scope=api && cd out && yarn install --frozen-lockfile && nps prisma.generate`,
      },
    },
    // 'test' scripts til at køre tests for applikationerne
    test: {
      // Default 'test' script kører tests for både web og api
      default: `nps test.web test.api`,
      // Kører tests for 'web' appen
      web: `cd ${webPath} && yarn test`,
      // Kører tests for 'api' appen
      api: `cd ${apiPath} && yarn test`,
      // CI specifikke test scripts
      ci: {
        default: `nps test.ci.web test.ci.api`,
        web: `cd ${ciWebPath} && yarn test:ci`,
        api: `cd ${ciApiPath} && yarn test:ci`,
      },
      // Scripts til at køre tests i watch mode
      watch: {
        default: `nps test.watch.web test.watch.api`,
        web: `cd ${webPath} && yarn test:watch`,
        api: `cd ${apiPath} && yarn test:watch`,
      },
    },
    // 'prisma' scripts til database-relaterede operationer
    prisma: {
      // Genererer Prisma client
      generate: `cd ${apiPath} && npx prisma generate`,
      // Åbner Prisma Studio (GUI til databasen)
      studio: `cd ${apiPath} && npx prisma studio`,
      // Kører database migrationer i udviklingsmiljøet
      migrate: {
        dev: `cd ${apiPath} && npx prisma migrate dev`,
      },
    },
    // 'build' scripts til at bygge applikationerne
    build: {
      // Default 'build' script bruger Turborepo til at bygge alle apps/packages
      default: "npx turbo run build",
      // CI specifikke build scripts (kører i 'out' mappen efter 'turbo prune')
      ci: {
        web: "cd out && npm run build", // Bemærk: Bruger 'npm run build' her, overvej at ændre til 'yarn build' for konsistens
        api: "cd out && npm run build", // Bemærk: Bruger 'npm run build' her, overvej at ændre til 'yarn build' for konsistens
      },
    },
    // 'dev' script til at starte udviklingsservere for alle apps (typisk parallelt via Turborepo)
    dev: "npx turbo run dev",
  },
};
