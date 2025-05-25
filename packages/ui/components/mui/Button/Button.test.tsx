// packages/ui/components/mui/Button/Button.test.tsx
import React from 'react';
import { render, screen } from '../test-utils';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByRole('button', { name: /test button/i })).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<Button isLoading>Test Button</Button>);
    expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Test Button</Button>);
    expect(screen.getByRole('button', { name: /test button/i })).toBeDisabled();
  });

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Test Button</Button>);
    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
  });

  it('renders with custom loading text', () => {
    render(<Button isLoading loadingText="Please wait...">Test Button</Button>);
    expect(screen.getByRole('button', { name: /please wait/i })).toBeInTheDocument();
  });
});