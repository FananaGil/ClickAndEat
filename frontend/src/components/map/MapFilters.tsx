'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface Category {
  id: string;
  nombre: string;
  icono?: string;
}

interface MapFiltersProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  onSearchChange: (search: string) => void;
  searchQuery: string;
  isOpen: boolean;
  onToggle: () => void;
  filters?: {
    openNow: boolean;
    delivery: boolean;
    pickup: boolean;
  };
  onFiltersChange?: (filters: MapFiltersProps['filters']) => void;
}

export default function MapFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  onSearchChange,
  searchQuery,
  isOpen,
  onToggle,
  filters,
  onFiltersChange,
}: MapFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  const clearFilters = () => {
    onCategoryChange(null);
    onSearchChange('');
    setLocalSearch('');
    if (onFiltersChange) {
      onFiltersChange({ openNow: false, delivery: false, pickup: false });
    }
  };

  const hasActiveFilters =
    selectedCategory !== null ||
    searchQuery !== '' ||
    filters?.openNow ||
    filters?.delivery ||
    filters?.pickup;

  return (
    <div className="bg-white rounded-2xl shadow-card p-4 space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar tiendas..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        {localSearch && (
          <button
            type="button"
            onClick={() => {
              setLocalSearch('');
              onSearchChange('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Toggle Filters Button (Mobile) */}
      <button
        onClick={onToggle}
        className="lg:hidden flex items-center justify-between w-full px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-700"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-primary rounded-full" />
          )}
        </span>
        <span>{isOpen ? 'Ocultar' : 'Mostrar'}</span>
      </button>

      {/* Filters Content */}
      <div className={cn('space-y-4', !isOpen && 'hidden lg:block')}>
        {/* Quick Filters */}
        {filters && onFiltersChange && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                onFiltersChange({ ...filters, openNow: !filters.openNow })
              }
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                filters.openNow
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Abiertas ahora
            </button>
            <button
              onClick={() =>
                onFiltersChange({ ...filters, delivery: !filters.delivery })
              }
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                filters.delivery
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Delivery
            </button>
            <button
              onClick={() =>
                onFiltersChange({ ...filters, pickup: !filters.pickup })
              }
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                filters.pickup
                  ? 'bg-secondary/10 text-secondary'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Pickup
            </button>
          </div>
        )}

        {/* Categories */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Categorías</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onCategoryChange(null)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                selectedCategory === null
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {category.icon && (
                  <span className="mr-1">{category.icon}</span>
                )}
                {category.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
