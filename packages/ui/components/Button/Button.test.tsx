import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button />);
    
    // Check if the button is in the document
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toBeInTheDocument();
    
    // Check if the button has the correct text
    expect(buttonElement).toHaveTextContent('boo');
    
    // Check if the button has the correct classes for default props
    expect(buttonElement).toHaveClass('bg-red-500');
    expect(buttonElement).toHaveClass('text-sm'); // medium size
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} />);
    
    const buttonElement = screen.getByRole('button');
    await userEvent.click(buttonElement);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveTextContent('Click Me');
  });

  it('applies the correct classes for different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    
    let buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveClass('bg-primary-500');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveClass('bg-gray-200');
    
    rerender(<Button variant="destructive">Destructive</Button>);
    buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveClass('bg-red-500');
  });

  it('applies the correct classes for different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    
    let buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveClass('h-9');
    
    rerender(<Button size="default">Medium</Button>);
    buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveClass('h-10');
    
    rerender(<Button size="lg">Large</Button>);
    buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveClass('h-11');
  });

  it('applies disabled styles when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toBeDisabled();
    expect(buttonElement).toHaveClass('opacity-50');
    expect(buttonElement).toHaveClass('cursor-not-allowed');
  });

  it('applies additional className when provided', () => {
    render(<Button className="custom-class">Custom Class</Button>);
    
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveClass('custom-class');
  });

  it('sets the correct button type', () => {
    const { rerender } = render(<Button type="button">Button</Button>);
    
    let buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveAttribute('type', 'button');
    
    rerender(<Button type="submit">Submit</Button>);
    buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveAttribute('type', 'submit');
    
    rerender(<Button type="reset">Reset</Button>);
    buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveAttribute('type', 'reset');
  });
});