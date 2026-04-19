'use client';

import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  stores: Array<{
    id: string;
    slug: string;
    nombre: string;
    lat: number;
    lng: number;
    abierto: boolean;
    categoria: string;
  }>;
  center: [number, number];
  userLocation: [number, number] | null;
  onStoreClick?: (slug: string) => void;
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
}

function MapController({
  center,
  userLocation,
}: {
  center: [number, number];
  userLocation: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, map.getZoom());
    } else {
      map.setView(center, map.getZoom());
    }
  }, [center, userLocation, map]);

  return null;
}

function StoreMarkers({
  stores,
  onStoreClick,
}: {
  stores: MapContainerProps['stores'];
  onStoreClick?: (slug: string) => void;
}) {
  const { default: StoreMarker } = require('./StoreMarker');

  return (
    <>
      {stores.map((store) => (
        <StoreMarker
          key={store.id}
          store={store}
          onClick={() => onStoreClick?.(store.slug)}
        />
      ))}
    </>
  );
}

export default function MapContainer({
  stores,
  center,
  userLocation,
  onStoreClick,
  zoom = 14,
  className = 'h-96 w-full',
  children,
}: MapContainerProps) {
  const bounds: LatLngBoundsExpression = [
    [11.5, -70.5],
    [11.9, -69.9],
  ];

  return (
    <div className={`relative ${className}`}>
      <LeafletMapContainer
        center={center}
        zoom={zoom}
        className={className}
        bounds={bounds}
        scrollWheelZoom={true}
        style={{ minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} userLocation={userLocation} />
        <StoreMarkers stores={stores} onStoreClick={onStoreClick} />
        {children}
      </LeafletMapContainer>

      {/* Map Overlay Gradient */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
    </div>
  );
}
