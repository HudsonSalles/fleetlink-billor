// components
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

/**
 * Modal component props
 */
export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Modal size */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Whether clicking overlay closes modal */
  closeOnOverlayClick?: boolean;
  /** Whether pressing escape closes modal */
  closeOnEscape?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Footer content */
  footer?: React.ReactNode;
}

/**
 * Modal header props
 */
export interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

/**
 * Modal body props
 */
export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Modal footer props
 */
export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  justify?: "start" | "center" | "end" | "between";
}

/**
 * Modal component
 *
 * A versatile modal dialog component that supports various sizes,
 * animations, and accessibility features for displaying overlays.
 *
 * @component
 * @category UI
 * @subcategory Overlays
 *
 * @param {ModalProps} props - The modal component props
 * @returns {JSX.Element | null} The modal component or null if closed
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Edit Truck"
 *   size="lg"
 * >
 *   <TruckForm onSubmit={handleSubmit} />
 * </Modal>
 *
 * // With custom footer
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   footer={
 *     <div className="flex gap-2">
 *       <Button onClick={handleCancel}>Cancel</Button>
 *       <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
 *     </div>
 *   }
 * >
 *   <p>Are you sure you want to delete this item?</p>
 * </Modal>
 * ```
 *
 * @features
 * - Multiple sizes and responsive design
 * - Keyboard navigation and focus management
 * - Click outside to close
 * - Escape key to close
 * - Smooth animations
 * - Portal rendering for proper z-index
 *
 * @accessibility
 * - ARIA labels and roles
 * - Focus trap within modal
 * - Screen reader announcements
 * - Keyboard navigation
 *
 * @since 1.0.0
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  showCloseButton = true,
  footer,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Size classes
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Store previous active element
      previousActiveElement.current = document.activeElement;

      // Focus modal
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Restore focus
      if (previousActiveElement.current) {
        (previousActiveElement.current as HTMLElement).focus();
      }

      // Restore body scroll
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle focus trap
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all",
          "animate-fade-in max-h-[90vh] flex flex-col",
          sizeClasses[size],
          className
        )}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <ModalHeader showCloseButton={showCloseButton} onClose={onClose}>
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
            )}
          </ModalHeader>
        )}

        {/* Body */}
        <ModalBody className="flex-1 overflow-y-auto">{children}</ModalBody>

        {/* Footer */}
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </div>
    </div>
  );

  // Render in portal
  return createPortal(modalContent, document.body);
};

/**
 * Modal Header component
 */
const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  className,
  onClose,
  showCloseButton = true,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700",
        className
      )}
    >
      <div className="flex-1">{children}</div>
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close modal"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

/**
 * Modal Body component
 */
const ModalBody: React.FC<ModalBodyProps> = ({ children, className }) => {
  return <div className={cn("p-4 md:p-6", className)}>{children}</div>;
};

/**
 * Modal Footer component
 */
const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className,
  justify = "end",
}) => {
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700",
        justifyClasses[justify],
        className
      )}
    >
      {children}
    </div>
  );
};

export default Modal;
export { ModalBody, ModalFooter, ModalHeader };
