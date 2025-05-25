// packages/ui/components/mui/Tabs/Tabs.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '../test-utils';
import { Tabs, TabPanel } from './Tabs';

describe('Tabs Component', () => {
  const tabItems = [
    { label: 'Tab 1', value: 'tab1' },
    { label: 'Tab 2', value: 'tab2' },
    { label: 'Tab 3', value: 'tab3', disabled: true }
  ];

  it('renders all tabs correctly', () => {
    render(
      <Tabs 
        items={tabItems} 
        value="tab1" 
        onChange={() => {}}
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('handles tab change correctly', () => {
    const handleChange = jest.fn();
    
    render(
      <Tabs 
        items={tabItems} 
        value="tab1" 
        onChange={handleChange}
      />
    );
    
    fireEvent.click(screen.getByText('Tab 2'));
    expect(handleChange).toHaveBeenCalledWith('tab2');
  });

  it('respects disabled state', () => {
    render(
      <Tabs 
        items={tabItems} 
        value="tab1" 
        onChange={() => {}}
      />
    );
    
    expect(screen.getByText('Tab 3').closest('button')).toBeDisabled();
  });

  it('renders tab panels correctly', () => {
    const { rerender } = render(
      <>
        <Tabs 
          items={tabItems} 
          value="tab1" 
          onChange={() => {}}
        />
        <TabPanel value="tab1" tabValue="tab1">Content 1</TabPanel>
        <TabPanel value="tab1" tabValue="tab2">Content 2</TabPanel>
      </>
    );
    
    expect(screen.getByText('Content 1')).toBeVisible();
    expect(screen.queryByText('Content 2')).not.toBeVisible();
    
    rerender(
      <>
        <Tabs 
          items={tabItems} 
          value="tab2" 
          onChange={() => {}}
        />
        <TabPanel value="tab2" tabValue="tab1">Content 1</TabPanel>
        <TabPanel value="tab2" tabValue="tab2">Content 2</TabPanel>
      </>
    );
    
    expect(screen.queryByText('Content 1')).not.toBeVisible();
    expect(screen.getByText('Content 2')).toBeVisible();
  });
});