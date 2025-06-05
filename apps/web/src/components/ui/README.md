# UI Components

⚠️ **DEPRECATED LOCATION**

This directory is deprecated. All UI components have been moved to the shared package location.

## Current Location

All UI components are now located in:

```
packages/ui/components/
```

## Available Components

The following components are available in `packages/ui/components/`:

- **Button** - Primary and secondary button variants
- **Card** - Container component with header, content, and footer
- **Badge** - Status and label indicators
- **Input** - Form input fields
- **Label** - Form labels
- **Textarea** - Multi-line text input
- **Select** - Dropdown selection component
- **Checkbox** - Boolean input component
- **Dialog** - Modal dialog component
- **Table** - Data table component
- **Tabs** - Tab navigation component
- **Separator** - Visual divider component
- **Progress** - Progress indicator component

## Usage

Import components from the shared package:

```typescript
import { Button } from "@/packages/ui/components/Button";
import { Card, CardContent, CardHeader } from "@/packages/ui/components/Card";
```

## Migration

If you're still importing from this location, please update your imports to use the shared package location in `packages/ui/components/`.

## Theme

UI components use the shared theme system located in `packages/ui/theme/`.
