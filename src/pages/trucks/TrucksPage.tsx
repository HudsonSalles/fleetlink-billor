// components
import React, { useState } from "react";

import { showToast, toastMessages } from "../../utils/toast";

// internal components
import TruckForm from "../../components/forms/TruckForm";
import ConfirmModal from "../../components/ui/ConfirmModal";
import EntityTable, { EntityConfig } from "../../components/ui/EntityTable";
import Modal from "../../components/ui/Modal";

// data
import { truckColumns } from "../../data/tableColumns";

// hooks
import {
  useCreateTruck,
  useDeleteTruck,
  useDrivers,
  useTrucks,
  useUpdateTruck,
} from "../../hooks/useQuery";

// services
import { uploadTruckDocuments, validateFiles } from "../../services/storage";

// types
import { Truck } from "../../types/entities";

const Trucks: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [deletingTruck, setDeletingTruck] = useState<Truck | null>(null);
  const [pendingDocuments, setPendingDocuments] = useState<FileList | null>(
    null
  );

  // React Query hooks
  const { data: trucks, isLoading, error } = useTrucks();
  const { data: drivers = [], isLoading: driversLoading } = useDrivers();
  const createTruckMutation = useCreateTruck();
  const updateTruckMutation = useUpdateTruck();
  const deleteTruckMutation = useDeleteTruck();

  // Entity configuration
  const truckEntity: EntityConfig<Truck> = {
    name: "Truck",
    namePlural: "Fleet Trucks",
    description: "Manage your fleet trucks and their status",
    resource: "trucks",
    identifierField: "licensePlate",
    displayNameField: "licensePlate",
  };

  // EntityTable handles permissions internally

  // Entity table handlers
  const handleEdit = (truck: Truck) => {
    setEditingTruck(truck);
    setShowForm(true);
  };

  const handleDelete = (truck: Truck) => {
    setDeletingTruck(truck);
  };

  const handleCreate = () => {
    setShowForm(true);
  };

  // Form handlers
  const handleCreateTruck = async (data: any) => {
    try {
      // Check for duplicate license plate
      const existingTruck = trucks?.find(
        (truck) =>
          truck.licensePlate.toLowerCase() === data.licensePlate.toLowerCase()
      );

      if (existingTruck) {
        toastMessages.duplicateError(
          "License plate",
          data.licensePlate,
          "truck"
        );
        return;
      }

      // Create the truck first
      const newTruckId = await createTruckMutation.mutateAsync(data);

      // If there are pending documents, upload them now
      if (pendingDocuments && pendingDocuments.length > 0) {
        try {
          console.log("Uploading pending documents for new truck:", newTruckId);
          const uploadedDocs = await uploadTruckDocuments(
            pendingDocuments,
            newTruckId
          );

          // Update the newly created truck with documents
          await updateTruckMutation.mutateAsync({
            id: newTruckId,
            data: { documents: uploadedDocs },
          });

          showToast.success(
            `Truck created and ${uploadedDocs.length} document(s) uploaded successfully`
          );
        } catch (uploadError) {
          console.error(
            "Document upload failed after truck creation:",
            uploadError
          );
          showToast.warning(
            "Truck created successfully, but document upload failed. You can upload documents later by editing the truck."
          );
        }
      } else {
        toastMessages.created("Truck", data.licensePlate);
      }

      setShowForm(false);
      setPendingDocuments(null); // Clear pending documents
    } catch (error) {
      console.error("Failed to create truck:", error);
      toastMessages.createError("Truck");
    }
  };

  const handleUpdateTruck = async (data: any) => {
    if (!editingTruck) return;

    try {
      // Check for duplicate license plate (excluding current truck)
      const existingTruck = trucks?.find(
        (truck) =>
          truck.id !== editingTruck.id &&
          truck.licensePlate.toLowerCase() === data.licensePlate.toLowerCase()
      );

      if (existingTruck) {
        toastMessages.duplicateError(
          "License plate",
          data.licensePlate,
          "truck"
        );
        return;
      }

      await updateTruckMutation.mutateAsync({
        id: editingTruck.id,
        data,
      });
      setShowForm(false);
      setEditingTruck(null);
      toastMessages.updated("Truck", data.licensePlate);
    } catch (error) {
      console.error("Failed to update truck:", error);
      toastMessages.updateError("Truck");
    }
  };

  const handleDeleteTruck = async () => {
    if (!deletingTruck) return;

    try {
      await deleteTruckMutation.mutateAsync(deletingTruck.id);
      toastMessages.deleted("Truck", deletingTruck.licensePlate);
      setDeletingTruck(null);
    } catch (error) {
      console.error("Failed to delete truck:", error);
      toastMessages.deleteError("Truck");
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (files: FileList) => {
    try {
      console.log("Document upload started", { fileCount: files.length });

      // Validate files before upload
      const validation = validateFiles(files);
      if (!validation.isValid) {
        validation.errors.forEach((error) => {
          showToast.error(error);
        });
        return;
      }

      // For editing existing trucks, upload immediately
      if (editingTruck) {
        console.log("Uploading documents for existing truck:", editingTruck.id);
        const uploadedDocs = await uploadTruckDocuments(files, editingTruck.id);
        showToast.success(
          `Successfully uploaded ${uploadedDocs.length} document(s)`
        );

        // Update truck with new documents
        const existingDocs = editingTruck.documents || [];
        const updatedDocs = [...existingDocs, ...uploadedDocs];

        await updateTruckMutation.mutateAsync({
          id: editingTruck.id,
          data: { documents: updatedDocs },
        });
      } else {
        // For new trucks, store files for later upload after truck creation
        setPendingDocuments(files);
        showToast.info(
          `${files.length} document(s) prepared. They will be uploaded when you save the truck.`
        );
      }
    } catch (error) {
      console.error("Document upload error details:", error);

      // Show more specific error message
      let errorMessage = "Failed to upload documents";
      if (error instanceof Error) {
        if (error.message.includes("permission")) {
          errorMessage =
            "Permission denied. Please check Firebase Storage rules.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes("auth")) {
          errorMessage = "Authentication error. Please sign in again.";
        } else {
          errorMessage = `Upload failed: ${error.message}`;
        }
      }

      showToast.error(errorMessage);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTruck(null);
    setPendingDocuments(null); // Clear any pending documents
  };

  // Statistics for EntityTable
  const stats = React.useMemo(() => {
    if (!trucks) {
      return [
        { label: "Total Vehicles", value: 0, loading: isLoading },
        {
          label: "Active",
          value: 0,
          valueColor: "text-green-600",
          loading: isLoading,
        },
        {
          label: "In Maintenance",
          value: 0,
          valueColor: "text-yellow-600",
          loading: isLoading,
        },
        { label: "Total Capacity", value: "0 kg", loading: isLoading },
      ];
    }

    const active = trucks.filter((t) => t.status === "active").length;
    const maintenance = trucks.filter((t) => t.status === "maintenance").length;
    const totalCapacity = trucks.reduce(
      (sum, truck) => sum + truck.capacity,
      0
    );

    return [
      { label: "Total Vehicles", value: trucks.length, loading: false },
      {
        label: "Active",
        value: active,
        valueColor: "text-green-600",
        loading: false,
      },
      {
        label: "In Maintenance",
        value: maintenance,
        valueColor: "text-yellow-600",
        loading: false,
      },
      {
        label: "Total Capacity",
        value: `${totalCapacity.toLocaleString()} kg`,
        loading: false,
      },
    ];
  }, [trucks, isLoading]);

  return (
    <div className="space-y-6">
      {/* Entity Table with integrated header, stats, and data */}
      <EntityTable
        entity={truckEntity}
        data={trucks}
        columns={truckColumns}
        isLoading={isLoading}
        error={error as Error | null}
        onCreateClick={handleCreate}
        onEditClick={handleEdit}
        onDeleteClick={handleDelete}
        showStats={true}
        stats={stats}
        emptyMessage="No vehicles in your fleet"
        emptyDescription="Start building your fleet by adding your first vehicle."
        pageSize={10}
      />

      {/* Truck Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingTruck ? "Edit Truck" : "Add New Truck"}
        size="xl"
      >
        <TruckForm
          truck={editingTruck || undefined}
          drivers={drivers
            .filter(
              (driver) =>
                driver.status === "active" &&
                (!driver.truckId || driver.truckId === editingTruck?.id)
            )
            .map((driver) => ({
              id: driver.id,
              name: driver.name,
            }))}
          onSubmit={editingTruck ? handleUpdateTruck : handleCreateTruck}
          onCancel={handleCloseForm}
          onDocumentUpload={handleDocumentUpload}
          loading={
            createTruckMutation.isPending ||
            updateTruckMutation.isPending ||
            driversLoading
          }
          submitLabel={editingTruck ? "Update Truck" : "Add Truck"}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingTruck}
        onClose={() => setDeletingTruck(null)}
        onConfirm={handleDeleteTruck}
        title="Delete Truck"
        message={
          deletingTruck
            ? `Are you sure you want to delete truck "${deletingTruck.licensePlate}" (${deletingTruck.model})? This action cannot be undone and will remove all associated data.`
            : ""
        }
        confirmText="Delete Truck"
        cancelText="Cancel"
        loading={deleteTruckMutation.isPending}
        confirmVariant="destructive"
      />
    </div>
  );
};

export default Trucks;
