# CLICK&EAT - Plataforma de Delivery para Punto Fijo, Falcón

<p align="center">
  <img src="https://via.placeholder.com/200x60/FF6B35/FFFFFF?text=CLICK%26EAT" alt="CLICK&EAT Logo">
</p>

**CLICK&EAT** es una plataforma digital de delivery y gestión de pedidos para comercios locales de comida en Punto Fijo, Estado Falcón, Venezuela. La plataforma combina geolocalización en tiempo real, pedidos automatizados, chat efímero para comprobantes de pago, y un sistema de calificaciones tripartita.

## Tabla de Contenidos

1. [Objetivo del Proyecto](#objetivo-del-proyecto)
2. [Funcionamiento General](#funcionamiento-general)
3. [Requisitos del Sistema](#requisitos-del-sistema)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Instalación y Configuración](#instalación-y-configuración)
6. [Despliegue Local](#despliegue-local)
7. [Variables de Entorno](#variables-de-entorno)
8. [Arquitectura](#arquitectura)
9. [API Endpoints](#api-endpoints)
10. [Funcionalidades Principales](#funcionalidades-principales)
11. [Licencia](#licencia)

---

## Objetivo del Proyecto

CLICK&EAT tiene como objetivo principal digitalizar y optimizar el proceso de pedidos de comida en Punto Fijo, Estado Falcón, Venezuela. El proyecto busca:

- **Facilitar el acceso** a restaurantes y tiendas de comida locales a través de un mapa interactivo con geolocalización.
- **Automatizar** el proceso de pedidos, reduciendo tiempos de espera y errores de comunicación.
- **Brindar transparencia** a los usuarios mediante calificaciones en tres categorías: servicio, comida y tiempo de entrega.
- **Apoyar a los comercios locales** con herramientas de gestión de menú, pedidos en tiempo real y métricas de rendimiento.
- **Garantizar la seguridad** en las transacciones mediante un chat efímero para la verificación de pagos.

---

## Funcionamiento General

### Roles de Usuario

La plataforma cuenta con tres tipos de actores principales:

#### Usuarios Finales (Clientes)

Los usuarios pueden:

- Visualizar un mapa interactivo del Estado Falcón con tiendas de comida identificadas.
- Ver recomendaciones automáticas de tiendas cercanas a su ubicación.
- Realizar pedidos con opciones de Delivery, Pickup o Comer en el sitio.
- Seleccionar ítems del menú con comentarios específicos de preparación.
- Calificar cada pedido en tres categorías: servicio, comida y tiempo de espera.
- Comunicarse con la tienda a través de un chat efímero para enviar comprobantes de pago.
- Recibir notificaciones en cada cambio de estado del pedido.

#### Dueños de Tienda

Los propietarios de tiendas pueden:

- Personalizar su página de presentación (colores, logo, nombre).
- Gestionar su menú, precios y disponibilidad de productos.
- Visualizar pedidos entrantes en tiempo real.
- Modificar tiempos estimados por tipo de servicio.
- Confirmar pagos a través del chat con los clientes.
- Acceder a métricas básicas de rendimiento.

#### Super Administradores

Los administradores del sistema pueden:

- Agregar, eliminar o inhabilitar tiendas.
- Supervisar tiendas con calificaciones bajas (menos de 3 puntos).
- Suspender tiendas con calificación menor a 2 puntos.
- Visualizar métricas generales: tiendas con más pedidos, ventas, peor calificación.
- Exportar datos en formato CSV.
- Gestionar usuarios bloqueados o incidencias.

### Flujo de Pedido

1. El usuario selecciona una tienda desde el mapa o la lista.
2. Explora el menú y agrega productos al carrito con comentarios opcionales.
3. Selecciona el tipo de servicio (Delivery, Pickup o Comer en sitio).
4. Confirma el pedido, lo cual crea un chat efímero con la tienda.
5. El usuario sube el comprobante de pago en el chat.
6. La tienda verifica el pago y cambia el estado del pedido.
7. El pedido pasa por los estados: Pendiente → Pagado → Preparando → Listo → En Camino → Completado.
8. Al finalizar, el usuario puede calificar la experiencia.

---

## Requisitos del Sistema

### Requisitos Mínimos

| Componente | Especificación |
|------------|----------------|
| Sistema Operativo | Windows 10+, macOS 10.14+, Ubuntu 18.04+ |
| Procesador | Dual-core 2 GHz o superior |
| RAM | 8 GB |
| Almacenamiento | 5 GB libres |
| Conexión a Internet | Banda ancha (para desarrollo local) |

### Requisitos Recomendados

| Componente | Especificación |
|------------|----------------|
| Sistema Operativo | Windows 11, macOS 12+, Ubuntu 22.04+ |
| Procesador | Quad-core 3 GHz o superior |
| RAM | 16 GB |
| Almacenamiento | 10 GB libres (SSD preferido) |
| Conexión a Internet | Fibra óptica o 4G estable |

### Software Requerido

#### Backend

- **Python**: Versión 3.10 o superior
- **PostgreSQL**: Versión 14 o superior (o cuenta de Supabase)
- **Redis**: Opcional, para realtime (puede usar Supabase Realtime)

#### Frontend

- **Node.js**: Versión 18 o superior
- **npm** o **yarn**: Últimas versiones estables

#### Herramientas Adicionales

- **Git**: Para control de versiones
- **Editor de código**: VS Code, PyCharm, WebStorm (cualquier editor compatible)

---

## Estructura del Proyecto

```
clickandeat/
├── backend/                  # Django REST API
│   ├── apps/
│   │   ├── accounts/        # Autenticación y usuarios
│   │   ├── tiendas/          # Tiendas y menú
│   │   ├── pedidos/          # Pedidos y items
│   │   ├── chat/             # Chat efímero
│   │   ├── calificaciones/    # Sistema de calificaciones
│   │   └── metrics/          # Métricas para admin
│   ├── core/                 # Modelos base y utilidades
│   ├── clickandeat/          # Configuración del proyecto
│   ├── db/                   # Esquema de base de datos
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                 # Next.js App
│   ├── src/
│   │   ├── app/              # Páginas de la aplicación
│   │   ├── components/       # Componentes React
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilidades y API client
│   │   ├── store/            # Estado global (Zustand)
│   │   ├── types/            # Tipos TypeScript
│   │   └── styles/           # Estilos globales
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── db/
│   └── schema.sql            # Esquema de PostgreSQL
│
├── SPEC.md                   # Especificación técnica completa
└── README.md                 # Este archivo
```

---

## Instalación y Configuración

### 1. Clonar o Extraer el Proyecto

Si received un archivo ZIP, extráigalo en su directorio de trabajo:

```bash
unzip clickandeat.zip -d clickandeat
cd clickandeat
```

### 2. Configurar la Base de Datos

#### Opción A: PostgreSQL Local

1. Instale PostgreSQL 14+:

   **Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

   **macOS (con Homebrew):**
   ```bash
   brew install postgresql
   brew services start postgresql
   ```

   **Windows:** Descargue desde https://www.postgresql.org/download/

2. Cree la base de datos:

   ```bash
   sudo -u postgres psql
   ```

   En la consola de PostgreSQL:

   ```sql
   CREATE DATABASE clickandeat;
   CREATE USER clickandeat_user WITH PASSWORD 'tu_password_seguro';
   GRANT ALL PRIVILEGES ON DATABASE clickandeat TO clickandeat_user;
   ALTER DATABASE clickandeat OWNER TO clickandeat_user;
   \q
   ```

3. Ejecute el esquema:

   ```bash
   psql -U clickandeat_user -d clickandeat -f db/schema.sql
   ```

#### Opción B: Supabase (Base de Datos en la Nube)

1. Cree una cuenta en https://supabase.com
2. Cree un nuevo proyecto
3. Obtenga las credenciales de conexión:
   - `DATABASE_URL`
   - `DB_PASSWORD`
4. En el SQL Editor de Supabase, ejecute el contenido de `db/schema.sql`

### 3. Configurar el Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Copiar archivo de variables de entorno
cp .env.example .env

# Editar .env con sus credenciales (ver sección Variables de Entorno)
```

### 4. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install
# o
yarn install

# Copiar archivo de variables de entorno
cp .env.example .env.local

# Editar .env.local con sus credenciales
```

---

## Despliegue Local

### Iniciar el Backend

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate

# Aplicar migraciones (si usa Django ORM)
python manage.py migrate

# Crear superusuario (opcional, para admin)
python manage.py createsuperuser

# Iniciar servidor de desarrollo
python manage.py runserver 0.0.0.0:8000
```

El backend estará disponible en: `http://localhost:8000`

### Iniciar el Frontend

```bash
cd frontend

# Iniciar servidor de desarrollo
npm run dev
# o
yarn dev
```

El frontend estará disponible en: `http://localhost:3000`

### Credenciales de Prueba

Después de ejecutar las migraciones, puede crear un superusuario o usar las credenciales de prueba definidas en el schema:

- **Email**: admin@clickandeat.ve
- **Contraseña**: Admin123! (temporal, cámbiela en producción)

---

## Variables de Entorno

### Backend (.env)

```env
# Django
DEBUG=True
SECRET_KEY=tu-secret-key-super-secreta-aqui
ALLOWED_HOSTS=localhost,127.0.0.1

# Base de datos
DATABASE_URL=postgresql://clickandeat_user:tu_password@localhost:5432/clickandeat
# O para Supabase:
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# JWT
JWT_ACCESS_TOKEN_LIFETIME=15
JWT_REFRESH_TOKEN_LIFETIME=10080

# Supabase (para realtime y storage)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_KEY=tu-service-key

# Canal WebSocket
CHANNEL_LAYER=channels.layers.InMemoryChannelLayer
```

### Frontend (.env.local)

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Mapa (opcional, usar mapa gratuito o API key)
NEXT_PUBLIC_MAP_PROVIDER=openstreetmap
# GOOGLE_MAPS_API_KEY=tu-google-maps-api-key
```

---

## Arquitectura

### Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Backend | Django 4.2, Django REST Framework |
| Base de Datos | PostgreSQL 14+ o Supabase |
| Realtime | Supabase Realtime o WebSockets (Channels) |
| Mapas | Leaflet o Mapbox |
| Autenticación | JWT (Simple JWT) |
| Estado Global | Zustand |
| Estilos | Tailwind CSS |
| UI Icons | Lucide React |

### Arquitectura de API

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│                     (Next.js 14)                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client Components  │    Server Components                  │
│  (Interactividad)    │    (SEO, SSR)                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    API Client (Axios)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│                  (Django REST Framework)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Views/Routers    │    Serializers    │    Models          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    Services Layer                            │
│  (Lógica de negocio, geolocalización)                        │
├─────────────────────────────────────────────────────────────┤
│                  Realtime Layer                              │
│           (Supabase Realtime / WebSockets)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│                    (PostgreSQL)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Inicio de sesión (JWT) |
| POST | `/api/auth/refresh` | Refrescar token |
| GET | `/api/auth/me` | Usuario actual |

### Tiendas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tiendas` | Listar tiendas (con filtros) |
| GET | `/api/tiendas/{slug}` | Detalle de tienda |
| GET | `/api/tiendas/{slug}/menu` | Menú completo |
| POST | `/api/tiendas` | Crear tienda (admin) |
| PUT | `/api/tiendas/{id}` | Actualizar tienda |
| DELETE | `/api/tiendas/{id}` | Eliminar tienda (soft delete) |

### Pedidos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/pedidos` | Listar pedidos |
| POST | `/api/pedidos` | Crear pedido |
| GET | `/api/pedidos/{id}` | Detalle de pedido |
| PATCH | `/api/pedidos/{id}/estado` | Cambiar estado |
| POST | `/api/pedidos/{id}/cancelar` | Cancelar pedido |

### Chat

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/chat/{pedido_id}` | Mensajes del pedido |
| POST | `/api/chat/{pedido_id}` | Enviar mensaje |
| POST | `/api/chat/{pedido_id}/archivo` | Subir archivo |

### Calificaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/calificaciones` | Listar calificaciones |
| POST | `/api/calificaciones` | Crear calificación |
| GET | `/api/calificaciones/resumen` | Resumen de calificaciones |
| POST | `/api/calificaciones/{id}/responder` | Responder calificación |

### Métricas (Admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/metrics/` | Dashboard metrics |
| GET | `/api/metrics/tiendas-top` | Tiendas destacadas |
| GET | `/api/metrics/exportar-csv` | Exportar CSV |

---

## Funcionalidades Principales

### Geolocalización

El mapa está centrado en Punto Fijo, Estado Falcón (Lat: 11.6956, Lng: -70.1999) con un zoom inicial de nivel 13. Los marcadores de tiendas muestran:

- Ícono de restaurante (tenedor y cuchillo)
- Indicador de disponibilidad (verde/rojo)
- Popup con nombre, calificación y tiempo estimado

### Sistema de Pedidos

Los estados del pedido son:

1. `pendiente_pago` - Esperando confirmación
2. `esperando_comprobante` - Cliente debe subir pago
3. `pagado` - Pago recibido (verificado)
4. `confirmado` - Tienda confirmó el pedido
5. `preparando` - En preparación
6. `listo` - Listo para retirar/enviar
7. `en_camino` - Delivery en tránsito
8. `completado` - Entregado/recibido
9. `cancelado` - Pedido cancelado

### Chat Efímero

El chat tiene las siguientes características:

- Un chat por pedido
- Disponible desde creación hasta 24h después de completado
- Mensajes de texto e imágenes
- Indicador de lectura
- Almacenamiento de comprobantes de pago

### Sistema de Calificaciones

Las calificaciones incluyen tres categorías (1-5):

- **Servicio**: Atención al cliente
- **Comida**: Calidad de los alimentos
- **Tiempo**: Rapidez de entrega/preparación

**Thresholds de supervisión:**

- 3.0 - 5.0: Normal
- 2.0 - 2.99: Bajo supervisión
- < 2.0: Suspensión inmediata

---

## Licencia

Este proyecto es software propietario. Todos los derechos reservados.

---

**CLICK&EAT** - Hecho con ❤️ en Punto Fijo, Falcón, Venezuela
