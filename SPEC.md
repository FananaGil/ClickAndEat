# CLICK&EAT - Especificación Técnica Completa

## 1. Concepto & Visión

**CLICK&EAT** es una plataforma digital de delivery y gestión de pedidos para comercios locales de comida en Punto Fijo, Estado Falcón, Venezuela. La plataforma combina geolocalización en tiempo real, pedidos automatizados, chat efímero para comprobantes de pago, y un sistema de calificaciones tripartita. La experiencia debe sentirse moderna, rápida y confiable, como si fuera una versión local de Uber Eats o PedidosYa, pero diseñada específicamente para las necesidades de los comercios falconianos.

## 2. Design Language

### Aesthetic Direction
Estilo **"Moderno Tropical"** - Colores vibrantes que evocan el sol falconiano, con una interfaz limpia y funcional. Inspirado en apps de delivery exitosas pero con personalidad local venezolana.

### Color Palette
```
Primary:        #FF6B35 (Naranja Caliente - energía, apetito)
Secondary:      #1A535C (Verde Azulado Profundo - confianza)
Accent:         #FFE66D (Amarillo Sol - optimism, llamativas CTAs)
Background:     #FAFAFA (Blanco Grisáceo - limpieza)
Surface:        #FFFFFF (Blanco Puro - tarjetas)
Text Primary:   #2D3436 (Gris Carbón)
Text Secondary: #636E72 (Gris Medio)
Success:        #00B894 (Verde Mint)
Warning:        #FDCB6E (Amarillo Alerta)
Error:          #E17055 (Rojo Coral)
```

### Typography
- **Headings**: `Poppins` (700, 600) - Moderna, geométrica, excelente legibilidad
- **Body**: `Inter` (400, 500) - Diseñada para interfaces, alta legibilidad en pantallas
- **Monospace**: `JetBrains Mono` - Para datos técnicos como precios

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96
- Border radius: 8px (cards), 12px (buttons), 24px (modals)
- Shadows: `0 2px 8px rgba(0,0,0,0.08)` (subtle), `0 8px 24px rgba(0,0,0,0.12)` (elevated)

### Motion Philosophy
- Micro-interactions: 150-200ms ease-out
- Page transitions: 300ms ease-in-out
- Loading states: Skeleton screens con shimmer animation
- Map markers: Bounce-in animation al cargar
- Chat messages: Slide-up con fade-in

### Icon Library
- **Lucide Icons** - Consistente, ligero, licencia MIT
- Iconos personalizados para categorías de comida

## 3. Layout & Structure

### Arquitectura de Páginas

#### Usuarios Finales
```
/                           → Mapa principal con tiendas
/tienda/[id]               → Página de tienda con menú
/carrito                    → Carrito de compras
/pedido/[id]                → Seguimiento de pedido + Chat
/perfil                     → Historial y direcciones
/calificar/[id]             → Formulario de calificación
```

#### Dueños de Tienda
```
/tienda/dashboard           → Panel principal
/tienda/menu                → Gestión de menú
/tienda/pedidos             → Lista de pedidos
/tienda/configuracion       → Apariencia y horarios
```

#### Super Administradores
```
/admin/dashboard            → Métricas generales
/admin/tiendas              → Gestión de tiendas
/admin/usuarios             → Gestión de usuarios
/admin/incidencias          → Reportes y bloqueo
```

### Responsive Strategy
- **Mobile First**: Diseño pensado primero para móviles (320px+)
- **Breakpoints**:
  - sm: 640px (landscape phones)
  - md: 768px (tablets)
  - lg: 1024px (laptops)
  - xl: 1280px (desktops)

### Estructura Visual del Mapa
- Mapa centrado en Punto Fijo (lat: 11.6956, lng: -70.1999)
- Zoom inicial: 13 (nivel de ciudad)
- Límites: bounds de Estado Falcón
- Iconos de tiendas: Fork & Knife con colores según categoría

## 4. Features & Interactions

### 4.1 Sistema de Autenticación

#### Registro de Usuario
- Campos: nombre, email, teléfono, contraseña
- Validación: email único, teléfono venezolano (+58)
- Confirmación por email (opcional para MVP)

#### Inicio de Sesión
- Email + contraseña
- JWT con refresh token
- Duración: access token 15min, refresh 7 días

#### Roles
```python
ROLES = {
    'usuario': 1,      # Cliente final
    'dueno': 2,        # Dueño de tienda
    'superadmin': 3    # Administrador del sistema
}
```

### 4.2 Geolocalización

#### Algoritmo de Búsqueda por Cercanía
```sql
-- Usando fórmula Haversine para distancia en km
SELECT *,
  (6371 * acos(
    cos(radians(?lat)) * cos(radians(lat)) *
    cos(radians(lng) - radians(?lng)) +
    sin(radians(?lat)) * sin(radians(lat))
  )) AS distance
FROM tiendas
HAVING distance < 10  -- Radio de 10km
ORDER BY distance
```

#### Índices Geoespaciales
```sql
CREATE INDEX idx_tiendas_geolocation ON tiendas (lat, lng);
CREATE INDEX idx_tiendas_disponibles ON tiendas (disponible, deleted_at);
```

#### Interacciones del Mapa
- **Click en marcador**: Abre popup con preview de tienda
- **Popup click**: Navega a página de tienda
- **Geolocalización del usuario**: Botón "Mi ubicación" con permiso del navegador
- **Filtro por categoría**: Filtros horizontales sobre el mapa

### 4.3 Sistema de Pedidos

#### Tipos de Servicio
```typescript
type TipoServicio = 'delivery' | 'pickup' | 'sitio';

interface Pedido {
  id: string;
  usuario_id: string;
  tienda_id: string;
  tipo_servicio: TipoServicio;
  estado: PedidoEstado;
  items: ItemPedido[];
  comentarios: string;
  direccion_entrega?: string;  // Solo para delivery
  coords_entrega?: {lat: number, lng: number};
  tiempo_estimado: number;  // minutos
  total: number;
  created_at: Date;
  updated_at: Date;
}

type PedidoEstado =
  | 'pendiente_pago'
  | 'esperando_comprobante'
  | 'pagado'
  | 'confirmado'
  | 'preparando'
  | 'listo'
  | 'en_camino'
  | 'completado'
  | 'cancelado';
```

#### Flujo de Pedido
1. Usuario selecciona tienda → ve menú completo
2. Agrega items al carrito (con cantidad, comentarios por item)
3. Selecciona tipo de servicio
4. Confirma pedido → se crea pedido en estado `pendiente_pago`
5. Se abre chat automáticamente con la tienda
6. Usuario sube comprobante de pago
7. Tienda valida y marca como `pagado`
8. Tienda cambia estado según progreso
9. Usuario recibe notificaciones en cada cambio
10. Al completar, usuario puede calificar

### 4.4 Chat Efímero

#### Características
- Un chat por pedido
- Disponible desde creación hasta 24h después de completado
- Mensajes de texto + archivos (imágenes de comprobantes)
- Indicador de lectura
- Historial visible solo para las partes (usuario y tienda)

#### Tipos de Mensaje
```typescript
type TipoMensaje = 'texto' | 'imagen' | 'sistema';

interface Mensaje {
  id: string;
  pedido_id: string;
  emisor_id: string;
  emisor_tipo: 'usuario' | 'tienda';
  tipo: TipoMensaje;
  contenido: string;
  archivo_url?: string;
  leido: boolean;
  created_at: Date;
}
```

#### Notificaciones
- Toast notification cuando llega mensaje
- Badge en el header del pedido
- Push notification si está fuera de la app

### 4.5 Sistema de Calificaciones

#### Estructura de Calificación
```typescript
interface Calificacion {
  id: string;
  pedido_id: string;
  usuario_id: string;
  tienda_id: string;
  rating_servicio: number;  // 1-5
  rating_comida: number;    // 1-5
  rating_tiempo: number;    // 1-5
  comentario?: string;
  created_at: Date;
}
```

#### Cálculo de Promedios
```sql
SELECT
  AVG(rating_servicio) as avg_servicio,
  AVG(rating_comida) as avg_comida,
  AVG(rating_tiempo) as avg_tiempo,
  AVG((rating_servicio + rating_comida + rating_tiempo) / 3.0) as avg_general
FROM calificaciones
WHERE tienda_id = ? AND deleted_at IS NULL;
```

#### Thresholds de Supervisión
- **3.0 - 5.0**: Normal
- **2.0 - 2.99**: Bajo supervisión
- **< 2.0**: Suspensión inmediata

### 4.6 Gestión de Tiendas (Dueños)

#### Personalización de Página
```typescript
interface TiendaPersonalizacion {
  logo_url?: string;
  banner_url?: string;
  color_primario: string;
  color_secundario: string;
  nombre_publico: string;
  descripcion?: string;
  horarios: Horario[];
}
```

#### Menú
```typescript
interface MenuItem {
  id: string;
  tienda_id: string;
  categoria_id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen_url?: string;
  disponible: boolean;
  opciones?: OpcionItem[];  // Ej: tamaños, extras
}

interface Categoria {
  id: string;
  tienda_id: string;
  nombre: string;
  orden: number;
}
```

### 4.7 Panel de Super Admin

#### Métricas Principales
```typescript
interface MetricasDashboard {
  // Totales generales
  total_tiendas: number;
  total_pedidos_hoy: number;
  ventas_hoy: number;
  calificacion_promedio: number;

  // Top performers
  tiendas_mas_pedidos: TiendaMetric[];
  tiendas_mas_ventas: TiendaMetric[];

  // Alertas
  tiendas_bajo_rendimiento: Tienda[];
  tiendas_suspendidas: Tienda[];
  usuarios_bloqueados: number;
}
```

#### Filtros de Análisis
- Período: Hoy, Esta semana, Este mes, Personalizado
- Exportación: CSV con datos filtrados
- Gráficos: Barras para pedidos, Líneas para tendencias

## 5. Component Inventory

### 5.1 Componentes Compartidos

#### Button
```
Variants: primary, secondary, outline, ghost, danger
Sizes: sm (32px), md (40px), lg (48px)
States: default, hover, active, disabled, loading
```

#### Input
```
Types: text, email, password, number, tel
States: default, focus, error, disabled
Additions: prefix icon, suffix icon, helper text, error message
```

#### Card
```
Variants: elevated, outlined, flat
Parts: header (optional), body, footer (optional)
Hover: subtle lift + shadow increase
```

#### Modal
```
Sizes: sm (400px), md (500px), lg (700px)
Parts: header, body, footer
Animation: fade-in + scale-up
Backdrop: blur + dark overlay
```

#### Toast
```
Types: success, error, warning, info
Position: top-right
Duration: 5s auto-dismiss
Action: dismiss button
```

### 5.2 Componentes de Mapa

#### MapContainer
- Mapa Leaflet centrado en Punto Fijo
- Controles de zoom personalizados
- Botón de geolocalización

#### StoreMarker
```
Icon: Fork & knife con borde de categoría
States: default, selected, unavailable
Popup: nombre, rating, tiempo estimado
```

#### MapFilters
- Chips horizontales scrollables
- Categorías: Todos, Rápida, Traditional, Mariscos, etc.

### 5.3 Componentes de Tienda

#### StoreCard
```
Image: logo o banner
Content: nombre, calificación, categorías, tiempo
Action: click para ver detalle
Variants: grid (mapa), list (búsqueda)
```

#### MenuItemCard
```
Image: foto del plato
Content: nombre, descripción, precio
Action: botón agregar
States: available, unavailable, loading
```

#### CartItem
```
Content: imagen thumbnail, nombre, cantidad, precio
Actions: +/- cantidad, eliminar, editar comentarios
```

### 5.4 Componentes de Chat

#### ChatWindow
```
Header: nombre tienda, estado pedido
Body: lista de mensajes con scroll
Footer: input + botón adjuntar
```

#### MessageBubble
```
Variants: sent (right), received (left), system (center)
Content: texto, imagen (thumbnail expandable)
Metadata: timestamp, status (sent, delivered, read)
```

#### FileUploader
```
Trigger: botón o drag & drop
Preview: thumbnail de imagen
Validation: tipo (jpg, png), tamaño (5MB max)
States: empty, uploading, success, error
```

### 5.5 Componentes de Admin

#### DataTable
```
Features: sort, filter, pagination, search
Columns: configurables
Actions: view, edit, delete per row
Empty: illustration + message
```

#### MetricCard
```
Icon: categoría
Value: número grande
Label: descripción
Trend: up/down arrow con porcentaje
```

#### Chart
```
Types: bar, line, pie
Library: Recharts
Responsive: fluid width
```

## 6. Technical Approach

### 6.1 Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│                     (Next.js 14 App Router)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Pages Router        │    Server Components                │
│  /pedido/[id]        │    /tienda/[id]                     │
│  /carrito            │    / (mapa)                          │
│  /admin/*            │                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    API Client Layer                          │
│              (fetch + React Query/SWR)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│                  (Django REST Framework)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Views/Routers      │    Serializers    │    Models        │
│  - auth/            │    - User          │    - User         │
│  - tiendas/         │    - Tienda        │    - Tienda      │
│  - pedidos/         │    - Pedido         │    - Pedido      │
│  - chat/            │    - Mensaje        │    - Mensaje     │
│  - metrics/         │    - Calificacion   │    - Calificacion│
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    Services Layer                            │
│  - GeolocationService                                       │
│  - NotificationService                                       │
│  - FileUploadService                                         │
│  - MetricService                                            │
├─────────────────────────────────────────────────────────────┤
│                  Realtime Layer                              │
│           (Supabase Realtime / WebSockets)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│                    (PostgreSQL)                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tables:                                                    │
│  - users, tiendas, categorias, menu_items                   │
│  - pedidos, pedido_items, calificacion                      │
│  - mensajes, archivos, direcciones                          │
│                                                             │
│  Indexes:                                                  │
│  - Geospatial (lat, lng)                                   │
│  - tienda_id on all relational tables                       │
│  - created_at for time-series queries                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 API Endpoints

#### Autenticación
```
POST   /api/auth/register          # Registro de usuario
POST   /api/auth/login             # Login (devuelve JWT)
POST   /api/auth/refresh           # Refresh token
GET    /api/auth/me                # Usuario actual
```

#### Tiendas
```
GET    /api/tiendas                # Lista (con filtros geográficos)
GET    /api/tiendas/[id]           # Detalle
GET    /api/tiendas/[id]/menu      # Menú completo
GET    /api/tiendas/[id]/calificaciones  # Ratings

# Dueño de tienda
POST   /api/tiendas                # Crear (superadmin)
PUT    /api/tiendas/[id]           # Actualizar
DELETE /api/tiendas/[id]           # Eliminar (soft delete)

POST   /api/tiendas/[id]/menu      # Agregar item
PUT    /api/tiendas/[id]/menu/[item_id]  # Editar item
DELETE /api/tiendas/[id]/menu/[item_id]   # Eliminar item
```

#### Pedidos
```
GET    /api/pedidos                # Lista del usuario actual
POST   /api/pedidos                # Crear pedido
GET    /api/pedidos/[id]           # Detalle
PUT    /api/pedidos/[id]/estado    # Cambiar estado (tienda)
POST   /api/pedidos/[id]/calificar # Calificar
```

#### Chat
```
GET    /api/chat/[pedido_id]       # Mensajes del pedido
POST   /api/chat/[pedido_id]       # Enviar mensaje
POST   /api/chat/[pedido_id]/archivo  # Subir comprobante
PUT    /api/chat/mensajes/[id]/leido  # Marcar como leído
```

#### Métricas (Super Admin)
```
GET    /api/metrics/dashboard      # Métricas generales
GET    /api/metrics/tiendas/[id]  # Métricas por tienda
GET    /api/metrics/exportar       # Exportar CSV
```

### 6.3 Modelo de Datos

```sql
-- Users (extendible para diferentes roles)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    nombre VARCHAR(100),
    rol INTEGER DEFAULT 1,  -- 1: usuario, 2: dueno, 3: superadmin
    tienda_id UUID REFERENCES tiendas(id),  -- NULL para usuarios normales
    disponible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rol ON users(rol);

-- Tiendas
CREATE TABLE tiendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    direccion VARCHAR(255),
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    telefono VARCHAR(20),
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    color_primario VARCHAR(7) DEFAULT '#FF6B35',
    color_secundario VARCHAR(7) DEFAULT '#1A535C',
    disponible BOOLEAN DEFAULT true,
    abierto BOOLEAN DEFAULT true,
    calificacion_servicio DECIMAL(3, 2) DEFAULT 0,
    calificacion_comida DECIMAL(3, 2) DEFAULT 0,
    calificacion_tiempo DECIMAL(3, 2) DEFAULT 0,
    num_calificaciones INTEGER DEFAULT 0,
    tiempo_pickup INTEGER DEFAULT 15,  -- minutos
    tiempo_delivery INTEGER DEFAULT 30,
    tiempo_sitio INTEGER DEFAULT 20,
    costo_delivery DECIMAL(10, 2) DEFAULT 0,
    motivo_suspension TEXT,  -- Para administradores
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_tiendas_geolocation ON tiendas(lat, lng);
CREATE INDEX idx_tiendas_disponibles ON tiendas(disponible, abierto, deleted_at);

-- Categorías
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    icono VARCHAR(50),  -- Lucide icon name
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categorias_tienda ON categorias(tienda_id);

-- Items del Menú
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    imagen_url VARCHAR(500),
    disponible BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_menu_items_tienda ON menu_items(tienda_id);
CREATE INDEX idx_menu_items_disponible ON menu_items(disponible);

-- Pedidos
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tienda_id UUID REFERENCES tiendas(id) ON DELETE SET NULL,
    tipo_servicio VARCHAR(20) NOT NULL,  -- delivery, pickup, sitio
    estado VARCHAR(30) DEFAULT 'pendiente_pago',
    direccion_entrega TEXT,
    lat_entrega DECIMAL(10, 8),
    lng_entrega DECIMAL(11, 8),
    subtotal DECIMAL(10, 2) DEFAULT 0,
    costo_delivery DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    tiempo_estimado INTEGER,  -- minutos
    comentarios TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_tienda ON pedidos(tienda_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_fecha ON pedidos(created_at DESC);

-- Items del Pedido
CREATE TABLE pedido_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL,  -- Snapshot del nombre
    precio DECIMAL(10, 2) NOT NULL,  -- Snapshot del precio
    cantidad INTEGER NOT NULL DEFAULT 1,
    comentarios TEXT,  -- ej: "sin cebolla"
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pedido_items_pedido ON pedido_items(pedido_id);

-- Mensajes del Chat
CREATE TABLE mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    emisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    emisor_tipo VARCHAR(20) NOT NULL,  -- usuario, tienda
    tipo VARCHAR(20) DEFAULT 'texto',  -- texto, imagen, sistema
    contenido TEXT NOT NULL,
    archivo_url VARCHAR(500),
    leido BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mensajes_pedido ON mensajes(pedido_id);
CREATE INDEX idx_mensajes_fecha ON mensajes(created_at);

-- Calificaciones
CREATE TABLE calificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tienda_id UUID REFERENCES tiendas(id) ON DELETE SET NULL,
    rating_servicio INTEGER NOT NULL CHECK (rating_servicio BETWEEN 1 AND 5),
    rating_comida INTEGER NOT NULL CHECK (rating_comida BETWEEN 1 AND 5),
    rating_tiempo INTEGER NOT NULL CHECK (rating_tiempo BETWEEN 1 AND 5),
    comentario TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calificaciones_tienda ON calificaciones(tienda_id);
CREATE INDEX idx_calificaciones_fecha ON calificaciones(created_at DESC);

-- Direcciones guardadas
CREATE TABLE direcciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nombre VARCHAR(100),  -- ej: "Casa", "Trabajo"
    direccion TEXT NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    instrucciones TEXT,  -- ej: "Frente al kiosko"
    es_principal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_direcciones_usuario ON direcciones(usuario_id);
```

### 6.4 Variables de Entorno

```env
# Backend (.env)
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=clickandeat
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET_KEY=your-jwt-secret
JWT_ACCESS_TOKEN_LIFETIME=15
JWT_REFRESH_TOKEN_LIFETIME=10080

# Supabase (para realtime y storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_MAP_PROVIDER=google
GOOGLE_MAPS_API_KEY=your-api-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 6.5 realtime con Supabase

```javascript
// Suscripción a nuevos pedidos (tienda)
supabase
  .channel('pedidos-tienda')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'pedidos',
      filter: `tienda_id=eq.${tiendaId}` },
    (payload) => {
      showNotification('Nuevo pedido recibido!');
      actualizarListaPedidos();
    })
  .subscribe();

// Suscripción a mensajes (chat)
supabase
  .channel(`chat-${pedidoId}`)
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'mensajes',
      filter: `pedido_id=eq.${pedidoId}` },
    (payload) => {
      agregarMensaje(payload.new);
    })
  .subscribe();
```

## 7. Flujo Completo de Usuario

```
┌──────────────┐
│    INICIO    │
│   App/Web    │
└──────┬───────┘
       ▼
┌──────────────────────────────────────────────────────────────┐
│                    PANTALLA PRINCIPAL                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │                    [MAPA DE FALCÓN]                   │  │
│  │                    con marcadores                      │  │
│  │                                                        │  │
│  │           🍴 Tienda 1  📍                             │  │
│  │                        📍 Tienda 2                     │  │
│  │                    📍                                  │  │
│  │              Tienda 3 📍                               │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [ Filtros: Todos | Rápida | Tradicional | Mariscos ]        │
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ Card 1  │ │ Card 2  │ │ Card 3  │ │ Card 4  │   → scroll │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
└──────────────────────────────────────────────────────────────┘
       │
       ▼ Click en tienda
┌──────────────────────────────────────────────────────────────┐
│                   PÁGINA DE TIENDA                           │
│                                                              │
│  [Banner con logo]                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🍕 Pizzería El Sol                                  │   │
│  │  ⭐ 4.5 (234) · 15-25 min · Delivery gratis          │   │
│  │  "Las mejores pizzas de Punto Fijo"                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [Pickup] [Delivery] [Comer aquí]  ← selector servicio      │
│                                                              │
│  ── Entradas ───────────────────────────────────────         │
│  ┌─────────────────┐ ┌─────────────────┐                    │
│  │ 🥗 Ensalada     │ │ 🧀 Deditos Q    │                    │
│  │ César           │ │ Boca           │                    │
│  │ Bs. 5.00       │ │ Bs. 4.50       │                    │
│  │        [+ Agregar]│        [+ Agregar]│                    │
│  └─────────────────┘ └─────────────────┘                    │
│                                                              │
│  ── Pizzas ──────────────────────────────────────────        │
│  ┌────────────────────────────────────────────┐             │
│  │ 🍕 Pepperoni                        Bs. 12.00│             │
│  │ Jamón, pepperoni, mozzarella...             │             │
│  │                          [Opciones] [+ Ag.]│             │
│  └────────────────────────────────────────────┘             │
│                                                              │
│  ┌────────────────────────────────────────────┐             │
│  │ 🛒 Tu carrito (3 items)              Bs. 35│             │
│  └────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────┘
       │
       ▼ Click en "Ver carrito" o finalizar
┌──────────────────────────────────────────────────────────────┐
│                   CARRITO DE COMPRAS                         │
│                                                              │
│  🍕 Pizzería El Sol                                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ [img] Pepperoni Pizza                    Bs. 12.00  │     │
│  │       Cantidad: [ - ] 2 [ + ]                       │     │
│  │       Comentario: [sin aceitunas_____]              │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ [img] Deditos de Queso                   Bs. 4.50  │     │
│  │       Cantidad: [ - ] 1 [ + ]                       │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  ─────────────────────────────────────────────────────       │
│  Subtotal:                                    Bs. 28.50     │
│  Delivery:                                     Bs. 0.00     │
│  ─────────────────────────────────────────────────────       │
│  TOTAL:                                       Bs. 28.50     │
│                                                              │
│  Tipo de entrega: [Delivery ▼]                               │
│  Dirección: [Usar mi ubicación actual ▼]                     │
│                                                              │
│  [💳 Confirmar Pedido]                                       │
└──────────────────────────────────────────────────────────────┘
       │
       ▼ Click en "Confirmar Pedido"
┌──────────────────────────────────────────────────────────────┐
│                   CONFIRMACIÓN + CHAT                        │
│                                                              │
│  ✅ Pedido #1234 confirmado                                  │
│  Estado: Esperando comprobante de pago                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │                    CHAT                             │     │
│  │  ┌──────────────────────────────────────────────┐   │     │
│  │  │ 📎 Sube tu comprobante de pago              │   │     │
│  │  │    (transferencia o pago móvil)             │   │     │
│  │  │                                              │   │     │
│  │  │  ┌────────────────────────────────────┐      │   │     │
│  │  │  │                                    │      │   │     │
│  │  │  │  📁 Arrastra imagen aquí o         │      │   │     │
│  │  │  │      haz clic para seleccionar      │      │   │     │
│  │  │  │                                    │      │   │     │
│  │  │  │  Máx. 5MB · JPG, PNG               │      │   │     │
│  │  │  └────────────────────────────────────┘      │   │     │
│  │  └──────────────────────────────────────────────┘   │     │
│  │                                                      │   │
│  │  💬 Tienda: "Recibido, estamos preparando..."      │   │
│  │           10:32 AM                                  │   │
│  │                              Yo: "Perfecto" 10:33   │   │
│  │  ┌────────────────────────────────────────────┐   │     │
│  │  │ Escribe un mensaje...              [Enviar]│   │     │
│  │  └────────────────────────────────────────────┘   │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  Tiempo estimado: 25-30 min                                 │
│                                                              │
│  [Cancelar Pedido]                                           │
└──────────────────────────────────────────────────────────────┘
       │
       ▼ Tienda confirma pago → Comienza preparación
┌──────────────────────────────────────────────────────────────┐
│               SEGUIMIENTO DEL PEDIDO                         │
│                                                              │
│  🍕 Pizzería El Sol                                         │
│  Pedido #1234                                               │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │                                                     │     │
│  │   📝 Pedido    🍳 Preparando   🚀 En camino   ✅ Listo  │
│  │     ✓────        ✓────         ○────        ○       │
│  │                                                     │     │
│  │  ●━━━━━━━━━━━━━━━○──────────────────○────────────○  │
│  │                                                     │     │
│  │  10:30        10:45            10:55          11:00  │
│  │                                                     │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  Tu pedido está siendo preparado 🔥                          │
│  Tiempo restante aproximado: 15 min                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │                    CHAT                             │     │
│  │  💬 Tienda: "Tu pizza está en el horno"  10:45   │     │
│  │  💬 Tienda: "Estará lista en 10 min"       10:50   │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  [Ver Detalles del Pedido]                                   │
└──────────────────────────────────────────────────────────────┘
       │
       ▼ Pedido completado
┌──────────────────────────────────────────────────────────────┐
│                   CALIFICACIÓN                                │
│                                                              │
│  🍕 Pizzería El Sol                                         │
│  ¿Cómo fue tu experiencia?                                  │
│                                                              │
│  Servicio                                                   │
│  [⭐] [⭐] [⭐] [☆] [☆]                                       │
│                                                              │
│  Comida                                                      │
│  [⭐] [⭐] [⭐] [⭐] [☆]                                       │
│                                                              │
│  Tiempo de espera                                           │
│  [⭐] [⭐] [⭐] [⭐] [⭐]                                       │
│                                                              │
│  Comentario adicional:                                      │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ [Excelente servicio, muy rápidos!_______________]   │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  [Enviar Calificación]                                       │
└──────────────────────────────────────────────────────────────┘
```

## 8. Estados y Notificaciones

### Estados del Pedido y Notificaciones

| Estado | Notificación al Usuario | Notificación a la Tienda |
|--------|------------------------|-------------------------|
| `pendiente_pago` | "Confirma tu pedido y sube el comprobante" | "Nuevo pedido #1234" |
| `pagado` | "Pago verificado. ¡Gracias!" | "El cliente subió el comprobante" |
| `confirmado` | "Tu pedido fue confirmado" | "Confirma el pago" |
| `preparando` | "Tu pedido está siendo preparado 🔥" | (Tienda inicia preparación) |
| `listo` | "¡Tu pedido está listo para {pickup/entregar}!" | "Notifica al cliente" |
| `en_camino` | "Tu delivery está en camino 🛵" | "Delivery en camino" |
| `completado` | "¡Pedido completado! ¿Cómo fue?" | "Pedido entregado" |
| `cancelado` | "El pedido fue cancelado" | "Pedido cancelado" |

### Cálculo de Tiempos Estimados

```typescript
const calcularTiempoEstimado = (
  tipo: 'delivery' | 'pickup' | 'sitio',
  tienda: Tienda,
  cantidadItems: number
): number => {
  const baseTimes = {
    pickup: tienda.tiempo_pickup,
    sitio: tienda.tiempo_sitio,
    delivery: tienda.tiempo_delivery
  };

  // Agregar 2 minutos por cada 3 items
  const itemsExtra = Math.ceil(cantidadItems / 3) * 2;

  return baseTimes[tipo] + itemsExtra;
};
```

## 9. Validaciones

### Comprobantes de Pago
```typescript
const VALIDAR_COMPROBANTE = {
  tipos: ['image/jpeg', 'image/png', 'image/webp'],
  tamanoMaximo: 5 * 1024 * 1024, // 5MB
  extensiones: ['.jpg', '.jpeg', '.png', '.webp']
};
```

### Teléfono Venezolano
```typescript
const telefonoRegex = /^(\+58)?[0-9]{10}$/;
// Acepta: +584121234567, 04121234567, 4121234567
```

### Precios
```typescript
const VALIDA_PRECIO = {
  minimo: 0.01,
  maximo: 999999.99,
  decimales: 2
};
```

## 10. Seguridad

### Rate Limiting
- Login: 5 intentos por minuto
- Registro: 3 por hora por IP
- API general: 100 requests/min

### Validación de Archivos
- Escaneo de MIME type
- Verificación de extensión
- Límite de tamaño en backend (no solo frontend)

### Sanitización
- XSS prevention en todos los inputs
- SQL injection prevention (ORM Django)
- CSRF tokens en forms

---

*Especificación creada para CLICK&EAT - Plataforma de Delivery para Punto Fijo, Falcón, Venezuela*
*Versión 1.0 - Abril 2026*
