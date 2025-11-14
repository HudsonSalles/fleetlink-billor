// components
import { useQueryClient } from '@tanstack/react-query';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect } from 'react';
import { db } from '../config/firebase';
import { queryKeys } from './useQuery';

// types
import { Driver, Load, Truck } from '../types/entities';

export const useRealtimeSubscriptions = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscription for loads (most frequently updated)
    const loadsQuery = query(
      collection(db, 'loads'), 
      orderBy('createdAt', 'desc'),
      limit(100) // Limit to prevent excessive memory usage
    );
    
    const unsubscribeLoads = onSnapshot(
      loadsQuery, 
      (snapshot) => {
        try {
          const loads = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            estimatedDelivery: doc.data().estimatedDelivery?.toDate(),
            actualDelivery: doc.data().actualDelivery?.toDate(),
          })) as Load[];
          
          // Update React Query cache with new data
          queryClient.setQueryData(queryKeys.loads, loads);
          
          // Invalidate dashboard to recalculate stats
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });

        } catch (error) {
          console.error('Error processing loads real-time update:', error);
        }
      },
      (error) => {
        console.error('Loads real-time subscription error:', error);
        // Optionally show user-friendly error message
      }
    );

    // Subscription for trucks
    const trucksQuery = query(
      collection(db, 'trucks'),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubscribeTrucks = onSnapshot(
      trucksQuery, 
      (snapshot) => {
        try {
          const trucks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as Truck[];
          
          queryClient.setQueryData(queryKeys.trucks, trucks);
          
          // Update available trucks cache
          const availableTrucks = trucks.filter(
            truck => truck.status === 'active' && !truck.driverId
          );
          queryClient.setQueryData(queryKeys.trucksAvailable, availableTrucks);
          
        } catch (error) {
          console.error('Error processing trucks real-time update:', error);
        }
      },
      (error) => {
        console.error('Trucks real-time subscription error:', error);
      }
    );

    // Subscription for drivers
    const driversQuery = query(
      collection(db, 'drivers'),
      orderBy('name')
    );
    
    const unsubscribeDrivers = onSnapshot(
      driversQuery, 
      (snapshot) => {
        try {
          const drivers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as Driver[];
          
          queryClient.setQueryData(queryKeys.drivers, drivers);
          
          // Update available drivers cache
          const availableDrivers = drivers.filter(driver => !driver.truckId);
          queryClient.setQueryData(queryKeys.driversAvailable, availableDrivers);
          
        } catch (error) {
          console.error('Error processing drivers real-time update:', error);
        }
      },
      (error) => {
        console.error('Drivers real-time subscription error:', error);
      }
    );

    // Cleanup function to unsubscribe from all real-time listeners
    return () => {
      unsubscribeLoads();
      unsubscribeTrucks();
      unsubscribeDrivers();
    };
  }, [queryClient]);
};

export const useLoadRealtime = (loadId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loadId) return;

    const loadDocRef = doc(db, 'loads', loadId);

    const unsubscribe = onSnapshot(
      loadDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          try {
            const loadData = {
              id: docSnapshot.id,
              ...docSnapshot.data(),
              createdAt: docSnapshot.data()?.createdAt?.toDate() || new Date(),
              updatedAt: docSnapshot.data()?.updatedAt?.toDate() || new Date(),
              estimatedDelivery: docSnapshot.data()?.estimatedDelivery?.toDate(),
              actualDelivery: docSnapshot.data()?.actualDelivery?.toDate(),
            } as Load;

            queryClient.setQueryData(queryKeys.load(loadId), loadData);
          } catch (error) {
            console.error(`Error processing load ${loadId} real-time update:`, error);
          }
        } else {
          // Document was deleted
          queryClient.setQueryData(queryKeys.load(loadId), null);
        }
      },
      (error: unknown) => {
        console.error(`Load ${loadId} real-time subscription error:`, error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [loadId, queryClient]);
};

export const useConnectionStatus = () => {
  // This would be implemented with a more sophisticated connection monitoring system
  // For now, return a simple connected state
  return {
    connected: true,
    lastUpdate: new Date(),
  };
};