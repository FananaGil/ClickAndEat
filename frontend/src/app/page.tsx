'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Search, Filter, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StoreCard } from '@/components/tienda/StoreCard';
import { MapFilters } from '@/components/map/MapFilters';
import { useGeolocation } from '@/hooks/useGeolocation';
import { storesApi } from '@/lib/api';
import type { Tienda, StoreFilters } from '@/types';

// Dynamic import del mapa para evitar errores de SSR
const MapContainer = dynamic(
  () => import('@/components/map/MapContainer').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <MapLoadingSkeleton /> }
);

function MapLoadingSkeleton() {
  return (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <div className="text-center">
        <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-400">Cargando mapa...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTienda, setSelectedTienda] = useState<Tienda | null>(null);
  const [filters, setFilters] = useState<StoreFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const { position, error: geoError, loading: geoLoading, getCurrentPosition } = useGeolocation();

  useEffect(() => {
    loadTiendas();
  }, [filters]);

  const loadTiendas = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, unknown> = {};
      if (filters.categoria) params.categoria = filters.categoria;
      if (filters.abierto !== undefined) params.abierto = filters.abierto;
      if (position) {
        params.lat = position.lat;
        params.lng = position.lng;
        params.radio = 10; // 10km radius
      }

      const response = await storesApi.getAll(params);

      if (response.success && response.data) {
        setTiendas(response.data);
      } else {
        setError('Error al cargar las tiendas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
      console.error('Error loading stores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter locally for now
    if (searchQuery) {
      setFilters({ ...filters, busqueda: searchQuery });
    }
  };

  const handleTiendaSelect = (tienda: Tienda) => {
    setSelectedTienda(tienda);
  };

  const filteredTiendas = tiendas.filter((tienda) => {
    if (filters.busqueda) {
      return tienda.nombre.toLowerCase().includes(filters.busqueda.toLowerCase());
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-gray-800">CLICK&EAT</span>
            </div>
            <nav className="hidden md:flex items-center gap-4">
              <a href="/perfil" className="text-gray-600 hover:text-orange-500">
                Mi Perfil
              </a>
              <a href="/carrito" className="text-gray-600 hover:text-orange-500">
                Carrito
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tiendas o comida..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* Geolocation Button */}
            <Button
              variant="outline"
              onClick={getCurrentPosition}
              disabled={geoLoading}
              className="flex items-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              {geoLoading ? 'Obteniendo...' : geoError ? 'Error' : 'Mi ubicación'}
            </Button>

            {/* Filters */}
            <MapFilters
              filters={filters}
              onFilterChange={setFilters}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Section */}
          <div className="h-[500px] lg:h-[600px] bg-white rounded-2xl shadow-lg overflow-hidden">
            <MapContainer
              tiendas={tiendas}
              center={{ lat: 11.6956, lng: -70.1999 }} // Punto Fijo, Falcón
              zoom={13}
              selectedTienda={selectedTienda}
              onTiendaSelect={handleTiendaSelect}
              userPosition={position}
            />
          </div>

          {/* Store List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Tiendas disponibles
              <span className="text-gray-400 font-normal ml-2">
                ({filteredTiendas.length})
              </span>
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-1/2 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
                {error}
                <button
                  onClick={loadTiendas}
                  className="ml-2 underline hover:no-underline"
                >
                  Reintentar
                </button>
              </div>
            ) : filteredTiendas.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No hay tiendas disponibles
                </h3>
                <p className="text-gray-400">
                  Intenta cambiar los filtros o buscar en otra área.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {filteredTiendas.map((tienda) => (
                  <StoreCard
                    key={tienda.id}
                    tienda={tienda}
                    onClick={() => handleTiendaSelect(tienda)}
                    isSelected={selectedTienda?.id === tienda.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
