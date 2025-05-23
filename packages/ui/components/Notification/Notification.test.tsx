import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Notification } from './Notification';

describe('Notification', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with the correct title and message', () => {
    render(
      <Notification
        type="info"
        title="Test Title"
        message="Test Message"
        data-testid="notification"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('applies the correct styles based on type', () => {
    const { rerender } = render(
      <Notification
        type="success"
        title="Success"
        data-testid="notification"
      />
    );

    let notification = screen.getByRole('alert');
    expect(notification).toHaveClass('border-green-500');
    expect(notification).toHaveClass('bg-green-50');

    rerender(
      <Notification
        type="error"
        title="Error"
        data-testid="notification"
      />
    );

    notification = screen.getByRole('alert');
    expect(notification).toHaveClass('border-red-500');
    expect(notification).toHaveClass('bg-red-50');

    rerender(
      <Notification
        type="warning"
        title="Warning"
        data-testid="notification"
      />
    );

    notification = screen.getByRole('alert');
    expect(notification).toHaveClass('border-yellow-500');
    expect(notification).toHaveClass('bg-yellow-50');

    rerender(
      <Notification
        type="info"
        title="Info"
        data-testid="notification"
      />
    );

    notification = screen.getByRole('alert');
    expect(notification).toHaveClass('border-blue-500');
    expect(notification).toHaveClass('bg-blue-50');
  });

  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = jest.fn();
    render(
      <Notification
        type="info"
        title="Test Title"
        onDismiss={onDismiss}
        data-testid="notification"
      />
    );

    const closeButton = screen.getByLabelText('Luk notifikation');
    fireEvent.click(closeButton);

    // Wait for the animation to complete
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after the specified duration', () => {
    const onDismiss = jest.fn();
    render(
      <Notification
        type="info"
        title="Test Title"
        duration={2000}
        onDismiss={onDismiss}
        data-testid="notification"
      />
    );

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Wait for the animation to complete
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not auto-dismiss if duration is Infinity', () => {
    const onDismiss = jest.fn();
    render(
      <Notification
        type="info"
        title="Test Title"
        duration={Infinity}
        onDismiss={onDismiss}
        data-testid="notification"
      />
    );

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });
});