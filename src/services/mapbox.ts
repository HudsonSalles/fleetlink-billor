// services
import mapboxgl from 'mapbox-gl';

/**
 * Mapbox configuration
 */
const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';

// Set the access token
if (MAPBOX_ACCESS_TOKEN) {
  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
} else {
  console.warn('Mapbox access token not found. Please set REACT_APP_MAPBOX_ACCESS_TOKEN environment variable.');
}

/**
 * Default map configuration
 */
export const DEFAULT_MAP_CONFIG = {
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-95.7129, 37.0902] as [number, number], // Geographic center of USA
  zoom: 4,
  pitch: 0,
  bearing: 0,
};

/**
 * Map marker colors by entity type
 */
export const MARKER_COLORS = {
  truck: '#3B82F6', // Blue
  driver: '#10B981', // Green
  pickup: '#F59E0B', // Yellow
  delivery: '#EF4444', // Red
  depot: '#8B5CF6', // Purple
} as const;

/**
 * Coordinate interface
 */
export interface Coordinates {
  longitude: number;
  latitude: number;
}

/**
 * Geocoding result interface
 */
export interface GeocodingResult {
  id: string;
  place_name: string;
  center: [number, number];
  bbox?: [number, number, number, number];
  address?: string;
  context?: Array<{
    id: string;
    text: string;
  }>;
}

/**
 * Route response interface
 */
export interface RouteResponse {
  routes: Array<{
    geometry: {
      coordinates: [number, number][];
      type: string;
    };
    legs: Array<{
      distance: number;
      duration: number;
      steps: Array<{
        geometry: {
          coordinates: [number, number][];
        };
        maneuver: {
          instruction: string;
          type: string;
        };
        distance: number;
        duration: number;
      }>;
    }>;
    distance: number;
    duration: number;
  }>;
}

/**
 * Mapbox Service Class
 * 
 * Provides methods for interacting with Mapbox APIs including
 * geocoding, routing, and map utilities.
 */
export class MapboxService {
  private static instance: MapboxService;

  private constructor() {
    if (!MAPBOX_ACCESS_TOKEN) {
      throw new Error('Mapbox access token is required');
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MapboxService {
    if (!MapboxService.instance) {
      MapboxService.instance = new MapboxService();
    }
    return MapboxService.instance;
  }

  /**
   * Geocode an address to get coordinates
   * 
   * @param address - Address to geocode
   * @param options - Additional geocoding options
   * @returns Promise resolving to geocoding results
   */
  async geocodeAddress(
    address: string,
    options: {
      limit?: number;
      country?: string;
      bbox?: [number, number, number, number];
      proximity?: [number, number];
    } = {}
  ): Promise<GeocodingResult[]> {
    try {
      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN,
        limit: String(options.limit || 5),
        ...options.country && { country: options.country },
        ...options.bbox && { bbox: options.bbox.join(',') },
        ...options.proximity && { proximity: options.proximity.join(',') },
      });

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?${params}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.features.map((feature: {
        id?: string;
        place_name: string;
        center: [number, number];
        bbox?: [number, number, number, number];
        properties?: { address?: string };
        context?: Array<{ id: string; text: string }>;
      }) => ({
        id: feature.id,
        place_name: feature.place_name,
        center: feature.center,
        bbox: feature.bbox,
        address: feature.properties?.address,
        context: feature.context,
      }));
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  }

  /**
   * Reverse geocode coordinates to get address
   * 
   * @param coordinates - Coordinates to reverse geocode
   * @returns Promise resolving to address information
   */
  async reverseGeocode(coordinates: Coordinates): Promise<GeocodingResult | null> {
    try {
      const { longitude, latitude } = coordinates;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return {
          id: feature.id,
          place_name: feature.place_name,
          center: feature.center,
          bbox: feature.bbox,
          address: feature.properties?.address,
          context: feature.context,
        };
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new Error('Failed to reverse geocode coordinates');
    }
  }

  /**
   * Get driving route between coordinates
   * 
   * @param coordinates - Array of coordinates for the route
   * @param options - Route options
   * @returns Promise resolving to route information
   */
  async getRoute(
    coordinates: Coordinates[],
    options: {
      profile?: 'driving' | 'driving-traffic' | 'walking' | 'cycling';
      geometries?: 'geojson' | 'polyline' | 'polyline6';
      overview?: 'full' | 'simplified' | 'false';
      steps?: boolean;
      annotations?: string[];
    } = {}
  ): Promise<RouteResponse> {
    try {
      const {
        profile = 'driving-traffic',
        geometries = 'geojson',
        overview = 'full',
        steps = true,
        annotations = ['duration', 'distance'],
      } = options;

      const coordinatesString = coordinates
        .map(coord => `${coord.longitude},${coord.latitude}`)
        .join(';');

      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN,
        geometries,
        overview,
        steps: String(steps),
        annotations: annotations.join(','),
      });

      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinatesString}?${params}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Routing failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data as RouteResponse;
    } catch (error) {
      console.error('Routing error:', error);
      throw new Error('Failed to get route');
    }
  }

  /**
   * Calculate distance between two coordinates
   * 
   * @param from - Starting coordinates
   * @param to - Ending coordinates
   * @returns Distance in meters
   */
  calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = from.latitude * Math.PI / 180;
    const φ2 = to.latitude * Math.PI / 180;
    const Δφ = (to.latitude - from.latitude) * Math.PI / 180;
    const Δλ = (to.longitude - from.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Create a map marker
   * 
   * @param coordinates - Marker coordinates
   * @param options - Marker options
   * @returns Mapbox marker instance
   */
  createMarker(
    coordinates: Coordinates,
    options: {
      color?: string;
      size?: 'small' | 'medium' | 'large';
      draggable?: boolean;
      popup?: string | HTMLElement;
      className?: string;
    } = {}
  ): mapboxgl.Marker {
    const {
      color = MARKER_COLORS.truck,
      size = 'medium',
      draggable = false,
      popup,
      className,
    } = options;

    // Create marker element
    const markerElement = document.createElement('div');
    markerElement.className = `mapbox-marker ${className || ''}`;
    
    // Size classes
    const sizeClasses = {
      small: 'w-3 h-3',
      medium: 'w-4 h-4',
      large: 'w-6 h-6',
    };
    
    markerElement.className += ` ${sizeClasses[size]} rounded-full border-2 border-white shadow-lg`;
    markerElement.style.backgroundColor = color;

    // Create marker
    const marker = new mapboxgl.Marker({
      element: markerElement,
      draggable,
    }).setLngLat([coordinates.longitude, coordinates.latitude]);

    // Add popup if provided
    if (popup) {
      const popupInstance = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
      });

      if (typeof popup === 'string') {
        popupInstance.setHTML(popup);
      } else {
        popupInstance.setDOMContent(popup);
      }

      marker.setPopup(popupInstance);
    }

    return marker;
  }

  /**
   * Create a route line on the map
   * 
   * @param map - Mapbox map instance
   * @param route - Route geometry
   * @param options - Line styling options
   */
  addRouteToMap(
    map: mapboxgl.Map,
    route: [number, number][],
    options: {
      id?: string;
      color?: string;
      width?: number;
      opacity?: number;
    } = {}
  ): void {
    const {
      id = 'route',
      color = '#3B82F6',
      width = 5,
      opacity = 0.8,
    } = options;

    // Add route source
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route,
        },
      },
    });

    // Add route layer
    map.addLayer({
      id,
      type: 'line',
      source: id,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': color,
        'line-width': width,
        'line-opacity': opacity,
      },
    });
  }

  /**
   * Fit map to bounds
   * 
   * @param map - Mapbox map instance
   * @param coordinates - Array of coordinates to fit
   * @param options - Fit bounds options
   */
  fitMapToBounds(
    map: mapboxgl.Map,
    coordinates: Coordinates[],
    options: {
      padding?: number | mapboxgl.PaddingOptions;
      maxZoom?: number;
      animate?: boolean;
    } = {}
  ): void {
    if (coordinates.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach(coord => {
      bounds.extend([coord.longitude, coord.latitude]);
    });

    map.fitBounds(bounds, {
      padding: options.padding || 50,
      maxZoom: options.maxZoom || 15,
      ...options.animate !== false && { duration: 1000 },
    });
  }
}

/**
 * Get singleton instance of MapboxService
 */
export const mapboxService = MapboxService.getInstance();