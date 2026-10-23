import { useEffect, useState } from "react";

/**
 * Wraps the browser Geolocation API and surfaces THREE distinct states the
 * UI must handle differently: still asking, granted-with-position, and
 * denied/unavailable. Journey Mode cannot silently fall back to "no
 * location" - it needs to tell the user clearly why the map can't center
 * on them and let them pick a start point manually instead.
 */
export function useGeolocation({ watch = false } = {}) {
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | requesting | granted | denied | unavailable
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      setError("This browser does not support location services.");
      return;
    }

    setStatus("requesting");

    const onSuccess = (pos) => {
      setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setStatus("granted");
      setError(null);
    };

    const onError = (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        setStatus("denied");
        setError("Location permission denied. You can still pick your start point manually on the map.");
      } else {
        setStatus("unavailable");
        setError("Could not determine your location right now. Please pick your start point manually.");
      }
    };

    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 };

    if (watch) {
      const watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    }
  }, [watch]);

  return { position, status, error };
}
