// components
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { toastMessages } from "../../utils/toast";

// internal components
import LoadForm, { LoadFormData } from "../../components/forms/LoadForm";
import { Button } from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ConfirmModal from "../../components/ui/ConfirmModal";
import EntityTable, { EntityConfig } from "../../components/ui/EntityTable";
import MapComponent from "../../components/ui/MapComponent";
import Modal from "../../components/ui/Modal";

// data
import { loadColumns, LoadStatusBadge } from "../../data/tableColumns";

// hooks
import {
  useCreateLoad,
  useDeleteLoad,
  useDrivers,
  useLoads,
  useTrucks,
  useUpdateLoad,
} from "../../hooks/useQuery";

//types
import { Load, RouteData } from "../../types/entities";

const Loads: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [deletingLoad, setDeletingLoad] = useState<Load | null>(null);
  const [selectedLoadForMap, setSelectedLoadForMap] = useState<Load | null>(
    null
  );

  // Navigation
  const navigate = useNavigate();

  // React Query hooks
  const { data: loads, isLoading, error } = useLoads();
  const { data: drivers = [], isLoading: driversLoading } = useDrivers();
  const { data: trucks = [], isLoading: trucksLoading } = useTrucks();
  const createLoadMutation = useCreateLoad();
  const updateLoadMutation = useUpdateLoad();
  const deleteLoadMutation = useDeleteLoad();

  // Entity configuration for EntityTable
  const loadEntity: EntityConfig<Load> = {
    name: "Load",
    namePlural: "Loads",
    description: "Manage your freight loads and shipments",
    resource: "loads",
    identifierField: "description",
  };

  // Entity table handlers
  const handleEdit = (load: Load) => {
    setEditingLoad(load);
    setShowForm(true);
  };

  const handleDelete = (load: Load) => {
    setDeletingLoad(load);
  };

  const handleCreate = () => {
    setShowForm(true);
  };

  const handleViewDetails = (load: Load) => {
    navigate(`/loads/${load.id}`);
  };

  // Helper to transform form data to API format
  const transformFormDataToLoad = (
    formData: LoadFormData
  ): Omit<Load, "id" | "createdAt" | "updatedAt"> => {
    return {
      ...formData,
      status:
        formData.status === "in route"
          ? "in_route"
          : (formData.status as "planned" | "in_route" | "delivered"),
      origin: formData.origin,
      destination: formData.destination,
    };
  };

  // Form handlers
  const handleCreateLoad = async (data: LoadFormData) => {
    try {
      const loadData = transformFormDataToLoad(data);
      await createLoadMutation.mutateAsync(loadData);
      toastMessages.created("Load", data.description);
      setShowForm(false);
    } catch (error) {
      console.error("Failed to add load:", error);
      toastMessages.createError("Load");
    }
  };

  const handleUpdateLoad = async (data: LoadFormData) => {
    if (!editingLoad) return;

    try {
      const loadData = transformFormDataToLoad(data);
      await updateLoadMutation.mutateAsync({
        id: editingLoad.id,
        data: loadData,
      });
      toastMessages.updated("Load");
      setShowForm(false);
      setEditingLoad(null);
    } catch (error) {
      console.error("Failed to update load:", error);
      toastMessages.updateError("Load");
    }
  };

  const handleDeleteLoad = async () => {
    if (!deletingLoad) return;

    try {
      await deleteLoadMutation.mutateAsync(deletingLoad.id);
      toastMessages.deleted("Load");
      setDeletingLoad(null);
    } catch (error) {
      console.error("Failed to delete load:", error);
      toastMessages.deleteError("Load");
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingLoad(null);
  };

  // Statistics for EntityTable
  const stats = React.useMemo(() => {
    if (!loads) {
      return [
        { label: "Total Loads", value: 0, loading: isLoading },
        {
          label: "Planned",
          value: 0,
          valueColor: "text-blue-600",
          loading: isLoading,
        },
        {
          label: "In Route",
          value: 0,
          valueColor: "text-yellow-600",
          loading: isLoading,
        },
        {
          label: "Delivered",
          value: 0,
          valueColor: "text-green-600",
          loading: isLoading,
        },
      ];
    }

    const planned = loads.filter((l) => l.status === "planned").length;
    const inRoute = loads.filter((l) => l.status === "in_route").length;
    const delivered = loads.filter((l) => l.status === "delivered").length;

    return [
      { label: "Total Loads", value: loads.length, loading: false },
      {
        label: "Planned",
        value: planned,
        valueColor: "text-blue-600",
        loading: false,
      },
      {
        label: "In Route",
        value: inRoute,
        valueColor: "text-yellow-600",
        loading: false,
      },
      {
        label: "Delivered",
        value: delivered,
        valueColor: "text-green-600",
        loading: false,
      },
    ];
  }, [loads, isLoading]);

  return (
    <div className="space-y-6">
      {/* Entity Table with integrated header, stats, and data */}
      <EntityTable
        entity={loadEntity}
        data={loads}
        columns={loadColumns}
        isLoading={isLoading}
        error={error as Error | null}
        onCreateClick={handleCreate}
        onEditClick={handleEdit}
        onDeleteClick={handleDelete}
        onViewClick={handleViewDetails}
        customActions={[
          {
            label: "Quick View",
            handler: (load: Load) => setSelectedLoadForMap(load),
            variant: "outline",
          },
        ]}
        showStats={true}
        stats={stats}
        emptyMessage="No loads in your fleet"
        emptyDescription="Start managing freight by creating your first load."
        pageSize={10}
      />

      {/* Load Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingLoad ? "Edit Load" : "Create New Load"}
        size="xl"
      >
        <LoadForm
          initialData={editingLoad || undefined}
          drivers={drivers
            .filter(
              (driver) =>
                (!driver.status || driver.status === "active") && driver.truckId // Only drivers with assigned trucks per PRD
            )
            .map((driver) => ({
              id: driver.id,
              name: driver.name,
              status: driver.status || "active",
              truckId: driver.truckId,
            }))}
          trucks={trucks
            .filter((truck) => truck.status === "active")
            .map((truck) => ({
              id: truck.id,
              licensePlate: truck.licensePlate,
              model: truck.model,
              status: truck.status,
            }))}
          onSubmit={editingLoad ? handleUpdateLoad : handleCreateLoad}
          onCancel={handleCloseForm}
          loading={
            createLoadMutation.isPending ||
            updateLoadMutation.isPending ||
            driversLoading ||
            trucksLoading
          }
          editMode={!!editingLoad}
        />
      </Modal>

      {/* Route Map Modal */}
      <Modal
        isOpen={!!selectedLoadForMap}
        onClose={() => setSelectedLoadForMap(null)}
        title={`Route Map - Load #${selectedLoadForMap?.id || "Unknown"}`}
        size="xl"
      >
        {selectedLoadForMap && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card className="p-2 md:p-4">
                <h3 className="font-semibold text-green-600 mb-2">🟢 Origin</h3>
                <p className="text-sm">{selectedLoadForMap.origin.street}</p>
                <p className="text-sm">
                  {selectedLoadForMap.origin.city},{" "}
                  {selectedLoadForMap.origin.state}{" "}
                  {selectedLoadForMap.origin.zipCode}
                </p>
              </Card>
              <Card className="p-2 md:p-4">
                <h3 className="font-semibold text-red-600 mb-2">
                  🔴 Destination
                </h3>
                <p className="text-sm">
                  {selectedLoadForMap.destination.street}
                </p>
                <p className="text-sm">
                  {selectedLoadForMap.destination.city},{" "}
                  {selectedLoadForMap.destination.state}{" "}
                  {selectedLoadForMap.destination.zipCode}
                </p>
              </Card>
            </div>

            <div className="rounded-lg overflow-hidden">
              <MapComponent
                load={selectedLoadForMap}
                height="400px"
                onRouteCalculated={(route: RouteData) => {
                  console.log("Route calculated:", route);
                  // You could save this route data to the load
                }}
              />
            </div>

            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-gray-600">
                <strong>Weight:</strong> {selectedLoadForMap.weight} kg |
                <strong> Status:</strong>{" "}
                <LoadStatusBadge status={selectedLoadForMap.status} />
              </div>
              <Button
                onClick={() => setSelectedLoadForMap(null)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingLoad}
        onClose={() => setDeletingLoad(null)}
        onConfirm={handleDeleteLoad}
        title="Delete Load"
        message={
          deletingLoad
            ? `Are you sure you want to delete this load (${deletingLoad.weight} kg)? This action cannot be undone and will remove all associated data.`
            : ""
        }
        confirmText="Delete Load"
        cancelText="Cancel"
        loading={deleteLoadMutation.isPending}
        confirmVariant="destructive"
      />
    </div>
  );
};

export default Loads;
