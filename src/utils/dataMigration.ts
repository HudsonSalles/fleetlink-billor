// Firebase
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

// Types
import { Driver, Truck } from '../types/entities';

// Expose to global scope for debugging
declare global {
  interface Window {
    syncTruckDriverData: () => Promise<void>;
    checkTruckDriverData: () => Promise<void>;
  }
}

/**
 * Synchronize truck-driver relationships
 * This function fixes any data inconsistencies between trucks and drivers
 */
export const syncTruckDriverRelationships = async (): Promise<{
  trucksUpdated: number;
  driversUpdated: number;
  errors: string[];
}> => {
  const results = {
    trucksUpdated: 0,
    driversUpdated: 0,
    errors: [] as string[],
  };

  try {
    // Fetch all trucks and drivers
    const [trucksSnapshot, driversSnapshot] = await Promise.all([
      getDocs(collection(db, 'trucks')),
      getDocs(collection(db, 'drivers'))
    ]);

    const trucks = trucksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Truck[];

    const drivers = driversSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Driver[];

    const batch = writeBatch(db);

    // Create maps for efficient lookups
    const trucksByDriverId = new Map<string, Truck>();
    const driversByTruckId = new Map<string, Driver>();

    // Map existing relationships
    trucks.forEach(truck => {
      if (truck.driverId) {
        trucksByDriverId.set(truck.driverId, truck);
      }
    });

    drivers.forEach(driver => {
      if (driver.truckId) {
        driversByTruckId.set(driver.truckId, driver);
      }
    });

    // Fix inconsistencies
    for (const driver of drivers) {
      if (driver.truckId) {
        // Driver has a truck assigned
        const assignedTruck = trucks.find(t => t.id === driver.truckId);
        
        if (assignedTruck) {
          // Check if truck has the driver assigned back
          if (assignedTruck.driverId !== driver.id) {
            
            // Update truck to have the driver
            const truckRef = doc(db, 'trucks', assignedTruck.id);
            batch.update(truckRef, {
              driverId: driver.id,
              updatedAt: new Date(),
            });
            results.trucksUpdated++;
          }
        } else {
          // Driver references a truck that doesn't exist
          const driverRef = doc(db, 'drivers', driver.id);
          batch.update(driverRef, {
            truckId: null,
            updatedAt: new Date(),
          });
          results.driversUpdated++;
        }
      }
    }

    // Check for trucks that have drivers assigned but driver doesn't have truck assigned back
    for (const truck of trucks) {
      if (truck.driverId) {
        const assignedDriver = drivers.find(d => d.id === truck.driverId);
        
        if (assignedDriver) {
          if (assignedDriver.truckId !== truck.id) {
            
            // Update driver to have the truck
            const driverRef = doc(db, 'drivers', assignedDriver.id);
            batch.update(driverRef, {
              truckId: truck.id,
              updatedAt: new Date(),
            });
            results.driversUpdated++;
          }
        } else {
          // Truck references a driver that doesn't exist
          const truckRef = doc(db, 'trucks', truck.id);
          batch.update(truckRef, {
            driverId: null,
            updatedAt: new Date(),
          });
          results.trucksUpdated++;
        }
      }
    }

    // Commit all changes
    if (results.trucksUpdated > 0 || results.driversUpdated > 0) {
      await batch.commit();
      console.log('Data synchronization completed:', results);
    } else {
      console.log('No data inconsistencies found');
    }

    return results;

  } catch (error) {
    console.error('Error synchronizing truck-driver relationships:', error);
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return results;
  }
};

/**
 * Check for data inconsistencies without fixing them
 */
export const checkTruckDriverConsistency = async (): Promise<{
  inconsistentTrucks: string[];
  inconsistentDrivers: string[];
  orphanedReferences: string[];
}> => {
  const issues = {
    inconsistentTrucks: [] as string[],
    inconsistentDrivers: [] as string[],
    orphanedReferences: [] as string[],
  };

  try {
    // Fetch all trucks and drivers
    const [trucksSnapshot, driversSnapshot] = await Promise.all([
      getDocs(collection(db, 'trucks')),
      getDocs(collection(db, 'drivers'))
    ]);

    const trucks = trucksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Truck[];

    const drivers = driversSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Driver[];

    // Check each driver's truck assignment
    for (const driver of drivers) {
      if (driver.truckId) {
        const assignedTruck = trucks.find(t => t.id === driver.truckId);
        
        if (!assignedTruck) {
          issues.orphanedReferences.push(`Driver ${driver.name} references non-existent truck ${driver.truckId}`);
        } else if (assignedTruck.driverId !== driver.id) {
          issues.inconsistentDrivers.push(`Driver ${driver.name} assigned to truck ${assignedTruck.licensePlate} but truck doesn't reference driver`);
        }
      }
    }

    // Check each truck's driver assignment
    for (const truck of trucks) {
      if (truck.driverId) {
        const assignedDriver = drivers.find(d => d.id === truck.driverId);
        
        if (!assignedDriver) {
          issues.orphanedReferences.push(`Truck ${truck.licensePlate} references non-existent driver ${truck.driverId}`);
        } else if (assignedDriver.truckId !== truck.id) {
          issues.inconsistentTrucks.push(`Truck ${truck.licensePlate} assigned to driver ${assignedDriver.name} but driver doesn't reference truck`);
        }
      }
    }

  } catch (error) {
    console.error('Error checking truck-driver consistency:', error);
  }

  return issues;
};

// Expose functions to global scope for debugging
if (typeof window !== 'undefined') {
  window.syncTruckDriverData = async () => {
    console.log('Starting truck-driver data synchronization...');
    const results = await syncTruckDriverRelationships();
    console.log('Synchronization completed:', results);
  };

  window.checkTruckDriverData = async () => {
    console.log('Checking truck-driver data consistency...');
    const issues = await checkTruckDriverConsistency();
    console.log('Consistency check completed:', issues);
  };
}