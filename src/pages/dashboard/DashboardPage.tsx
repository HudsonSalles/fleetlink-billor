// components
import React, { useMemo, useState } from "react";
import { cn } from "../../utils/cn";

// internal components
import { Button } from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LoadingState from "../../components/ui/LoadingState";
import Modal from "../../components/ui/Modal";

// forms
import DriverForm from "../../components/forms/DriverForm";
import LoadForm, { LoadFormData } from "../../components/forms/LoadForm";
import TruckForm, { TruckFormData } from "../../components/forms/TruckForm";

// hooks
import {
  useCreateDriver,
  useCreateLoad,
  useCreateTruck,
  useDrivers,
  useLoads,
  useTrucks,
} from "../../hooks/useQuery";

// utils
import { toastMessages } from "../../utils/toast";

// context
import { useAuthStore } from "../../stores/authStore";

/**
 * Multi-segment stats card component interface
 */
interface MultiSegmentStatsCardProps {
  title: string;
  total: number;
  segments: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  icon: string;
  className?: string;
  centerValue?: string; // Optional custom center value
}

const MultiSegmentStatsCard: React.FC<MultiSegmentStatsCardProps> = ({
  title,
  total,
  segments,
  icon,
  className,
  centerValue,
}) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {total}
          </p>
          <div className="space-y-1 mt-3">
            {segments.map((segment, index) => {
              // Calculate raw count from percentage and total
              const rawCount = Math.round((segment.value / 100) * total);
              return (
                <div key={index} className="flex items-center text-sm">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    {segment.label}: {rawCount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {total > 0 && (
          <div className="relative w-24 h-24 ml-4">
            <svg className="w-24 h-24 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Segment circles */}
              {segments.map((segment, index) => {
                // Use the percentage value directly for SVG calculation since we're now passing percentages
                const segmentPercentage = total > 0 ? segment.value / 100 : 0;
                const offset = circumference * (1 - segmentPercentage);
                const previousSegmentsValue = segments
                  .slice(0, index)
                  .reduce((sum, prev) => sum + prev.value, 0);
                const rotation = (previousSegmentsValue / 100) * 360;

                return (
                  <circle
                    key={index}
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke={segment.color}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                    style={{
                      transformOrigin: "48px 48px",
                      transform: `rotate(${rotation}deg)`,
                    }}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {centerValue ||
                  (() => {
                    if (total === 0 || segments.length === 0) return "0%";
                    const maxSegment = Math.max(
                      ...segments.map((s) => s.value)
                    );
                    return `${maxSegment}%`;
                  })()}
              </span>
            </div>
          </div>
        )}
        {total === 0 && <div className="text-4xl ml-4">{icon}</div>}
      </div>
    </Card>
  );
};

/**
 * Quick Action component interface
 */
interface QuickActionProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  title,
  description,
  onClick,
  disabled = false,
}) => (
  <Button
    variant="outline"
    size="lg"
    className="h-auto p-6 flex flex-col items-center text-center space-y-2 hover:shadow-md transition-all duration-200"
    onClick={onClick}
    disabled={disabled}
  >
    <span className="text-2xl">{icon}</span>
    <div>
      <p className="font-medium text-gray-900 dark:text-white">{title}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {description}
      </p>
    </div>
  </Button>
);

/**
 * Recent Activity item interface
 */
interface ActivityItemProps {
  type: "truck" | "driver" | "load";
  title: string;
  description: string;
  timestamp: Date;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  type,
  title,
  description,
  timestamp,
}) => {
  const iconMap = {
    truck: "🚚",
    driver: "👨‍💼",
    load: "📋",
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
        <span className="text-sm">{iconMap[type]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {title}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
      <div className="flex-shrink-0">
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  // Mutation hooks
  const createTruckMutation = useCreateTruck();
  const createDriverMutation = useCreateDriver();
  const createLoadMutation = useCreateLoad();

  // Modal state
  const [modals, setModals] = useState({
    truck: false,
    driver: false,
    load: false,
  });

  // Fetch data using React Query hooks
  const { data: trucks, isLoading: trucksLoading } = useTrucks();
  const { data: drivers, isLoading: driversLoading } = useDrivers();
  const { data: loads, isLoading: loadsLoading } = useLoads();

  // Modal handlers
  const openModal = (type: "truck" | "driver" | "load") => {
    setModals((prev) => ({ ...prev, [type]: true }));
  };

  const closeModal = (type: "truck" | "driver" | "load") => {
    setModals((prev) => ({ ...prev, [type]: false }));
  };

  // Form submission handlers with proper type conversion
  const handleTruckSubmit = async (data: TruckFormData) => {
    try {
      // Convert form data to match expected mutation type
      const truckData = {
        ...data,
        driverId: data.driverId || undefined, // Convert null to undefined
      };
      await createTruckMutation.mutateAsync(truckData);
      toastMessages.created("Truck");
      closeModal("truck");
    } catch (error) {
      toastMessages.createError("Truck");
      console.error("Error creating truck:", error);
    }
  };

  const handleDriverSubmit = async (data: any) => {
    try {
      // Convert form data to match expected mutation type with split names
      const driverData = {
        firstName: "", // DriverForm only has 'name' field, split it
        lastName: "",
        name: data.name,
        phone: data.phone,
        license: data.license,
        status: data.status as "active" | "inactive",
        truckId: data.truckId || undefined, // Convert null to undefined
      };
      await createDriverMutation.mutateAsync(driverData);
      toastMessages.created("Driver");
      closeModal("driver");
    } catch (error) {
      toastMessages.createError("Driver");
      console.error("Error creating driver:", error);
    }
  };

  const handleLoadSubmit = async (data: LoadFormData) => {
    try {
      // Convert form data to match expected mutation type
      const loadData = {
        ...data,
        status:
          data.status === "in route"
            ? ("in_route" as const)
            : (data.status as "planned" | "delivered"),
      };
      await createLoadMutation.mutateAsync(loadData);
      toastMessages.created("Load");
      closeModal("load");
    } catch (error) {
      toastMessages.createError("Load");
      console.error("Error creating load:", error);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const driversCount = drivers?.length || 0;
    const activeCount =
      drivers?.filter((driver) => driver.status === "active").length || 0;
    const inactiveCount =
      drivers?.filter((driver) => driver.status === "inactive").length || 0;
    const suspendedCount =
      drivers?.filter((driver) => driver.status === "suspended").length || 0;

    // Debug log to understand driver statuses
    console.log("Dashboard Driver Stats Debug:", {
      totalDrivers: driversCount,
      activeDrivers: activeCount,
      inactiveDrivers: inactiveCount,
      suspendedDrivers: suspendedCount,
      driverStatuses:
        drivers?.map((d) => ({ name: d.name, status: d.status })) || [],
    });

    return {
      totalTrucks: trucks?.length || 0,
      totalDrivers: driversCount,
      totalLoads: loads?.length || 0,
      activeTrucks:
        trucks?.filter((truck) => truck.status === "active").length || 0,
      activeDrivers: activeCount,
      pendingLoads:
        loads?.filter((load) => load.status === "planned").length || 0,
    };
  }, [trucks, drivers, loads]);

  // Get recent activities
  const recentActivities = useMemo(() => {
    const activities: ActivityItemProps[] = [];

    // Add truck activities
    if (trucks) {
      trucks.slice(0, 3).forEach((truck) => {
        activities.push({
          type: "truck",
          title: `Truck ${truck.licensePlate}`,
          description: `Status: ${truck.status}`,
          timestamp: truck.updatedAt,
        });
      });
    }

    // Add driver activities
    if (drivers) {
      drivers.slice(0, 3).forEach((driver) => {
        activities.push({
          type: "driver",
          title: `${driver.firstName} ${driver.lastName}`,
          description: `Status: ${driver.status}`,
          timestamp: driver.updatedAt,
        });
      });
    }

    // Add load activities
    if (loads) {
      loads.slice(0, 3).forEach((load) => {
        activities.push({
          type: "load",
          title: `Load #${load.id.slice(-6)}`,
          description: `New load from ${load.origin.city} to ${load.destination.city}`,
          timestamp: load.updatedAt,
        });
      });
    }

    return activities.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }, [trucks, drivers, loads]);

  // Show loading state
  if (trucksLoading || driversLoading || loadsLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1 md:mt-2">
          Welcome back{user?.email ? `, ${user.email}` : ""}! Here's an overview
          of your fleet operations.
        </p>
      </div>

      {/* Statistics Cards with Radial Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <MultiSegmentStatsCard
          title="Total Trucks"
          total={stats.totalTrucks}
          segments={[
            {
              label: "Active",
              value: Math.round(
                ((trucks?.filter((truck) => truck.status === "active").length ||
                  0) /
                  (stats.totalTrucks || 1)) *
                  100
              ),
              color: "#10b981",
            },
            {
              label: "Maintenance",
              value: Math.round(
                ((trucks?.filter((truck) => truck.status === "maintenance")
                  .length || 0) /
                  (stats.totalTrucks || 1)) *
                  100
              ),
              color: "#f59e0b",
            },
          ]}
          icon="🚚"
        />
        <MultiSegmentStatsCard
          title="Total Drivers"
          total={stats.totalDrivers}
          centerValue={`${Math.round(((drivers?.filter((driver) => driver.status === "active").length || 0) / (stats.totalDrivers || 1)) * 100)}%`}
          segments={(() => {
            const activeCount =
              drivers?.filter((driver) => driver.status === "active").length ||
              0;
            const inactiveCount =
              drivers?.filter((driver) => driver.status === "inactive")
                .length || 0;

            const segments = [
              {
                label: "Active",
                value: Math.round(
                  (activeCount / (stats.totalDrivers || 1)) * 100
                ),
                color: "#10b981",
              },
              {
                label: "Inactive",
                value: Math.round(
                  (inactiveCount / (stats.totalDrivers || 1)) * 100
                ),
                color: "#6b7280",
              },
            ];

            // Debug log for segments
            console.log("Driver Segments Debug:", {
              segments: segments,
              total: stats.totalDrivers,
              percentages: segments.map((s) => ({
                ...s,
                percentage:
                  stats.totalDrivers > 0
                    ? ((s.value / stats.totalDrivers) * 100).toFixed(1) + "%"
                    : "0%",
              })),
            });

            // Always show all segments, regardless of value
            return segments;
          })()}
          icon="👨‍💼"
        />{" "}
        <MultiSegmentStatsCard
          title="Total Loads"
          total={stats.totalLoads}
          segments={[
            {
              label: "Pending",
              value: Math.round(
                ((loads?.filter((load) => load.status === "planned").length ||
                  0) /
                  (stats.totalLoads || 1)) *
                  100
              ),
              color: "#f59e0b",
            },
            {
              label: "In Route",
              value: Math.round(
                ((loads?.filter((load) => load.status === "in_route").length ||
                  0) /
                  (stats.totalLoads || 1)) *
                  100
              ),
              color: "#3b82f6",
            },
            {
              label: "Delivered",
              value: Math.round(
                ((loads?.filter((load) => load.status === "delivered").length ||
                  0) /
                  (stats.totalLoads || 1)) *
                  100
              ),
              color: "#10b981",
            },
          ]}
          icon="📋"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            icon="🚚"
            title="Add Truck"
            description="Register a new truck to your fleet"
            onClick={() => openModal("truck")}
          />
          <QuickAction
            icon="👨‍💼"
            title="Add Driver"
            description="Onboard a new driver to your team"
            onClick={() => openModal("driver")}
          />
          <QuickAction
            icon="📋"
            title="Create Load"
            description="Schedule a new load for delivery"
            onClick={() => openModal("load")}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <Card.Header>
            <Card.Title>Recent Activity</Card.Title>
            <Card.Description>
              Latest updates on trucks, drivers, and loads
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <ActivityItem key={index} {...activity} />
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Fleet Overview */}
        <Card className="lg:col-span-1">
          <Card.Header>
            <Card.Title>Fleet Overview</Card.Title>
            <Card.Description>
              Current status of your fleet operations
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Trucks
                </span>
                <span className="text-lg font-bold text-green-600">
                  {stats.activeTrucks}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Drivers
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {stats.activeDrivers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Loads
                </span>
                <span className="text-lg font-bold text-yellow-600">
                  {stats.pendingLoads}
                </span>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Modals */}
      <Modal
        isOpen={modals.truck}
        onClose={() => closeModal("truck")}
        title="Add New Truck"
        size="lg"
      >
        <TruckForm
          onSubmit={handleTruckSubmit}
          onCancel={() => closeModal("truck")}
          loading={createTruckMutation.isPending}
          drivers={drivers?.map((driver) => ({
            id: driver.id,
            name:
              driver.firstName && driver.lastName
                ? `${driver.firstName} ${driver.lastName}`
                : driver.name || "Unknown",
          }))}
        />
      </Modal>

      <Modal
        isOpen={modals.driver}
        onClose={() => closeModal("driver")}
        title="Add New Driver"
        size="lg"
      >
        <DriverForm
          onSubmit={handleDriverSubmit}
          onCancel={() => closeModal("driver")}
          loading={createDriverMutation.isPending}
          trucks={trucks
            ?.filter((truck) => truck.status === "active" && !truck.driverId)
            .map((truck) => ({
              id: truck.id,
              licensePlate: truck.licensePlate,
              model: truck.model,
              status: truck.status,
            }))}
        />
      </Modal>

      <Modal
        isOpen={modals.load}
        onClose={() => closeModal("load")}
        title="Add New Load"
        size="xl"
      >
        <LoadForm
          onSubmit={handleLoadSubmit}
          onCancel={() => closeModal("load")}
          loading={createLoadMutation.isPending}
          trucks={trucks
            ?.filter((truck) => truck.status === "active")
            .map((truck) => ({
              id: truck.id,
              licensePlate: truck.licensePlate,
              model: truck.model,
              status: truck.status,
              driverId: truck.driverId,
            }))}
          drivers={drivers
            ?.filter((driver) => driver.status === "active")
            .map((driver) => ({
              id: driver.id,
              name:
                driver.firstName && driver.lastName
                  ? `${driver.firstName} ${driver.lastName}`
                  : driver.name || "Unknown",
              status: driver.status,
              truckId: driver.truckId,
            }))}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;
