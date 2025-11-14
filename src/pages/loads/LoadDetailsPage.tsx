// components
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// internal components
import PageHeader from "../../components/layout/PageHeader";
import InteractiveMap from "../../components/map/InteractiveMap";
import { Button } from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LoadingState from "../../components/ui/LoadingState";

// hooks
import { useLoads, useProcessLoadRoute } from "../../hooks/useQuery";

// data
import { LoadStatusBadge } from "../../data/tableColumns";

// types
import { Load } from "../../types/entities";

/**
 * LoadDetailsPage - Shows detailed view of a specific load with map visualization
 */
const LoadDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: loads, isLoading, error } = useLoads();
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const processRoute = useProcessLoadRoute();

  // Find the specific load
  useEffect(() => {
    if (loads && id) {
      const load = loads.find((l) => l.id === id);
      setSelectedLoad(load || null);

      // Auto-process route if load exists but doesn't have coordinates or route
      const hasValid = (c?: { lat: number; lng: number } | null) =>
        !!c && Math.abs(c.lat) > 0.0001 && Math.abs(c.lng) > 0.0001;

      if (
        load &&
        (!hasValid(load.origin.coordinates) ||
          !hasValid(load.destination.coordinates) ||
          !load.route)
      ) {
        processRoute.mutate(load.id);
      }
    }
  }, [loads, id, processRoute]);

  if (isLoading) {
    return <LoadingState message="Loading load details..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load details</p>
        <Button onClick={() => navigate("/loads")}>Back to Loads</Button>
      </div>
    );
  }

  if (!selectedLoad) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Load Not Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The requested load could not be found.
        </p>
        <Button onClick={() => navigate("/loads")}>Back to Loads</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Load Details"
        subtitle={`Track and monitor cargo shipment - #${selectedLoad.id}`}
        action={{
          label: "Back to Loads",
          onClick: () => navigate("/loads"),
          variant: "outline",
        }}
      />

      {/* Map and Route Information Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Information Card - Left Side */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <Card.Header title="Route Information" />
            <Card.Content className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-2">
                    Origin
                  </h4>
                  <div className="text-sm text-gray-900 dark:text-white">
                    <p>{selectedLoad.origin.street}</p>
                    <p>
                      {selectedLoad.origin.city}, {selectedLoad.origin.state}
                    </p>
                    <p>{selectedLoad.origin.zipCode}</p>
                    {selectedLoad.origin.coordinates &&
                      Math.abs(selectedLoad.origin.coordinates.lat) > 0.0001 &&
                      Math.abs(selectedLoad.origin.coordinates.lng) >
                        0.0001 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          ✓ Coordinates:{" "}
                          {selectedLoad.origin.coordinates.lat.toFixed(6)},{" "}
                          {selectedLoad.origin.coordinates.lng.toFixed(6)}
                        </p>
                      )}
                    {(!selectedLoad.origin.coordinates ||
                      Math.abs(selectedLoad.origin.coordinates.lat) <= 0.0001 ||
                      Math.abs(selectedLoad.origin.coordinates.lng) <=
                        0.0001) && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        ⚠ Coordinates pending geocoding
                      </p>
                    )}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-red-600 mb-2">
                    Destination
                  </h4>
                  <div className="text-sm text-gray-900 dark:text-white">
                    <p>{selectedLoad.destination.street}</p>
                    <p>
                      {selectedLoad.destination.city},{" "}
                      {selectedLoad.destination.state}
                    </p>
                    <p>{selectedLoad.destination.zipCode}</p>
                    {selectedLoad.destination.coordinates &&
                      Math.abs(selectedLoad.destination.coordinates.lat) >
                        0.0001 &&
                      Math.abs(selectedLoad.destination.coordinates.lng) >
                        0.0001 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          ✓ Coordinates:{" "}
                          {selectedLoad.destination.coordinates.lat.toFixed(6)},{" "}
                          {selectedLoad.destination.coordinates.lng.toFixed(6)}
                        </p>
                      )}
                    {(!selectedLoad.destination.coordinates ||
                      Math.abs(selectedLoad.destination.coordinates.lat) <=
                        0.0001 ||
                      Math.abs(selectedLoad.destination.coordinates.lng) <=
                        0.0001) && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        ⚠ Coordinates pending geocoding
                      </p>
                    )}
                  </div>
                </div>
                {selectedLoad.route && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-blue-600 mb-2">
                      Route Details
                    </h4>
                    <div className="text-sm text-gray-900 dark:text-white space-y-1">
                      <p>
                        Distance:{" "}
                        <span className="font-medium">
                          {(selectedLoad.route.distance / 1000).toFixed(1)} km
                        </span>
                      </p>
                      <p>
                        Estimated Duration:{" "}
                        <span className="font-medium">
                          {Math.floor(selectedLoad.route.duration / 3600)}h{" "}
                          {Math.floor(
                            (selectedLoad.route.duration % 3600) / 60
                          )}
                          min
                        </span>
                      </p>
                      {selectedLoad.route.instructions &&
                        selectedLoad.route.instructions.length > 0 && (
                          <p>
                            Instructions:{" "}
                            <span className="font-medium">
                              {selectedLoad.route.instructions.length} steps
                            </span>
                          </p>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Interactive Map - Right Side */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header title="Interactive Route Map" />
            <Card.Content>
              <div className="h-[600px] rounded-lg overflow-hidden">
                <InteractiveMap
                  load={selectedLoad}
                  height={600}
                  className="w-full h-full"
                  showDetails={true}
                  enableRealTimeTracking={selectedLoad.status === "in_route"}
                  onRouteCalculated={(route: any) => {
                    console.log("Route calculated:", route);
                  }}
                  onRouteError={(error: any) => {
                    console.error("Route calculation error:", error);
                  }}
                />
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Load Information */}
      {selectedLoad && (
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Load Information
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description:
                </span>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedLoad.description}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Weight:
                </span>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedLoad.weight.toLocaleString()} kg
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status:
                </span>
                <div className="mt-1">
                  <LoadStatusBadge status={selectedLoad.status} />
                </div>
              </div>
              {selectedLoad.estimatedDelivery && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Estimated Delivery:
                  </span>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(
                      selectedLoad.estimatedDelivery
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
              {selectedLoad.actualDelivery && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Actual Delivery:
                  </span>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedLoad.actualDelivery).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LoadDetailsPage;
