import toast from "react-hot-toast";

/**
 * Toast configuration options
 */
interface ToastOptions {
  /** Duration in milliseconds (default: 3000 for success, 4000 for error) */
  duration?: number;
  /** Custom position override (default: bottom-right) */
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
}

/**
 * Reusable toast utility with consistent styling
 * Provides success and error toasts with transparent backgrounds
 */
export const showToast = {
  /**
   * Show success toast with transparent green background
   * @param message - The success message to display
   * @param options - Optional configuration
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      position: options?.position || "bottom-right",
      duration: options?.duration || 3000,
      style: {
        background: "rgba(34, 197, 94, 0.1)",
        border: "1px solid rgba(34, 197, 94, 0.2)",
        color: "#15803d",
      },
    });
  },

  /**
   * Show error toast with transparent red background
   * @param message - The error message to display
   * @param options - Optional configuration
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      position: options?.position || "bottom-right",
      duration: options?.duration || 4000,
      style: {
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        color: "#dc2626",
      },
    });
  },

  /**
   * Show info toast with transparent blue background
   * @param message - The info message to display
   * @param options - Optional configuration
   */
  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      position: options?.position || "bottom-right",
      duration: options?.duration || 3000,
      style: {
        background: "rgba(59, 130, 246, 0.1)",
        border: "1px solid rgba(59, 130, 246, 0.2)",
        color: "#1d4ed8",
      },
    });
  },

  /**
   * Show warning toast with transparent yellow background
   * @param message - The warning message to display
   * @param options - Optional configuration
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast(message, {
      position: options?.position || "bottom-right",
      duration: options?.duration || 4000,
      style: {
        background: "rgba(245, 158, 11, 0.1)",
        border: "1px solid rgba(245, 158, 11, 0.2)",
        color: "#b45309",
      },
    });
  },
};

/**
 * Pre-configured toast messages for common CRUD operations
 */
export const toastMessages = {
  // Direct toast methods
  success: (message: string, options?: ToastOptions) => showToast.success(message, options),
  error: (message: string, options?: ToastOptions) => showToast.error(message, options),
  info: (message: string, options?: ToastOptions) => showToast.info(message, options),

  // Create operations
  created: (entityName: string, identifier?: string) =>
    showToast.success(
      `${entityName}${identifier ? ` "${identifier}"` : ""} created successfully!`
    ),

  // Update operations
  updated: (entityName: string, identifier?: string) =>
    showToast.success(
      `${entityName}${identifier ? ` "${identifier}"` : ""} updated successfully!`
    ),

  // Delete operations
  deleted: (entityName: string, identifier?: string) =>
    showToast.success(
      `${entityName}${identifier ? ` "${identifier}"` : ""} deleted successfully!`
    ),

  // Error operations
  createError: (entityName: string) =>
    showToast.error(`Failed to create ${entityName.toLowerCase()}. Please try again.`),

  updateError: (entityName: string) =>
    showToast.error(`Failed to update ${entityName.toLowerCase()}. Please try again.`),

  deleteError: (entityName: string) =>
    showToast.error(`Failed to delete ${entityName.toLowerCase()}. Please try again.`),

  // Validation errors
  duplicateError: (field: string, value: string, entityName?: string) =>
    showToast.error(
      `${field} "${value}" is already registered${
        entityName ? ` to another ${entityName.toLowerCase()}` : ""
      }. Please use a different ${field.toLowerCase()}.`,
      { duration: 5000 }
    ),

  // Generic validation
  validationError: (message: string) =>
    showToast.error(`${message}`, { duration: 5000 }),
};