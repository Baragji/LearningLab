# 🎨 UI KONSOLIDERING & KOMPONENT MIGRATION PLAN

## 📊 NUVÆRENDE UI SITUATION

### Duplikerede UI Systemer
1. **packages/ui/components/mui/** - MUI-baserede komponenter
2. **apps/web/src/components/ui/** - Shadcn/ui komponenter

### Problemanalyse
- **Inkonsistent design**: To forskellige design systemer
- **Duplikeret kode**: Samme funktionalitet implementeret to gange
- **Maintenance overhead**: Dobbelt vedligeholdelse
- **Bundle size**: Unødvendig stor bundle størrelse
- **Developer confusion**: Uklarhed om hvilke komponenter der skal bruges

## 🎯 KONSOLIDERINGSSTRATEGI

### Beslutning: MUI som Primært System
**Rationale:**
- Mere mature og stabil
- Bedre accessibility support
- Omfattende komponent bibliotek
- Stærk TypeScript support
- Aktiv community og support

### Migration Approach
1. **Audit og mapping** af eksisterende komponenter
2. **Merge funktionalitet** fra Shadcn til MUI komponenter
3. **Gradvis migration** af imports
4. **Testing** af alle komponenter
5. **Cleanup** af gamle filer

## 📋 KOMPONENT MAPPING

### Direkte Mappings
| Shadcn Component | MUI Component | Action |
|------------------|---------------|---------|
| `button.tsx` | `mui/Button/Button.tsx` | Merge styling options |
| `card.tsx` | `mui/Card/Card.tsx` | Merge variants |
| `dialog.tsx` | `mui/Dialog/Dialog.tsx` | Merge functionality |
| `input.tsx` | `mui/TextField/TextField.tsx` | Merge input types |
| `select.tsx` | `mui/Select/Select.tsx` | Merge options |
| `table.tsx` | `mui/Table/Table.tsx` | Merge table features |
| `tabs.tsx` | `mui/Tabs/Tabs.tsx` | Merge tab variants |
| `checkbox.tsx` | `mui/Checkbox/Checkbox.tsx` | Merge states |
| `progress.tsx` | `mui/Progress/Progress.tsx` | Merge progress types |

### Nye Komponenter (kun i Shadcn)
| Component | Action |
|-----------|---------|
| `alert.tsx` | Migrate til `mui/Alert/` |
| `badge.tsx` | Create new `mui/Badge/` |
| `label.tsx` | Integrate med TextField |
| `separator.tsx` | Create new `mui/Divider/` |
| `textarea.tsx` | Extend TextField component |

### Specielle Komponenter
| Component | Action |
|-----------|---------|
| `AppButton.tsx` | Merge med MUI Button |

## 🔧 DETALJERET MIGRATION PLAN

### Fase 1: Audit og Forberedelse (Dag 1)

#### 1.1 Komponent Inventory
```bash
# Generer komponent liste
find apps/web/src/components/ui -name "*.tsx" -exec basename {} \; > shadcn-components.txt
find packages/ui/components/mui -name "*.tsx" -exec basename {} \; > mui-components.txt
```

#### 1.2 Usage Analysis
```bash
# Find alle imports af UI komponenter
grep -r "from.*components/ui" apps/web/src/ > ui-imports.txt
grep -r "from.*@repo/ui" apps/web/src/ > mui-imports.txt
```

### Fase 2: Komponent Enhancement (Dag 2-3)

#### 2.1 Button Component Enhancement
```typescript
// packages/ui/components/mui/Button/Button.tsx
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { forwardRef } from 'react';

// Merge Shadcn variants med MUI
export interface ButtonProps extends MuiButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', ...props }, ref) => {
    // Mapping logic mellem Shadcn og MUI variants
    const muiVariant = mapShadcnToMuiVariant(variant);
    const muiSize = mapShadcnToMuiSize(size);
    
    return (
      <MuiButton
        ref={ref}
        variant={muiVariant}
        size={muiSize}
        {...props}
      />
    );
  }
);
```

#### 2.2 Card Component Enhancement
```typescript
// packages/ui/components/mui/Card/Card.tsx
import { Card as MuiCard, CardContent, CardHeader, CardActions } from '@mui/material';

// Merge Shadcn Card struktur med MUI
export const Card = ({ children, ...props }) => (
  <MuiCard {...props}>{children}</MuiCard>
);

export const CardHeader = ({ children, ...props }) => (
  <CardHeader {...props}>{children}</CardHeader>
);

export const CardContent = ({ children, ...props }) => (
  <CardContent {...props}>{children}</CardContent>
);

export const CardFooter = ({ children, ...props }) => (
  <CardActions {...props}>{children}</CardActions>
);
```

### Fase 3: Nye Komponenter (Dag 4)

#### 3.1 Badge Component
```typescript
// packages/ui/components/mui/Badge/Badge.tsx
import { Chip, ChipProps } from '@mui/material';

export interface BadgeProps extends Omit<ChipProps, 'variant'> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export const Badge = ({ variant = 'default', ...props }: BadgeProps) => {
  const muiVariant = mapBadgeVariant(variant);
  return <Chip variant={muiVariant} {...props} />;
};
```

#### 3.2 Separator Component
```typescript
// packages/ui/components/mui/Separator/Separator.tsx
import { Divider, DividerProps } from '@mui/material';

export interface SeparatorProps extends DividerProps {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator = ({ orientation = 'horizontal', ...props }: SeparatorProps) => (
  <Divider orientation={orientation} {...props} />
);
```

### Fase 4: Import Migration (Dag 5-6)

#### 4.1 Automated Import Replacement
```bash
# Script til at erstatte imports
#!/bin/bash

# Erstat Shadcn imports med MUI imports
find apps/web/src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e 's|from "../../components/ui/button"|from "@repo/ui/Button"|g' \
  -e 's|from "../../components/ui/card"|from "@repo/ui/Card"|g' \
  -e 's|from "../../components/ui/dialog"|from "@repo/ui/Dialog"|g'
```

#### 4.2 Manual Migration Checklist
- [ ] Button imports
- [ ] Card imports  
- [ ] Dialog imports
- [ ] Input/TextField imports
- [ ] Select imports
- [ ] Table imports
- [ ] Tabs imports
- [ ] Checkbox imports
- [ ] Progress imports
- [ ] Alert imports
- [ ] Badge imports
- [ ] Separator imports

### Fase 5: Testing & Validation (Dag 7)

#### 5.1 Component Testing
```bash
# Test alle UI komponenter
yarn workspace ui test
yarn workspace web test
```

#### 5.2 Visual Regression Testing
```bash
# Storybook visual tests
yarn storybook:build
yarn test:visual
```

#### 5.3 E2E Testing
```bash
# Playwright tests
yarn test:e2e
```

### Fase 6: Cleanup (Dag 8)

#### 6.1 Remove Shadcn Components
```bash
# Fjern gamle Shadcn komponenter
rm -rf apps/web/src/components/ui/
```

#### 6.2 Update Package Dependencies
```json
// apps/web/package.json - Fjern Shadcn dependencies
{
  "dependencies": {
    // Fjern disse:
    // "@radix-ui/react-*": "...",
    // "class-variance-authority": "...",
    // "clsx": "...",
    // "tailwind-merge": "..."
  }
}
```

## 📁 NY UI STRUKTUR

### Packages/UI Organisation
```
packages/ui/
├── components/
│   ├── base/              # Grundlæggende komponenter
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── ...
│   ├── composite/         # Sammensatte komponenter
│   │   ├── DataTable/
│   │   ├── FormField/
│   │   └── ...
│   ├── layout/           # Layout komponenter
│   │   ├── Container/
│   │   ├── Grid/
│   │   └── ...
│   └── feedback/         # Feedback komponenter
│       ├── Alert/
│       ├── Toast/
│       └── ...
├── hooks/                # Delte UI hooks
├── utils/                # UI utilities
├── theme/                # MUI theme
└── types/                # TypeScript types
```

### Export Strategy
```typescript
// packages/ui/index.tsx
export * from './components/base';
export * from './components/composite';
export * from './components/layout';
export * from './components/feedback';
export * from './hooks';
export * from './utils';
export { theme } from './theme';
```

## 🧪 TESTING STRATEGI

### Unit Tests
```typescript
// Eksempel test struktur
describe('Button Component', () => {
  it('renders with Shadcn variant mapping', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('MuiButton-colorError');
  });
});
```

### Integration Tests
```typescript
// Test komponent integration
describe('Form Components Integration', () => {
  it('works together in a form', () => {
    render(
      <form>
        <TextField label="Name" />
        <Select options={[]} />
        <Button type="submit">Submit</Button>
      </form>
    );
  });
});
```

### Visual Tests
```typescript
// Storybook stories for visual testing
export default {
  title: 'Components/Button',
  component: Button,
} as Meta;

export const AllVariants = () => (
  <div>
    <Button variant="default">Default</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="outline">Outline</Button>
  </div>
);
```

## 📋 IMPLEMENTATION CHECKLIST

### Pre-Migration
- [ ] Backup nuværende UI komponenter
- [ ] Dokumenter nuværende usage patterns
- [ ] Setup visual regression testing
- [ ] Create component inventory

### Phase 1: Enhancement
- [ ] Enhance Button component
- [ ] Enhance Card component
- [ ] Enhance Dialog component
- [ ] Enhance TextField component
- [ ] Enhance Select component
- [ ] Enhance Table component
- [ ] Enhance Tabs component
- [ ] Enhance Checkbox component
- [ ] Enhance Progress component

### Phase 2: New Components
- [ ] Create Badge component
- [ ] Create Separator component
- [ ] Create enhanced Alert component
- [ ] Create Textarea component

### Phase 3: Migration
- [ ] Update all Button imports
- [ ] Update all Card imports
- [ ] Update all Dialog imports
- [ ] Update all form component imports
- [ ] Update all layout component imports
- [ ] Update all feedback component imports

### Phase 4: Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Visual regression tests pass
- [ ] E2E tests pass
- [ ] Performance benchmarks

### Phase 5: Cleanup
- [ ] Remove Shadcn components
- [ ] Remove unused dependencies
- [ ] Update documentation
- [ ] Update Storybook

## 🚀 SUCCESS METRICS

### Technical
- [ ] Single UI system
- [ ] 100% component test coverage
- [ ] 0 visual regressions
- [ ] Bundle size reduction 15%+
- [ ] Build time improvement

### User Experience
- [ ] Consistent design language
- [ ] Improved accessibility scores
- [ ] Better performance metrics
- [ ] Responsive design maintained

### Developer Experience
- [ ] Clear component API
- [ ] Comprehensive documentation
- [ ] Easy to use and extend
- [ ] TypeScript support 100%

---

*Denne plan sikrer en systematisk og sikker konsolidering af UI komponenter med minimal disruption.*