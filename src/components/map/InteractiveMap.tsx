import "mapbox-gl/dist/mapbox-gl.css";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FullscreenControl,
  Layer,
  Map,
  Marker,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
} from "react-map-gl/mapbox";

import { useTheme } from "../../contexts/ThemeContext";
import { LoadRouteService } from "../../services/loadRoutes";
import {
  Coordinate,
  Driver,
  Load,
  RouteData,
  Truck,
} from "../../types/entities";
import { Button } from "../ui";
import Card from "../ui/Card";
import Spinner from "../ui/Spinner";

// Mapbox configuration
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || "";

interface InteractiveMapProps {
  /** Load data containing origin and destination */
  load: Load;
  /** Driver information */
  driver?: Driver;
  /** Truck information */
  truck?: Truck;
  /** Map height */
  height?: string | number;
  /** Map width */
  width?: string | number;
  /** CSS class name */
  className?: string;
  /** Show details panel */
  showDetails?: boolean;
  /** Enable real-time tracking */
  enableRealTimeTracking?: boolean;
  /** Callback when route is calculated */
  onRouteCalculated?: (route: RouteData) => void;
  /** Callback when route fails to calculate */
  onRouteError?: (error: string) => void;
}

interface TruckPosition {
  coordinate: Coordinate;
  timestamp: Date;
  speed: number; // km/h
  heading: number; // degrees
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  load,
  driver,
  truck,
  height = 400,
  width = "100%",
  className = "",
  showDetails = true,
  enableRealTimeTracking = false,
  onRouteCalculated,
  onRouteError,
}) => {
  const { theme } = useTheme();
  // Coordinate validation helper to avoid using placeholder 0,0
  const hasValidCoordinates = useCallback((c?: Coordinate | null) => {
    if (!c) return false;
    return Math.abs(c.lat) > 0.0001 && Math.abs(c.lng) > 0.0001;
  }, []);

  const isTokenMissing = !MAPBOX_TOKEN;

  // Map state
  const [viewState, setViewState] = useState({
    longitude: -46.6333, // São Paulo default
    latitude: -23.5505,
    zoom: 12,
  });

  // Data state
  const [route, setRoute] = useState<RouteData | null>(load.route || null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeAttempted, setRouteAttempted] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<
    "origin" | "destination" | "truck" | null
  >(null);

  // Real-time tracking state
  const [truckPosition, setTruckPosition] = useState<TruckPosition | null>(
    null
  );
  const [isTracking, setIsTracking] = useState(false);
  const [trackingProgress, setTrackingProgress] = useState(0); // 0-100%
  const simulationCleanupRef = React.useRef<(() => void) | null>(null);

  /**
   * Calculate center point and bounds from origin/destination coordinates
   */
  const mapBounds = useMemo(() => {
    const origin = load.origin.coordinates;
    const destination = load.destination.coordinates;

    if (!origin || !destination) return null;

    const minLng = Math.min(origin.lng, destination.lng);
    const maxLng = Math.max(origin.lng, destination.lng);
    const minLat = Math.min(origin.lat, destination.lat);
    const maxLat = Math.max(origin.lat, destination.lat);

    // Add padding
    const padding = 0.01;

    return {
      center: {
        lng: (minLng + maxLng) / 2,
        lat: (minLat + maxLat) / 2,
      } as Coordinate,
      bounds: [
        [minLng - padding, minLat - padding],
        [maxLng + padding, maxLat + padding],
      ] as [[number, number], [number, number]],
    };
  }, [load.origin.coordinates, load.destination.coordinates]);

  /**
   * Auto-fit map to show all markers when bounds change
   */
  useEffect(() => {
    if (mapBounds) {
      setViewState((prev) => ({
        ...prev,
        longitude: mapBounds.center.lng,
        latitude: mapBounds.center.lat,
        zoom: 14,
      }));
    }
  }, [mapBounds]);

  /**
   * Calculate route between origin and destination
   */
  const calculateRoute = useCallback(async () => {
    const origin = load.origin.coordinates;
    const destination = load.destination.coordinates;

    if (!hasValidCoordinates(origin) || !hasValidCoordinates(destination)) {
      // Wait until geocoding supplies valid coordinates
      return;
    }

    setIsLoadingRoute(true);
    setRouteAttempted(true);
    setRouteError(null);

    try {
      // Calculate route using Mapbox Directions API
      const { RouteService } = await import("../../services/routing");
      const routeData = await RouteService.calculateRoute(
        origin as Coordinate,
        destination as Coordinate
      );

      if (routeData) {
        setRoute(routeData);
        onRouteCalculated?.(routeData);

        // Save route to Firestore
        await LoadRouteService.updateLoadRoute(
          load.id,
          origin as Coordinate,
          destination as Coordinate
        );
      } else {
        throw new Error("Failed to calculate route");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to calculate route";
      setRouteError(errorMessage);
      onRouteError?.(errorMessage);
      console.error("Route calculation failed:", error);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [
    hasValidCoordinates,
    load.origin.coordinates,
    load.destination.coordinates,
    load.id,
    onRouteCalculated,
    onRouteError,
  ]);

  /**
   * Start real-time truck tracking simulation
   */
  const startTruckTracking = useCallback(async () => {
    if (!route || !route.waypoints || route.waypoints.length === 0) {
      console.warn("No route available for tracking");
      return;
    }

    setIsTracking(true);
    setTrackingProgress(0);

    // Simulate truck movement along the route
    const { RouteService } = await import("../../services/routing");
    const cleanup = RouteService.simulateTruckMovement(
      route,
      async (positionData) => {
        const position: TruckPosition = {
          coordinate: positionData.coordinate,
          timestamp: new Date(),
          speed: positionData.speed,
          heading: positionData.heading,
        };
        setTruckPosition(position);
        setTrackingProgress(positionData.progress);

        // Stop tracking and update status to delivered when route is complete
        if (positionData.progress >= 100) {
          setIsTracking(false);
          simulationCleanupRef.current = null;

          // Update load status to delivered in Firestore
          try {
            const { updateDoc, doc } = await import("firebase/firestore");
            const { db } = await import("../../config/firebase");
            await updateDoc(doc(db, "loads", load.id), {
              status: "delivered",
              actualDelivery: new Date(),
              updatedAt: new Date(),
            });
          } catch (error) {
            console.error("Failed to update load status:", error);
          }
        }
      }
    );

    simulationCleanupRef.current = cleanup;
  }, [route, load.id]);

  /**
   * Auto-calculate route on mount if needed
   */
  useEffect(() => {
    if (
      !route &&
      hasValidCoordinates(load.origin.coordinates) &&
      hasValidCoordinates(load.destination.coordinates) &&
      !isLoadingRoute &&
      !routeAttempted
    ) {
      calculateRoute();
    }
  }, [
    route,
    hasValidCoordinates,
    load.origin.coordinates,
    load.destination.coordinates,
    isLoadingRoute,
    routeAttempted,
    calculateRoute,
  ]);

  // Reset attempt flag when coordinates change (e.g., after geocoding updates)
  useEffect(() => {
    setRouteAttempted(false);
  }, [
    load.origin.coordinates?.lat,
    load.origin.coordinates?.lng,
    load.destination.coordinates?.lat,
    load.destination.coordinates?.lng,
  ]);

  /**
   * Auto-start tracking when load status is 'in_route'
   */
  useEffect(() => {
    if (load.status === "in_route" && route && !isTracking) {
      startTruckTracking();
    }
  }, [load.status, route, isTracking, startTruckTracking]);

  /**
   * Render route layer on map
   */
  const renderRouteLayer = () => {
    if (!route) return null;

    try {
      // Route geometry for visualization
      const routeGeometry =
        typeof route.geometry === "string"
          ? JSON.parse(route.geometry)
          : route.geometry;

      return (
        <Source
          id="route"
          type="geojson"
          data={{
            type: "Feature",
            properties: {},
            geometry: routeGeometry,
          }}
        >
          <Layer
            id="route-line"
            type="line"
            paint={{
              "line-color": "#3b82f6",
              "line-width": 4,
              "line-opacity": 0.8,
            }}
            layout={{
              "line-join": "round",
              "line-cap": "round",
            }}
          />
        </Source>
      );
    } catch (error) {
      console.error("Error rendering route:", error);
      return null;
    }
  };

  /**
   * Render origin marker
   */
  const renderOriginMarker = () => {
    const coordinates = load.origin.coordinates;
    if (!coordinates) return null;

    return (
      <Marker
        longitude={coordinates.lng}
        latitude={coordinates.lat}
        color="#10b981"
        onClick={() => setSelectedMarker("origin")}
      />
    );
  };

  /**
   * Render destination marker
   */
  const renderDestinationMarker = () => {
    const coordinates = load.destination.coordinates;
    if (!coordinates) return null;

    return (
      <Marker
        longitude={coordinates.lng}
        latitude={coordinates.lat}
        color="#ef4444"
        onClick={() => setSelectedMarker("destination")}
      />
    );
  };

  /**
   * Render truck position marker
   */
  const renderTruckMarker = () => {
    if (!truckPosition) return null;

    return (
      <Marker
        longitude={truckPosition.coordinate.lng}
        latitude={truckPosition.coordinate.lat}
        anchor="center"
        onClick={() => setSelectedMarker("truck")}
      >
        <div
          className="relative drop-shadow-xl"
          style={{
            width: 40,
            height: 40,
            backgroundColor: theme === "dark" ? "#0f1a2b" : "#ffffff",
            WebkitMaskImage: "url(/fast-delivery.png)",
            maskImage: "url(/fast-delivery.png)",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      </Marker>
    );
  };

  /**
   * Render popup for selected marker
   */
  const renderPopup = () => {
    if (!selectedMarker) return null;

    let coordinates: Coordinate | null = null;
    let title = "";
    let content: React.ReactNode = null;

    switch (selectedMarker) {
      case "origin":
        coordinates = load.origin.coordinates;
        title = "Origin";
        content = (
          <div className="space-y-2">
            <p className="font-medium">{load.origin.street}</p>
            <p className="text-sm text-gray-600">
              {load.origin.city}, {load.origin.state}
            </p>
            <p className="text-sm text-gray-600">{load.origin.zipCode}</p>
          </div>
        );
        break;

      case "destination":
        coordinates = load.destination.coordinates;
        title = "Destination";
        content = (
          <div className="space-y-2">
            <p className="font-medium">{load.destination.street}</p>
            <p className="text-sm text-gray-600">
              {load.destination.city}, {load.destination.state}
            </p>
            <p className="text-sm text-gray-600">{load.destination.zipCode}</p>
          </div>
        );
        break;

      case "truck":
        coordinates = truckPosition?.coordinate || null;
        title = "Truck";
        content = (
          <div className="space-y-2">
            {truck && (
              <>
                <p className="font-medium">{truck.licensePlate}</p>
                <p className="text-sm text-gray-600">{truck.model}</p>
              </>
            )}
            {truckPosition && (
              <>
                <p className="text-sm text-gray-600">
                  Speed: {truckPosition.speed.toFixed(0)} km/h
                </p>
                <p className="text-sm text-gray-600">
                  Progress: {trackingProgress.toFixed(1)}%
                </p>
              </>
            )}
            {driver && (
              <p className="text-sm text-gray-600">Motorista: {driver.name}</p>
            )}
          </div>
        );
        break;

      default:
        return null;
    }

    if (!coordinates) return null;

    return (
      <Popup
        longitude={coordinates.lng}
        latitude={coordinates.lat}
        onClose={() => setSelectedMarker(null)}
        closeButton={true}
        closeOnClick={false}
        offset={[0, -10]}
      >
        <div className="p-2">
          <h3 className="font-semibold mb-2">{title}</h3>
          {content}
        </div>
      </Popup>
    );
  };

  /**
   * Render map controls and information
   */
  const renderControls = () => {
    if (!showDetails) return null;

    return (
      <div className="absolute top-4 left-4 z-10 space-y-2">
        {/* Route Information Card */}
        {route && (
          <Card className="p-3 bg-white/95 backdrop-blur-sm max-w-xs">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Route Info</h4>
              <div className="text-xs space-y-1">
                <p>Distância: {(route.distance / 1000).toFixed(1)} km</p>
                <p>Duração: {Math.round(route.duration / 60)} min</p>
                {isTracking && <p>Progress: {trackingProgress.toFixed(1)}%</p>}
              </div>
            </div>
          </Card>
        )}

        {/* Load Information Card */}
        <Card className="p-3 bg-white/95 backdrop-blur-sm max-w-xs">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Load Info</h4>
            <div className="text-xs space-y-1">
              <p className="truncate max-w-[250px]" title={load.description}>
                {load.description}
              </p>
              <p>Peso: {load.weight} kg</p>
              {driver && <p>Motorista: {driver.name}</p>}
              {truck && (
                <p>
                  Veículo: {truck.licensePlate} ({truck.model})
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Show error if token is missing
  if (isTokenMissing) {
    return (
      <div className={`relative ${className}`} style={{ height, width }}>
        <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              Mapbox access token missing
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Set REACT_APP_MAPBOX_ACCESS_TOKEN and restart the dev server.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading if coordinates are not available
  if (
    !hasValidCoordinates(load.origin.coordinates) ||
    !hasValidCoordinates(load.destination.coordinates)
  ) {
    return (
      <div className={`relative ${className}`} style={{ height, width }}>
        <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Waiting for origin/destination geocoding...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <Map
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {/* Map Controls */}
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl position="bottom-left" />

        {/* Route Layer */}
        {renderRouteLayer()}

        {/* Markers */}
        {renderOriginMarker()}
        {renderDestinationMarker()}
        {renderTruckMarker()}

        {/* Popup */}
        {renderPopup()}
      </Map>

      {/* Controls and Information */}
      {renderControls()}

      {/* Loading Overlay */}
      {isLoadingRoute && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
            <Spinner size="sm" />
            <span>Calculating route...</span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {routeError && (
        <div className="absolute bottom-4 right-4 z-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  Route Error
                </h3>
                <p className="text-sm text-red-600">{routeError}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={calculateRoute}
                className="ml-2 text-xs"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
