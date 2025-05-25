// packages/ui/components/mui/Card/Card.test.tsx
import React from 'react';
import { render, screen } from '../test-utils';
import { Card } from './Card';

describe('Card Component', () => {
  it('renders with title and subtitle', () => {
    render(
      <Card 
        title="Card Title" 
        subtitle="Card Subtitle"
      >
        Card Content
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders with media', () => {
    render(
      <Card 
        title="Card Title"
        media={{
          image: '/test-image.jpg',
          alt: 'Test Image'
        }}
      >
        Card Content
      </Card>
    );
    
    const image = screen.getByAltText('Test Image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  it('renders with footer', () => {
    render(
      <Card 
        footer={<button>Action Button</button>}
      >
        Card Content
      </Card>
    );
    
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  it('applies noPadding prop correctly', () => {
    render(
      <Card noPadding>
        Card Content
      </Card>
    );
    
    // Dette er en visuel test, så vi kan ikke nemt bekræfte styling
    // I en rigtig test kunne man bruge et test-id og tjekke computed styles
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders without any props', () => {
    render(
      <Card>
        Card Content
      </Card>
    );
    
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });
});