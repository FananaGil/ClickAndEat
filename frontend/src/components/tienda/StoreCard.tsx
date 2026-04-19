'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Badge, RatingBadge } from '@/components/ui/Badge';
import { Clock, MapPin, Star, Truck, ShoppingBag, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tienda } from '@/types';

interface StoreCardProps {
  store: Tienda;
  variant?: 'default' | 'compact' | 'horizontal';
  className?: string;
  showDistance?: boolean;
  distance?: number;
}

export function StoreCard({
  store,
  variant = 'default',
  className,
  showDistance = false,
  distance,
}: StoreCardProps) {
  const serviceIcons = {
    delivery: Truck,
    pickup: ShoppingBag,
    sitio: Utensils,
  };

  const availableServices = store.tipo_servicio || [];

  if (variant === 'horizontal') {
    return (
      <Link href={`/tienda/${store.slug}`}>
        <Card
          hoverable
          className={cn('flex gap-4 p-3', className)}
        >
          {/* Logo */}
          <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
            {store.logo_url ? (
              <Image
                src={store.logo_url}
                alt={store.nombre}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <Utensils className="w-8 h-8 text-primary" />
              </div>
            )}
            {!store.abierto && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-xs font-medium">Cerrado</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 truncate">
                  {store.nombre}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {store.categoria?.nombre || store.direccion}
                </p>
              </div>
              <RatingBadge rating={store.calificacion_comida} size="sm" />
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {store.tiempo_preparacion || 20}-{store.tiempo_preparacion + 10 || 30} min
              </span>
              {showDistance && distance !== undefined && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {distance < 1
                    ? `${Math.round(distance * 1000)}m`
                    : `${distance.toFixed(1)}km`}
                </span>
              )}
              <span className="font-medium text-primary">
                Bs. {store.costo_delivery?.toFixed(2) || '0.00'} delivery
              </span>
            </div>

            {/* Services */}
            <div className="flex items-center gap-2 mt-2">
              {availableServices.map((service) => {
                const Icon = serviceIcons[service];
                return (
                  <span
                    key={service}
                    className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600"
                  >
                    <Icon className="w-3 h-3" />
                    {service === 'delivery'
                      ? 'Delivery'
                      : service === 'pickup'
                      ? 'Pickup'
                      : 'Sitio'}
                  </span>
                );
              })}
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href={`/tienda/${store.slug}`}>
        <Card hoverable className={cn('p-3', className)}>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
            {store.banner_url ? (
              <Image
                src={store.banner_url}
                alt={store.nombre}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <Utensils className="w-8 h-8 text-primary" />
              </div>
            )}
          </div>
          <div className="mt-2">
            <h3 className="font-medium text-gray-900 truncate text-sm">
              {store.nombre}
            </h3>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                {store.categoria?.nombre}
              </span>
              <RatingBadge rating={store.calificacion_comida} size="sm" />
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/tienda/${store.slug}`}>
      <Card hoverable className={cn('overflow-hidden', className)}>
        {/* Banner Image */}
        <div className="relative h-32 bg-gray-100">
          {store.banner_url ? (
            <Image
              src={store.banner_url}
              alt={store.nombre}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <Utensils className="w-12 h-12 text-primary/50" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge
              variant={store.abierto ? 'success' : 'danger'}
              rounded
            >
              {store.abierto ? 'Abierto' : 'Cerrado'}
            </Badge>
          </div>

          {/* Logo */}
          <div className="absolute -bottom-8 left-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border-4 border-white shadow-md bg-white">
              {store.logo_url ? (
                <Image
                  src={store.logo_url}
                  alt={store.nombre}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <Utensils className="w-6 h-6 text-primary" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-10 px-4 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900">{store.nombre}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {store.categoria?.nombre || store.direccion}
              </p>
            </div>
            <RatingBadge rating={store.calificacion_comida} />
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {store.tiempo_preparacion || 20}-{store.tiempo_preparacion + 10 || 30} min
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              {store.calificacion_llegada || store.calificacion_comida}/5 llegada
            </span>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {availableServices.map((service) => {
                const Icon = serviceIcons[service];
                return (
                  <span
                    key={service}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-600"
                  >
                    <Icon className="w-3 h-3" />
                  </span>
                );
              })}
            </div>
            <span className="text-sm font-medium text-primary">
              Bs. {store.costo_delivery?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// Skeleton for loading state
export function StoreCardSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="relative h-32 bg-gray-200" />
      <div className="pt-10 px-4 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="w-32 h-5 bg-gray-200 rounded" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
          </div>
          <div className="w-12 h-6 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="w-16 h-4 bg-gray-200 rounded" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
        </div>
      </div>
    </Card>
  );
}
