// components
import React, { useEffect, useRef, useState } from "react";

// maps
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// services
import { GeocodingService } from "../../services/geocoding";
import { LoadRouteService } from "../../services/loadRoutes";

// types
import { Address, Coordinate, Load, RouteData } from "../../types/entities";

// Set Mapbox access token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || "";
const validateToken = (): string | null => {
  const token = mapboxgl.accessToken as string | undefined;
  if (!token)
    return "Mapbox access token is required. Set REACT_APP_MAPBOX_ACCESS_TOKEN in a .env.local file and restart the dev server.";
  if (token.startsWith("sk."))
    return "You are using a secret (sk.) token in the browser. Generate a public (pk.) token and use that instead.";
  if (!token.startsWith("pk."))
    return "Invalid Mapbox token format. Use a public token starting with pk.";
  return null;
};

/**
 * Map component props interface
 */
interface MapComponentProps {
  /** Load data containing origin and destination */
  load?: Load;
  /** Origin address */
  origin?: Address;
  /** Destination address */
  destination?: Address;
  /** Map height */
  height?: string;
  /** Map width */
  width?: string;
  /** CSS class name */
  className?: string;
  /** Route data to display */
  route?: RouteData;
  /** Callback when route is calculated */
  onRouteCalculated?: (route: RouteData) => void;
  /** Show truck position (for real-time tracking) */
  truckPosition?: { lat: number; lng: number };
}

const MapComponent: React.FC<MapComponentProps> = ({
  load,
  origin,
  destination,
  height = "400px",
  width = "100%",
  className,
  route,
  onRouteCalculated,
  truckPosition,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Prevent infinite retries when requests fail (e.g., invalid token)
  const geocodeAttemptedRef = useRef<{ origin: boolean; destination: boolean }>(
    {
      origin: false,
      destination: false,
    }
  );
  const routeAttemptedRef = useRef<boolean>(false);

  // Get origin and destination from props or load
  const originCoords = origin?.coordinates || load?.origin?.coordinates;
  const destinationCoords =
    destination?.coordinates || load?.destination?.coordinates;

  // State for processed coordinates
  const [processedOrigin, setProcessedOrigin] = useState<Coordinate | null>(
    originCoords || null
  );
  const [processedDestination, setProcessedDestination] =
    useState<Coordinate | null>(destinationCoords || null);
  const [routeProcessing, setRouteProcessing] = useState(false);

  // Process coordinates if they don't exist
  useEffect(() => {
    const processCoordinates = async () => {
      if (!origin && !load?.origin) return;
      if (!destination && !load?.destination) return;

      const originAddr = origin || load?.origin;
      const destAddr = destination || load?.destination;

      if (!originAddr || !destAddr) return;

      let newOrigin = originCoords;
      let newDestination = destinationCoords;

      // Geocode origin if coordinates don't exist
      if (!newOrigin && originAddr && !geocodeAttemptedRef.current.origin) {
        const geocodedOrigin =
          await GeocodingService.addressToCoordinates(originAddr);
        if (geocodedOrigin) {
          newOrigin = geocodedOrigin;
          setProcessedOrigin(geocodedOrigin);
        }
        geocodeAttemptedRef.current.origin = true;
      } else if (newOrigin) {
        setProcessedOrigin(newOrigin);
      }

      // Geocode destination if coordinates don't exist
      if (
        !newDestination &&
        destAddr &&
        !geocodeAttemptedRef.current.destination
      ) {
        const geocodedDestination =
          await GeocodingService.addressToCoordinates(destAddr);
        if (geocodedDestination) {
          newDestination = geocodedDestination;
          setProcessedDestination(geocodedDestination);
        }
        geocodeAttemptedRef.current.destination = true;
      } else if (newDestination) {
        setProcessedDestination(newDestination);
      }

      // If we have a load ID and both coordinates, process the route
      if (
        load?.id &&
        newOrigin &&
        newDestination &&
        !route &&
        !routeProcessing &&
        !routeAttemptedRef.current
      ) {
        setRouteProcessing(true);
        try {
          const result = await LoadRouteService.updateLoadRoute(
            load.id,
            newOrigin,
            newDestination
          );
          if (result.success && result.route && onRouteCalculated) {
            onRouteCalculated(result.route);
          }
        } catch (error) {
          console.error("Error processing load route:", error);
        } finally {
          setRouteProcessing(false);
          routeAttemptedRef.current = true;
        }
      }
    };

    processCoordinates();
  }, [
    origin,
    destination,
    load,
    originCoords,
    destinationCoords,
    route,
    onRouteCalculated,
    routeProcessing,
  ]);

  // Reset attempt flags when relevant inputs change (new load or address edits)
  useEffect(() => {
    geocodeAttemptedRef.current = { origin: false, destination: false };
    routeAttemptedRef.current = false;
  }, [
    load?.id,
    origin?.street,
    origin?.city,
    origin?.state,
    origin?.zipCode,
    destination?.street,
    destination?.city,
    destination?.state,
    destination?.zipCode,
  ]);

  /**
   * Initialize the map
   */
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const tokenIssue = validateToken();
    if (tokenIssue) {
      setError(tokenIssue);
      setIsLoading(false);
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: processedOrigin
          ? [processedOrigin.lng, processedOrigin.lat]
          : [-46.6333, -23.5505], // São Paulo, Brazil default
        zoom: 9,
      });

      map.current.on("load", () => {
        setIsLoading(false);
      });

      map.current.on("error", (e) => {
        console.error("Map error:", e);
        setError(
          "Failed to load map. Check your Mapbox token and URL restrictions."
        );
        setIsLoading(false);
      });
    } catch (err) {
      console.error("Map initialization error:", err);
      setError("Failed to initialize map");
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [processedOrigin]);

  /**
   * Add markers and route when coordinates are available
   */
  useEffect(() => {
    if (!map.current || !processedOrigin || !processedDestination || isLoading)
      return;

    /**
     * Calculate route using Mapbox Directions API
     */
    const calculateRoute = async (): Promise<RouteData | null> => {
      if (!processedOrigin || !processedDestination) return null;

      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${processedOrigin.lng},${processedOrigin.lat};${processedDestination.lng},${processedDestination.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        );

        if (!response.ok) {
          if (response.status === 401) {
            setError(
              "Unauthorized from Mapbox Directions API (invalid token)."
            );
            return null;
          }
          if (response.status === 403) {
            setError(
              "Forbidden from Mapbox Directions API (token URL restrictions). Add http://localhost:3000 to allowed URLs."
            );
            return null;
          }
          throw new Error("Failed to fetch route");
        }

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const routeData: RouteData = {
            distance: data.routes[0].distance,
            duration: data.routes[0].duration,
            geometry: JSON.stringify(data.routes[0].geometry),
            waypoints: [processedOrigin, processedDestination],
            instructions:
              data.routes[0].legs[0]?.steps?.map(
                (step: { maneuver: { instruction: string } }) =>
                  step.maneuver.instruction
              ) || [],
          };

          return routeData;
        }
      } catch (err) {
        console.error("Route calculation error:", err);
        setError("Failed to calculate route");
      }
      return null;
    };

    /**
     * Display route on the map
     */
    const displayRoute = (routeData: RouteData) => {
      if (!map.current) return;

      try {
        const geometry = JSON.parse(routeData.geometry);

        // Add route source and layer
        if (map.current.getSource("route")) {
          (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData({
            type: "Feature",
            properties: {},
            geometry: geometry,
          });
        } else {
          map.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: geometry,
            },
          });

          map.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#3887FF",
              "line-width": 5,
              "line-opacity": 0.75,
            },
          });
        }
      } catch (err) {
        console.error("Route display error:", err);
      }
    };

    /**
     * Add markers for origin and destination, and calculate route
     */
    const addMarkersAndRoute = async () => {
      if (!map.current || !processedOrigin || !processedDestination) return;

      // Clear existing markers and routes
      const markers = document.querySelectorAll(".mapboxgl-marker");
      markers.forEach((marker) => marker.remove());

      // Add origin marker
      new mapboxgl.Marker({ color: "#22C55E" })
        .setLngLat([processedOrigin.lng, processedOrigin.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-green-600">Origin</h3>
                <p class="text-sm">${origin?.street || load?.origin?.street}</p>
                <p class="text-sm">${origin?.city || load?.origin?.city}, ${origin?.state || load?.origin?.state}</p>
              </div>
            `)
        )
        .addTo(map.current);

      // Add destination marker
      new mapboxgl.Marker({ color: "#EF4444" })
        .setLngLat([processedDestination.lng, processedDestination.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-red-600">Destination</h3>
                <p class="text-sm">${destination?.street || load?.destination?.street}</p>
                <p class="text-sm">${destination?.city || load?.destination?.city}, ${destination?.state || load?.destination?.state}</p>
              </div>
            `)
        )
        .addTo(map.current);

      // Fit map to show both markers
      const bounds = new mapboxgl.LngLatBounds()
        .extend([processedOrigin.lng, processedOrigin.lat])
        .extend([processedDestination.lng, processedDestination.lat]);

      map.current.fitBounds(bounds, { padding: 50 });

      // Calculate and display route
      if (!route) {
        const calculatedRoute = await calculateRoute();
        if (calculatedRoute) {
          displayRoute(calculatedRoute);
          if (onRouteCalculated) {
            onRouteCalculated(calculatedRoute);
          }
        }
      } else {
        displayRoute(route);
      }
    };

    addMarkersAndRoute();
  }, [
    processedOrigin,
    processedDestination,
    isLoading,
    origin,
    destination,
    load,
    route,
    onRouteCalculated,
  ]);

  /**
   * Update truck position for real-time tracking
   */
  useEffect(() => {
    if (!map.current || !truckPosition) return;

    // Add or update truck marker
    const truckMarker = new mapboxgl.Marker({ color: "#3887FF" })
      .setLngLat([truckPosition.lng, truckPosition.lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h3 class="font-semibold text-blue-600">🚛 Truck Position</h3>
              <p class="text-sm">Current location</p>
            </div>
          `)
      )
      .addTo(map.current);

    // Cleanup function to remove marker when component unmounts or position changes
    return () => {
      truckMarker.remove();
    };
  }, [truckPosition]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
        style={{ height, width }}
      >
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Map Error
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10"
          style={{ height, width }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading map...
            </p>
          </div>
        </div>
      )}

      <div
        ref={mapContainer}
        className="mapbox-container"
        style={{ height, width }}
      />

      {/* Route info overlay */}
      {route && !isLoading && (
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-10">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
            Route Info
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Distance: {(route.distance / 1000).toFixed(1)} km
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Duration: {Math.round(route.duration / 60)} min
          </p>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
