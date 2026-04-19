// User types
export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  tipo: 'usuario' | 'tienda' | 'admin';
  foto_url?: string;
  direccion?: string;
  created_at: string;
}

export interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Store types
export interface Categoria {
  id: string;
  nombre: string;
  icono?: string;
  orden?: number;
}

export interface MenuItem {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url?: string;
  disponible: boolean;
  categoria_id: string;
}

export interface Tienda {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  logo_url?: string;
  banner_url?: string;
  lat: number;
  lng: number;
  direccion: string;
  telefono: string;
  calificacion_comida: number;
  calificacion_llegada: number;
  tiempo_preparacion: number;
  categoria_id: string;
  categoria?: Categoria;
  categorias?: CategoriaMenu[];
  abierto: boolean;
  costo_delivery: number;
  minimo_pedido: number;
  metodos_pago: string[];
  tipo_servicio: ('delivery' | 'pickup' | 'sitio')[];
  created_at: string;
}

export interface CategoriaMenu {
  id: string;
  nombre: string;
  icono?: string;
  items: MenuItem[];
}

// Cart types
export interface CartItem {
  id: string;
  menu_item_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  comentarios: string;
  imagen_url?: string;
}

export interface CartStore {
  items: CartItem[];
  tienda_id: string | null;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  updateComments: (id: string, comentarios: string) => void;
  clear: () => void;
  get subtotal(): number;
  get delivery(): number;
  get total(): number;
}

// Order types
export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'preparando'
  | 'listo'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

export interface Pedido {
  id: string;
  numero_pedido: string;
  usuario_id: string;
  tienda_id: string;
  tienda?: Tienda;
  tipo_servicio: 'delivery' | 'pickup' | 'sitio';
  estado: OrderStatus;
  subtotal: number;
  delivery: number;
  total: number;
  direccion_entrega?: string;
  lat?: number;
  lng?: number;
  notas?: string;
  created_at: string;
  updated_at: string;
  metodo_pago: string;
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  menu_item_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  comentarios: string;
}

// Chat types
export type MessageType = 'texto' | 'imagen' | 'archivo';

export interface Mensaje {
  id: string;
  pedido_id: string;
  emisor_id: string;
  emisor_tipo: 'usuario' | 'tienda' | 'repartidor' | 'admin';
  tipo: MessageType;
  contenido: string;
  archivo_url?: string;
  created_at: string;
}

// Rating types
export interface Calificacion {
  id: string;
  pedido_id: string;
  usuario_id: string;
  tienda_id: string;
  calificacion_comida: number;
  calificacion_servicio: number;
  comentario?: string;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter types
export interface StoreFilters {
  categoria?: string;
  abierto?: boolean;
  servicio?: 'delivery' | 'pickup' | 'sitio';
  busqueda?: string;
  ordenar?: 'distancia' | 'tiempo' | 'calificacion';
}

// Map types
export interface MapCenter {
  lat: number;
  lng: number;
}

export interface StoreMarker {
  id: string;
  slug: string;
  nombre: string;
  lat: number;
  lng: number;
  abierto: boolean;
  categoria: string;
}
