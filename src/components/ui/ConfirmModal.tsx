// components
import React from "react";

// internal components
import { Button } from "./Button";
import Modal from "./Modal";

/**
 * Confirmation modal props
 */
export interface ConfirmModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close modal handler */
  onClose: () => void;
  /** Confirmation handler */
  onConfirm: () => void;
  /** Modal title */
  title?: string;
  /** Modal message */
  message?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether the action is loading */
  loading?: boolean;
  /** Confirm button variant (default: destructive) */
  confirmVariant?: "primary" | "secondary" | "destructive" | "outline";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Reusable confirmation modal component
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  confirmVariant = "destructive",
  className,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      className={className}
    >
      <div className="space-y-6">
        {/* Message */}
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
