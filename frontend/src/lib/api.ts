import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { supabase } from './supabase';
import type { ApiResponse, PaginatedResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Try to get the session from Supabase
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.access_token) {
      config.headers.Authorization = `Bearer ${session.session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<null>>) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could trigger logout or token refresh
      supabase.auth.signOut();
    }
    return Promise.reject(error);
  }
);

/**
 * Generic GET request
 */
export async function get<T>(
  url: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.get<ApiResponse<T>>(url, { ...config, params });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Generic POST request
 */
export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Generic PUT request
 */
export async function put<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Generic PATCH request
 */
export async function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Generic DELETE request
 */
export async function del<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Upload file with FormData
 */
export async function uploadFile<T>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

// Store API endpoints
export const storesApi = {
  getAll: (params?: Record<string, unknown>) =>
    get<any[]>('/tiendas', params),

  getBySlug: (slug: string) =>
    get<any>(`/tiendas/${slug}`),

  getById: (id: string) =>
    get<any>(`/tiendas/id/${id}`),

  getCategories: () =>
    get<any[]>('/categorias'),
};

// Menu API endpoints
export const menuApi = {
  getByTienda: (tiendaId: string) =>
    get<any[]>(`/tiendas/${tiendaId}/menu`),

  getItem: (itemId: string) =>
    get<any>(`/menu/${itemId}`),
};

// Order API endpoints
export const ordersApi = {
  create: (data: {
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
  }) => post<any>('/pedidos', data),

  getById: (id: string) =>
    get<any>(`/pedidos/${id}`),

  getByUser: (userId: string) =>
    get<any[]>('/pedidos/mis-pedidos'),

  getByTienda: (tiendaId: string) =>
    get<any[]>(`/pedidos/tienda/${tiendaId}`),

  updateStatus: (id: string, estado: string) =>
    patch<any>(`/pedidos/${id}/status`, { estado }),

  cancel: (id: string, motivo?: string) =>
    patch<any>(`/pedidos/${id}/cancelar`, { motivo }),
};

// Chat API endpoints
export const chatApi = {
  getMessages: (pedidoId: string) =>
    get<any[]>(`/chat/${pedidoId}`),

  sendMessage: (pedidoId: string, data: {
    contenido: string;
    tipo: 'texto' | 'imagen' | 'archivo';
  }) => post<any>(`/chat/${pedidoId}`, data),

  uploadFile: (pedidoId: string, formData: FormData) =>
    uploadFile<any>(`/chat/${pedidoId}/archivo`, formData),
};

// Rating API endpoints
export const ratingsApi = {
  create: (data: {
    pedido_id: string;
    calificacion_comida: number;
    calificacion_servicio: number;
    comentario?: string;
  }) => post<any>('/calificaciones', data),

  getByTienda: (tiendaId: string) =>
    get<any[]>(`/calificaciones/tienda/${tiendaId}`),
};

// User API endpoints
export const userApi = {
  getProfile: () =>
    get<any>('/usuarios/perfil'),

  updateProfile: (data: {
    nombre?: string;
    telefono?: string;
    direccion?: string;
    foto_url?: string;
  }) => patch<any>('/usuarios/perfil', data),

  updateLocation: (lat: number, lng: number) =>
    patch<any>('/usuarios/ubicacion', { lat, lng }),
};

// Error handler
function handleError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<null>>;
    if (axiosError.response?.data?.error) {
      return new Error(axiosError.response.data.error);
    }
    if (axiosError.message) {
      return new Error(axiosError.message);
    }
  }
  return new Error('An unexpected error occurred');
}

export default apiClient;
