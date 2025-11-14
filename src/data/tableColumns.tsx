import React from "react";
import type { Column } from "../components/ui/DataTable";
import { useDrivers, useTrucks } from "../hooks/useQuery";
import { Address, Driver, Load, Truck } from "../types/entities";
import { cn } from "../utils/cn";

/**
 * Assigned Truck Cell component for drivers table
 */
interface AssignedTruckCellProps {
  driverId: string;
  truckId?: string;
}

const AssignedTruckCell: React.FC<AssignedTruckCellProps> = React.memo(
  ({ truckId }) => {
    const { data: trucks = [] } = useTrucks();

    if (!truckId) {
      return <span className="text-gray-400">--</span>;
    }

    const truck = trucks.find((t) => t.id === truckId);
    return truck ? (
      <span className="font-medium">{truck.licensePlate}</span>
    ) : (
      <span className="text-gray-400">--</span>
    );
  }
);

AssignedTruckCell.displayName = "AssignedTruckCell";

/**
 * Assigned Driver Cell component for trucks table
 */
interface AssignedDriverCellProps {
  truckId: string;
  driverId?: string;
}

const AssignedDriverCell: React.FC<AssignedDriverCellProps> = React.memo(
  ({ truckId, driverId }) => {
    const { data: drivers = [] } = useDrivers();

    // First try to find by driverId
    let driver = driverId ? drivers.find((d) => d.id === driverId) : null;

    // If not found by driverId, try to find by truckId (fallback for data consistency issues)
    if (!driver) {
      driver = drivers.find((d) => d.truckId === truckId);
    }

    if (!driver) {
      return <span className="text-gray-400">No driver assigned</span>;
    }

    return (
      <div className="flex flex-col">
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {driver.name}
        </span>
        <span className="text-xs text-gray-500">{driver.phone}</span>
      </div>
    );
  }
);

AssignedDriverCell.displayName = "AssignedDriverCell";

/**
 * Assigned Driver Cell component for loads table
 */
interface AssignedDriverForLoadCellProps {
  loadId: string;
  driverId: string;
}

const AssignedDriverForLoadCell: React.FC<AssignedDriverForLoadCellProps> =
  React.memo(({ driverId }) => {
    const { data: drivers = [] } = useDrivers();

    const driver = drivers.find((d) => d.id === driverId);
    return driver ? (
      <span className="font-medium text-blue-600 dark:text-blue-400">
        {driver.name}
      </span>
    ) : (
      <span className="text-gray-400">Driver not found</span>
    );
  });

AssignedDriverForLoadCell.displayName = "AssignedDriverForLoadCell";

/**
 * Assigned Truck Cell component for loads table
 */
interface AssignedTruckForLoadCellProps {
  loadId: string;
  truckId: string;
}

const AssignedTruckForLoadCell: React.FC<AssignedTruckForLoadCellProps> =
  React.memo(({ truckId }) => {
    const { data: trucks = [] } = useTrucks();

    const truck = trucks.find((t) => t.id === truckId);
    return truck ? (
      <span className="font-medium text-green-600 dark:text-green-400">
        {truck.licensePlate}
      </span>
    ) : (
      <span className="text-gray-400">Truck not found</span>
    );
  });

AssignedTruckForLoadCell.displayName = "AssignedTruckForLoadCell";

/**
 * Description Cell component with truncation and modal
 */
interface DescriptionCellProps {
  description: string;
}

const DescriptionCell: React.FC<DescriptionCellProps> = React.memo(
  ({ description }) => {
    const [showModal, setShowModal] = React.useState(false);

    const needsTruncation = description.length > 100;

    return (
      <>
        <div className="max-w-xs">
          <div
            className="line-clamp-2 text-sm"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-word",
            }}
          >
            {description}
          </div>
          {needsTruncation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className="text-xs text-primary-600 hover:text-primary-800 mt-1"
            >
              View all
            </button>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Load Description
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {description}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }
);

DescriptionCell.displayName = "DescriptionCell";

/**
 * Tooltip component for enhanced hover information
 */
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
            transform: "translate(-50%, -100%)",
            maxWidth: "300px",
            wordBreak: "break-word",
          }}
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </>
  );
};

/**
 * Address Cell component with truncation and tooltip
 */
interface AddressCellProps {
  address: Address;
}

const AddressCell: React.FC<AddressCellProps> = React.memo(({ address }) => {
  const fullAddress =
    address.street ||
    `${address.city}, ${address.state} ${address.zipCode}`.trim();
  const displayText =
    fullAddress.length > 25
      ? fullAddress.substring(0, 25) + "..."
      : fullAddress;

  if (!fullAddress || fullAddress === ", ") {
    return <span className="text-gray-400">--</span>;
  }

  return (
    <Tooltip content={fullAddress}>
      <div className="truncate cursor-help">{displayText}</div>
    </Tooltip>
  );
});

AddressCell.displayName = "AddressCell";

/**
 * Status badge components for different entities
 */

// Truck Status Badge
interface TruckStatusBadgeProps {
  status: Truck["status"];
}

const TruckStatusBadge: React.FC<TruckStatusBadgeProps> = React.memo(
  ({ status }) => {
    const statusConfig = {
      active: { label: "Active", color: "bg-green-100 text-green-800" },
      maintenance: {
        label: "Maintenance",
        color: "bg-yellow-100 text-yellow-800",
      },
    };

    const config = statusConfig[status];

    return (
      <span
        className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          config.color
        )}
      >
        {config.label}
      </span>
    );
  }
);

TruckStatusBadge.displayName = "TruckStatusBadge";

// Driver Status Badge
interface DriverStatusBadgeProps {
  status: Driver["status"];
}

const DriverStatusBadge: React.FC<DriverStatusBadgeProps> = React.memo(
  ({ status }) => {
    const statusConfig: Record<
      Driver["status"],
      { label: string; color: string }
    > = {
      active: { label: "Active", color: "bg-green-100 text-green-800" },
      inactive: { label: "Inactive", color: "bg-gray-100 text-gray-800" },
      suspended: { label: "Suspended", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status] || statusConfig.active;

    return (
      <span
        className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          config.color
        )}
      >
        {config.label}
      </span>
    );
  }
);

DriverStatusBadge.displayName = "DriverStatusBadge";

// Load Status Badge
interface LoadStatusBadgeProps {
  status: Load["status"];
}

const LoadStatusBadge: React.FC<LoadStatusBadgeProps> = React.memo(
  ({ status }) => {
    const statusConfig: Record<
      Load["status"],
      { label: string; color: string }
    > = {
      planned: { label: "Planned", color: "bg-blue-100 text-blue-800" },
      in_route: { label: "In Route", color: "bg-yellow-100 text-yellow-800" },
      delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
    };

    const config = statusConfig[status] || statusConfig.planned;

    return (
      <span
        className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          config.color
        )}
      >
        {config.label}
      </span>
    );
  }
);

LoadStatusBadge.displayName = "LoadStatusBadge";

// Export status badge components for individual use
export { DriverStatusBadge, LoadStatusBadge, TruckStatusBadge };

/**
 * Centralized table column definitions
 */

// Truck columns
export const truckColumns: Column<Truck>[] = [
  {
    key: "licensePlate",
    header: "License Plate",
    sortable: true,
    width: "150px",
  },
  {
    key: "model",
    header: "Model",
    sortable: true,
    width: "120px",
  },
  {
    key: "year",
    header: "Year",
    sortable: true,
    width: "100px",
  },
  {
    key: "capacity",
    header: "Capacity",
    sortable: true,
    width: "120px",
    accessor: (truck: Truck) => `${truck.capacity.toLocaleString()} kg`,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    width: "130px",
    accessor: (truck: Truck) => <TruckStatusBadge status={truck.status} />,
  },
  {
    key: "driverId",
    header: "Assigned Driver",
    sortable: false,
    width: "150px",
    accessor: (truck: Truck) => (
      <AssignedDriverCell truckId={truck.id} driverId={truck.driverId} />
    ),
  },
  {
    key: "updatedAt",
    header: "Last Modified",
    sortable: true,
    width: "140px",
    accessor: (truck: Truck) => new Date(truck.updatedAt).toLocaleDateString(),
  },
];

// Driver columns
export const driverColumns: Column<Driver>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    width: "200px",
  },
  {
    key: "license",
    header: "License",
    sortable: true,
    width: "150px",
  },
  {
    key: "phone",
    header: "Phone",
    sortable: true,
    width: "130px",
  },
  {
    key: "truckId",
    header: "Truck",
    sortable: false,
    width: "150px",
    accessor: (driver: Driver) => (
      <AssignedTruckCell driverId={driver.id} truckId={driver.truckId} />
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    width: "120px",
    accessor: (driver: Driver) => <DriverStatusBadge status={driver.status} />,
  },
  {
    key: "updatedAt",
    header: "Last Modified",
    sortable: true,
    width: "140px",
    accessor: (driver: Driver) =>
      new Date(driver.updatedAt).toLocaleDateString(),
  },
];

// Load columns - Following PRD: description, weight, origin (address), destination (address), status, driver, truck
export const loadColumns: Column<Load>[] = [
  {
    key: "description",
    header: "Description",
    sortable: true,
    width: "250px",
    accessor: (load: Load) => (
      <DescriptionCell description={load.description} />
    ),
  },
  {
    key: "weight",
    header: "Weight (kg)",
    sortable: true,
    width: "120px",
    accessor: (load: Load) => load.weight.toLocaleString() + " kg",
  },
  {
    key: "origin",
    header: "Origin",
    sortable: false,
    width: "180px",
    accessor: (load: Load) => <AddressCell address={load.origin} />,
  },
  {
    key: "destination",
    header: "Destination",
    sortable: false,
    width: "180px",
    accessor: (load: Load) => <AddressCell address={load.destination} />,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    width: "120px",
    accessor: (load: Load) => <LoadStatusBadge status={load.status} />,
  },
  {
    key: "driverId",
    header: "Driver",
    sortable: false,
    width: "130px",
    accessor: (load: Load) => (
      <AssignedDriverForLoadCell loadId={load.id} driverId={load.driverId} />
    ),
  },
  {
    key: "truckId",
    header: "Truck",
    sortable: false,
    width: "130px",
    accessor: (load: Load) => (
      <AssignedTruckForLoadCell loadId={load.id} truckId={load.truckId} />
    ),
  },
  {
    key: "updatedAt",
    header: "Modified",
    sortable: true,
    width: "120px",
    accessor: (load: Load) => new Date(load.updatedAt).toLocaleDateString(),
  },
];
