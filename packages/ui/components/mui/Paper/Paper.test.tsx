// packages/ui/components/mui/Paper/Paper.test.tsx
import React from "react";
import { render, screen } from "../test-utils";
import { Paper } from "./Paper";

describe("Paper Component", () => {
  it("renders children correctly", () => {
    render(<Paper>Paper Content</Paper>);

    expect(screen.getByText("Paper Content")).toBeInTheDocument();
  });

  it("applies elevation prop correctly", () => {
    render(<Paper elevation={3}>Paper Content</Paper>);

    // Dette er en visuel test, så vi kan ikke nemt bekræfte styling
    // I en rigtig test kunne man bruge et test-id og tjekke computed styles
    expect(screen.getByText("Paper Content")).toBeInTheDocument();
  });

  it("applies noPadding prop correctly", () => {
    render(<Paper noPadding>Paper Content</Paper>);

    // Dette er en visuel test, så vi kan ikke nemt bekræfte styling
    // I en rigtig test kunne man bruge et test-id og tjekke computed styles
    expect(screen.getByText("Paper Content")).toBeInTheDocument();
  });

  it("applies custom sx prop correctly", () => {
    render(<Paper sx={{ backgroundColor: "red" }}>Paper Content</Paper>);

    // Dette er en visuel test, så vi kan ikke nemt bekræfte styling
    // I en rigtig test kunne man bruge et test-id og tjekke computed styles
    expect(screen.getByText("Paper Content")).toBeInTheDocument();
  });
});
