// packages/ui/components/mui/TextField/TextField.test.tsx
import React from "react";
import { render, screen, fireEvent } from "../test-utils";
import { TextField } from "./TextField";

describe("TextField", () => {
  // Basic rendering tests
  it("renders correctly", () => {
    render(<TextField label="Test Input" />);
    expect(screen.getByLabelText(/test input/i)).toBeInTheDocument();
  });

  it("renders with placeholder", () => {
    render(<TextField placeholder="Enter text here" />);
    expect(screen.getByPlaceholderText(/enter text here/i)).toBeInTheDocument();
  });

  it("renders with helper text", () => {
    render(<TextField helperText="This is a helper text" />);
    expect(screen.getByText(/this is a helper text/i)).toBeInTheDocument();
  });

  it("renders in error state", () => {
    render(
      <TextField
        error
        helperText="This field is required"
        label="Required Field"
      />,
    );
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/required field/i)).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<TextField disabled label="Disabled Input" />);
    expect(screen.getByLabelText(/disabled input/i)).toBeDisabled();
  });

  // New functionality tests
  it("is disabled when isLoading is true", () => {
    render(<TextField isLoading label="Loading Input" />);
    expect(screen.getByLabelText(/loading input/i)).toBeDisabled();
  });

  it("enforces maxLength constraint", () => {
    const handleChange = jest.fn();
    render(
      <TextField
        label="Max Length Input"
        maxLength={5}
        onChange={handleChange}
      />,
    );

    const input = screen.getByLabelText(/max length input/i);
    fireEvent.change(input, { target: { value: "123456789" } });

    expect(input).toHaveValue("12345");
    expect(handleChange).toHaveBeenCalled();
  });

  it("renders with startIcon", () => {
    render(
      <TextField
        label="Input with Start Icon"
        startIcon={<span data-testid="start-icon">🔍</span>}
      />,
    );
    expect(screen.getByTestId("start-icon")).toBeInTheDocument();
  });

  it("renders with endIcon", () => {
    render(
      <TextField
        label="Input with End Icon"
        endIcon={<span data-testid="end-icon">❌</span>}
      />,
    );
    expect(screen.getByTestId("end-icon")).toBeInTheDocument();
  });

  it("calls onStartIconClick when start icon is clicked", () => {
    const handleClick = jest.fn();
    render(
      <TextField
        label="Input with Clickable Start Icon"
        startIcon={<span>🔍</span>}
        onStartIconClick={handleClick}
      />,
    );

    // Find the button that wraps the icon
    const iconButton = screen.getByRole("button");
    fireEvent.click(iconButton);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("calls onEndIconClick when end icon is clicked", () => {
    const handleClick = jest.fn();
    render(
      <TextField
        label="Input with Clickable End Icon"
        endIcon={<span>❌</span>}
        onEndIconClick={handleClick}
      />,
    );

    // Find the button that wraps the icon
    const iconButton = screen.getByRole("button");
    fireEvent.click(iconButton);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders in different variants", () => {
    const { rerender } = render(
      <TextField label="Outlined Input" variant="outlined" />,
    );
    expect(screen.getByLabelText(/outlined input/i)).toBeInTheDocument();

    rerender(<TextField label="Filled Input" variant="filled" />);
    expect(screen.getByLabelText(/filled input/i)).toBeInTheDocument();

    rerender(<TextField label="Standard Input" variant="standard" />);
    expect(screen.getByLabelText(/standard input/i)).toBeInTheDocument();
  });

  it("renders in different sizes", () => {
    const { rerender } = render(
      <TextField label="Medium Input" size="medium" />,
    );
    expect(screen.getByLabelText(/medium input/i)).toBeInTheDocument();

    rerender(<TextField label="Small Input" size="small" />);
    expect(screen.getByLabelText(/small input/i)).toBeInTheDocument();
  });
});
