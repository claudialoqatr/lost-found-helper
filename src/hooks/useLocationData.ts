import { useState, useEffect, useCallback } from "react";
import type { LocationData } from "@/types";

interface UseLocationDataReturn {
  location: LocationData;
  loading: boolean;
  refresh: () => void;
}

/**
 * Hook to get the user's current location with reverse geocoding.
 * Uses the browser's Geolocation API and Nominatim for address lookup.
 */
export function useLocationData(): UseLocationDataReturn {
  const [location, setLocation] = useState<LocationData>({
    latitude: null,
    longitude: null,
    address: null,
  });
  const [loading, setLoading] = useState(true);

  const getLocation = useCallback(async () => {
    setLoading(true);

    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Try to get address from coordinates using Nominatim geocoding API
        let address: string | null = null;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          address = data.display_name || null;
        } catch (e) {
          console.log("Geocoding failed:", e);
        }

        setLocation({ latitude, longitude, address });
        setLoading(false);
      },
      (error) => {
        console.log("Location error:", error);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return {
    location,
    loading,
    refresh: getLocation,
  };
}
