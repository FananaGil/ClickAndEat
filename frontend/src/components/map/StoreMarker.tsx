'use client';

import { Marker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression, IconOptions } from 'leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

interface StoreMarkerProps {
  store: {
    id: string;
    slug: string;
    nombre: string;
    lat: number;
    lng: number;
    abierto: boolean;
    categoria: string;
  };
  onClick?: () => void;
}

// Create custom icon
function createStoreIcon(isOpen: boolean): L.Icon {
  const color = isOpen ? '#FF6B35' : '#9CA3AF';
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="40" height="40">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5 0 1.65-.8 3.1-2 4.09V15H9v-1.91C7.8 12.1 7 10.65 7 9c0-2.76 2.24-5 5-5z"/>
      <path d="M9 18c0 .55-.45 1-1 1s-1-.45-1-1v-2c0-.55.45-1 1-1s1 .45 1 1v2zm2 0c0 .55-.45 1-1 1s-1-.45-1-1v-2c0-.55.45-1 1-1s1 .45 1 1v2zm4 0c0 .55-.45 1-1 1s-1-.45-1-1v-2c0-.55.45-1 1-1s1 .45 1 1v2z"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'store-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}

function UserLocationIcon() {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" width="24" height="24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
      <circle cx="12" cy="12" r="4" fill="#3B82F6"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'user-location-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function StoreMarker({ store, onClick }: StoreMarkerProps) {
  const position: LatLngExpression = [store.lat, store.lng];
  const icon = createStoreIcon(store.abierto);

  return (
    <Marker position={position} icon={icon} eventHandlers={{ click: onClick }}>
      <Popup>
        <div className="text-center min-w-[150px]">
          <h3 className="font-semibold text-gray-900">{store.nombre}</h3>
          <p className="text-sm text-gray-500">{store.categoria}</p>
          <span
            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
              store.abierto
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {store.abierto ? 'Abierto' : 'Cerrado'}
          </span>
          <button
            onClick={onClick}
            className="mt-2 w-full bg-primary text-white text-sm py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Ver Tienda
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

export function UserMarker({ position }: { position: [number, number] }) {
  const icon = UserLocationIcon();

  return (
    <Marker position={position} icon={icon}>
      <Popup>Tu ubicación</Popup>
    </Marker>
  );
}
