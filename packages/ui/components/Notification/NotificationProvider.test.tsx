import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { NotificationProvider, useNotification } from './NotificationProvider';

// Test component that uses the notification hook
const TestComponent = () => {
  const { showNotification, hideNotification, clearAllNotifications } = useNotification();

  return (
    <div>
      <button
        onClick={() => showNotification({
          type: 'success',
          title: 'Success Notification',
          message: 'This is a success message',
        })}
        data-testid="show-success"
      >
        Show Success
      </button>
      <button
        onClick={() => showNotification({
          type: 'error',
          title: 'Error Notification',
          message: 'This is an error message',
        })}
        data-testid="show-error"
      >
        Show Error
      </button>
      <button
        onClick={() => {
          const id = showNotification({
            type: 'info',
            title: 'Info Notification',
          });
          setTimeout(() => hideNotification(id), 100);
        }}
        data-testid="show-and-hide"
      >
        Show and Hide
      </button>
      <button
        onClick={clearAllNotifications}
        data-testid="clear-all"
      >
        Clear All
      </button>
    </div>
  );
};

describe('NotificationProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders children correctly', () => {
    render(
      <NotificationProvider>
        <div data-testid="test-child">Test Child</div>
      </NotificationProvider>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('shows notifications when showNotification is called', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const showSuccessButton = screen.getByTestId('show-success');
    act(() => {
      showSuccessButton.click();
    });

    expect(screen.getByText('Success Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a success message')).toBeInTheDocument();
  });

  it('can show multiple notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const showSuccessButton = screen.getByTestId('show-success');
    const showErrorButton = screen.getByTestId('show-error');

    act(() => {
      showSuccessButton.click();
      showErrorButton.click();
    });

    expect(screen.getByText('Success Notification')).toBeInTheDocument();
    expect(screen.getByText('Error Notification')).toBeInTheDocument();
  });

  it('removes notifications when clearAllNotifications is called', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const showSuccessButton = screen.getByTestId('show-success');
    const clearAllButton = screen.getByTestId('clear-all');

    act(() => {
      showSuccessButton.click();
    });

    expect(screen.getByText('Success Notification')).toBeInTheDocument();

    act(() => {
      clearAllButton.click();
    });

    expect(screen.queryByText('Success Notification')).not.toBeInTheDocument();
  });

  it('respects the maxNotifications limit', () => {
    render(
      <NotificationProvider maxNotifications={2}>
        <TestComponent />
      </NotificationProvider>
    );

    const showSuccessButton = screen.getByTestId('show-success');
    const showErrorButton = screen.getByTestId('show-error');

    // Show 3 notifications (exceeding the limit of 2)
    act(() => {
      showSuccessButton.click();
      showSuccessButton.click();
      showErrorButton.click();
    });

    // The oldest notification should be removed
    expect(screen.queryAllByText('Success Notification').length).toBe(1);
    expect(screen.getByText('Error Notification')).toBeInTheDocument();
  });
});