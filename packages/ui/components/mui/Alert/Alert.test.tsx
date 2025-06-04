import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders with default props', () => {
    render(<Alert>Test message</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders with different severities', () => {
    const { rerender } = render(<Alert severity="error">Error message</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-standardError');

    rerender(<Alert severity="warning">Warning message</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-standardWarning');

    rerender(<Alert severity="info">Info message</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-standardInfo');

    rerender(<Alert severity="success">Success message</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-standardSuccess');
  });

  it('renders with title', () => {
    render(<Alert title="Alert Title">Alert content</Alert>);
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Alert content')).toBeInTheDocument();
  });

  it('renders close button when closable', () => {
    render(<Alert closable>Closable alert</Alert>);
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <Alert closable onClose={onClose}>
        Closable alert
      </Alert>
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides when open is false', () => {
    render(<Alert open={false}>Hidden alert</Alert>);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Alert variant="filled">Filled alert</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-filled');

    rerender(<Alert variant="outlined">Outlined alert</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-outlined');
  });

  it('hides icon when showIcon is false', () => {
    render(<Alert showIcon={false}>No icon alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert.querySelector('.MuiAlert-icon')).not.toBeInTheDocument();
  });
});