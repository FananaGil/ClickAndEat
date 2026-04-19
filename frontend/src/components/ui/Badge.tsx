'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 text-gray-600 bg-transparent',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        variants[variant],
        sizes[size],
        rounded ? 'rounded-full' : 'rounded-md',
        className
      )}
    >
      {children}
    </span>
  );
}

// Status-specific badges
export interface StatusBadgeProps {
  status: 'pendiente' | 'confirmado' | 'preparando' | 'listo' | 'en_camino' | 'entregado' | 'cancelado';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pendiente: { label: 'Pendiente', variant: 'warning' },
    confirmado: { label: 'Confirmado', variant: 'primary' },
    preparando: { label: 'Preparando', variant: 'secondary' },
    listo: { label: 'Listo', variant: 'success' },
    en_camino: { label: 'En camino', variant: 'secondary' },
    entregado: { label: 'Entregado', variant: 'success' },
    cancelado: { label: 'Cancelado', variant: 'danger' },
  };

  const config = statusConfig[status] || { label: status, variant: 'default' as const };

  return (
    <Badge variant={config.variant} size={size} rounded>
      {config.label}
    </Badge>
  );
}

// Rating badge
export interface RatingBadgeProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function RatingBadge({ rating, maxRating = 5, size = 'md' }: RatingBadgeProps) {
  return (
    <Badge variant="warning" size={size} rounded>
      <span className="flex items-center gap-0.5">
        {rating.toFixed(1)}
        <svg
          className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
          }
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </span>
    </Badge>
  );
}
