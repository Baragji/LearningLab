// packages/ui/components/mui/Layout/Layout.test.tsx
import React from "react";
import { render, screen } from "../test-utils";
import { Box, Container, Grid, Stack } from "./";

describe("Layout Components", () => {
  it("renders Box correctly", () => {
    render(<Box>Test Content</Box>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders Container correctly", () => {
    render(<Container>Test Content</Container>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders fluid Container correctly", () => {
    render(<Container fluid>Test Content</Container>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders Grid correctly", () => {
    render(
      <Grid container>
        <Grid item xs={12} md={6}>
          Test Content
        </Grid>
      </Grid>,
    );
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders Stack correctly", () => {
    render(
      <Stack spacing={2} direction="row">
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>,
    );
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders Stack with vertical direction", () => {
    render(
      <Stack spacing={2} direction="column">
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>,
    );
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });
});
