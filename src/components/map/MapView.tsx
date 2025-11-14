// components
import mapboxgl from "mapbox-gl";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_MAP_CONFIG,
  mapboxService,
  MARKER_COLORS,
} from "../../services/mapbox";

// types
import { Driver, Load, Truck } from "../../types";

/**
 * Map marker data interface
 */
export interface MapMarkerData {
  id: string;
  type: "truck" | "driver" | "pickup" | "delivery" | "depot";
  coordinates: {
    longitude: number;
    latitude: number;
  };
  data: Truck | Driver | Load | any;
  popup?: string | HTMLElement;
}

/**
 * Map route data interface
 */
export interface MapRouteData {
  id: string;
  coordinates: [number, number][];
  color?: string;
  width?: number;
}

/**
 * MapView props interface
 */
export interface MapViewProps {
  /** Map container CSS class */
  className?: string;
  /** Map container style */
  style?: React.CSSProperties;
  /** Initial map center coordinates */
  center?: [number, number];
  /** Initial map zoom level */
  zoom?: number;
  /** Markers to display on the map */
  markers?: MapMarkerData[];
  /** Routes to display on the map */
  routes?: MapRouteData[];
  /** Whether the map is interactive */
  interactive?: boolean;
  /** Map style URL */
  mapStyle?: string;
  /** Callback when marker is clicked */
  onMarkerClick?: (marker: MapMarkerData) => void;
  /** Callback when map is clicked */
  onMapClick?: (coordinates: { longitude: number; latitude: number }) => void;
  /** Callback when map is loaded */
  onMapLoad?: (map: mapboxgl.Map) => void;
  /** Whether to show traffic layer */
  showTraffic?: boolean;
  /** Whether to fit bounds to markers */
  fitBounds?: boolean;
}

const MapView: React.FC<MapViewProps> = ({
  className = "",
  style = { width: "100%", height: "400px" },
  center = DEFAULT_MAP_CONFIG.center,
  zoom = DEFAULT_MAP_CONFIG.zoom,
  markers = [],
  routes = [],
  interactive = true,
  mapStyle = DEFAULT_MAP_CONFIG.style,
  onMarkerClick,
  onMapClick,
  onMapLoad,
  showTraffic = false,
  fitBounds = false,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  /**
   * Add traffic layer to map
   */
  const addTrafficLayer = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    try {
      map.current.addSource("mapbox-traffic", {
        type: "vector",
        url: "mapbox://mapbox.mapbox-traffic-v1",
      });

      map.current.addLayer({
        id: "traffic-flow",
        type: "line",
        source: "mapbox-traffic",
        "source-layer": "traffic",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "congestion"], "low"],
            "#00FF00",
            ["==", ["get", "congestion"], "moderate"],
            "#FFFF00",
            ["==", ["get", "congestion"], "heavy"],
            "#FF8000",
            ["==", ["get", "congestion"], "severe"],
            "#FF0000",
            "#888888",
          ],
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.5, 18, 8],
          "line-opacity": 0.7,
        },
      });
    } catch (error) {
      console.error("Failed to add traffic layer:", error);
    }
  }, [mapLoaded]);

  /**
   * Initialize the map
   */
  useEffect(() => {
    if (!mapContainer.current) return;

    const currentMarkers = markersRef.current;

    try {
      // Create map instance
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center,
        zoom,
        interactive,
        attributionControl: true,
        logoPosition: "bottom-left",
      });

      // Add navigation controls
      if (interactive) {
        map.current.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
          }),
          "top-right"
        );

        // Add fullscreen control
        map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

        // Add scale control
        map.current.addControl(
          new mapboxgl.ScaleControl({
            maxWidth: 80,
            unit: "metric",
          }),
          "bottom-left"
        );
      }

      // Map load event
      map.current.on("load", () => {
        setMapLoaded(true);

        // Add traffic layer if requested
        if (showTraffic) {
          addTrafficLayer();
        }

        // Callback for map load
        if (onMapLoad && map.current) {
          onMapLoad(map.current);
        }
      });

      // Map click event
      if (onMapClick && interactive) {
        map.current.on("click", (e) => {
          onMapClick({
            longitude: e.lngLat.lng,
            latitude: e.lngLat.lat,
          });
        });
      }

      // Cleanup function
      return () => {
        currentMarkers.clear();
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }
  }, [
    mapStyle,
    center,
    zoom,
    interactive,
    onMapLoad,
    onMapClick,
    showTraffic,
    addTrafficLayer,
  ]);

  /**
   * Update markers on the map
   */
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove markers that no longer exist
    const currentMarkerIds = new Set(markers.map((m) => m.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    markers.forEach((markerData) => {
      const existingMarker = markersRef.current.get(markerData.id);

      if (existingMarker) {
        // Update existing marker position
        existingMarker.setLngLat([
          markerData.coordinates.longitude,
          markerData.coordinates.latitude,
        ]);
      } else {
        // Create new marker
        const marker = mapboxService.createMarker(markerData.coordinates, {
          color: MARKER_COLORS[markerData.type] || MARKER_COLORS.truck,
          size: "medium",
          popup: markerData.popup,
          className: `marker-${markerData.type}`,
        });

        // Add click handler
        if (onMarkerClick) {
          marker.getElement().addEventListener("click", () => {
            onMarkerClick(markerData);
          });
        }

        // Add to map and store reference
        marker.addTo(map.current!);
        markersRef.current.set(markerData.id, marker);
      }
    });

    // Fit bounds to markers if requested
    if (fitBounds && markers.length > 0) {
      const coordinates = markers.map((m) => m.coordinates);
      mapboxService.fitMapToBounds(map.current, coordinates);
    }
  }, [markers, mapLoaded, onMarkerClick, fitBounds]);

  /**
   * Update routes on the map
   */
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing routes
    routes.forEach((route) => {
      const sourceId = `route-${route.id}`;
      const layerId = `route-${route.id}`;

      try {
        if (map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId);
        }
        if (map.current!.getSource(sourceId)) {
          map.current!.removeSource(sourceId);
        }
      } catch (error) {
        // Layer might not exist, ignore error
      }
    });

    // Add new routes
    routes.forEach((route) => {
      try {
        mapboxService.addRouteToMap(map.current!, route.coordinates, {
          id: `route-${route.id}`,
          color: route.color,
          width: route.width,
        });
      } catch (error) {
        console.error(`Failed to add route ${route.id}:`, error);
      }
    });
  }, [routes, mapLoaded]);

  /**
   * Handle map resize
   */
  useEffect(() => {
    if (!map.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (map.current) {
        map.current.resize();
      }
    });

    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      className={`mapbox-map ${className}`}
      style={style}
      data-testid="map-container"
    >
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-primary-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading map...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
