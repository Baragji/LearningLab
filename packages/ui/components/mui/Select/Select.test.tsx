// packages/ui/components/mui/Select/Select.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '../test-utils';
import { Select } from './Select';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
];

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

describe('Select', () => {
  // Basic rendering tests
  it('renders correctly with label', () => {
    render(<Select label="Test Select" options={options} />);
    expect(screen.getByLabelText(/test select/i)).toBeInTheDocument();
  });

  it('renders with helper text', () => {
    render(<Select label="Test Select" helperText="This is a helper text" options={options} />);
    expect(screen.getByText(/this is a helper text/i)).toBeInTheDocument();
  });

  it('renders in error state', () => {
    render(
      <Select 
        error 
        helperText="This field is required" 
        label="Required Field" 
        options={options}
      />
    );
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Select disabled label="Disabled Select" options={options} />);
    expect(screen.getByLabelText(/disabled select/i)).toBeDisabled();
  });

  // New functionality tests
  it('is disabled when isLoading is true', () => {
    render(<Select isLoading label="Loading Select" options={options} />);
    expect(screen.getByLabelText(/loading select/i)).toBeDisabled();
  });

  it('renders with placeholder', () => {
    render(<Select label="Select with Placeholder" placeholder="Choose an option" options={options} />);
    const select = screen.getByLabelText(/select with placeholder/i);
    fireEvent.mouseDown(select);
    expect(screen.getByText(/choose an option/i)).toBeInTheDocument();
  });

  it('renders with required attribute', () => {
    render(<Select label="Required Select" required options={options} />);
    const formControl = screen.getByLabelText(/required select/i).closest('div[class*="MuiFormControl-root"]');
    expect(formControl).toHaveClass('MuiFormControl-required');
  });

  it('renders with custom formControlClassName', () => {
    render(
      <Select 
        label="Custom Form Control" 
        formControlClassName="custom-form-control" 
        options={options} 
      />
    );
    const formControl = screen.getByLabelText(/custom form control/i).closest('div[class*="MuiFormControl-root"]');
    expect(formControl).toHaveClass('custom-form-control');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Select label="Outlined Select" variant="outlined" options={options} />);
    expect(screen.getByLabelText(/outlined select/i)).toBeInTheDocument();
    
    rerender(<Select label="Filled Select" variant="filled" options={options} />);
    expect(screen.getByLabelText(/filled select/i)).toBeInTheDocument();
    
    rerender(<Select label="Standard Select" variant="standard" options={options} />);
    expect(screen.getByLabelText(/standard select/i)).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Select label="Medium Select" size="medium" options={options} />);
    expect(screen.getByLabelText(/medium select/i)).toBeInTheDocument();
    
    rerender(<Select label="Small Select" size="small" options={options} />);
    expect(screen.getByLabelText(/small select/i)).toBeInTheDocument();
  });

  it('renders with grouped options', () => {
    render(<Select label="Grouped Select" groups={groups} />);
    const select = screen.getByLabelText(/grouped select/i);
    fireEvent.mouseDown(select);
    
    expect(screen.getByText(/group 1/i)).toBeInTheDocument();
    expect(screen.getByText(/group 1 - option 1/i)).toBeInTheDocument();
    expect(screen.getByText(/group 2/i)).toBeInTheDocument();
    expect(screen.getByText(/group 2 - option 1/i)).toBeInTheDocument();
  });

  it('renders as multiple select', () => {
    render(<Select label="Multiple Select" multiple options={options} />);
    expect(screen.getByLabelText(/multiple select/i)).toBeInTheDocument();
  });
});