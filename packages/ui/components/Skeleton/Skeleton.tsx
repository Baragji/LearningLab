import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

/**
 * Skeleton variants using class-variance-authority
 */
const skeletonVariants = cva(
  "relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-md",
  {
    variants: {
      animation: {
        shimmer: "skeleton-shimmer",
        pulse: "skeleton-pulse",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      animation: "shimmer",
      radius: "md",
    },
  },
);

/**
 * Extended Skeleton props interface
 */
export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /**
   * The width of the skeleton
   */
  width?: string | number;
  /**
   * The height of the skeleton
   */
  height?: string | number;
  /**
   * The border radius of the skeleton (custom value)
   * Use radius prop for predefined values
   */
  borderRadius?: string | number;
  /**
   * Whether to show the shimmer effect
   * @deprecated Use animation="shimmer" or animation="pulse" instead
   */
  shimmer?: boolean;
}

/**
 * Base Skeleton component for loading states
 * Enhanced with Shadcn/UI patterns
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      width = "100%",
      height = "1rem",
      borderRadius,
      shimmer = true,
      animation,
      radius,
      className,
      ...props
    },
    ref,
  ) => {
    // Convert width and height to string with px if they are numbers
    const widthStyle = typeof width === "number" ? `${width}px` : width;
    const heightStyle = typeof height === "number" ? `${height}px` : height;

    // Handle custom border radius if provided
    const radiusStyle =
      typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius;

    // For backward compatibility, if shimmer is explicitly set to false, use pulse animation
    const animationValue = animation || (shimmer ? "shimmer" : "pulse");

    return (
      <div
        ref={ref}
        className={cn(
          skeletonVariants({
            animation: animationValue,
            radius: radiusStyle ? undefined : radius,
            className,
          }),
        )}
        style={{
          width: widthStyle,
          height: heightStyle,
          ...(radiusStyle ? { borderRadius: radiusStyle } : {}),
        }}
        aria-hidden="true"
        {...props}
      />
    );
  },
);

Skeleton.displayName = "Skeleton";

/**
 * Skeleton Text component for text placeholders
 */
export interface SkeletonTextProps {
  /**
   * Number of lines to display
   */
  lines?: number;
  /**
   * Spacing between lines
   */
  spacing?: string | number;
  /**
   * Width of the last line (percentage or pixel value)
   */
  lastLineWidth?: string | number;
  /**
   * Whether to vary the line heights slightly for a more natural look
   */
  varyHeights?: boolean;
  /**
   * Additional CSS class names
   */
  className?: string;
}

export const SkeletonText = ({
  lines = 3,
  spacing = "0.5rem",
  lastLineWidth = "70%",
  varyHeights = false,
  className = "",
}: SkeletonTextProps): JSX.Element => {
  const spacingStyle = typeof spacing === "number" ? `${spacing}px` : spacing;
  const lastWidthStyle =
    typeof lastLineWidth === "number" ? `${lastLineWidth}px` : lastLineWidth;

  // Note: Tailwind's JIT compiler might not pick up dynamic class names like `space-y-${spacingStyle}`.
  // If spacing doesn't work as expected, consider applying margin directly in style or using fixed Tailwind classes.
  return (
    <div
      className={`${className}`}
      style={
        lines > 1
          ? { display: "flex", flexDirection: "column", gap: spacingStyle }
          : {}
      }
    >
      {Array.from({ length: lines }).map((_, index) => {
        // If varyHeights is true, slightly vary the height of each line
        const height = varyHeights
          ? `${0.7 + Math.random() * 0.3}rem`
          : "0.75rem";

        return (
          <Skeleton
            key={index}
            width={index === lines - 1 ? lastWidthStyle : "100%"}
            height={height}
          />
        );
      })}
    </div>
  );
};

/**
 * Skeleton Avatar component for profile pictures or icons
 */
export interface SkeletonAvatarProps {
  /**
   * Size of the avatar in pixels
   */
  size?: number;
  /**
   * Additional CSS class names
   */
  className?: string;
}

export const SkeletonAvatar = ({
  size = 40,
  className = "",
}: SkeletonAvatarProps): JSX.Element => {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius="50%"
      className={className}
    />
  );
};

/**
 * Skeleton Card component for card placeholders
 */
export interface SkeletonCardProps {
  /**
   * Height of the card
   */
  height?: string | number;
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Whether to include a header section in the card
   */
  withHeader?: boolean;
  /**
   * Whether to include a footer section in the card
   */
  withFooter?: boolean;
}

export const SkeletonCard = ({
  height = "12rem",
  className = "",
  withHeader = false,
  withFooter = false,
}: SkeletonCardProps): JSX.Element => {
  // Calculate content height dynamically based on header/footer
  let contentHeight = height;
  if (typeof height === "string" && height.includes("rem")) {
    // A rough estimation, assuming p-4 for header/footer (1rem padding top/bottom)
    // and border. This might need more precise calculation based on actual header/footer content.
    let deduction = 0;
    if (withHeader) deduction += 3.5; // Approx height of header (avatar + text + padding)
    if (withFooter) deduction += 2.5; // Approx height of footer (text + padding)
    if (deduction > 0) {
      contentHeight = `calc(${height} - ${deduction}rem)`;
    }
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}
      style={{ height: height }}
    >
      {withHeader && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <SkeletonAvatar size={32} />
            <div className="ml-3 flex-1 space-y-2">
              <Skeleton height="0.875rem" width="60%" />
              <Skeleton height="0.75rem" width="40%" />
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        <Skeleton
          height={contentHeight} // Use the calculated or original height
          borderRadius="0.25rem"
        />
      </div>

      {withFooter && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <Skeleton height="0.875rem" width="30%" />
            <Skeleton height="0.875rem" width="20%" />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Skeleton Button component for button placeholders
 */
export interface SkeletonButtonProps {
  /**
   * Width of the button
   */
  width?: string | number;
  /**
   * Height of the button
   */
  height?: string | number;
  /**
   * Whether the button should be rounded
   */
  rounded?: boolean;
  /**
   * Additional CSS class names
   */
  className?: string;
}

export const SkeletonButton = ({
  width = "8rem",
  height = "2.5rem",
  rounded = false,
  className = "",
}: SkeletonButtonProps): JSX.Element => {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={rounded ? "9999px" : "0.375rem"} // Tailwind's rounded-full is often 9999px
      className={className}
    />
  );
};

/**
 * Skeleton Image component for image placeholders
 */
export interface SkeletonImageProps {
  /**
   * Width of the image
   */
  width?: string | number;
  /**
   * Height of the image
   */
  height?: string | number;
  /**
   * Border radius of the image
   */
  borderRadius?: string | number;
  /**
   * Additional CSS class names
   */
  className?: string;
}

export const SkeletonImage = ({
  width = "100%",
  height = "16rem",
  borderRadius = "0.375rem", // Tailwind's rounded-md
  className = "",
}: SkeletonImageProps): JSX.Element => {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={borderRadius}
      className={className}
    />
  );
};

/**
 * Skeleton List component for list placeholders
 */
export interface SkeletonListProps {
  /**
   * Number of items in the list
   */
  items?: number;
  /**
   * Height of each item (can be used for consistent item sizing if needed)
   */
  itemHeight?: string | number;
  /**
   * Whether to include an avatar for each item
   */
  withAvatar?: boolean;
  /**
   * Whether to include a thumbnail for each item
   */
  withThumbnail?: boolean;
  /**
   * Additional CSS class names
   */
  className?: string;
}

export const SkeletonList = ({
  items = 3, // Reduced default for brevity in previews
  // itemHeight is not directly used in div styling but can guide content Skeletons
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  itemHeight = "4rem",
  withAvatar = false,
  withThumbnail = false,
  className = "",
}: SkeletonListProps): JSX.Element => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="flex items-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md"
        >
          {withAvatar && (
            <SkeletonAvatar size={40} className="mr-3 flex-shrink-0" />
          )}

          {withThumbnail &&
            !withAvatar && ( // Ensure only one is shown if both true, or adjust logic
              <Skeleton
                width={80}
                height={60}
                borderRadius="0.25rem"
                className="mr-3 flex-shrink-0"
              />
            )}

          <div className="flex-1 space-y-2">
            <Skeleton height="0.875rem" width="70%" />
            <Skeleton height="0.75rem" width="50%" />
          </div>

          {/* Optional: placeholder for an action button or icon on the right */}
          <Skeleton
            width={32}
            height={32}
            borderRadius="0.25rem"
            className="ml-3 flex-shrink-0"
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton Section component for section placeholders with title and content
 */
export interface SkeletonSectionProps {
  /**
   * Whether to show a title skeleton
   */
  withTitle?: boolean;
  /**
   * Number of content lines to display
   */
  contentLines?: number;
  /**
   * Whether to include a divider between title and content
   */
  withDivider?: boolean;
  /**
   * Additional CSS class names
   */
  className?: string;
}

export const SkeletonSection = ({
  withTitle = true,
  contentLines = 3,
  withDivider = false,
  className = "",
}: SkeletonSectionProps): JSX.Element => {
  return (
    <div className={`space-y-4 ${className}`}>
      {withTitle && (
        <Skeleton
          height="1.5rem"
          width="40%"
          borderRadius="0.25rem"
          className="mb-2"
        />
      )}

      {withDivider &&
        withTitle && ( // Only show divider if there's a title
          <div className="border-b border-gray-200 dark:border-gray-700 my-3"></div>
        )}

      <div className="space-y-2">
        {" "}
        {/* Reduced spacing for tighter lines */}
        {Array.from({ length: contentLines }).map((_, index) => (
          <Skeleton
            key={index}
            height="0.875rem"
            width={`${Math.max(50, 100 - index * 15)}%`} // Varying width for realism
            borderRadius="0.25rem"
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton Table component for table placeholders
 */
export interface SkeletonTableProps {
  /**
   * Number of rows to display (excluding header)
   */
  rows?: number;
  /**
   * Number of columns to display
   */
  columns?: number;
  /**
   * Whether to include a header row
   */
  withHeader?: boolean;
  /**
   * Additional CSS class names for the container div
   */
  className?: string;
}

export const SkeletonTable = ({
  rows = 4, // Default rows
  columns = 4, // Default columns
  withHeader = true,
  className = "",
}: SkeletonTableProps): JSX.Element => {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="overflow-x-auto">
        {" "}
        {/* Ensures table is scrollable on small screens */}
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {withHeader && (
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {Array.from({ length: columns }).map((_, index) => (
                  <th key={`header-${index}`} className="px-4 py-3 text-left">
                    {" "}
                    {/* Adjusted padding */}
                    <Skeleton
                      height="1rem"
                      width={`${60 + Math.random() * 30}%`}
                      borderRadius="0.25rem"
                    />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr
                key={`row-${rowIndex}`}
                className={
                  rowIndex % 2 === 0
                    ? "bg-white dark:bg-gray-900"
                    : "bg-gray-50 dark:bg-gray-850"
                }
              >
                {" "}
                {/* Zebra striping */}
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td
                    key={`cell-${rowIndex}-${colIndex}`}
                    className="px-4 py-3"
                  >
                    {" "}
                    {/* Adjusted padding */}
                    <Skeleton
                      height="0.875rem"
                      width={`${Math.max(40, 90 - colIndex * 10)}%`} // Varying width for realism
                      borderRadius="0.25rem"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
