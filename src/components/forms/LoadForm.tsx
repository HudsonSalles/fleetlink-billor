// components
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { cn } from "../../utils/cn";

// services
import { LoadRouteService } from "../../services/loadRoutes";

// types
import { Address, Load } from "../../types/entities";

// internal components
import { Button } from "../ui/Button";
import Card, { CardFooter } from "../ui/Card";
import Input from "../ui/Input";
import SearchableSelect from "../ui/SearchableSelect";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";

/**
 * Load form data interface based on PRD requirements
 */
export interface LoadFormData {
  description: string;
  weight: number;
  origin: Address; // Complete address object for Brazilian addresses
  destination: Address; // Complete address object for Brazilian addresses
  status: "planned" | "in route" | "delivered";
  driverId: string;
  truckId: string;
}

/**
 * Load form props
 */
export interface LoadFormProps {
  /** Initial load data for editing */
  initialData?: Partial<Load>;
  /** Available drivers for selection */
  drivers?: Array<{
    id: string;
    name: string;
    status: "active" | "inactive" | "suspended";
    truckId?: string;
  }>;
  /** Available trucks for selection */
  trucks?: Array<{
    id: string;
    licensePlate: string;
    model: string;
    status: "active" | "maintenance";
  }>;
  /** Form submission handler */
  onSubmit: (data: LoadFormData) => Promise<void>;
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
 * Load status options according to PRD
 */
const statusOptions = [
  { value: "planned", label: "Planned" },
  { value: "in route", label: "In Route" },
  { value: "delivered", label: "Delivered" },
];

// Validation is handled by react-hook-form with yup resolver
// Schema definitions are in validation/schemas.ts

const LoadForm: React.FC<LoadFormProps> = ({
  initialData,
  drivers = [],
  trucks = [],
  onSubmit,
  onCancel,
  loading = false,
  editMode = false,
  className,
}) => {
  // Helper function to safely extract form data from load entity
  const getFormDefaults = (initialData?: Partial<Load>): LoadFormData => {
    if (!initialData) {
      return {
        description: "",
        weight: 0,
        origin: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          coordinates: null,
        },
        destination: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          coordinates: null,
        },
        status: "planned",
        driverId: "",
        truckId: "",
      };
    }

    // Type-safe extraction with fallbacks for required PRD fields
    const originAddress: Address =
      typeof initialData.origin === "object" && initialData.origin
        ? {
            street: initialData.origin.street || "",
            city: initialData.origin.city || "",
            state: initialData.origin.state || "",
            zipCode: initialData.origin.zipCode || "",
            coordinates: initialData.origin.coordinates || null,
          }
        : {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            coordinates: null,
          };

    const destinationAddress: Address =
      typeof initialData.destination === "object" && initialData.destination
        ? {
            street: initialData.destination.street || "",
            city: initialData.destination.city || "",
            state: initialData.destination.state || "",
            zipCode: initialData.destination.zipCode || "",
            coordinates: initialData.destination.coordinates || null,
          }
        : {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            coordinates: null,
          };

    // Map entity status to form status
    let formStatus: "planned" | "in route" | "delivered";
    switch (initialData.status) {
      case "in_route":
        formStatus = "in route";
        break;
      case "delivered":
        formStatus = "delivered";
        break;
      default:
        formStatus = "planned";
        break;
    }

    return {
      description: initialData.description || "",
      weight: initialData.weight || 0,
      origin: originAddress,
      destination: destinationAddress,
      status: formStatus,
      driverId: initialData.driverId || "",
      truckId: initialData.truckId || "",
    };
  };

  const form = useForm<LoadFormData>({
    // resolver: yupResolver(loadValidationSchema), // Temporarily disabled for complex validation
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

  // Weight input state for proper editing support
  const [weightDisplayValue, setWeightDisplayValue] = React.useState("");
  const [weightIsFocused, setWeightIsFocused] = React.useState(false);

  // Auto-assign truck when driver is selected (if driver has assigned truck)
  const watchedDriverId = form.watch("driverId");
  useEffect(() => {
    if (watchedDriverId) {
      const selectedDriver = drivers.find(
        (driver) => driver.id === watchedDriverId
      );
      if (selectedDriver?.truckId) {
        form.setValue("truckId", selectedDriver.truckId, {
          shouldValidate: true,
        });
      }
    }
  }, [watchedDriverId, drivers, form]);

  // Update weight display value when form weight changes (but not when focused)
  const watchedWeight = form.watch("weight");
  useEffect(() => {
    if (!weightIsFocused) {
      if (watchedWeight && watchedWeight > 0) {
        setWeightDisplayValue(watchedWeight.toLocaleString("en-US") + " kg");
      } else {
        setWeightDisplayValue("");
      }
    }
  }, [watchedWeight, weightIsFocused]);

  // Driver options for SearchableSelect
  const driverOptions = drivers.map((driver) => ({
    value: driver.id,
    label: driver.name,
    status: driver.status,
    statusColor:
      driver.status === "active"
        ? ("green" as const)
        : driver.status === "inactive"
          ? ("gray" as const)
          : ("red" as const),
  }));

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (data: LoadFormData) => {
    try {
      // Additional Brazilian address validation
      const originValidation = LoadRouteService.validateBrazilianAddress(
        data.origin
      );
      const destValidation = LoadRouteService.validateBrazilianAddress(
        data.destination
      );

      if (!originValidation.valid || !destValidation.valid) {
        console.error("Address validation failed:", {
          origin: originValidation.errors,
          destination: destValidation.errors,
        });
        // Form validation will show the errors
        return;
      }

      // Format and clean up data before submission
      const formattedData = {
        ...data,
        origin: {
          ...data.origin,
          state: data.origin.state.toUpperCase(),
          zipCode: data.origin.zipCode
            .replace(/\D/g, "")
            .replace(/(\d{5})(\d{3})/, "$1-$2"),
        },
        destination: {
          ...data.destination,
          state: data.destination.state.toUpperCase(),
          zipCode: data.destination.zipCode
            .replace(/\D/g, "")
            .replace(/(\d{5})(\d{3})/, "$1-$2"),
        },
      };

      await onSubmit(formattedData);
    } catch (error) {
      console.error("Error submitting load form:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn("space-y-4", className)}
    >
      {/* Assignment Information - First for better UX */}
      <Card>
        <Card.Header>
          <Card.Title>Assignment</Card.Title>
          <Card.Description>
            Assign driver and truck to this load
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchableSelect
              label="Driver"
              options={driverOptions}
              value={form.watch("driverId")}
              onSelect={(value) =>
                form.setValue("driverId", value, { shouldValidate: true })
              }
              placeholder={
                drivers.length === 0
                  ? "No active drivers available"
                  : "Search and select an active driver..."
              }
              emptyMessage="No active drivers found"
              error={errors.driverId?.message}
              required
              disabled={drivers.length === 0}
            />
            <Input
              label="Truck"
              value={(() => {
                const truckId = form.watch("truckId");
                if (!truckId) {
                  return form.watch("driverId")
                    ? "No truck assigned"
                    : "Select a driver first";
                }
                const truck = trucks.find((t) => t.id === truckId);
                return truck
                  ? `${truck.licensePlate} - ${truck.model}`
                  : "Truck not found";
              })()}
              placeholder="Truck will be auto-assigned based on driver selection"
              disabled={true}
              readOnly={true}
              error={errors.truckId?.message}
            />
          </div>
        </Card.Content>
      </Card>

      {/* Load Information - PRD Requirements */}
      <Card>
        <Card.Header>
          <Card.Title>Load Information</Card.Title>
          <Card.Description>
            Basic load details as required by PRD
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <Textarea
            label="Description"
            {...register("description")}
            error={errors.description?.message}
            placeholder="Describe the load details..."
            maxLength={5000}
            showCharCount={true}
            rows={4}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Weight (kg)"
              type="text"
              value={weightDisplayValue}
              onFocus={() => {
                setWeightIsFocused(true);
                // Show raw numbers when focused for easier editing
                const currentWeight = form.watch("weight");
                if (currentWeight && currentWeight > 0) {
                  setWeightDisplayValue(currentWeight.toString());
                }
              }}
              onBlur={() => {
                setWeightIsFocused(false);
                // Apply formatting when losing focus
                const numericValue = weightDisplayValue.replace(/[^\d]/g, "");
                if (numericValue === "") {
                  form.setValue("weight", undefined as any, {
                    shouldValidate: true,
                  });
                  setWeightDisplayValue("");
                } else {
                  const numberValue = parseInt(numericValue, 10);
                  form.setValue("weight", numberValue, {
                    shouldValidate: true,
                  });
                  setWeightDisplayValue(
                    numberValue.toLocaleString("en-US") + " kg"
                  );
                }
              }}
              onChange={(e) => {
                setWeightDisplayValue(e.target.value);
              }}
              error={errors.weight?.message}
              placeholder="25000 (enter numbers only)"
              helperText="Enter weight in kilograms. Example: 25000 = 25 tons"
              required
            />
            <Select
              label="Status"
              options={statusOptions}
              {...register("status")}
              error={errors.status?.message}
              required
            />
          </div>
        </Card.Content>
      </Card>

      {/* Location Information */}
      <Card>
        <Card.Header>
          <Card.Title>Origin Address</Card.Title>
          <Card.Description>
            {editMode
              ? "Pickup location (cannot be edited)"
              : "Pickup location details"}
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Street Address"
              {...register("origin.street")}
              error={errors.origin?.street?.message}
              placeholder="Ex: Av. Paulista, 1000"
              required={!editMode}
              disabled={editMode}
              className={editMode ? "bg-gray-100 dark:bg-gray-800" : ""}
            />
            <Input
              label="City"
              {...register("origin.city")}
              error={errors.origin?.city?.message}
              placeholder="Ex: São Paulo"
              required={!editMode}
              disabled={editMode}
              className={editMode ? "bg-gray-100 dark:bg-gray-800" : ""}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="State"
              {...register("origin.state", {
                onChange: editMode
                  ? undefined
                  : (e) => {
                      e.target.value = e.target.value.toUpperCase();
                    },
              })}
              error={errors.origin?.state?.message}
              placeholder="Ex: SP (2 letters)"
              maxLength={2}
              style={{ textTransform: "uppercase" }}
              required={!editMode}
              disabled={editMode}
              className={editMode ? "bg-gray-100 dark:bg-gray-800" : ""}
            />
            <Input
              label="CEP (ZIP Code)"
              {...register("origin.zipCode", {
                onChange: editMode
                  ? undefined
                  : (e) => {
                      // Format CEP as user types
                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length > 5) {
                        value = value.replace(/(\d{5})(\d{1,3})/, "$1-$2");
                      }
                      e.target.value = value;
                    },
              })}
              error={errors.origin?.zipCode?.message}
              placeholder="Ex: 01310-100"
              maxLength={9}
              required={!editMode}
              disabled={editMode}
              className={editMode ? "bg-gray-100 dark:bg-gray-800" : ""}
            />
          </div>
        </Card.Content>
      </Card>

      {/* Destination Information */}
      <Card>
        <Card.Header>
          <Card.Title>Destination Address</Card.Title>
          <Card.Description>
            {editMode
              ? "Delivery location (cannot be edited)"
              : "Delivery location details"}
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Street Address"
              {...register("destination.street")}
              error={errors.destination?.street?.message}
              placeholder="Ex: Rua das Flores, 500"
              required={!editMode}
              disabled={editMode}
              className={editMode ? "bg-gray-100 dark:bg-gray-800" : ""}
            />
            <Input
              label="City"
              {...register("destination.city")}
              error={errors.destination?.city?.message}
              placeholder="Ex: Rio de Janeiro"
              required={!editMode}
              disabled={editMode}
              className={editMode ? "bg-gray-100 dark:bg-gray-800" : ""}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="State"
              {...register("destination.state", {
                onChange: editMode
                  ? undefined
                  : (e) => {
                      e.target.value = e.target.value.toUpperCase();
                    },
              })}
              error={errors.destination?.state?.message}
              placeholder="Ex: RJ (2 letters)"
              maxLength={2}
              style={{ textTransform: "uppercase" }}
              required={!editMode}
              disabled={editMode}
              className={editMode ? "bg-gray-100 dark:bg-gray-800" : ""}
            />
            <Input
              label="CEP (ZIP Code)"
              {...register("destination.zipCode", {
                onChange: editMode
                  ? undefined
                  : (e) => {
                      // Format CEP as user types
                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length > 5) {
                        value = value.replace(/(\d{5})(\d{1,3})/, "$1-$2");
                      }
                      e.target.value = value;
                    },
              })}
              error={errors.destination?.zipCode?.message}
              placeholder="Ex: 20040-020"
              maxLength={9}
              required={!editMode}
              disabled={editMode}
              className={editMode ? "bg-gray-100 dark:bg-gray-800" : ""}
            />
          </div>
        </Card.Content>
      </Card>

      {/* Address Guidelines */}
      <Card>
        <Card.Content>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              🗺️ Address Guidelines for Brazil
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Use complete street addresses (Ex: Av. Paulista, 1000)</li>
              <li>• State codes should be 2 letters (SP, RJ, MG, etc.)</li>
              <li>• CEP format: XXXXX-XXX or XXXXXXXX</li>
              <li>• Coordinates and routes will be automatically calculated</li>
              <li>
                • Make sure addresses are valid for accurate GPS navigation
              </li>
            </ul>
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
            {editMode ? "Update Load" : "Add Load"}
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

export default LoadForm;
