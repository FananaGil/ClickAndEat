'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Store,
  ShoppingCart,
  Star,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface DashboardMetrics {
  total_tiendas: number;
  tiendas_activas: number;
  total_pedidos_hoy: number;
  ventas_hoy: number;
  calificacion_promedio: number;
  pedidos_pendientes: number;
  tiendas_suspendidas: number;
}

interface TopTienda {
  id: string;
  nombre: string;
  slug: string;
  logo_url: string | null;
  total_pedidos: number;
  ventas_totales: number;
  ticket_promedio: number;
  calificacion_promedio: number;
}

interface TiendaBajoRendimiento {
  id: string;
  nombre: string;
  slug: string;
  calificacion_promedio: number;
  num_calificaciones: number;
  estado: string;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [tiendasTop, setTiendasTop] = useState<TopTienda[]>([]);
  const [tiendasBajas, setTiendasBajas] = useState<TiendaBajoRendimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes'>('semana');

  useEffect(() => {
    loadDashboardData();
  }, [periodo]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simulated API calls - replace with actual API
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

      const [metricsRes, topRes, bajasRes] = await Promise.all([
        fetch(`${baseUrl}/metrics/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        fetch(`${baseUrl}/metrics/tiendas-top/?periodo=${periodo}&tipo=pedidos`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        fetch(`${baseUrl}/metrics/tiendas-bajo-rendimiento/?umbral=3.0`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
      ]);

      if (metricsRes.ok && topRes.ok && bajasRes.ok) {
        const metricsData = await metricsRes.json();
        const topData = await topRes.json();
        const bajasData = await bajasRes.json();

        setMetrics(metricsData);
        setTiendasTop(Array.isArray(topData) ? topData : []);
        setTiendasBajas(Array.isArray(bajasData) ? bajasData : []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Load sample data for demo
      setMetrics({
        total_tiendas: 24,
        tiendas_activas: 18,
        total_pedidos_hoy: 145,
        ventas_hoy: 4567800,
        calificacion_promedio: 4.2,
        pedidos_pendientes: 23,
        tiendas_suspendidas: 2,
      });
      setTiendasTop([
        {
          id: '1',
          nombre: 'Pizzería El Sol',
          slug: 'pizzeria-el-sol',
          logo_url: null,
          total_pedidos: 89,
          ventas_totales: 1250000,
          ticket_promedio: 14000,
          calificacion_promedio: 4.8,
        },
        {
          id: '2',
          nombre: 'Hamburguesas El Parque',
          slug: 'hamburguesas-el-parque',
          logo_url: null,
          total_pedidos: 67,
          ventas_totales: 890000,
          ticket_promedio: 13200,
          calificacion_promedio: 4.5,
        },
      ]);
      setTiendasBajas([
        {
          id: '3',
          nombre: 'Arepera Express',
          slug: 'arepera-express',
          calificacion_promedio: 2.3,
          num_calificaciones: 15,
          estado: 'supervision',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(
        `${baseUrl}/metrics/exportar-csv/?tipo=pedidos&periodo=${periodo}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `metricas_${periodo}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar datos');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-800">
                Panel de Administración
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadDashboardData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tiendas Activas</p>
                <p className="text-2xl font-bold text-gray-800">
                  {metrics?.tiendas_activas || 0}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    / {metrics?.total_tiendas || 0}
                  </span>
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pedidos Hoy</p>
                <p className="text-2xl font-bold text-gray-800">
                  {metrics?.total_pedidos_hoy || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ventas Hoy</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(metrics?.ventas_hoy || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Calificación Promedio</p>
                <p className="text-2xl font-bold text-gray-800">
                  {metrics?.calificacion_promedio?.toFixed(1) || '0.0'}
                  <span className="text-sm font-normal text-yellow-500 ml-1">★</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Alerts Section */}
        {(metrics?.pedidos_pendientes || 0) > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800">
                  {metrics?.pedidos_pendientes} pedidos pendientes de atención
                </p>
                <p className="text-sm text-amber-700">
                  Las tiendas deben confirmar o procesar estos pedidos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Period Selector */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Análisis de Rendimiento</h2>
          <div className="flex gap-2">
            {(['dia', 'semana', 'mes'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  periodo === p
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p === 'dia' ? 'Hoy' : p === 'semana' ? 'Esta Semana' : 'Este Mes'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Stores */}
          <Card className="p-4">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Tiendas con Más Pedidos
            </h3>
            <div className="space-y-3">
              {tiendasTop.map((tienda, index) => (
                <div
                  key={tienda.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600">
                    {index + 1}
                  </div>
                  {tienda.logo_url ? (
                    <img
                      src={tienda.logo_url}
                      alt={tienda.nombre}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Store className="w-5 h-5 text-orange-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{tienda.nombre}</p>
                    <p className="text-sm text-gray-500">
                      {tienda.total_pedidos} pedidos · {formatCurrency(tienda.ventas_totales)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {tienda.calificacion_promedio.toFixed(1)} ★
                    </p>
                  </div>
                </div>
              ))}
              {tiendasTop.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No hay datos disponibles para este período.
                </p>
              )}
            </div>
          </Card>

          {/* Low Performance Stores */}
          <Card className="p-4">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Tiendas Bajo Rendimiento
            </h3>
            <div className="space-y-3">
              {tiendasBajas.map((tienda) => (
                <div
                  key={tienda.id}
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100"
                >
                  {tienda.logo_url ? (
                    <img
                      src={tienda.logo_url}
                      alt={tienda.nombre}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Store className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{tienda.nombre}</p>
                    <p className="text-sm text-gray-500">
                      {tienda.num_calificaciones} calificaciones
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={tienda.estado === 'suspension' ? 'danger' : 'warning'}
                    >
                      {tienda.calificacion_promedio.toFixed(1)} ★
                    </Badge>
                    {tienda.estado === 'suspension' && (
                      <p className="text-xs text-red-600 mt-1">Requiere acción</p>
                    )}
                  </div>
                </div>
              ))}
              {tiendasBajas.length === 0 && (
                <div className="text-center py-4">
                  <TrendingUp className="w-12 h-12 text-green-300 mx-auto mb-2" />
                  <p className="text-gray-500">¡Todas las tiendas están funcionando bien!</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <h3 className="font-bold text-gray-800 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/tiendas">
              <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                <Store className="w-8 h-8 text-blue-600 mb-2" />
                <p className="font-medium text-gray-800">Gestionar Tiendas</p>
              </Card>
            </Link>
            <Link href="/admin/usuarios">
              <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                <Users className="w-8 h-8 text-purple-600 mb-2" />
                <p className="font-medium text-gray-800">Usuarios</p>
              </Card>
            </Link>
            <Link href="/admin/incidencias">
              <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
                <p className="font-medium text-gray-800">Incidencias</p>
              </Card>
            </Link>
            <Link href="/admin/reportes">
              <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
                <p className="font-medium text-gray-800">Reportes</p>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
