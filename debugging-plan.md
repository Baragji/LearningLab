# LearningLab Monorepo Build Fejl Debugging Plan

## Problemanalyse

Efter en grundig analyse af LearningLab monorepo'et har jeg identificeret følgende problemer, der forårsager build-fejl:

### Hovedproblem
Build-processen fejler under kompilering af web-applikationen med følgende fejl:
```
Type '{ (props: ButtonProps): Element; displayName: string | undefined; }' is not assignable to type 'FC<ButtonProps>'.
Type 'Element' is not assignable to type 'ReactNode'.
Property 'children' is missing in type 'Element' but required in type 'ReactPortal'.
```

### Underliggende årsager

1. **TypeScript-typekonflikt i UI-pakken**: 
   - Fejlen opstår i `packages/ui/components/mui/Button/Button.tsx` hvor React.FC-typen ikke er kompatibel med returtypen.
   
2. **Versionskonflikter mellem React-typer**:
   - Der er forskellige versioner af `@types/react` i projektet:
     - Web-applikationen bruger `@types/react@18.2.18`
     - Transitive afhængigheder trækker `@types/react@19.1.5` ind

3. **Potentielle problemer med peer dependencies**:
   - UI-pakken har React som peer dependency, men der kan være konflikter i hvordan disse håndteres i monorepo'et.

4. **Yarn PnP og TypeScript-kompatibilitet**:
   - Yarn 4.9.1 bruger Plug'n'Play, som kan have kompatibilitetsproblemer med TypeScript i monorepo-kontekst.

## Trin-for-trin Debugging Plan

### 1. Løs TypeScript-typekonflikten i Button-komponenten

```typescript
// Ændr fra:
export const Button: React.FC<ButtonProps> = (props) => {
  // ...
};

// Til:
export const Button = (props: ButtonProps): React.ReactElement => {
  // ...
};
```

### 2. Ensret React-typeversioner i hele monorepo'et

1. Opdater package.json i root-mappen med en resolutions-sektion:

```json
"resolutions": {
  "@types/react": "18.2.18"
}
```

2. Opdater UI-pakkens package.json til at bruge samme version:

```json
"devDependencies": {
  "@types/react": "18.2.18",
  // andre dependencies...
}
```

3. Ryd node_modules og geninstaller:

```bash
yarn cache clean
rm -rf node_modules .yarn/cache
yarn install
```

### 3. Tjek og løs peer dependency-problemer

1. Sørg for at UI-pakkens peer dependencies matcher web-applikationens dependencies:

```json
"peerDependencies": {
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

2. Tilføj eksplicitte dependencies i root package.json:

```json
"dependencies": {
  "react": "18.2.0",
  "react-dom": "18.2.0",
  // andre dependencies...
}
```

### 4. Konfigurer TypeScript korrekt for monorepo

1. Tjek tsconfig.json i UI-pakken:

```json
{
  "extends": "tsconfig/react-library.json",
  "include": ["."],
  "exclude": ["dist", "build", "node_modules"]
}
```

2. Sørg for at react-library.json i tsconfig-pakken har korrekte indstillinger:

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2015", "DOM"],
    "module": "ESNext",
    "target": "ES6",
    "skipLibCheck": true
  }
}
```

### 5. Løs specifikke MUI-kompatibilitetsproblemer

1. Tjek versionskompatibilitet mellem MUI v7.1.0 og React 18.2.0:

```bash
yarn add @mui/material@7.1.0 @emotion/react@11.14.0 @emotion/styled@11.14.0
```

2. Opdater Button-komponenten til at bruge korrekte typer fra MUI v7:

```typescript
import { Button as MuiButton, CircularProgress } from '@mui/material';
import type { ButtonProps as MuiButtonProps } from '@mui/material';

// Opdater typedefinitionen hvis nødvendigt
```

### 6. Håndter Yarn PnP-relaterede problemer

1. Konfigurer TypeScript til at arbejde med Yarn PnP:

```bash
yarn dlx @yarnpkg/sdks vscode
```

2. Tilføj .yarnrc.yml-konfiguration:

```yaml
nodeLinker: pnp
pnpMode: loose

packageExtensions:
  "@mui/material@*":
    peerDependencies:
      "@types/react": "*"
```

### 7. Ryd cachen og genbyg projektet

```bash
yarn cache clean
yarn turbo prune --scope=web
yarn turbo prune --scope=ui
yarn install
yarn build
```

### 8. Hvis problemet fortsætter, isoler og test individuelt

1. Test UI-pakken separat:

```bash
cd packages/ui
yarn tsc --noEmit
```

2. Test web-applikationen separat:

```bash
cd apps/web
yarn build
```

### 9. Tjek for andre versionskonflikter

1. Undersøg andre potentielle versionskonflikter:

```bash
yarn why react
yarn why typescript
yarn why @mui/material
```

2. Løs eventuelle konflikter ved at tilføje resolutions i root package.json.

### 10. Opdater dependencies til kompatible versioner

1. Tjek om der er kendte kompatibilitetsproblemer mellem:
   - Next.js 13.4.12 og React 18.2.0
   - MUI v7.1.0 og React 18.2.0
   - TypeScript 5.1.6/5.3.3/5.8.3 (forskellige versioner i projektet)

2. Opdater til kompatible versioner:

```bash
yarn up -R typescript@5.3.3
```

## Forebyggelse af fremtidige problemer

1. **Implementer strikte versionskontrols**:
   - Brug `"resolutions"` i root package.json til at sikre konsistente versioner.
   - Overvej at bruge `syncpack` til at holde versioner synkroniserede.

2. **Forbedre TypeScript-konfiguration**:
   - Brug `"skipLibCheck": true` i alle tsconfig-filer.
   - Implementer project references for bedre monorepo-støtte.

3. **Forbedre CI/CD-pipeline**:
   - Tilføj type-checking som et separat trin før build.
   - Implementer dependency-scanning for at fange versionskonflikter tidligt.

4. **Dokumentation og guidelines**:
   - Opdater guidelines.md med best practices for dependency management.
   - Dokumenter kendte problemer og deres løsninger.

## Konklusion

Hovedproblemet er en kombination af TypeScript-typekonflikter og versionskonflikter mellem forskellige pakker i monorepo'et. Ved at følge denne debugging-plan systematisk, kan vi identificere og løse de specifikke problemer, der forårsager build-fejlen.

Planen adresserer både de umiddelbare problemer og giver langsigtede løsninger til at forebygge lignende problemer i fremtiden.