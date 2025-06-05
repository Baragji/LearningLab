# UI-komponent Audit

## Eksisterende UI-komponenter

### Packages/UI

1. **Button** (packages/ui/components/Button/Button.tsx)

   - Implementeret med Radix UI Slot og Tailwind CSS (via class-variance-authority)
   - Varianter: default, destructive, outline, secondary, ghost, link
   - Størrelser: default, sm, lg, icon
   - Props: asChild, fullWidth, isLoading

2. **Notification** (packages/ui/components/Notification)

   - Custom implementering

3. **Skeleton** (packages/ui/components/Skeleton)
   - Custom implementering

### Apps/Web/Components/UI

1. **AppButton** (apps/web/src/components/ui/AppButton.tsx)

   - Duplikation af Button fra UI-pakken, men med færre funktioner
   - Mangler isLoading og fullWidth props

2. **Badge** (apps/web/src/components/ui/badge.tsx)

   - Implementeret med Tailwind CSS

3. **Card** (apps/web/src/components/ui/card.tsx)

   - Implementeret med Tailwind CSS

4. **Checkbox** (apps/web/src/components/ui/checkbox.tsx)

   - Implementeret med Radix UI (@radix-ui/react-checkbox)

5. **Dialog** (apps/web/src/components/ui/dialog.tsx)

   - Implementeret med Radix UI (@radix-ui/react-dialog)

6. **Input** (apps/web/src/components/ui/input.tsx)

   - Custom implementering med Tailwind CSS

7. **Label** (apps/web/src/components/ui/label.tsx)

   - Implementeret med Radix UI (@radix-ui/react-label)

8. **Select** (apps/web/src/components/ui/select.tsx)

   - Implementeret med Radix UI (@radix-ui/react-select)

9. **Separator** (apps/web/src/components/ui/separator.tsx)

   - Implementeret med Tailwind CSS

10. **Table** (apps/web/src/components/ui/table.tsx)

    - Custom implementering med Tailwind CSS

11. **Tabs** (apps/web/src/components/ui/tabs.tsx)

    - Implementeret med Radix UI (@radix-ui/react-tabs)

12. **Textarea** (apps/web/src/components/ui/textarea.tsx)
    - Custom implementering med Tailwind CSS

### Material UI (MUI) komponenter i brug

Baseret på package.json, er MUI v7.1.0 allerede installeret, men det er ikke klart, hvilke komponenter der bruges direkte. Ifølge konsolideringsplanen bruges:

- Box
- Typography
- LinearProgress
- Ikoner fra @mui/icons-material

## Prioritering af komponenter til migrering

### Høj prioritet (Fase 2 - Kernekomponenter)

1. Button (duplikation mellem UI-pakken og web-appen)
2. Input/TextField
3. Checkbox
4. Select

### Medium prioritet (Fase 3 - Layout og Navigation)

1. Dialog/Modal
2. Tabs
3. Card
4. Layout-komponenter

### Lav prioritet (Fase 4 og 5)

1. Table
2. Notification/Alert
3. Progress/Loading
4. Ikoner
5. Badge
6. Separator
7. Textarea

## Migreringsstrategi

For hver komponent:

1. Opret en MUI-baseret version i packages/ui
2. Bevar samme API hvor muligt for at minimere ændringer i eksisterende kode
3. Tilføj unit tests
4. Opdater dokumentation
5. Fjern den gamle komponent, når den nye er fuldt implementeret og testet
