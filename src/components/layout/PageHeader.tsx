// components
import React from "react";

// internal components
import { Button } from "../ui/Button";

/**
 * Page header props interface
 */
export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Page subtitle/description */
  subtitle: string;
  /** Optional action button */
  action?: {
    /** Button label */
    label: string;
    /** Click handler */
    onClick: () => void;
    /** Button variant */
    variant?: "primary" | "secondary" | "outline";
    /** Additional CSS classes */
    className?: string;
  };
  /** Additional CSS classes for the container */
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  className = "",
}) => {
  return (
    <div className={className}>
      <div className="flex justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || "primary"}
            className={`ml-4 shrink-0 ${action.className || "bg-blue-600 hover:bg-blue-700"}`}
          >
            {action.label}
          </Button>
        )}
      </div>
      <p className="text-gray-600 dark:text-gray-400 mt-2">{subtitle}</p>
    </div>
  );
};

export default PageHeader;
