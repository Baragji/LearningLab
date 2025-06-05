# Select Component

The Select component is a form control that allows users to select one or more options from a dropdown menu. It's based on Material UI's Select component but enhanced to support all features from the legacy Select component.

## Usage

```tsx
import { Select } from '@learninglab/ui';

// Basic usage with options array
const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
];

<Select
  label="Basic Select"
  options={options}
/>

// With placeholder
<Select
  label="Select with Placeholder"
  placeholder="Choose an option"
  options={options}
/>

// With helper text
<Select
  label="Select with Helper Text"
  helperText="Please select an option"
  options={options}
/>

// Error state
<Select
  label="Required Selection"
  error
  helperText="This field is required"
  options={options}
/>

// Disabled
<Select
  label="Disabled Select"
  disabled
  options={options}
/>

// Loading state
<Select
  label="Loading Select"
  isLoading
  options={options}
/>

// With start icon
<Select
  label="Select with Icon"
  startIcon={<SearchIcon />}
  options={options}
/>

// Required
<Select
  label="Required Select"
  required
  options={options}
/>

// Multiple selection
<Select
  label="Multiple Select"
  multiple
  options={options}
/>

// With option groups
const groups = [
  {
    label: 'Group 1',
    options: [
      { value: 'group1-option1', label: 'Group 1 - Option 1' },
      { value: 'group1-option2', label: 'Group 1 - Option 2' },
    ]
  },
  {
    label: 'Group 2',
    options: [
      { value: 'group2-option1', label: 'Group 2 - Option 1' },
      { value: 'group2-option2', label: 'Group 2 - Option 2' },
    ]
  }
];

<Select
  label="Grouped Select"
  groups={groups}
/>

// With options that have icons
const optionsWithIcons = [
  { value: 'option1', label: 'Option 1', icon: <HomeIcon /> },
  { value: 'option2', label: 'Option 2', icon: <SettingsIcon /> },
  { value: 'option3', label: 'Option 3', icon: <PersonIcon /> },
];

<Select
  label="Select with Option Icons"
  options={optionsWithIcons}
/>

// Different variants
<Select label="Outlined Select" variant="outlined" options={options} />
<Select label="Filled Select" variant="filled" options={options} />
<Select label="Standard Select" variant="standard" options={options} />

// Different sizes
<Select label="Medium Select" size="medium" options={options} />
<Select label="Small Select" size="small" options={options} />

// Controlled component
const [value, setValue] = useState('');
<Select
  label="Controlled Select"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  options={options}
/>
```

## Props

| Prop                   | Type                                                   | Default      | Description                                                        |
| ---------------------- | ------------------------------------------------------ | ------------ | ------------------------------------------------------------------ |
| `variant`              | `'outlined' \| 'filled' \| 'standard'`                 | `'outlined'` | The variant of the select                                          |
| `fullWidth`            | `boolean`                                              | `true`       | If `true`, the select will take up the full width of its container |
| `size`                 | `'small' \| 'medium'`                                  | `'medium'`   | The size of the select                                             |
| `label`                | `string`                                               | `undefined`  | The label for the select                                           |
| `helperText`           | `ReactNode`                                            | `undefined`  | Helper text to display below the select                            |
| `error`                | `boolean`                                              | `false`      | If `true`, the select will be displayed in an error state          |
| `options`              | `SelectOption[]`                                       | `[]`         | Array of options for the select                                    |
| `groups`               | `SelectGroup[]`                                        | `[]`         | Array of option groups for the select                              |
| `placeholder`          | `string`                                               | `undefined`  | Placeholder text when no value is selected                         |
| `isLoading`            | `boolean`                                              | `false`      | If `true`, the select will show a loading spinner and be disabled  |
| `startIcon`            | `ReactNode`                                            | `undefined`  | Icon to display at the start of the select                         |
| `formControlClassName` | `string`                                               | `undefined`  | CSS class applied to the form control wrapper                      |
| `renderValue`          | `(selected: unknown) => ReactNode`                     | `undefined`  | Custom render function for the selected value                      |
| `required`             | `boolean`                                              | `false`      | If `true`, the select will be marked as required                   |
| `multiple`             | `boolean`                                              | `false`      | If `true`, the select will allow multiple selections               |
| `value`                | `string \| string[] \| number \| number[]`             | `undefined`  | The selected value(s)                                              |
| `onChange`             | `(event: React.ChangeEvent<HTMLInputElement>) => void` | `undefined`  | Callback fired when the value is changed                           |
| `disabled`             | `boolean`                                              | `false`      | If `true`, the select will be disabled                             |

### SelectOption

| Prop       | Type               | Description                            |
| ---------- | ------------------ | -------------------------------------- |
| `value`    | `string \| number` | The value of the option                |
| `label`    | `string`           | The label of the option                |
| `disabled` | `boolean`          | If `true`, the option will be disabled |
| `icon`     | `ReactNode`        | Icon to display with the option        |

### SelectGroup

| Prop      | Type             | Description                   |
| --------- | ---------------- | ----------------------------- |
| `label`   | `string`         | The label of the group        |
| `options` | `SelectOption[]` | Array of options in the group |

Plus all other props from Material UI's Select component.

## Migration Guide

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
</Select>;

// After
import { Select } from "@learninglab/ui";

<Select
  onChange={(e) => setValue(e.target.value)}
  defaultValue={value}
  placeholder="Select an option"
  options={[
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ]}
/>;
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
