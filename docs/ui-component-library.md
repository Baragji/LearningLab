# UI Komponentbibliotek

Dette dokument beskriver strukturen og brugen af det konsoliderede UI-komponentbibliotek baseret på Material UI (MUI).

## Struktur

Komponentbiblioteket er organiseret i følgende struktur:

```
packages/ui/
├── components/
│   ├── mui/           # MUI-baserede komponenter
│   │   ├── Button/
│   │   ├── TextField/
│   │   ├── Checkbox/
│   │   ├── Select/
│   │   └── ...
│   ├── Button/        # Legacy komponenter (vil blive udfaset)
│   ├── Notification/  # Legacy komponenter (vil blive udfaset)
│   └── Skeleton/      # Legacy komponenter (vil blive udfaset)
└── theme/             # MUI tema-konfiguration
```

## Komponenter

### Kernekomponenter (Høj prioritet)

#### Button

En MUI-baseret knap-komponent med følgende funktioner:

- Varianter: `contained`, `outlined`, `text`
- Farver: `primary`, `secondary`, `error`, `info`, `success`, `warning`
- Størrelser: `small`, `medium`, `large`
- Tilstande: `isLoading`, `disabled`
- Ekstra props: `fullWidth`, `loadingText`

```tsx
import { Button } from '@repo/ui';

function MyComponent() {
  return (
    <>
      <Button>Default Button</Button>
      <Button variant="outlined" color="secondary">Outlined Button</Button>
      <Button isLoading>Loading Button</Button>
      <Button fullWidth>Full Width Button</Button>
    </>
  );
}
```

#### TextField

En MUI-baseret tekstfelt-komponent med følgende funktioner:

- Varianter: `outlined`, `filled`, `standard`
- Størrelser: `small`, `medium`
- Tilstande: `error`, `disabled`
- Ekstra props: `fullWidth`, `helperText`

```tsx
import { TextField } from '@repo/ui';

function MyComponent() {
  return (
    <>
      <TextField label="Standard Input" />
      <TextField 
        label="Email" 
        type="email" 
        placeholder="Enter your email"
        helperText="We'll never share your email"
      />
      <TextField 
        label="Required Field" 
        required 
        error={!value} 
        helperText={!value ? "This field is required" : ""}
      />
    </>
  );
}
```

#### Checkbox

En MUI-baseret checkbox-komponent med følgende funktioner:

- Farver: `primary`, `secondary`, `error`, `info`, `success`, `warning`, `default`
- Størrelser: `small`, `medium`
- Ekstra props: `label`, `labelPlacement`

```tsx
import { Checkbox } from '@repo/ui';

function MyComponent() {
  return (
    <>
      <Checkbox label="Accept terms and conditions" />
      <Checkbox label="Remember me" defaultChecked />
      <Checkbox label="Left label" labelPlacement="start" />
    </>
  );
}
```

#### Select

En MUI-baseret select-komponent med følgende funktioner:

- Varianter: `outlined`, `filled`, `standard`
- Størrelser: `small`, `medium`
- Tilstande: `error`, `disabled`
- Ekstra props: `fullWidth`, `helperText`, `options`

```tsx
import { Select } from '@repo/ui';

function MyComponent() {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  return (
    <>
      <Select 
        label="Choose an option" 
        options={options} 
      />
      <Select 
        label="Required Field" 
        required 
        error={!value} 
        helperText={!value ? "Please select an option" : ""}
        options={options}
      />
    </>
  );
}
```

## Tema

Komponentbiblioteket inkluderer et tilpasset MUI-tema, der kan bruges til at sikre konsistent styling på tværs af applikationen.

```tsx
import { ThemeProvider, theme } from '@repo/ui';

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
```

Se [MUI-tema dokumentationen](./mui-theme-documentation.md) for flere detaljer om temaet.

## Migreringsstrategi

Migreringen fra de eksisterende komponenter til MUI-baserede komponenter vil ske gradvist i følgende faser:

1. **Fase 1: Forberedelse og planlægning** (Afsluttet)
   - Audit af eksisterende komponenter
   - Oprettelse af MUI-tema
   - Oprettelse af komponentbibliotek-struktur

2. **Fase 2: Kernekomponenter**
   - Migrering af Button, TextField, Checkbox, Select

3. **Fase 3: Layout og Navigation**
   - Migrering af Dialog/Modal, Tabs, Card, Layout-komponenter

4. **Fase 4: Datavisning**
   - Migrering af Table, Progress/Loading

5. **Fase 5: Øvrige komponenter**
   - Migrering af Notification/Alert, Ikoner, Badge, Separator, Textarea

For hver komponent vil vi:
1. Implementere en MUI-baseret version i packages/ui
2. Tilføje unit tests
3. Opdatere dokumentation
4. Gradvist erstatte brugen af de gamle komponenter
5. Fjerne de gamle komponenter, når de ikke længere er i brug