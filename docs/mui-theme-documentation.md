# Material UI (MUI) Tema Dokumentation

Dette dokument beskriver det tilpassede MUI-tema, der bruges i LearningLab-projektet.

## Farvepalette

### Primær farve

- **Hovedfarve**: `#3f51b5` (Indigo)
- **Lys variant**: `#757de8`
- **Mørk variant**: `#002984`
- **Kontrasttekst**: `#ffffff` (Hvid)

### Sekundær farve

- **Hovedfarve**: `#f50057` (Pink)
- **Lys variant**: `#ff5983`
- **Mørk variant**: `#bb002f`
- **Kontrasttekst**: `#ffffff` (Hvid)

### Fejlfarve

- **Hovedfarve**: `#f44336` (Rød)

### Baggrund

- **Standard**: `#ffffff` (Hvid)
- **Paper**: `#f5f5f5` (Lysegrå)

## Typografi

### Skrifttype

- Primær: `"Inter", "Roboto", "Helvetica", "Arial", sans-serif`

### Overskrifter

- **H1**: 2.5rem (40px), vægt: 600
- **H2**: 2rem (32px), vægt: 600
- **H3**: 1.75rem (28px), vægt: 600
- **H4**: 1.5rem (24px), vægt: 600
- **H5**: 1.25rem (20px), vægt: 600
- **H6**: 1rem (16px), vægt: 600

### Brødtekst

- **Body1**: 1rem (16px)
- **Body2**: 0.875rem (14px)

## Form

- **Hjørneradius**: 8px

## Komponenttilpasninger

### Button

- Ingen store bogstaver (textTransform: 'none')
- Skriftvægt: 500 (medium)

### TextField

- Hover-effekt på outline med primær farve

### Checkbox

- Primær farve som standard

### Dialog

- Hjørneradius: 8px

### Tab

- Ingen store bogstaver (textTransform: 'none')

## Brug af temaet

Temaet er defineret i `packages/ui/theme/index.ts` og kan importeres og bruges i hele projektet.

### Eksempel på brug i en komponent

```tsx
import { ThemeProvider, theme } from "@repo/ui/theme";
import { Button } from "@mui/material";

function MyComponent() {
  return (
    <ThemeProvider theme={theme}>
      <Button variant="contained">Min knap</Button>
    </ThemeProvider>
  );
}
```

### Eksempel på brug i \_app.tsx

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

## Tilpasning af temaet

Hvis du har behov for at tilpasse temaet, kan du redigere `packages/ui/theme/index.ts`. Se [MUI's dokumentation](https://mui.com/material-ui/customization/theming/) for flere detaljer om, hvordan du kan tilpasse temaet.
