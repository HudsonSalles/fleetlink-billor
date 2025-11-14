/**
 * Base entity interface
 * Common fields for all database entities
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * User entity
 * Represents a user in the system
 */
export interface User extends BaseEntity {
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  companyId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  preferences: UserPreferences;
}

/**
 * User roles enum
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  DISPATCHER = 'dispatcher',
  DRIVER = 'driver',
  VIEWER = 'viewer'
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  dashboard: DashboardSettings;
  mapSettings: MapSettings;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  loadUpdates: boolean;
  maintenanceAlerts: boolean;
  emergencyAlerts: boolean;
}

/**
 * Dashboard settings
 */
export interface DashboardSettings {
  defaultView: 'overview' | 'map' | 'loads' | 'trucks';
  refreshInterval: number;
  showMetrics: boolean;
  widgetLayout: string[];
}

/**
 * Map settings
 */
export interface MapSettings {
  defaultCenter: [number, number];
  defaultZoom: number;
  style: 'streets' | 'satellite' | 'terrain';
  showTraffic: boolean;
  showWeather: boolean;
}

/**
 * Truck entity
 */
export interface Truck extends BaseEntity {
  plateNumber: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: FuelType;
  maxWeight: number;
  currentMileage: number;
  status: TruckStatus;
  assignedDriverId?: string;
  currentLocation?: Location;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  insuranceExpiry?: Date;
  registrationExpiry?: Date;
  inspectionExpiry?: Date;
  companyId: string;
  documents: Document[];
  specifications: TruckSpecifications;
}

/**
 * Fuel type enum
 */
export enum FuelType {
  DIESEL = 'diesel',
  GASOLINE = 'gasoline',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
  CNG = 'cng',
  LPG = 'lpg'
}

/**
 * Truck status enum
 */
export enum TruckStatus {
  AVAILABLE = 'available',
  IN_TRANSIT = 'in_transit',
  LOADING = 'loading',
  UNLOADING = 'unloading',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service'
}

/**
 * Truck specifications
 */
export interface TruckSpecifications {
  length: number;
  width: number;
  height: number;
  cargoCapacity: number;
  trailerType?: string;
  hasLiftGate: boolean;
  hasRefrigeration: boolean;
  axleCount: number;
}

/**
 * Driver entity
 */
export interface Driver extends BaseEntity {
  userId?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // Add phone property (aliases phoneNumber)
  phoneNumber: string;
  licenseNumber: string;
  licenseState: string; // Add licenseState property
  licenseClass: string;
  licenseExpiry: Date;
  dateOfBirth: Date;
  hireDate: Date;
  status: DriverStatus;
  currentTruckId?: string;
  currentLocation?: Location;
  companyId: string;
  address: Address;
  emergencyContact: EmergencyContact;
  documents: Document[];
  certifications: Certification[];
  violations: TrafficViolation[];
  cdlClass: 'A' | 'B' | 'C'; // Add cdlClass property
  cdlEndorsements: string[]; // Add cdlEndorsements property
  medicalCertExpiry: Date; // Add medicalCertExpiry property
  employmentType: 'full-time' | 'part-time' | 'contractor'; // Add employmentType property
}

/**
 * Driver status enum
 */
export enum DriverStatus {
  AVAILABLE = 'available',
  ON_DUTY = 'on_duty',
  OFF_DUTY = 'off_duty',
  DRIVING = 'driving',
  BREAK = 'break',
  SLEEPER_BERTH = 'sleeper_berth',
  ACTIVE = 'active', // Add for form compatibility
  INACTIVE = 'inactive',
  ON_LEAVE = 'on-leave' // Add for form compatibility
}

/**
 * Address interface
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: [number, number];
}

/**
 * Emergency contact
 */
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string; // Add phone property
  phoneNumber: string;
  alternatePhone?: string;
}

/**
 * Certification interface
 */
export interface Certification {
  id: string;
  type: string;
  number: string;
  issueDate: Date;
  expiryDate: Date;
  issuingAuthority: string;
}

/**
 * Traffic violation
 */
export interface TrafficViolation {
  id: string;
  date: Date;
  violation: string;
  location: string;
  fine: number;
  points: number;
  status: 'pending' | 'resolved' | 'contested';
}

/**
 * Load entity
 */
export interface Load extends BaseEntity {
  loadNumber: string;
  customerId: string;
  customerName: string;
  status: LoadStatus;
  priority: LoadPriority;
  loadType: LoadType;
  assignedTruckId?: string;
  assignedDriverId?: string;
  pickupLocation: LoadLocation;
  deliveryLocation: LoadLocation;
  scheduledPickupDate: Date;
  scheduledDeliveryDate: Date;
  actualPickupDate?: Date;
  actualDeliveryDate?: Date;
  distance: number;
  estimatedDuration: number;
  rate: number;
  currency: string;
  weight: number;
  volume?: number;
  specialInstructions?: string;
  companyId: string;
  cargo: CargoItem[];
  route?: RoutePoint[];
  tracking: TrackingEvent[];
  documents: Document[];
}

/**
 * Load status enum
 */
export enum LoadStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',
  PICKED_UP = 'picked_up',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

/**
 * Load priority enum
 */
export enum LoadPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Load type enum
 */
export enum LoadType {
  DRY_VAN = 'dry_van',
  REFRIGERATED = 'refrigerated',
  FLATBED = 'flatbed',
  TANKER = 'tanker',
  CONTAINER = 'container',
  OVERSIZED = 'oversized'
}

/**
 * Load location details
 */
export interface LoadLocation {
  address: Address;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  businessHours?: BusinessHours;
  specialInstructions?: string;
  dockNumber?: string;
  appointmentRequired: boolean;
}

/**
 * Business hours
 */
export interface BusinessHours {
  monday?: TimeRange;
  tuesday?: TimeRange;
  wednesday?: TimeRange;
  thursday?: TimeRange;
  friday?: TimeRange;
  saturday?: TimeRange;
  sunday?: TimeRange;
}

/**
 * Time range
 */
export interface TimeRange {
  open: string;
  close: string;
}

/**
 * Cargo item
 */
export interface CargoItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  weight: number;
  dimensions?: Dimensions;
  value?: number;
  hazmat: boolean;
  temperature?: TemperatureRange;
}

/**
 * Dimensions
 */
export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'in' | 'cm' | 'ft' | 'm';
}

/**
 * Temperature range
 */
export interface TemperatureRange {
  min: number;
  max: number;
  unit: 'F' | 'C';
}

/**
 * Route point
 */
export interface RoutePoint {
  id: string;
  sequence: number;
  location: Location;
  estimatedArrival: Date;
  actualArrival?: Date;
  type: 'pickup' | 'delivery' | 'waypoint' | 'fuel' | 'rest';
  completed: boolean;
  notes?: string;
}

/**
 * Location interface
 */
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: Date;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

/**
 * Tracking event
 */
export interface TrackingEvent {
  id: string;
  timestamp: Date;
  eventType: TrackingEventType;
  location?: Location;
  description: string;
  triggeredBy: string;
  metadata?: Record<string, any>;
}

/**
 * Tracking event type enum
 */
export enum TrackingEventType {
  LOAD_CREATED = 'load_created',
  ASSIGNED = 'assigned',
  EN_ROUTE_PICKUP = 'en_route_pickup',
  ARRIVED_PICKUP = 'arrived_pickup',
  PICKUP_STARTED = 'pickup_started',
  PICKUP_COMPLETED = 'pickup_completed',
  EN_ROUTE_DELIVERY = 'en_route_delivery',
  ARRIVED_DELIVERY = 'arrived_delivery',
  DELIVERY_STARTED = 'delivery_started',
  DELIVERY_COMPLETED = 'delivery_completed',
  DELAY = 'delay',
  BREAKDOWN = 'breakdown',
  ACCIDENT = 'accident',
  CANCELLED = 'cancelled'
}

/**
 * Document interface
 */
export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  uploadDate: Date;
  uploadedBy: string;
  size: number;
  mimeType: string;
  expiryDate?: Date;
}

/**
 * Document type enum
 */
export enum DocumentType {
  LICENSE = 'license',
  REGISTRATION = 'registration',
  INSURANCE = 'insurance',
  INSPECTION = 'inspection',
  PERMIT = 'permit',
  BOL = 'bill_of_lading',
  POD = 'proof_of_delivery',
  INVOICE = 'invoice',
  CONTRACT = 'contract',
  OTHER = 'other'
}

/**
 * Company entity
 */
export interface Company extends BaseEntity {
  name: string;
  mcNumber?: string;
  dotNumber?: string;
  address: Address;
  phoneNumber: string;
  email: string;
  website?: string;
  logo?: string;
  subscription: Subscription;
  settings: CompanySettings;
}

/**
 * Subscription details
 */
export interface Subscription {
  plan: 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'inactive' | 'trial' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  maxTrucks: number;
  maxDrivers: number;
  maxUsers: number;
  features: string[];
}

/**
 * Company settings
 */
export interface CompanySettings {
  timezone: string;
  currency: string;
  distanceUnit: 'miles' | 'kilometers';
  weightUnit: 'lbs' | 'kg';
  fuelUnit: 'gallons' | 'liters';
  autoAssignment: boolean;
  notifications: CompanyNotificationSettings;
}

/**
 * Company notification settings
 */
export interface CompanyNotificationSettings {
  emailAlerts: boolean;
  smsAlerts: boolean;
  webhookUrl?: string;
  alertTypes: string[];
}

/**
 * API Response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: Date;
}

/**
 * API Error interface
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Filter options for queries
 */
export interface FilterOptions {
  search?: string;
  status?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
}

/**
 * Sort options
 */
export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

/**
 * Export/Import types
 */
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  fields: string[];
  filters?: FilterOptions;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Report types
 */
export interface ReportConfig {
  type: 'trucks' | 'drivers' | 'loads' | 'revenue' | 'performance';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate?: Date;
  endDate?: Date;
  groupBy?: string;
  metrics: string[];
  filters?: FilterOptions;
}