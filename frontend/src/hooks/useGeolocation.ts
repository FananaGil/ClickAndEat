'use client';

import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  enableOnMount?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    enableOnMount = true,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: enableOnMount,
  });

  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      isLoading: false,
    });
  }, []);

  const onError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permiso de geolocalización denegado';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Información de ubicación no disponible';
        break;
      case error.TIMEOUT:
        errorMessage = 'Tiempo de espera de geolocalización agotado';
        break;
      default:
        errorMessage = 'Error desconocido de geolocalización';
    }
    setState((prev) => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
    }));
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocalización no soportada por este navegador',
        isLoading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [enableHighAccuracy, timeout, maximumAge, onSuccess, onError]);

  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocalización no soportada por este navegador',
        isLoading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enableHighAccuracy, timeout, maximumAge, onSuccess, onError]);

  useEffect(() => {
    if (enableOnMount) {
      getLocation();
    }
  }, [enableOnMount, getLocation]);

  return {
    ...state,
    getLocation,
    watchPosition,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  };
}

// Hook to calculate distance from user to a point
export function useDistanceFromUser(
  targetLat: number | null,
  targetLng: number | null
) {
  const { latitude, longitude } = useGeolocation({ enableOnMount: false });
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (
      latitude !== null &&
      longitude !== null &&
      targetLat !== null &&
      targetLng !== null
    ) {
      const R = 6371; // Earth's radius in km
      const dLat = toRad(targetLat - latitude);
      const dLng = toRad(targetLng - longitude);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(latitude)) *
          Math.cos(toRad(targetLat)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      setDistance(dist);
    }
  }, [latitude, longitude, targetLat, targetLng]);

  return {
    distance,
    formattedDistance:
      distance !== null
        ? distance < 1
          ? `${Math.round(distance * 1000)}m`
          : `${distance.toFixed(1)}km`
        : null,
  };
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Default coordinates for Punto Fijo, Venezuela
export const PUNTO_FIJO_CENTER = {
  lat: 11.6956,
  lng: -70.1999,
};
