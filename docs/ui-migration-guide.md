# UI Component Migration Guide

This guide provides instructions for migrating from the existing UI components to the new MUI-based components.

## Overview

As part of our UI consolidation effort, we are replacing the existing UI components with new MUI-based components. The new components provide a consistent look and feel, better accessibility, and more features.

The migration process involves:

1. Identifying where the old components are used
2. Replacing them with the new MUI components
3. Testing to ensure functionality is preserved

## Button Component

### From packages/ui Button

```tsx
// Before
import { Button } from '@learninglab/ui';

<Button variant="default" size="default" fullWidth isLoading>
  Loading...
</Button>

// After
import { Button } from '@learninglab/ui';

<Button variant="default" size="default" fullWidth isLoading>
  Loading...
</Button>
```

The API is fully compatible, so no changes are needed. The component is now using MUI under the hood.

### From apps/web AppButton

```tsx
// Before
import { AppButton } from '@/components/ui/AppButton';

<AppButton variant="default" size="default" asChild>
  <a href="https://example.com">Link</a>
</AppButton>

// After
import { Button } from '@learninglab/ui';

<Button variant="default" size="default" asChild>
  <a href="https://example.com">Link</a>
</Button>
```

Simply replace `AppButton` with `Button` from the UI package.

## TextField Component

### From apps/web Input

```tsx
// Before
import { Input } from '@/components/ui/input';

<Input 
  type="text" 
  className="custom-class" 
  placeholder="Enter text" 
/>

// After
import { TextField } from '@learninglab/ui';

<TextField 
  type="text" 
  className="custom-class" 
  placeholder="Enter text" 
  variant="outlined"
  fullWidth
/>
```

The main differences are:
1. The component name changes from `Input` to `TextField`
2. The new component has built-in label support
3. The new component has built-in helper text support
4. The new component has built-in error state support
5. The new component has built-in icon support
6. The new component has built-in loading state support
7. The new component has built-in maximum length support

## Checkbox Component

### From apps/web Checkbox

```tsx
// Before
import { Checkbox } from '@/components/ui/checkbox';

<Checkbox 
  className="custom-class" 
  checked={isChecked}
  onCheckedChange={setIsChecked}
/>

// After
import { Checkbox } from '@learninglab/ui';

<Checkbox 
  className="custom-class" 
  checked={isChecked}
  onChange={(e) => setIsChecked(e.target.checked)}
/>
```

The main differences are:
1. The component is now based on Material UI instead of Radix UI
2. `onCheckedChange` is replaced with `onChange`
3. The new component has built-in label support
4. The new component has built-in helper text support
5. The new component has built-in error state support

## Select Component

### From apps/web Select

```tsx
// Before
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select onValueChange={setValue} defaultValue={value}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>

// After
import { Select } from '@learninglab/ui';

<Select 
  onChange={(e) => setValue(e.target.value)} 
  defaultValue={value}
  placeholder="Select an option"
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]}
/>
```

The main differences are:
1. The component is now based on Material UI instead of Radix UI
2. The component structure is simplified - no need for separate trigger, content, and item components
3. Options are passed as an array instead of as children
4. `onValueChange` is replaced with `onChange`
5. The new component has built-in label support
6. The new component has built-in helper text support
7. The new component has built-in error state support
8. The new component has built-in loading state support
9. The new component has built-in option grouping support

## Migration Strategy

We recommend the following approach for migrating to the new components:

1. **Start with isolated components**: Begin by migrating components that are used in isolation, rather than those that are part of complex forms or layouts.

2. **Use a feature branch**: Create a feature branch for each component migration to isolate changes.

3. **Test thoroughly**: After migrating each component, test thoroughly to ensure functionality is preserved.

4. **Update one component type at a time**: For example, migrate all Button components before moving on to TextField components.

5. **Use search tools**: Use search tools to find all instances of the old components in the codebase.

6. **Update imports first**: Update all imports before changing the component usage.

7. **Run tests after each change**: Run tests after each change to catch any issues early.

## Common Issues and Solutions

### Styling Differences

The new MUI components may have slightly different styling compared to the old components. You may need to adjust styles to match the previous appearance.

### Form Integration

The new components use different event handlers for form integration. Make sure to update form handlers accordingly.

### Controlled vs Uncontrolled Components

The new components support both controlled and uncontrolled modes. Make sure to maintain the same mode when migrating.

## Getting Help

If you encounter any issues during migration, please reach out to the UI team for assistance.