'use client';

import { useState, useEffect, useCallback } from 'react';
import { ordersApi } from '@/lib/api';
import type { Pedido, OrderStatus, ApiResponse } from '@/types';

export function useOrders() {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ordersApi.getByUser('');
      if (response.success && response.data) {
        setOrders(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchOrderById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ordersApi.getById(id);
      if (response.success && response.data) {
        setCurrentOrder(response.data);
        return response.data;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching order');
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  const createOrder = useCallback(
    async (data: {
      items: Array<{
        menu_item_id: string;
        cantidad: number;
        comentarios?: string;
      }>;
      tipo_servicio: 'delivery' | 'pickup' | 'sitio';
      direccion_entrega?: string;
      lat?: number;
      lng?: number;
      metodo_pago: string;
      notas?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await ordersApi.create(data);
        if (response.success && response.data) {
          setCurrentOrder(response.data);
          return response.data;
        }
        throw new Error(response.error || 'Error creating order');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error creating order');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateOrderStatus = useCallback(async (id: string, estado: OrderStatus) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ordersApi.updateStatus(id, estado);
      if (response.success && response.data) {
        setCurrentOrder(response.data);
        return response.data;
      }
      throw new Error(response.error || 'Error updating order');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating order');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(async (id: string, motivo?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ordersApi.cancel(id, motivo);
      if (response.success && response.data) {
        setCurrentOrder(response.data);
        return response.data;
      }
      throw new Error(response.error || 'Error canceling order');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error canceling order');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    orders,
    currentOrder,
    isLoading,
    error,
    fetchOrders,
    fetchOrderById,
    createOrder,
    updateOrderStatus,
    cancelOrder,
  };
}

export function useOrderPolling(orderId: string, interval: number = 5000) {
  const [order, setOrder] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const response = await ordersApi.getById(orderId);
      if (response.success && response.data) {
        setOrder(response.data);
      }
    } catch (err) {
      // Silent fail for polling
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    const timer = setInterval(fetchOrder, interval);
    return () => clearInterval(timer);
  }, [fetchOrder, interval]);

  return { order, isLoading, error, refetch: fetchOrder };
}
