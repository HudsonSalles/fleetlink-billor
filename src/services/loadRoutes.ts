import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Address, Coordinate, Load, RouteData } from '../types/entities';
import { GeocodingService } from './geocoding';

/**
 * Load route management service
 */
export class LoadRouteService {
  /**
   * Process a load to add coordinates and calculate route
   */
  static async processLoadRoute(loadId: string): Promise<{ success: boolean; error?: string; route?: RouteData }> {
    try {
      // Get the load from Firestore
      const loadDoc = await getDoc(doc(db, 'loads', loadId));
      
      if (!loadDoc.exists()) {
        return { success: false, error: 'Load not found' };
      }

      const load = { id: loadDoc.id, ...loadDoc.data() } as Load;

      // Check if coordinates already exist and are valid (not 0,0)
      const originCoords = load.origin.coordinates;
      const destCoords = load.destination.coordinates;
      const isValid = (c?: Coordinate | null) => !!c && Math.abs(c.lat) > 0.0001 && Math.abs(c.lng) > 0.0001;

      let origin: Coordinate;
      let destination: Coordinate;

      // Geocode origin if coordinates don't exist or are invalid
      if (!isValid(originCoords)) {
        const geocodedOrigin = await GeocodingService.addressToCoordinates(load.origin);
        if (!geocodedOrigin) {
          return { success: false, error: 'Failed to geocode origin address' };
        }
        origin = geocodedOrigin;

        // Update origin with coordinates
        await updateDoc(doc(db, 'loads', loadId), {
          'origin.coordinates': geocodedOrigin,
          updatedAt: new Date()
        });
      } else {
        origin = originCoords!;
      }

      // Geocode destination if coordinates don't exist or are invalid
      if (!isValid(destCoords)) {
        const geocodedDestination = await GeocodingService.addressToCoordinates(load.destination);
        if (!geocodedDestination) {
          return { success: false, error: 'Failed to geocode destination address' };
        }
        destination = geocodedDestination;

        // Update destination with coordinates
        await updateDoc(doc(db, 'loads', loadId), {
          'destination.coordinates': geocodedDestination,
          updatedAt: new Date()
        });
      } else {
        destination = destCoords!;
      }

      // Calculate route
      const { RouteService } = await import('./routing');
      const route = await RouteService.calculateRoute(origin, destination, {
        profile: 'driving-traffic',
        steps: true,
        geometries: 'geojson'
      });

      if (!route) {
        return { success: false, error: 'Failed to calculate route' };
      }

      // Save route to Firestore
      await updateDoc(doc(db, 'loads', loadId), {
        route,
        updatedAt: new Date()
      });

      return { success: true, route };
    } catch (error) {
      console.error('Error processing load route:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update route for an existing load
   */
  static async updateLoadRoute(
    loadId: string, 
    origin: Coordinate, 
    destination: Coordinate
  ): Promise<{ success: boolean; error?: string; route?: RouteData }> {
    try {
      const { RouteService } = await import('./routing');
      const route = await RouteService.calculateRoute(origin, destination, {
        profile: 'driving-traffic',
        steps: true,
        geometries: 'geojson'
      });

      if (!route) {
        return { success: false, error: 'Failed to calculate route' };
      }

      // Update route in Firestore
      await updateDoc(doc(db, 'loads', loadId), {
        route,
        updatedAt: new Date()
      });

      return { success: true, route };
    } catch (error) {
      console.error('Error updating load route:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Recalculate route with different profile
   */
  static async recalculateRoute(
    loadId: string,
    profile: 'driving' | 'driving-traffic' = 'driving-traffic'
  ): Promise<{ success: boolean; error?: string; route?: RouteData }> {
    try {
      const loadDoc = await getDoc(doc(db, 'loads', loadId));
      
      if (!loadDoc.exists()) {
        return { success: false, error: 'Load not found' };
      }

      const load = { id: loadDoc.id, ...loadDoc.data() } as Load;
      
      const origin = load.origin.coordinates;
      const destination = load.destination.coordinates;
      const isValid = (c?: Coordinate | null) => !!c && Math.abs(c.lat) > 0.0001 && Math.abs(c.lng) > 0.0001;

      if (!isValid(origin) || !isValid(destination)) {
        return { success: false, error: 'Origin or destination coordinates not available' };
      }

      const { RouteService } = await import('./routing');
      const route = await RouteService.calculateRoute(origin as Coordinate, destination as Coordinate, {
        profile,
        steps: true,
        geometries: 'geojson'
      });

      if (!route) {
        return { success: false, error: 'Failed to recalculate route' };
      }

      // Update route in Firestore
      await updateDoc(doc(db, 'loads', loadId), {
        route,
        updatedAt: new Date()
      });

      return { success: true, route };
    } catch (error) {
      console.error('Error recalculating route:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Remove route from a load
   */
  static async removeLoadRoute(loadId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'loads', loadId), {
        route: null,
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing load route:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Batch process multiple loads for routing
   */
  static async batchProcessRoutes(loadIds: string[]): Promise<{
    success: boolean;
    results: Array<{ loadId: string; success: boolean; error?: string; route?: RouteData }>;
  }> {
    try {
      const results = await Promise.allSettled(
        loadIds.map(async (loadId) => {
          const result = await this.processLoadRoute(loadId);
          return { loadId, ...result };
        })
      );

      const processedResults = results
        .filter((result): result is PromiseFulfilledResult<{ loadId: string; success: boolean; error?: string; route?: RouteData }> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      const allSuccessful = processedResults.every(result => result.success);

      return {
        success: allSuccessful,
        results: processedResults
      };
    } catch (error) {
      console.error('Error in batch processing routes:', error);
      return {
        success: false,
        results: loadIds.map(loadId => ({
          loadId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }))
      };
    }
  }

  /**
   * Get estimated delivery time based on route
   */
  static calculateEstimatedDelivery(
    route: RouteData,
    departureTime: Date = new Date(),
    bufferMinutes: number = 30
  ): Date {
    const deliveryTime = new Date(departureTime);
    const routeDurationMinutes = Math.ceil(route.duration / 60);
    const totalMinutes = routeDurationMinutes + bufferMinutes;
    
    deliveryTime.setMinutes(deliveryTime.getMinutes() + totalMinutes);
    
    return deliveryTime;
  }

  /**
   * Validate Brazilian addresses before processing
   */
  static validateBrazilianAddress(address: Address): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!address.street?.trim()) {
      errors.push('Street address is required');
    }

    if (!address.city?.trim()) {
      errors.push('City is required');
    }

    if (!address.state?.trim()) {
      errors.push('State is required');
    } else if (address.state.length !== 2) {
      errors.push('State should be a 2-letter abbreviation (e.g., SP, RJ)');
    }

    if (!address.zipCode?.trim()) {
      errors.push('ZIP code is required');
    } else if (!/^\d{5}-?\d{3}$/.test(address.zipCode)) {
      errors.push('ZIP code should be in format XXXXX-XXX or XXXXXXXX');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Format Brazilian address for display
   */
  static formatBrazilianAddress(address: Address): string {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode
    ].filter(Boolean);

    return parts.join(', ');
  }
}