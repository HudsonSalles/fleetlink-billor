// components
import React from "react";
import { cn } from "../../utils/cn";

/**
 * Card component props
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated" | "filled";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  hover?: boolean;
  loading?: boolean;
}

/**
 * Extended Card component with sub-components
 */
interface CardComponent
  extends React.ForwardRefExoticComponent<
    CardProps & React.RefAttributes<HTMLDivElement>
  > {
  Header: typeof CardHeader;
  Title: typeof CardTitle;
  Description: typeof CardDescription;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
}

/**
 * Card Header props
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/**
 * Card Content props
 */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

/**
 * Card Footer props
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: "start" | "center" | "end" | "between" | "around";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      padding = "md",
      hover = false,
      loading = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Variant styles
    const variantStyles = {
      default:
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm",
      outlined:
        "bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600",
      elevated:
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg",
      filled:
        "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600",
    };

    // Padding styles
    const paddingStyles = {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
    };

    // Hover styles
    const hoverStyles = hover
      ? "transition-shadow duration-200 hover:shadow-lg cursor-pointer"
      : "";

    // Loading styles
    const loadingStyles = loading ? "opacity-60 pointer-events-none" : "";

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "rounded-lg transition-colors duration-200",

          // Variant styles
          variantStyles[variant],

          // Padding styles
          paddingStyles[padding],

          // Interactive styles
          hoverStyles,
          loadingStyles,

          className
        )}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded-lg z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-primary-500" />
          </div>
        )}
        {children}
      </div>
    );
  }
) as CardComponent;

Card.displayName = "Card";

/**
 * Card Header component
 *
 * Header section for cards with title, subtitle, and action area.
 *
 * @component
 * @category Layout
 */
const CardHeader = React.memo(
  React.forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ title, subtitle, action, className, children, ...props }, ref) => {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-start justify-between",
            "border-b border-gray-200 dark:border-gray-700",
            "pb-4 mb-4",
            className
          )}
          {...props}
        >
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
            {children}
          </div>
          {action && <div className="ml-4 flex-shrink-0">{action}</div>}
        </div>
      );
    }
  )
);

CardHeader.displayName = "CardHeader";

/**
 * Card Content component
 *
 * Main content area of the card with optional padding control.
 *
 * @component
 * @category Layout
 */
const CardContent = React.memo(
  React.forwardRef<HTMLDivElement, CardContentProps>(
    ({ padding = "none", className, children, ...props }, ref) => {
      const paddingStyles = {
        none: "",
        sm: "p-3",
        md: "p-0 md:p-4",
        lg: "p-6",
        xl: "p-8",
      };

      return (
        <div
          ref={ref}
          className={cn(paddingStyles[padding], className)}
          {...props}
        >
          {children}
        </div>
      );
    }
  )
);

CardContent.displayName = "CardContent";

/**
 * Card Footer component
 *
 * Footer section for cards with flexible content justification.
 *
 * @component
 * @category Layout
 */
const CardFooter = React.memo(
  React.forwardRef<HTMLDivElement, CardFooterProps>(
    ({ justify = "end", className, children, ...props }, ref) => {
      const justifyStyles = {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between",
        around: "justify-around",
      };

      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-3",
            "border-t border-gray-200 dark:border-gray-700",
            "pt-4 mt-4",
            justifyStyles[justify],
            className
          )}
          {...props}
        >
          {children}
        </div>
      );
    }
  )
);

CardFooter.displayName = "CardFooter";

/**
 * Card Title component
 */
const CardTitle = React.memo(
  React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
  >(({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          "text-lg font-semibold text-gray-900 dark:text-white",
          className
        )}
        {...props}
      >
        {children}
      </h3>
    );
  })
);

CardTitle.displayName = "CardTitle";

/**
 * Card Description component
 */
const CardDescription = React.memo(
  React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
  >(({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
        {...props}
      >
        {children}
      </p>
    );
  })
);

CardDescription.displayName = "CardDescription";

// Attach sub-components to the main Card component
Object.assign(Card, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
});

// Export components
export default Card;
export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
