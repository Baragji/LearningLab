# UI-konsolidering Fase 2: Kernekomponenter

Dette dokument beskriver planen for fase 2 af UI-konsolideringen, hvor vi vil implementere og migrere kernekomponenterne.

## Mål

- Implementere MUI-baserede versioner af kernekomponenterne
- Tilføje unit tests for alle komponenter
- Opdatere dokumentation
- Begynde migrering fra eksisterende komponenter til de nye MUI-komponenter

## Komponenter i fokus

1. **Button**
   - Erstatte både `Button` fra packages/ui og `AppButton` fra apps/web
   - Sikre at alle funktioner fra begge komponenter er understøttet

2. **TextField**
   - Erstatte `Input` fra apps/web
   - Tilføje funktionalitet til at håndtere forskellige input-typer

3. **Checkbox**
   - Erstatte `Checkbox` fra apps/web
   - Sikre kompatibilitet med formularer

4. **Select**
   - Erstatte `Select` fra apps/web
   - Understøtte både simple og komplekse use cases

## Implementeringsplan

### Uge 1: Button og TextField

#### Dag 1-2: Button
- Implementere MUI Button-komponent
- Tilføje unit tests
- Dokumentere komponenten
- Oprette eksempler på brug

#### Dag 3-4: TextField
- Implementere MUI TextField-komponent
- Tilføje unit tests
- Dokumentere komponenten
- Oprette eksempler på brug

#### Dag 5: Review og tilpasninger
- Gennemgå implementeringen med teamet
- Foretage nødvendige tilpasninger
- Begynde migrering i en mindre del af applikationen

### Uge 2: Checkbox og Select

#### Dag 1-2: Checkbox
- Implementere MUI Checkbox-komponent
- Tilføje unit tests
- Dokumentere komponenten
- Oprette eksempler på brug

#### Dag 3-4: Select
- Implementere MUI Select-komponent
- Tilføje unit tests
- Dokumentere komponenten
- Oprette eksempler på brug

#### Dag 5: Review og tilpasninger
- Gennemgå implementeringen med teamet
- Foretage nødvendige tilpasninger
- Begynde migrering i en mindre del af applikationen

### Uge 3: Migrering og integration

#### Dag 1-3: Migrering
- Identificere alle steder, hvor de gamle komponenter bruges
- Migrere til de nye MUI-komponenter
- Teste funktionalitet efter migrering

#### Dag 4-5: Integration og test
- Sikre at alle komponenter fungerer korrekt sammen
- Løse eventuelle problemer med styling eller funktionalitet
- Dokumentere eventuelle breaking changes

## Succeskriterier

- Alle fire kernekomponenter er implementeret med MUI
- Alle komponenter har unit tests med god dækning
- Dokumentation er opdateret
- Mindst 50% af brugen af de gamle komponenter er migreret til de nye
- Ingen regression i funktionalitet eller brugeroplevelse

## Risici og udfordringer

- Potentielle breaking changes i API'er
- Styling-forskelle mellem eksisterende og nye komponenter
- Integration med eksisterende formularer og validering
- Potentielle ydeevneproblemer

## Mitigeringsstrategi

- Bevare samme API hvor muligt
- Grundig test af alle komponenter
- Gradvis migrering for at minimere risiko
- Tæt samarbejde med UX-teamet for at sikre konsistent brugeroplevelse