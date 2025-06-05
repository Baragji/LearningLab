import React from "react";
import { render, screen } from "@testing-library/react";
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
} from "./Skeleton";

describe("Skeleton", () => {
  it("renders with default props", () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");

    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("bg-gray-200");
    expect(skeleton).toHaveClass("skeleton-shimmer");
  });

  it("applies custom width and height", () => {
    render(<Skeleton width={200} height={100} data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");

    expect(skeleton).toHaveStyle("width: 200px");
    expect(skeleton).toHaveStyle("height: 100px");
  });

  it("applies string width and height", () => {
    render(<Skeleton width="50%" height="5rem" data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");

    expect(skeleton).toHaveStyle("width: 50%");
    expect(skeleton).toHaveStyle("height: 5rem");
  });

  it("applies custom border radius", () => {
    render(<Skeleton borderRadius={8} data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");

    expect(skeleton).toHaveStyle("border-radius: 8px");
  });

  it("disables shimmer effect when shimmer is false", () => {
    render(<Skeleton shimmer={false} data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");

    expect(skeleton).not.toHaveClass("skeleton-shimmer");
  });
});

describe("SkeletonText", () => {
  it("renders the correct number of lines", () => {
    render(<SkeletonText lines={3} data-testid="skeleton-text" />);
    const skeletonLines = screen.getAllByRole("generic");

    // +1 because the container is also a generic role
    expect(skeletonLines.length).toBe(4);
  });
});

describe("SkeletonAvatar", () => {
  it("renders with circular shape", () => {
    render(<SkeletonAvatar data-testid="skeleton-avatar" />);
    const avatar = screen.getByTestId("skeleton-avatar");

    expect(avatar).toHaveStyle("border-radius: 50%");
  });

  it("applies custom size", () => {
    render(<SkeletonAvatar size={60} data-testid="skeleton-avatar" />);
    const avatar = screen.getByTestId("skeleton-avatar");

    expect(avatar).toHaveStyle("width: 60px");
    expect(avatar).toHaveStyle("height: 60px");
  });
});

describe("SkeletonCard", () => {
  it("renders with rounded corners", () => {
    render(<SkeletonCard data-testid="skeleton-card" />);
    const card = screen.getByTestId("skeleton-card");

    expect(card.firstChild).toHaveStyle("border-radius: 0.5rem");
  });

  it("applies custom height", () => {
    render(<SkeletonCard height="20rem" data-testid="skeleton-card" />);
    const card = screen.getByTestId("skeleton-card");

    expect(card.firstChild).toHaveStyle("height: 20rem");
  });
});
