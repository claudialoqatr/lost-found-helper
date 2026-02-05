import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const MAPBOX_TOKEN = "pk.eyJ1IjoiY2xhdWRpYWxvcWF0ciIsImEiOiJjbWw5c3MxZ2YwNWJyM2hyNHJsY2JuaTdiIn0.Oz4sYQeauYwe_QAFaAo0kg";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

/**
 * Silently captures location in the background without blocking UI.
 * Updates the scans table once address is geocoded.
 */
export function useSilentLocationCapture(scanId: number | null) {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    address: null,
  });
  const captureAttemptedRef = useRef(false);

  useEffect(() => {
    // Only attempt once per scan
    if (!scanId || captureAttemptedRef.current) return;
    captureAttemptedRef.current = true;

    const captureLocation = async () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Update state with coords immediately
          setLocation((prev) => ({ ...prev, latitude, longitude }));

          // Geocode with Mapbox
          let address: string | null = null;
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=address,place,locality,neighborhood`
            );
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
              address = data.features[0].place_name || null;
            }
          } catch (e) {
            console.log("Mapbox geocoding failed:", e);
          }

          // Build final location text
          let locationText: string | null = null;
          if (address && address.trim()) {
            locationText = address;
          } else if (latitude && longitude) {
            locationText = `https://www.google.com/maps?q=${latitude},${longitude}`;
          }

          // Update local state
          setLocation({ latitude, longitude, address: locationText });

          // Silently update the scan record
          if (locationText) {
            const { error } = await supabase
              .from("scans")
              .update({
                latitude,
                longitude,
                address: locationText,
              })
              .eq("id", scanId);

            if (error) {
              console.log("Silent scan update failed:", error);
            }
          }
        },
        (error) => {
          // Fail silently - location denied or unavailable
          console.log("Geolocation denied or failed:", error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000, // 8 second timeout
          maximumAge: 60000, // Accept cached position up to 1 minute old
        }
      );
    };

    captureLocation();
  }, [scanId]);

  return location;
}
