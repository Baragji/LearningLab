// packages/ui/components/mui/Select/Select.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '../test-utils';
import { Select } from './Select';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select', () => {
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
});