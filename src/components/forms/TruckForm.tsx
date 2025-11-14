// components
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

// validation
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// types
import { Truck } from "../../types/entities";

// internal components
import Card, { CardContent, CardHeader } from "../ui/Card";
import FormActions from "../ui/FormActions";
import Input from "../ui/Input";
import Select from "../ui/Select";

/**
 * Truck form data interface based on PRD requirements
 */
export interface TruckFormData {
  licensePlate: string;
  model: string;
  capacity: number; // in kg
  year: number;
  status: "active" | "maintenance";
  driverId?: string | null;
}

/**
 * Truck form props
 */
export interface TruckFormProps {
  truck?: Truck;
  drivers?: Array<{ id: string; name: string }>;
  onSubmit: (data: TruckFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
  onDocumentUpload?: (files: FileList) => Promise<void>;
}

/**
 * Truck status options according to PRD
 */
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
];

/**
 * Validation schema for truck form based on PRD requirements
 */
const truckValidationSchema = yup.object({
  licensePlate: yup
    .string()
    .required("License plate is required")
    .min(2, "License plate must be at least 2 characters"),

  model: yup
    .string()
    .required("Model is required")
    .min(2, "Model must be at least 2 characters"),

  capacity: yup
    .number()
    .required("Capacity is required")
    .min(1, "Capacity must be at least 1 kg")
    .max(80000, "Capacity cannot exceed 80,000 kg"),

  year: yup
    .number()
    .required("Year is required")
    .min(1980, "Year must be 1980 or later")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),

  status: yup
    .string()
    .required("Status is required")
    .oneOf(["active", "maintenance"] as const, "Invalid status"),

  driverId: yup.string().nullable(),
});

/**
 * Truck Form component
 *
 * A form for creating and editing truck information based on PRD requirements:
 * - license plate, model, capacity (kg), year, status (active/maintenance)
 * - Allow document upload (PDF/JPG) to Firebase Storage
 * - Display the linked driver, if available
 *
 * @component
 * @category Forms
 */
const TruckForm: React.FC<TruckFormProps> = ({
  truck,
  drivers = [],
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Add Truck",
  onDocumentUpload,
}) => {
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Helper function to safely extract form data from truck entity
  const getFormDefaults = (truck?: Truck): TruckFormData => {
    if (!truck) {
      return {
        licensePlate: "",
        model: "",
        capacity: 0,
        year: new Date().getFullYear(),
        status: "active" as const,
        driverId: null,
      };
    }

    // Type-safe extraction with fallbacks for required PRD fields
    return {
      licensePlate: truck.licensePlate || "",
      model: truck.model || "",
      capacity: truck.capacity || 0,
      year: truck.year || new Date().getFullYear(),
      status: truck.status === "maintenance" ? "maintenance" : "active",
      driverId: truck.driverId || null,
    };
  };

  // Form setup with React Hook Form and Yup validation
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TruckFormData>({
    resolver: yupResolver(truckValidationSchema),
    defaultValues: getFormDefaults(truck),
  });

  // Reset form when truck data changes (for edit mode)
  useEffect(() => {
    reset(getFormDefaults(truck));
  }, [truck, reset]);

  // Driver options for select
  const driverOptions = [
    { value: "", label: "No driver assigned" },
    ...drivers.map((driver) => ({
      value: driver.id,
      label: driver.name,
    })),
  ];

  // Handle form submission
  const handleFormSubmit = async (data: TruckFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0 && onDocumentUpload) {
      setUploadingDocument(true);
      try {
        await onDocumentUpload(files);
      } catch (error) {
        console.error("Document upload error:", error);
      } finally {
        setUploadingDocument(false);
      }
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Basic Information */}
      <Card>
        <CardHeader
          title="Truck Information"
          subtitle="Basic truck details as required by PRD"
        />
        <CardContent padding="md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="licensePlate"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="License Plate"
                  placeholder="ABC-1234"
                  error={errors.licensePlate?.message}
                  required
                />
              )}
            />

            <Controller
              name="model"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Model"
                  placeholder="e.g., Cascadia"
                  error={errors.model?.message}
                  required
                />
              )}
            />

            <Controller
              name="capacity"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  label="Capacity (kg)"
                  placeholder="25000"
                  error={errors.capacity?.message}
                  min={1}
                  max={80000}
                  required
                />
              )}
            />

            <Controller
              name="year"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  label="Year"
                  placeholder={new Date().getFullYear().toString()}
                  error={errors.year?.message}
                  min={1980}
                  max={new Date().getFullYear() + 2}
                  required
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Status"
                  options={statusOptions}
                  error={errors.status?.message}
                  required
                />
              )}
            />

            <Controller
              name="driverId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value || ""}
                  label={truck ? "Assigned Driver" : "Assign Driver"}
                  options={driverOptions}
                  error={errors.driverId?.message}
                  placeholder="Select a driver"
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader
          title="Documents"
          subtitle="Upload truck documents (PDF/JPG)"
        />
        <CardContent padding="md">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="document-upload"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Upload Documents
              </label>
              <input
                id="document-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={handleDocumentUpload}
                disabled={uploadingDocument || isLoading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-300 hover:cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, JPG, PNG (max 10MB each)
              </p>
            </div>

            {uploadingDocument && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading documents...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <FormActions
        actions={[
          {
            label: submitLabel,
            variant: "primary",
            type: "submit",
            onClick: () => {}, // handled by form submit
            loading: isLoading,
            disabled: isLoading,
          },
          ...(onCancel
            ? [
                {
                  label: "Cancel",
                  variant: "secondary" as const,
                  onClick: onCancel,
                  disabled: isLoading,
                },
              ]
            : []),
        ]}
      />
    </form>
  );
};

export default TruckForm;
