// components
import React from "react";

// internal components
import { Button } from "./Button";
import { CardFooter } from "./Card";

/**
 * Form action button interface
 */
export interface FormAction {
  /** Button label */
  label: string;
  /** Button variant */
  variant: "primary" | "secondary" | "outline" | "destructive" | "ghost";
  /** Click handler */
  onClick: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Whether button shows loading state */
  loading?: boolean;
  /** Button type */
  type?: "button" | "submit" | "reset";
  /** Additional CSS classes */
  className?: string;
}

/**
 * FormActions component props
 */
export interface FormActionsProps {
  /** Array of action buttons */
  actions: FormAction[];
  /** Additional CSS classes for the container */
  className?: string;
}

const FormActions: React.FC<FormActionsProps> = ({ actions, className }) => {
  return (
    <CardFooter className={`flex-col md:flex-row ${className || ""}`}>
      <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto md:ml-auto">
        {actions.map((action, index) => (
          <Button
            key={index}
            type={action.type || "button"}
            variant={action.variant}
            onClick={action.onClick}
            disabled={action.disabled}
            loading={action.loading}
            className={`w-full md:w-auto ${action.className || ""}`}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </CardFooter>
  );
};

export default FormActions;
