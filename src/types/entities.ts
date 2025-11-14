/**
 * Represents a user in the FleetLink system
 * 
 * @interface User
 */
export interface User {
  /** Unique user identifier from Firebase Auth */
  uid: string;
  /** User's email address */
  email: string;
  /** Optional display name */
  displayName?: string;
  /** User role for authorization */
  role: 'admin';
  /** User permissions from backend */
  permissions?: string[];
  /** Account creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Represents a geographic coordinate
 * 
 * @interface Coordinate
 */
export interface Coordinate {
  /** Latitude in decimal degrees */
  lat: number;
  /** Longitude in decimal degrees */
  lng: number;
}

/**
 * Represents a physical address with coordinates
 * 
 * @interface Address
 */
export interface Address {
  /** Street address */
  street: string;
  /** City name */
  city: string;
  /** State or province */
  state: string;
  /** Postal/ZIP code */
  zipCode: string;
  /** Geographic coordinates (null until geocoding completes) */
  coordinates: Coordinate | null;
}

/**
 * Represents an uploaded document file
 * 
 * @interface DocumentFile
 */
export interface DocumentFile {
  /** Unique document identifier */
  id: string;
  /** Original filename */
  name: string;
  /** Firebase Storage download URL */
  url: string;
  /** File MIME type */
  type: 'application/pdf' | 'image/jpeg' | 'image/png';
  /** File size in bytes */
  size: number;
  /** Upload timestamp */
  uploadedAt: Date;
}

/**
 * Represents route data from Mapbox Directions API
 * 
 * @interface RouteData
 */
export interface RouteData {
  /** Total distance in meters */
  distance: number;
  /** Estimated duration in seconds */
  duration: number;
  /** GeoJSON geometry string */
  geometry: string;
  /** Array of route waypoints */
  waypoints: Coordinate[];
  /** Optional route instructions */
  instructions?: string[];
}

/**
 * Represents a truck in the fleet
 * 
 * @interface Truck
 */
export interface Truck {
  /** Unique truck identifier */
  id: string;
  /** Vehicle license plate (format: XXX-1234) */
  licensePlate: string;
  /** Truck model name */
  model: string;
  /** Cargo capacity in kilograms */
  capacity: number;
  /** Manufacturing year */
  year: number;
  /** Current operational status */
  status: 'active' | 'maintenance';
  /** ID of assigned driver (if any) */
  driverId?: string;
  /** Array of uploaded documents */
  documents?: DocumentFile[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Represents a driver in the system
 * 
 * @interface Driver
 */
export interface Driver {
  /** Unique driver identifier */
  id: string;
  /** Driver's first name */
  firstName: string;
  /** Driver's last name */
  lastName: string;
  /** Full name (computed from first + last name) */
  name: string;
  /** Contact phone number */
  phone: string;
  /** Driver license number (CNH) */
  license: string;
  /** Current driver status */
  status: 'active' | 'inactive' | 'suspended';
  /** ID of assigned truck (if any) */
  truckId?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Represents a cargo load/shipment
 * 
 * @interface Load
 */
export interface Load {
  /** Unique load identifier */
  id: string;
  /** Load description */
  description: string;
  /** Weight in kilograms */
  weight: number;
  /** Origin address */
  origin: Address;
  /** Destination address */
  destination: Address;
  /** Current load status */
  status: 'planned' | 'in_route' | 'delivered';
  /** Assigned driver ID */
  driverId: string;
  /** Assigned truck ID */
  truckId: string;
  /** Route information (if calculated) */
  route?: RouteData;
  /** Estimated delivery date */
  estimatedDelivery?: Date;
  /** Actual delivery date */
  actualDelivery?: Date;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Dashboard statistics interface
 * 
 * @interface DashboardStats
 */
export interface DashboardStats {
  /** Load counts by status */
  loadsByStatus: {
    planned: number;
    in_route: number;
    delivered: number;
  };
  /** Number of active drivers */
  activeDrivers: number;
  /** Number of available trucks */
  availableTrucks: number;
  /** Total loads count */
  totalLoads: number;
  /** Total drivers count */
  totalDrivers: number;
  /** Total trucks count */
  totalTrucks: number;
  /** Recent loads for display */
  recentLoads: Load[];
}

/**
 * API response wrapper interface
 * 
 * @interface ApiResponse
 * @template T The type of data being returned
 */
export interface ApiResponse<T> {
  /** Response data */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Success status */
  success: boolean;
  /** Response message */
  message?: string;
}

/**
 * Form validation error interface
 * 
 * @interface ValidationError
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;
  /** Error message */
  message: string;
}

/**
 * Pagination parameters interface
 * 
 * @interface PaginationParams
 */
export interface PaginationParams {
  /** Page number (0-based) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response interface
 * 
 * @interface PaginatedResponse
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];
  /** Total number of items */
  total: number;
  /** Current page */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of pages */
  totalPages: number;
  /** Has next page */
  hasNext: boolean;
  /** Has previous page */
  hasPrevious: boolean;
}

/**
 * Create/Update form data types (excluding system fields)
 */

/** Truck form data for create/update operations */
export type TruckFormData = Omit<Truck, 'id' | 'createdAt' | 'updatedAt'>;

/** Driver form data for create/update operations */
export type DriverFormData = Omit<Driver, 'id' | 'createdAt' | 'updatedAt' | 'name'>;



/**
 * Error types for better error handling
 */
export interface FirebaseError extends Error {
  code: string;
  message: string;
}

export interface ValidationErrorDetails {
  field: string;
  message: string;
  value?: unknown;
}

export interface ApiErrorResponse {
  error: string;
  success: false;
  message?: string;
  details?: ValidationErrorDetails[];
}