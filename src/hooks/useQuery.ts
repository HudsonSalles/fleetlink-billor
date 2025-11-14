// components
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

// services
import { LoadRouteService } from '../services/loadRoutes';

// types
import { Coordinate, DashboardStats, Driver, Load, Truck } from '../types/entities';

/**
 * Query key factory for consistent cache keys
 */
export const queryKeys = {
  // Trucks
  trucks: ['trucks'] as const,
  truck: (id: string) => ['trucks', id] as const,
  trucksAvailable: ['trucks', 'available'] as const,
  
  // Drivers
  drivers: ['drivers'] as const,
  driver: (id: string) => ['drivers', id] as const,
  driversAvailable: ['drivers', 'available'] as const,
  
  // Loads
  loads: ['loads'] as const,
  load: (id: string) => ['loads', id] as const,
  loadsByStatus: (status: string) => ['loads', 'status', status] as const,
  loadsByDriver: (driverId: string) => ['loads', 'driver', driverId] as const,
  loadRoute: (id: string) => ['loads', id, 'route'] as const,
  
  // Dashboard
  dashboard: ['dashboard'] as const,
} as const;

/**
 * Error handler for Firebase operations
 */
const handleFirebaseError = (error: unknown): Error => {
  console.error('Firebase operation failed:', error);
  
  // Type guard for Firebase error
  const firebaseError = error as { code?: string; message?: string };
  
  if (firebaseError.code) {
    switch (firebaseError.code) {
      case 'permission-denied':
        return new Error('You do not have permission to perform this action');
      case 'not-found':
        return new Error('The requested resource was not found');
      case 'unavailable':
        return new Error('Service temporarily unavailable. Please try again.');
      default:
        return new Error('An unexpected error occurred. Please try again.');
    }
  }
  
  return error instanceof Error ? error : new Error('Unknown error occurred');
};

// ============================================================================
// TRUCK HOOKS
// ============================================================================

/**
 * Hook to fetch all trucks
 * 
 * @param {Object} [options] - Query options
 * @returns {UseQueryResult<Truck[], Error>} Query result with trucks data
 */
export const useTrucks = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.trucks,
    queryFn: async (): Promise<Truck[]> => {
      if (!db) {
        console.warn('Firestore not available');
        return [];
      }

      try {
        const trucksRef = collection(db, 'trucks');
        const q = query(trucksRef, orderBy('updatedAt', 'desc'));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Truck[];
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: (options?.enabled ?? true) && !!db,
  });
};

/**
 * Hook to fetch a single truck by ID
 * 
 * @param {string} id - Truck ID
 * @returns {UseQueryResult<Truck | null, Error>} Query result with truck data
 */
export const useTruck = (id: string) => {
  return useQuery({
    queryKey: queryKeys.truck(id),
    queryFn: async (): Promise<Truck | null> => {
      if (!id) return null;
      
      try {
        const truckDoc = await getDoc(doc(db, 'trucks', id));
        
        if (!truckDoc.exists()) {
          return null;
        }
        
        const data = truckDoc.data();
        return {
          id: truckDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Truck;
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    enabled: !!id,
  });
};

/**
 * Hook to fetch available trucks (active status, no assigned driver)
 * 
 * @returns {UseQueryResult<Truck[], Error>} Query result with available trucks
 */
export const useAvailableTrucks = () => {
  return useQuery({
    queryKey: queryKeys.trucksAvailable,
    queryFn: async (): Promise<Truck[]> => {
      try {
        const trucksRef = collection(db, 'trucks');
        const q = query(
          trucksRef,
          where('status', '==', 'active'),
          where('driverId', '==', null),
          orderBy('licensePlate')
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Truck[];
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to create a new truck
 * 
 * @returns {UseMutationResult} Mutation for creating trucks
 */
export const useCreateTruck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (truckData: Omit<Truck, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const batch = writeBatch(db);
        const now = new Date();
        
        // Create the truck document
        const truckRef = doc(collection(db, 'trucks'));
        batch.set(truckRef, {
          ...truckData,
          createdAt: now,
          updatedAt: now,
        });
        
        // If a driver is assigned, update the driver's truckId
        if (truckData.driverId) {
          const driverRef = doc(db, 'drivers', truckData.driverId);
          batch.update(driverRef, {
            truckId: truckRef.id,
            updatedAt: now,
          });
        }
        
        await batch.commit();
        return truckRef.id;
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch related data
      queryClient.invalidateQueries({ queryKey: queryKeys.trucks });
      queryClient.invalidateQueries({ queryKey: queryKeys.trucksAvailable });
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers });
      queryClient.invalidateQueries({ queryKey: queryKeys.driversAvailable });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

/**
 * Hook to update a truck
 * 
 * @returns {UseMutationResult} Mutation for updating trucks
 */
export const useUpdateTruck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Truck> }) => {
      try {
        const batch = writeBatch(db);
        
        // Get current truck data to compare driver assignment
        const currentTruckRef = doc(db, 'trucks', id);
        const currentTruckSnap = await getDoc(currentTruckRef);
        const currentTruck = currentTruckSnap.data() as Truck;
        
        // Update the truck
        batch.update(currentTruckRef, {
          ...data,
          updatedAt: new Date(),
        });
        
        // Handle driver assignment changes
        const oldDriverId = currentTruck?.driverId;
        const newDriverId = data.driverId;
        
        // If driver assignment changed, update both sides of the relationship
        if (oldDriverId !== newDriverId) {
          // Remove truck assignment from old driver
          if (oldDriverId) {
            const oldDriverRef = doc(db, 'drivers', oldDriverId);
            batch.update(oldDriverRef, {
              truckId: null,
              updatedAt: new Date(),
            });
          }
          
          // Assign truck to new driver
          if (newDriverId) {
            const newDriverRef = doc(db, 'drivers', newDriverId);
            batch.update(newDriverRef, {
              truckId: id,
              updatedAt: new Date(),
            });
          }
        }
        
        await batch.commit();
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch related data
      queryClient.invalidateQueries({ queryKey: queryKeys.trucks });
      queryClient.invalidateQueries({ queryKey: queryKeys.truck(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trucksAvailable });
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers });
      queryClient.invalidateQueries({ queryKey: queryKeys.driversAvailable });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

/**
 * Hook to delete a truck
 * 
 * @returns {UseMutationResult} Mutation for deleting trucks
 */
export const useDeleteTruck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await deleteDoc(doc(db, 'trucks', id));
        return id;
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trucks });
      queryClient.invalidateQueries({ queryKey: queryKeys.trucksAvailable });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

// ============================================================================
// DRIVER HOOKS
// ============================================================================

/**
 * Hook to fetch all drivers
 * 
 * @returns {UseQueryResult<Driver[], Error>} Query result with drivers data
 */
export const useDrivers = () => {
  return useQuery({
    queryKey: queryKeys.drivers,
    queryFn: async (): Promise<Driver[]> => {
      try {
        const driversRef = collection(db, 'drivers');
        const q = query(driversRef, orderBy('name'));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Driver[];
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch available drivers (no assigned truck)
 * 
 * @returns {UseQueryResult<Driver[], Error>} Query result with available drivers
 */
export const useAvailableDrivers = () => {
  return useQuery({
    queryKey: queryKeys.driversAvailable,
    queryFn: async (): Promise<Driver[]> => {
      try {
        const driversRef = collection(db, 'drivers');
        const q = query(
          driversRef,
          where('truckId', '==', null),
          orderBy('name')
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Driver[];
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook to create a new driver
 * 
 * @returns {UseMutationResult} Mutation for creating drivers
 */
export const useCreateDriver = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (driverData: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const batch = writeBatch(db);
        const now = new Date();
        
        // Create the driver document
        const driverRef = doc(collection(db, 'drivers'));
        batch.set(driverRef, {
          ...driverData,
          createdAt: now,
          updatedAt: now,
        });
        
        // If a truck is assigned, update the truck's driverId
        if (driverData.truckId) {
          const truckRef = doc(db, 'trucks', driverData.truckId);
          batch.update(truckRef, {
            driverId: driverRef.id,
            updatedAt: now,
          });
        }
        
        await batch.commit();
        return driverRef.id;
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch related data
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers });
      queryClient.invalidateQueries({ queryKey: queryKeys.driversAvailable });
      queryClient.invalidateQueries({ queryKey: queryKeys.trucks });
      queryClient.invalidateQueries({ queryKey: queryKeys.trucksAvailable });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

/**
 * Hook to update a driver
 */
/**
 * Hook to update a driver
 * 
 * @returns {UseMutationResult} Mutation for updating drivers
 */
export const useUpdateDriver = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Driver> }) => {
      try {
        const batch = writeBatch(db);
        
        // Get current driver data to compare truck assignment
        const currentDriverRef = doc(db, 'drivers', id);
        const currentDriverSnap = await getDoc(currentDriverRef);
        const currentDriver = currentDriverSnap.data() as Driver;
        
        // Update the driver
        batch.update(currentDriverRef, {
          ...data,
          updatedAt: new Date(),
        });
        
        // Handle truck assignment changes
        const oldTruckId = currentDriver?.truckId;
        const newTruckId = data.truckId;
        
        // If truck assignment changed, update both sides of the relationship
        if (oldTruckId !== newTruckId) {
          // Remove driver assignment from old truck
          if (oldTruckId) {
            const oldTruckRef = doc(db, 'trucks', oldTruckId);
            batch.update(oldTruckRef, {
              driverId: null,
              updatedAt: new Date(),
            });
          }
          
          // Assign driver to new truck
          if (newTruckId) {
            const newTruckRef = doc(db, 'trucks', newTruckId);
            batch.update(newTruckRef, {
              driverId: id,
              updatedAt: new Date(),
            });
          }
        }
        
        await batch.commit();
        return id;
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch related data
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers });
      queryClient.invalidateQueries({ queryKey: queryKeys.driversAvailable });
      queryClient.invalidateQueries({ queryKey: queryKeys.trucks });
      queryClient.invalidateQueries({ queryKey: queryKeys.trucksAvailable });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

/**
 * Hook to delete a driver
 * 
 * @returns {UseMutationResult} Mutation for deleting drivers
 */
export const useDeleteDriver = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await deleteDoc(doc(db, 'drivers', id));
        return id;
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers });
      queryClient.invalidateQueries({ queryKey: queryKeys.driversAvailable });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

// ============================================================================
// LOAD HOOKS
// ============================================================================

/**
 * Hook to fetch all loads
 * 
 * @returns {UseQueryResult<Load[], Error>} Query result with loads data
 */
export const useLoads = () => {
  return useQuery({
    queryKey: queryKeys.loads,
    queryFn: async (): Promise<Load[]> => {
      try {
        const loadsRef = collection(db, 'loads');
        const q = query(loadsRef, orderBy('createdAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          estimatedDelivery: doc.data().estimatedDelivery?.toDate(),
          actualDelivery: doc.data().actualDelivery?.toDate(),
        })) as Load[];
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for more frequent updates
  });
};

/**
 * Hook to create a new load
 * 
 * @returns {UseMutationResult} Mutation for creating loads
 */
export const useCreateLoad = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (loadData: Omit<Load, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const now = new Date();
        const docRef = await addDoc(collection(db, 'loads'), {
          ...loadData,
          createdAt: now,
          updatedAt: now,
        });
        
        // Auto-process route after creating load
        const loadId = docRef.id;
        try {
          await LoadRouteService.processLoadRoute(loadId);
        } catch (routeError) {
          console.warn('Failed to auto-process route for new load:', routeError);
          // Don't fail the load creation if route processing fails
        }
        
        return loadId;
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loads });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

/**
 * Hook to update a load
 */
export const useUpdateLoad = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Load> }) => {
      try {
        const loadRef = doc(db, 'loads', id);
        await updateDoc(loadRef, {
          ...data,
          updatedAt: new Date(),
        });
        return id;
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loads });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

/**
 * Hook to delete a load
 * 
 * @returns {UseMutationResult} Mutation for deleting loads
 */
export const useDeleteLoad = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await deleteDoc(doc(db, 'loads', id));
        return id;
      } catch (error) {
        throw handleFirebaseError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loads });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

// ============================================================================
// DASHBOARD HOOKS
// ============================================================================

/**
 * Hook to fetch dashboard statistics
 * 
 * @returns {UseQueryResult<DashboardStats, Error>} Query result with dashboard data
 */
export const useDashboardData = () => {
  const { data: loads = [] } = useLoads();
  const { data: drivers = [] } = useDrivers();
  const { data: trucks = [] } = useTrucks();

  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async (): Promise<DashboardStats> => {
      const loadsByStatus = {
        planned: loads.filter(load => load.status === 'planned').length,
        in_route: loads.filter(load => load.status === 'in_route').length,
        delivered: loads.filter(load => load.status === 'delivered').length,
      };

      const activeDrivers = drivers.filter(driver => !!driver.truckId).length;
      const availableTrucks = trucks.filter(
        truck => truck.status === 'active' && !truck.driverId
      ).length;
      
      const recentLoads = loads.slice(0, 10);

      return {
        loadsByStatus,
        activeDrivers,
        availableTrucks,
        totalLoads: loads.length,
        totalDrivers: drivers.length,
        totalTrucks: trucks.length,
        recentLoads,
      };
    },
    enabled: loads.length >= 0 && drivers.length >= 0 && trucks.length >= 0,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// ============================================================================
// ROUTE MANAGEMENT HOOKS
// ============================================================================

/**
 * Hook to process load route (geocode addresses and calculate route)
 */
export const useProcessLoadRoute = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (loadId: string) => {
      const result = await LoadRouteService.processLoadRoute(loadId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to process route');
      }
      return result;
    },
    onSuccess: (_, loadId) => {
      // Invalidate load queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.load(loadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.loads });
      queryClient.invalidateQueries({ queryKey: queryKeys.loadRoute(loadId) });
    },
  });
};

/**
 * Hook to update load route with new coordinates
 */
export const useUpdateLoadRoute = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      loadId, 
      origin, 
      destination 
    }: { 
      loadId: string; 
      origin: Coordinate; 
      destination: Coordinate; 
    }) => {
      const result = await LoadRouteService.updateLoadRoute(loadId, origin, destination);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update route');
      }
      return result;
    },
    onSuccess: (_, { loadId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.load(loadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.loads });
      queryClient.invalidateQueries({ queryKey: queryKeys.loadRoute(loadId) });
    },
  });
};

/**
 * Hook to recalculate route with different profile
 */
export const useRecalculateRoute = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      loadId, 
      profile = 'driving-traffic' 
    }: { 
      loadId: string; 
      profile?: 'driving' | 'driving-traffic'; 
    }) => {
      const result = await LoadRouteService.recalculateRoute(loadId, profile);
      if (!result.success) {
        throw new Error(result.error || 'Failed to recalculate route');
      }
      return result;
    },
    onSuccess: (_, { loadId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.load(loadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.loads });
      queryClient.invalidateQueries({ queryKey: queryKeys.loadRoute(loadId) });
    },
  });
};

/**
 * Hook to remove route from a load
 */
export const useRemoveLoadRoute = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (loadId: string) => {
      const result = await LoadRouteService.removeLoadRoute(loadId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove route');
      }
      return result;
    },
    onSuccess: (_, loadId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.load(loadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.loads });
      queryClient.invalidateQueries({ queryKey: queryKeys.loadRoute(loadId) });
    },
  });
};

/**
 * Hook to batch process multiple load routes
 */
export const useBatchProcessRoutes = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (loadIds: string[]) => {
      const result = await LoadRouteService.batchProcessRoutes(loadIds);
      return result;
    },
    onSuccess: () => {
      // Invalidate all load queries
      queryClient.invalidateQueries({ queryKey: queryKeys.loads });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};