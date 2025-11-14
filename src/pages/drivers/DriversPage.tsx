// components
import React, { useState } from "react";

// utils
import { toastMessages } from "../../utils/toast";

// internal components
import DriverForm from "../../components/forms/DriverForm";
import ConfirmModal from "../../components/ui/ConfirmModal";

import EntityTable, { EntityConfig } from "../../components/ui/EntityTable";
import Modal from "../../components/ui/Modal";

// data
import { driverColumns } from "../../data/tableColumns";

// hooks
import {
  useCreateDriver,
  useDeleteDriver,
  useDrivers,
  useTrucks,
  useUpdateDriver,
} from "../../hooks/useQuery";

// types
import { Driver } from "../../types/entities";

const Drivers: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);

  // Entity configuration
  const driverEntity: EntityConfig<Driver> = {
    name: "Driver",
    namePlural: "Fleet Drivers",
    description: "Manage your fleet drivers and their information",
    resource: "drivers",
    identifierField: "license",
    displayNameField: "name",
  };

  // React Query hooks
  const { data: drivers, isLoading, error } = useDrivers();
  const { data: trucks = [], isLoading: trucksLoading } = useTrucks();
  const createDriverMutation = useCreateDriver();
  const updateDriverMutation = useUpdateDriver();
  const deleteDriverMutation = useDeleteDriver();

  // EntityTable handles permissions internally

  // Entity table handlers
  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setShowForm(true);
  };

  const handleDelete = (driver: Driver) => {
    setDeletingDriver(driver);
  };

  const handleCreate = () => {
    setShowForm(true);
  };

  // Form handlers
  const handleCreateDriver = async (data: any) => {
    try {
      // Check for duplicate license number
      const existingDriverByLicense = drivers?.find(
        (driver) => driver.license === data.license
      );

      if (existingDriverByLicense) {
        toastMessages.duplicateError("License number", data.license, "driver");
        return;
      }

      // Parse name into firstName and lastName
      const nameParts = data.name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || firstName;

      const driverData = {
        ...data,
        firstName,
        lastName,
        name: data.name,
        status: data.status as "active" | "inactive",
      };

      await createDriverMutation.mutateAsync(driverData);
      setShowForm(false);
      toastMessages.created("Driver", data.name);
    } catch (error) {
      console.error("Failed to create driver:", error);
      toastMessages.createError("Driver");
    }
  };

  const handleUpdateDriver = async (data: any) => {
    if (!editingDriver) return;

    try {
      // Check for duplicate license number (excluding current driver)
      const existingDriverByLicense = drivers?.find(
        (driver) =>
          driver.license === data.license && driver.id !== editingDriver.id
      );

      if (existingDriverByLicense) {
        throw new Error(`Driver with license ${data.license} already exists`);
      }

      // Convert form data to match expected mutation type
      const driverData = {
        firstName: editingDriver.firstName || "",
        lastName: editingDriver.lastName || "",
        name: data.name,
        phone: data.phone,
        license: data.license,
        status: data.status as "active" | "inactive",
        truckId: data.truckId || undefined, // Convert null to undefined
      };

      await updateDriverMutation.mutateAsync({
        id: editingDriver.id,
        data: driverData,
      });
      setShowForm(false);
      setEditingDriver(null);
      toastMessages.updated("Driver", data.name);
    } catch (error) {
      console.error("Failed to update driver:", error);
      toastMessages.updateError("Driver");
    }
  };

  const handleDeleteDriver = async () => {
    if (!deletingDriver) return;

    try {
      await deleteDriverMutation.mutateAsync(deletingDriver.id);
      toastMessages.deleted("Driver", deletingDriver.name);
      setDeletingDriver(null);
    } catch (error) {
      console.error("Failed to delete driver:", error);
      toastMessages.deleteError("Driver");
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingDriver(null);
  };

  // Statistics for EntityTable
  const stats = React.useMemo(() => {
    if (!drivers) {
      return [
        { label: "Total Drivers", value: 0, loading: isLoading },
        {
          label: "Active Drivers",
          value: 0,
          valueColor: "text-green-600",
          loading: isLoading,
        },
        {
          label: "Inactive Drivers",
          value: 0,
          valueColor: "text-gray-600",
          loading: isLoading,
        },
        {
          label: "Assigned",
          value: 0,
          valueColor: "text-blue-600",
          loading: isLoading,
        },
      ];
    }

    const active = drivers.filter((d) => d.status === "active").length;
    const inactive = drivers.filter((d) => d.status === "inactive").length;
    const assigned = drivers.filter((d) => !!d.truckId).length;

    return [
      { label: "Total Drivers", value: drivers.length, loading: false },
      {
        label: "Active Drivers",
        value: active,
        valueColor: "text-green-600",
        loading: false,
      },
      {
        label: "Inactive Drivers",
        value: inactive,
        valueColor: "text-gray-600",
        loading: false,
      },
      {
        label: "Assigned",
        value: assigned,
        valueColor: "text-blue-600",
        loading: false,
      },
    ];
  }, [drivers, isLoading]);

  return (
    <div className="space-y-6">
      {/* Entity Table with integrated header, stats, and data */}
      <EntityTable
        entity={driverEntity}
        data={drivers}
        columns={driverColumns}
        isLoading={isLoading}
        error={error as Error | null}
        onCreateClick={handleCreate}
        onEditClick={handleEdit}
        onDeleteClick={handleDelete}
        showStats={true}
        stats={stats}
        emptyMessage="No drivers in your fleet"
        emptyDescription="Build your team by adding your first driver."
        pageSize={10}
      />

      {/* Driver Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingDriver ? "Edit Driver" : "Add New Driver"}
        size="xl"
      >
        <DriverForm
          initialData={editingDriver || undefined}
          trucks={trucks
            .filter(
              (truck) =>
                // Show all trucks except those assigned to OTHER drivers
                // Include the truck currently assigned to this driver (for editing)
                !truck.driverId || truck.driverId === editingDriver?.id
            )
            .map((truck) => ({
              id: truck.id,
              licensePlate: truck.licensePlate,
              model: truck.model,
              status: truck.status,
            }))}
          onSubmit={editingDriver ? handleUpdateDriver : handleCreateDriver}
          onCancel={handleCloseForm}
          loading={
            createDriverMutation.isPending ||
            updateDriverMutation.isPending ||
            trucksLoading
          }
          editMode={!!editingDriver}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingDriver}
        onClose={() => setDeletingDriver(null)}
        onConfirm={handleDeleteDriver}
        title="Delete Driver"
        message={
          deletingDriver
            ? `Are you sure you want to delete driver "${deletingDriver.name}" (License: ${deletingDriver.license})? This action cannot be undone and will remove all associated data.`
            : ""
        }
        confirmText="Delete Driver"
        cancelText="Cancel"
        loading={deleteDriverMutation.isPending}
        confirmVariant="destructive"
      />
    </div>
  );
};

export default Drivers;
