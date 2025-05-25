# Checkbox Component

The Checkbox component is a form control that allows users to select one or more options from a set. It's based on Material UI's Checkbox component but enhanced to support all features from the legacy Checkbox component.

## Usage

```tsx
import { Checkbox } from '@learninglab/ui';

// Basic usage
<Checkbox />

// With label
<Checkbox label="Accept terms and conditions" />

// Checked state
<Checkbox defaultChecked label="Remember me" />

// With helper text
<Checkbox 
  label="Subscribe to newsletter" 
  helperText="You can unsubscribe at any time" 
/>

// Error state
<Checkbox 
  label="I agree to the terms" 
  error 
  helperText="You must agree to the terms to continue" 
/>

// Required
<Checkbox label="Required field" required />

// Disabled
<Checkbox label="Disabled option" disabled />

// Different label placements
<Checkbox label="End label (default)" labelPlacement="end" />
<Checkbox label="Start label" labelPlacement="start" />
<Checkbox label="Top label" labelPlacement="top" />
<Checkbox label="Bottom label" labelPlacement="bottom" />

// Different colors
<Checkbox label="Primary (default)" color="primary" />
<Checkbox label="Secondary" color="secondary" />
<Checkbox label="Error" color="error" />
<Checkbox label="Warning" color="warning" />
<Checkbox label="Info" color="info" />
<Checkbox label="Success" color="success" />

// Different sizes
<Checkbox label="Medium (default)" size="medium" />
<Checkbox label="Small" size="small" />

// With custom classes
<Checkbox 
  label="Custom styling" 
  className="custom-checkbox"
  labelClassName="custom-label"
  formControlClassName="custom-form-control"
/>

// Controlled component
const [checked, setChecked] = useState(false);
<Checkbox 
  label="Controlled checkbox" 
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `'primary' \| 'secondary' \| 'error' \| 'info' \| 'success' \| 'warning' \| 'default'` | `'primary'` | The color of the checkbox |
| `size` | `'small' \| 'medium'` | `'medium'` | The size of the checkbox |
| `label` | `ReactNode` | `undefined` | The label for the checkbox |
| `labelPlacement` | `'end' \| 'start' \| 'top' \| 'bottom'` | `'end'` | The placement of the label |
| `helperText` | `ReactNode` | `undefined` | Helper text to display below the checkbox |
| `error` | `boolean` | `false` | If `true`, the checkbox will be displayed in an error state |
| `required` | `boolean` | `false` | If `true`, the checkbox will be marked as required |
| `className` | `string` | `undefined` | CSS class applied to the checkbox |
| `labelClassName` | `string` | `undefined` | CSS class applied to the label |
| `formControlClassName` | `string` | `undefined` | CSS class applied to the form control wrapper |
| `checked` | `boolean` | `undefined` | If `true`, the checkbox will be checked |
| `defaultChecked` | `boolean` | `undefined` | If `true`, the checkbox will be checked by default |
| `disabled` | `boolean` | `false` | If `true`, the checkbox will be disabled |
| `onChange` | `(event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void` | `undefined` | Callback fired when the state is changed |

Plus all other props from Material UI's Checkbox component.

## Migration Guide

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