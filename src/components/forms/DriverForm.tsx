// components
import { yupResolver } from "@hookform/resolvers/yup";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { cn } from "../../utils/cn";

// types
import { Driver } from "../../types/entities";

// internal components
import { Button } from "../ui/Button";
import Card, { CardFooter } from "../ui/Card";
import Input from "../ui/Input";
import SearchableSelect from "../ui/SearchableSelect";
import Select from "../ui/Select";

/**
 * Driver form data interface based on PRD requirements
 */
export interface DriverFormData {
  name: string;
  phone: string;
  license: string; // CNH - driver's license
  status: "active" | "inactive";
  truckId?: string | null;
}

/**
 * Driver form props
 */
export interface DriverFormProps {
  /** Initial driver data for editing */
  initialData?: Partial<Driver>;
  /** Available trucks for linking */
  trucks?: Array<{
    id: string;
    licensePlate: string;
    model: string;
    status: "active" | "maintenance";
  }>;
  /** Form submission handler */
  onSubmit: (data: DriverFormData) => Promise<void>;
  /** Form cancellation handler */
  onCancel?: () => void;
  /** Whether form is in loading state */
  loading?: boolean;
  /** Whether form is in edit mode */
  editMode?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Simple validation schema for driver form based on PRD requirements
 */
const driverValidationSchema = yup.object({
  name: yup
    .string()
    .required("Driver name is required")
    .min(2, "Name must be at least 2 characters"),

  phone: yup
    .string()
    .required("Phone number is required")
    .matches(/^\+?[\d\s\-()]+$/, "Invalid phone number format"),

  license: yup
    .string()
    .required("Driver license (CNH) is required")
    .min(5, "License number must be at least 5 characters"),

  status: yup
    .string()
    .required("Status is required")
    .oneOf(["active", "inactive"] as const, "Invalid status"),

  truckId: yup.string().nullable(),
});

const DriverForm: React.FC<DriverFormProps> = ({
  initialData,
  trucks = [],
  onSubmit,
  onCancel,
  loading = false,
  editMode = false,
  className,
}) => {
  // Helper function to safely extract form data from driver entity
  const getFormDefaults = (initialData?: Partial<Driver>): DriverFormData => {
    if (!initialData) {
      return {
        name: "",
        phone: "",
        license: "",
        status: "active",
        truckId: null,
      };
    }

    // Type-safe extraction with fallbacks for required PRD fields
    const fullName =
      initialData.firstName && initialData.lastName
        ? `${initialData.firstName} ${initialData.lastName}`
        : initialData.name || "";

    return {
      name: fullName,
      phone: initialData.phone || "",
      license: initialData.license || "",
      status:
        (initialData.status === "suspended"
          ? "inactive"
          : initialData.status) || "active",
      truckId: initialData.truckId || null,
    };
  };

  const form = useForm<DriverFormData>({
    resolver: yupResolver(driverValidationSchema),
    defaultValues: getFormDefaults(initialData),
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
  } = form;

  // Reset form when initial data changes (for edit mode)
  useEffect(() => {
    reset(getFormDefaults(initialData));
  }, [initialData, reset]);

  // Status options for driver
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  // Truck options for SearchableSelect
  const truckOptions = trucks.map((truck) => ({
    value: truck.id,
    label: truck.licensePlate,
    subtitle: `${truck.model} - ${truck.status}`,
    status: truck.status,
    statusColor:
      truck.status === "active" ? ("green" as const) : ("yellow" as const),
  }));

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (data: DriverFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Error submitting driver form:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn("space-y-4", className)}
    >
      {/* Driver Information - PRD Requirements */}
      <Card>
        <Card.Header>
          <Card.Title>Driver Information</Card.Title>
          <Card.Description>Basic driver details</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name"
              {...register("name")}
              error={errors.name?.message}
              placeholder="Full driver name"
              required
            />
            <Input
              label="Phone"
              type="tel"
              {...register("phone")}
              error={errors.phone?.message}
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Driver's License (CNH)"
              {...register("license")}
              error={errors.license?.message}
              placeholder="CNH number"
              required
            />
            <Select
              label="Status"
              options={statusOptions}
              {...register("status")}
              error={errors.status?.message}
              required
            />
            <SearchableSelect
              label="Assigned Truck"
              options={truckOptions}
              value={form.watch("truckId") || ""}
              onSelect={(value) =>
                form.setValue("truckId", value || null, {
                  shouldValidate: true,
                })
              }
              placeholder={
                trucks.length === 0
                  ? "No available trucks"
                  : "Search and select a truck..."
              }
              emptyMessage="No available trucks found"
              error={errors.truckId?.message}
            />
          </div>
        </Card.Content>
      </Card>

      {/* Form Actions */}
      <CardFooter className="flex-col md:flex-row">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto md:ml-auto">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!isValid || (!editMode && !isDirty)}
            className="w-full md:w-auto"
          >
            {editMode ? "Update Driver" : "Add Driver"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
              className="w-full md:w-auto"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardFooter>
    </form>
  );
};

export default DriverForm;
