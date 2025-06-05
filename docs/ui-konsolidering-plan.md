# UI-bibliotek Konsolideringsplan

## Nuværende situation

LearningLab-projektet bruger i øjeblikket flere forskellige UI-biblioteker og komponentsystemer:

1. **Material UI (MUI) v7.1.0**

   - Komponenter: Box, Typography, LinearProgress
   - Ikoner fra @mui/icons-material
   - Nyeste version (v7) er installeret

2. **Radix UI**

   - Primitive komponenter: Checkbox, Dialog, Label, Select, Tabs
   - Forskellige pakker installeret separat (@radix-ui/react-checkbox, @radix-ui/react-dialog, osv.)
   - Bruges som grundlag for flere custom komponenter

3. **Tailwind CSS v3.3.3**

   - Styling i hele projektet
   - Kombineres med class-variance-authority (cva) for komponentvarianter
   - Integreret med andre biblioteker via utility-funktioner (cn)

4. **Custom UI-komponenter**
   - Egen UI-pakke (workspace:ui) med komponenter som Button, Skeleton, Notification
   - Web-applikationens egne UI-komponenter i apps/web/src/components/ui/
   - Duplikation af komponenter (Button i UI-pakken og AppButton i web-appen)

## Problemer med den nuværende tilgang

1. **Duplikation af komponenter**: Flere implementeringer af samme komponenter (f.eks. Button)
2. **Inkonsistent styling**: Forskellige designsystemer blandes (MUI, Radix, custom)
3. **Vedligeholdelsesudfordringer**: Flere biblioteker betyder mere kompleks vedligeholdelse
4. **Øget bundle-størrelse**: Flere UI-biblioteker øger applikationens størrelse
5. **Læringskurve**: Udviklere skal kende flere forskellige API'er og konventioner

## Anbefaling: Konsolidering til Material UI (MUI) v7

Vi anbefaler at konsolidere til **Material UI (MUI) v7** som det primære UI-bibliotek af følgende årsager:

1. **Nyeste version allerede i brug**: Projektet bruger allerede MUI v7.1.0
2. **Komplet komponentbibliotek**: MUI tilbyder et omfattende sæt af komponenter
3. **God TypeScript-support**: MUI har god TypeScript-integration
4. **Aktiv vedligeholdelse**: Regelmæssige opdateringer og sikkerhedspatches
5. **Stor community**: God support og mange ressourcer
6. **Tilpasningsevne**: Kan tilpasses med ThemeProvider til at matche ethvert design

## Migrationsplan

### Fase 1: Forberedelse og planlægning (1-2 uger)

1. **Audit af eksisterende komponenter**

   - Lav en komplet liste over alle UI-komponenter i brug
   - Identificer hvilke komponenter der skal migreres
   - Prioriter komponenter baseret på anvendelse og kompleksitet

2. **Opret MUI tema**

   - Definer farver, typografi og spacing der matcher nuværende design
   - Opret en ThemeProvider-konfiguration
   - Dokumenter temaet for fremtidig reference

3. **Opret komponentbibliotek-struktur**
   - Definer struktur for det konsoliderede komponentbibliotek
   - Opret mapper og filer for de nye komponenter
   - Forbered test-infrastruktur

### Fase 2: Kernekomponenter (2-3 uger)

1. **Migrering af Button-komponenter**

   ```tsx
   // packages/ui/components/Button/Button.tsx
   import React from "react";
   import {
     Button as MuiButton,
     ButtonProps as MuiButtonProps,
   } from "@mui/material";

   export interface ButtonProps extends Omit<MuiButtonProps, "variant"> {
     variant?:
       | "default"
       | "destructive"
       | "outline"
       | "secondary"
       | "ghost"
       | "link";
     fullWidth?: boolean;
     isLoading?: boolean;
   }

   export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
     (
       {
         variant = "default",
         fullWidth = false,
         isLoading = false,
         children,
         ...props
       },
       ref,
     ) => {
       // Map custom variants to MUI variants
       const muiVariant =
         variant === "default"
           ? "contained"
           : variant === "destructive"
             ? "contained"
             : variant === "outline"
               ? "outlined"
               : variant === "secondary"
                 ? "contained"
                 : variant === "ghost"
                   ? "text"
                   : variant === "link"
                     ? "text"
                     : "contained";

       // Map custom colors
       const color =
         variant === "destructive"
           ? "error"
           : variant === "secondary"
             ? "secondary"
             : variant === "link"
               ? "primary"
               : "primary";

       return (
         <MuiButton
           ref={ref}
           variant={muiVariant}
           color={color}
           fullWidth={fullWidth}
           disabled={isLoading || props.disabled}
           {...props}
         >
           {isLoading ? (
             <>
               <span className="mr-2">
                 <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                   <circle
                     className="opacity-25"
                     cx="12"
                     cy="12"
                     r="10"
                     stroke="currentColor"
                     strokeWidth="4"
                   ></circle>
                   <path
                     className="opacity-75"
                     fill="currentColor"
                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                   ></path>
                 </svg>
               </span>
               Loading...
             </>
           ) : (
             children
           )}
         </MuiButton>
       );
     },
   );

   Button.displayName = "Button";
   ```

2. **Migrering af Input-komponenter**

   - Erstat custom input med MUI TextField
   - Bevar samme API hvor muligt
   - Tilføj unit tests

3. **Migrering af Checkbox og Radio**

   - Erstat Radix UI Checkbox med MUI Checkbox
   - Erstat eventuelle custom radio buttons med MUI Radio
   - Tilføj unit tests

4. **Migrering af Select**
   - Erstat Radix UI Select med MUI Select
   - Implementer samme funktionalitet
   - Tilføj unit tests

### Fase 3: Layout og Navigation (2-3 uger)

1. **Migrering af Dialog og Modal**

   - Erstat Radix UI Dialog med MUI Dialog
   - Implementer samme funktionalitet
   - Tilføj unit tests

2. **Migrering af Tabs**

   - Erstat Radix UI Tabs med MUI Tabs
   - Bevar samme API hvor muligt
   - Tilføj unit tests

3. **Migrering af Card og Paper**

   - Implementer Card-komponenter med MUI Card
   - Erstat custom containers med MUI Paper
   - Tilføj unit tests

4. **Migrering af Layout-komponenter**
   - Implementer Grid og Container med MUI
   - Erstat custom layout-komponenter
   - Tilføj unit tests

### Fase 4: Formularer og Datavisning (2-3 uger)

1. **Migrering af Form-komponenter**

   - Implementer FormControl, FormGroup, FormHelperText med MUI
   - Erstat custom form-komponenter
   - Tilføj unit tests

2. **Migrering af Table**

   - Erstat custom table med MUI Table
   - Implementer samme funktionalitet
   - Tilføj unit tests

3. **Migrering af Notification og Alert**

   - Erstat custom notification med MUI Snackbar og Alert
   - Implementer samme funktionalitet
   - Tilføj unit tests

4. **Migrering af Progress og Loading**
   - Erstat custom progress med MUI Progress
   - Implementer samme funktionalitet
   - Tilføj unit tests

### Fase 5: Ikoner og Medier (1-2 uger)

1. **Migrering af Ikoner**

   - Erstat alle ikoner med MUI Icons
   - Opret en konsistent ikonbibliotek
   - Dokumenter tilgængelige ikoner

2. **Migrering af Avatar og Badge**

   - Erstat custom avatar med MUI Avatar
   - Erstat custom badge med MUI Badge
   - Tilføj unit tests

3. **Migrering af Image og Media**
   - Implementer image-komponenter med MUI
   - Erstat custom media-komponenter
   - Tilføj unit tests

### Fase 6: Oprydning og Dokumentation (2-3 uger)

1. **Fjern ubrugte afhængigheder**

   - Fjern Radix UI-pakker
   - Fjern ubrugte custom komponenter
   - Opdater package.json

2. **Opdater Storybook (hvis relevant)**

   - Opdater Storybook-konfiguration
   - Tilføj stories for alle MUI-komponenter
   - Dokumenter komponentvarianter og props

3. **Opret komponentdokumentation**

   - Dokumenter alle komponenter
   - Opret eksempler på almindelige mønstre
   - Definer best practices

4. **Træning og onboarding**
   - Træn udviklere i det nye komponentbibliotek
   - Opret onboarding-materiale
   - Afhold workshops om MUI

## Implementeringsdetaljer

### Tema-konfiguration

```tsx
// packages/ui/theme/index.ts
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#3f51b5", // Tilpas til jeres brand-farve
      light: "#757de8",
      dark: "#002984",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#f50057", // Tilpas til jeres sekundære farve
      light: "#ff5983",
      dark: "#bb002f",
      contrastText: "#ffffff",
    },
    error: {
      main: "#f44336",
    },
    background: {
      default: "#ffffff",
      paper: "#f5f5f5",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 600,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
    },
    body1: {
      fontSize: "1rem",
    },
    body2: {
      fontSize: "0.875rem",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    // Tilføj flere komponent-overrides efter behov
  },
});
```

### ThemeProvider-integration

```tsx
// apps/web/src/pages/_app.tsx
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "@repo/ui/theme";

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
```

### Eksempel på migreret komponent

**Før (Radix UI + Tailwind):**

```tsx
// apps/web/src/components/ui/checkbox.tsx
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary-500 data-[state=checked]:text-white dark:border-gray-700 dark:focus-visible:ring-primary-500 dark:data-[state=checked]:bg-primary-500",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
```

**Efter (MUI):**

```tsx
// packages/ui/components/Checkbox/Checkbox.tsx
import React from "react";
import {
  Checkbox as MuiCheckbox,
  CheckboxProps as MuiCheckboxProps,
  FormControlLabel,
} from "@mui/material";

export interface CheckboxProps extends Omit<MuiCheckboxProps, "size"> {
  label?: string;
  size?: "small" | "medium" | "large";
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ label, size = "medium", ...props }, ref) => {
    const checkbox = (
      <MuiCheckbox
        ref={ref}
        size={size === "large" ? "medium" : size}
        {...props}
      />
    );

    if (label) {
      return <FormControlLabel control={checkbox} label={label} />;
    }

    return checkbox;
  },
);

Checkbox.displayName = "Checkbox";
```

## Fordele ved konsolidering

1. **Reduceret kompleksitet**: Ét primært UI-bibliotek i stedet for flere
2. **Konsistent brugeroplevelse**: Ensartet design og interaktionsmønstre
3. **Lettere vedligeholdelse**: Færre afhængigheder at holde opdateret
4. **Hurtigere udvikling**: Udviklere skal kun lære ét komponentbibliotek
5. **Mindre bundle-størrelse**: Reduceret JavaScript-størrelse forbedrer ydeevnen
6. **Bedre tilgængelighed**: MUI har god tilgængelighed (a11y) indbygget
7. **Fremtidssikring**: MUI er aktivt vedligeholdt og opdateres regelmæssigt

## Risici og afbødning

1. **Risiko**: Migrering kan introducere regressioner

   - **Afbødning**: Omfattende test af hver migreret komponent

2. **Risiko**: Udviklere skal lære nyt API

   - **Afbødning**: Dokumentation og træning

3. **Risiko**: Nogle custom komponenter kan være svære at migrere

   - **Afbødning**: Gradvis migrering, bevar komplekse komponenter indtil senere

4. **Risiko**: Styling kan være inkonsistent under migrering
   - **Afbødning**: Definer klare retningslinjer for styling under overgangsperioden

## Tidsplan og ressourcer

- **Samlet tidsramme**: 10-16 uger
- **Ressourcebehov**: 1-2 frontend-udviklere dedikeret til migrering
- **Milepæle**:
  - Fase 1 (Forberedelse): Uge 1-2
  - Fase 2 (Kernekomponenter): Uge 3-5
  - Fase 3 (Layout og Navigation): Uge 6-8
  - Fase 4 (Formularer og Datavisning): Uge 9-11
  - Fase 5 (Ikoner og Medier): Uge 12-13
  - Fase 6 (Oprydning og Dokumentation): Uge 14-16

## Konklusion

Ved at konsolidere til Material UI v7 som det primære UI-bibliotek, kan LearningLab-projektet opnå en mere konsistent brugeroplevelse, reducere vedligeholdelsesarbejdet og forbedre udviklerproduktiviteten. Den foreslåede migrationsplan giver en struktureret tilgang til at gennemføre denne konsolidering med minimal forstyrrelse af den igangværende udvikling.
