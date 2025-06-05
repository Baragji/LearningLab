import React from "react";
import { render, screen } from "@testing-library/react";
import { Progress } from "./Progress";

describe("Progress", () => {
  it("renders linear progress by default", () => {
    render(<Progress value={50} />);
    const progressElement = screen.getByRole("progressbar");
    expect(progressElement).toBeInTheDocument();
  });

  it("renders circular progress when variant is circular", () => {
    render(<Progress variant="circular" value={75} />);
    const progressElement = screen.getByRole("progressbar");
    expect(progressElement).toBeInTheDocument();
  });

  it("shows value when showValue is true", () => {
    render(<Progress value={60} showValue />);
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("shows label when provided", () => {
    const label = "Loading progress";
    render(<Progress label={label} value={30} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("renders indeterminate progress", () => {
    render(<Progress indeterminate />);
    const progressElement = screen.getByRole("progressbar");
    expect(progressElement).toBeInTheDocument();
  });

  it("applies custom color", () => {
    render(<Progress color="secondary" value={40} />);
    const progressElement = screen.getByRole("progressbar");
    expect(progressElement).toHaveClass("MuiLinearProgress-colorSecondary");
  });

  it("applies custom size for circular variant", () => {
    render(<Progress variant="circular" size={60} value={50} />);
    const progressElement = screen.getByRole("progressbar");
    expect(progressElement).toHaveStyle({ width: "60px", height: "60px" });
  });
});
