// packages/ui/components/mui/Dialog/__tests__/Dialog.test.tsx
import React from "react";
import { render, screen, fireEvent } from "../test-utils";
import { Dialog } from "./Dialog";

describe("Dialog Component", () => {
  it("renders with title and description", () => {
    render(
      <Dialog open={true} title="Test Title" description="Test Description" />,
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders with custom buttons", () => {
    const handleConfirm = jest.fn();
    const handleClose = jest.fn();

    render(
      <Dialog
        open={true}
        confirmButton
        confirmText="Custom Confirm"
        cancelText="Custom Cancel"
        onConfirm={handleConfirm}
        onClose={handleClose}
      />,
    );

    expect(screen.getByText("Custom Confirm")).toBeInTheDocument();
    expect(screen.getByText("Custom Cancel")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Custom Confirm"));
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Custom Cancel"));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders with custom footer", () => {
    render(<Dialog open={true} footer={<button>Custom Footer</button>} />);

    expect(screen.getByText("Custom Footer")).toBeInTheDocument();
  });

  it("renders children correctly", () => {
    render(
      <Dialog open={true}>
        <div>Dialog Content</div>
      </Dialog>,
    );

    expect(screen.getByText("Dialog Content")).toBeInTheDocument();
  });
});
