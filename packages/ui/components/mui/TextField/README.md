# TextField Component

The TextField component is a versatile input component for collecting user input. It's based on Material UI's TextField component but enhanced to support all features from the legacy Input component.

## Usage

```tsx
import { TextField } from '@learninglab/ui';

// Basic usage
<TextField label="Username" />

// With placeholder
<TextField placeholder="Enter your username" />

// With helper text
<TextField 
  label="Email" 
  helperText="We'll never share your email with anyone else" 
/>

// With error state
<TextField 
  label="Password" 
  type="password" 
  error 
  helperText="Password is required" 
/>

// With icons
<TextField 
  label="Search" 
  startIcon={<SearchIcon />} 
  endIcon={<ClearIcon />}
  onEndIconClick={() => setValue('')}
/>

// With loading state
<TextField label="Loading" isLoading />

// With maximum length
<TextField label="Tweet" maxLength={280} />

// Different variants
<TextField label="Outlined" variant="outlined" />
<TextField label="Filled" variant="filled" />
<TextField label="Standard" variant="standard" />

// Different sizes
<TextField label="Medium" size="medium" />
<TextField label="Small" size="small" />

// Full width
<TextField label="Full Width" fullWidth />

// Disabled
<TextField label="Disabled" disabled />

// Required
<TextField label="Required" required />

// With different input types
<TextField label="Password" type="password" />
<TextField label="Number" type="number" />
<TextField label="Date" type="date" />
<TextField label="Time" type="time" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'outlined' \| 'filled' \| 'standard'` | `'outlined'` | The variant of the text field |
| `fullWidth` | `boolean` | `true` | If `true`, the text field will take up the full width of its container |
| `size` | `'small' \| 'medium'` | `'medium'` | The size of the text field |
| `error` | `boolean` | `false` | If `true`, the text field will be displayed in an error state |
| `helperText` | `ReactNode` | `undefined` | Helper text to display below the text field |
| `startIcon` | `ReactNode` | `undefined` | Icon to display at the start of the text field |
| `endIcon` | `ReactNode` | `undefined` | Icon to display at the end of the text field |
| `onStartIconClick` | `() => void` | `undefined` | Callback when the start icon is clicked |
| `onEndIconClick` | `() => void` | `undefined` | Callback when the end icon is clicked |
| `isLoading` | `boolean` | `false` | If `true`, the text field will show a loading spinner and be disabled |
| `maxLength` | `number` | `undefined` | Maximum number of characters allowed |
| `label` | `string` | `undefined` | The label for the text field |
| `placeholder` | `string` | `undefined` | The placeholder text |
| `disabled` | `boolean` | `false` | If `true`, the text field will be disabled |
| `required` | `boolean` | `false` | If `true`, the text field will be marked as required |
| `type` | `string` | `'text'` | The type of the input element |

Plus all other props from Material UI's TextField component.

## Migration Guide

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