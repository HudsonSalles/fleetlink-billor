import { Coordinate, RouteData } from '../types/entities';

/**
 * Enhanced Route calculation service using Mapbox Directions API
 * Implements PRD requirements for Interactive Map functionality
 */
export class RouteService {
  private static readonly MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  private static readonly DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox';

  /**
   * Calculate route between two coordinates with comprehensive options
   * Following PRD requirements for route display and data persistence
   */
  static async calculateRoute(
    origin: Coordinate,
    destination: Coordinate,
    options: {
      profile?: 'driving' | 'driving-traffic' | 'walking' | 'cycling';
      geometries?: 'geojson' | 'polyline' | 'polyline6';
      overview?: 'full' | 'simplified' | 'false';
      steps?: boolean;
      alternatives?: boolean;
      exclude?: string[];
      annotations?: string[];
      language?: string;
    } = {}
  ): Promise<RouteData | null> {
    if (!this.MAPBOX_ACCESS_TOKEN) {
      console.error('Mapbox access token not configured');
      return null;
    }

    try {
      const {
        profile = 'driving-traffic', // Use traffic-aware routing for better ETA
        geometries = 'geojson',
        overview = 'full',
        steps = true,
        alternatives = false,
        exclude = [],
        annotations = ['duration', 'distance', 'speed'],
        language = 'pt' // Portuguese for Brazilian users
      } = options;

      // Build coordinates string
      const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
      
      const url = new URL(`${this.DIRECTIONS_URL}/${profile}/${coordinates}`);
      url.searchParams.set('access_token', this.MAPBOX_ACCESS_TOKEN);
      url.searchParams.set('geometries', geometries);
      url.searchParams.set('overview', overview);
      url.searchParams.set('steps', String(steps));
      url.searchParams.set('alternatives', String(alternatives));
      url.searchParams.set('language', language);
      url.searchParams.set('annotations', annotations.join(','));
      
      if (exclude.length > 0) {
        url.searchParams.set('exclude', exclude.join(','));
      }

      console.log('Calculating route with Mapbox Directions API:', url.toString());
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No routes found between the specified coordinates');
      }

      const route = data.routes[0];
      const leg = route.legs?.[0];
      
      // Extract step-by-step instructions
      const instructions = leg?.steps?.map((step: any) => {
        return step.maneuver?.instruction || '';
      }) || [];

      const routeData: RouteData = {
        distance: route.distance,
        duration: route.duration,
        geometry: JSON.stringify(route.geometry),
        waypoints: [origin, destination],
        instructions: instructions
      };

      console.log('Route calculated successfully:', {
        distance: this.formatDistance(route.distance),
        duration: this.formatDuration(route.duration),
        steps: instructions.length
      });

      return routeData;
    } catch (error) {
      console.error('Route calculation failed:', error);
      throw error;
    }
  }

  /**
   * Simulate truck movement along a route (Bonus feature)
   * Implements real-time truck movement for the PRD bonus requirement
   */
  static simulateTruckMovement(
    route: RouteData,
    onPositionUpdate: (position: {
      coordinate: Coordinate;
      progress: number; // 0-100%
      speed: number; // km/h
      heading: number; // degrees
      estimatedTimeRemaining: number; // seconds
      distanceRemaining: number; // meters
    }) => void,
    options: {
      updateInterval?: number; // milliseconds
      averageSpeed?: number; // km/h
      speedVariation?: number; // +/- km/h
      startFromBeginning?: boolean;
    } = {}
  ): () => void {
    const {
      // Revert to original, less frequent updates
      updateInterval = 1000, // 1 update per second
      averageSpeed = 60, // 60 km/h average
      speedVariation = 15, // +/- 15 km/h variation
      startFromBeginning = true
    } = options;

    let progress = startFromBeginning ? 0 : Math.random() * 20; // Start at beginning or random position
    let isRunning = true;

    const simulationInterval = setInterval(() => {
      if (!isRunning || progress >= 100) {
        clearInterval(simulationInterval);
        if (progress >= 100) {
          // Trigger final position update at destination
          onPositionUpdate({
            coordinate: route.waypoints[route.waypoints.length - 1],
            progress: 100,
            speed: 0,
            heading: 0,
            estimatedTimeRemaining: 0,
            distanceRemaining: 0
          });
        }
        return;
      }

      try {
        const geometry = typeof route.geometry === 'string' 
          ? JSON.parse(route.geometry) 
          : route.geometry;
        
        if (!geometry?.coordinates) return;

        const coordinates = geometry.coordinates;
        const totalDistance = route.distance; // meters
        const currentSpeed = averageSpeed + (Math.random() - 0.5) * 2 * speedVariation;
        
        // Calculate distance covered in this interval
        const distancePerSecond = (currentSpeed * 1000) / 3600; // m/s
        const distanceCovered = distancePerSecond * (updateInterval / 1000);
        
        // Update progress
        progress = Math.min(progress + (distanceCovered / totalDistance) * 100, 100);
        
        // Find current position along route without interpolation (step-wise)
        const numSegments = Math.max(1, coordinates.length - 1);
        const pos = (progress / 100) * numSegments;
        const targetIndex = Math.floor(pos);
        const currentCoord = coordinates[targetIndex];
        const nextCoord = coordinates[Math.min(targetIndex + 1, coordinates.length - 1)];
        
        if (currentCoord) {
          // Calculate heading
          let heading = 0;
          if (nextCoord && nextCoord !== currentCoord) {
            const dLng = (nextCoord[0] - currentCoord[0]) * Math.PI / 180;
            const lat1 = currentCoord[1] * Math.PI / 180;
            const lat2 = nextCoord[1] * Math.PI / 180;
            
            const y = Math.sin(dLng) * Math.cos(lat2);
            const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
            
            heading = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
          }

          // Calculate remaining distance and time
          const distanceRemaining = totalDistance * (1 - progress / 100);
          const estimatedTimeRemaining = distanceRemaining / distancePerSecond;

          onPositionUpdate({
            coordinate: { lng: currentCoord[0], lat: currentCoord[1] },
            progress,
            speed: currentSpeed,
            heading,
            estimatedTimeRemaining,
            distanceRemaining
          });
        }
      } catch (error) {
        console.error('Error in truck simulation:', error);
      }
    }, updateInterval);

    // Return cleanup function
    return () => {
      isRunning = false;
      clearInterval(simulationInterval);
    };
  }

  /**
   * Format route distance for display
   */
  static formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)} m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)} km`;
    }
  }

  /**
   * Format route duration for display
   */
  static formatDuration(durationInSeconds: number): string {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  }

  /**
   * Calculate estimated arrival time
   */
  static calculateETA(durationInSeconds: number, startTime: Date = new Date()): Date {
    return new Date(startTime.getTime() + durationInSeconds * 1000);
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1.lat * Math.PI / 180;
    const φ2 = coord2.lat * Math.PI / 180;
    const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
    const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }
}