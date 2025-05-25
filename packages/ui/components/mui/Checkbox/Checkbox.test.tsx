// packages/ui/components/mui/Checkbox/Checkbox.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '../test-utils';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  // Basic rendering tests
  it('renders correctly without label', () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByLabelText(/accept terms/i)).toBeInTheDocument();
  });

  it('is checked when defaultChecked is true', () => {
    render(<Checkbox defaultChecked label="Checked by default" />);
    expect(screen.getByLabelText(/checked by default/i)).toBeChecked();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Checkbox disabled label="Disabled checkbox" />);
    expect(screen.getByLabelText(/disabled checkbox/i)).toBeDisabled();
  });

  it('calls onChange when clicked', () => {
    const handleChange = jest.fn();
    render(<Checkbox onChange={handleChange} label="Clickable checkbox" />);
    fireEvent.click(screen.getByLabelText(/clickable checkbox/i));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders with label placement start', () => {
    render(<Checkbox label="Left label" labelPlacement="start" />);
    const checkbox = screen.getByLabelText(/left label/i);
    expect(checkbox).toBeInTheDocument();
  });

  // New functionality tests
  it('renders with helper text', () => {
    render(
      <Checkbox 
        label="Terms and conditions" 
        helperText="Please read the terms carefully" 
      />
    );
    expect(screen.getByText(/please read the terms carefully/i)).toBeInTheDocument();
  });

  it('renders in error state', () => {
    render(
      <Checkbox 
        label="Required checkbox" 
        error 
        helperText="This field is required" 
      />
    );
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
  });

  it('renders as required', () => {
    render(<Checkbox label="Required field" required />);
    // In MUI, required adds an asterisk to the label
    const formControl = screen.getByRole('checkbox').closest('div[class*="MuiFormControl-root"]');
    expect(formControl).toHaveClass('MuiFormControl-required');
  });

  it('applies custom className to the checkbox', () => {
    render(<Checkbox className="custom-checkbox" />);
    expect(screen.getByRole('checkbox')).toHaveClass('custom-checkbox');
  });

  it('applies labelClassName to the label', () => {
    render(
      <Checkbox 
        label="Custom label" 
        labelClassName="custom-label" 
      />
    );
    const label = screen.getByLabelText(/custom label/i).closest('label');
    expect(label).toHaveClass('custom-label');
  });

  it('applies formControlClassName to the FormControl', () => {
    render(
      <Checkbox 
        label="Form control" 
        formControlClassName="custom-form-control" 
      />
    );
    const formControl = screen.getByRole('checkbox').closest('div[class*="MuiFormControl-root"]');
    expect(formControl).toHaveClass('custom-form-control');
  });

  it('renders with different colors', () => {
    const { rerender } = render(<Checkbox color="primary" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    
    rerender(<Checkbox color="secondary" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    
    rerender(<Checkbox color="error" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Checkbox size="medium" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    
    rerender(<Checkbox size="small" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});