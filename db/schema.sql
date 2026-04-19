-- CLICK&EAT Database Schema
-- PostgreSQL 14+
-- Ubicación: Punto Fijo, Estado Falcón, Venezuela

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Para búsqueda similarity

-- ============================================
-- USUARIOS Y AUTENTICACIÓN
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    nombre VARCHAR(100) NOT NULL,
    rol INTEGER DEFAULT 1 CHECK (rol IN (1, 2, 3)),  -- 1: usuario, 2: dueno, 3: superadmin
    tienda_id UUID,  -- Referencia a tienda para dueños
    disponible BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rol ON users(rol);
CREATE INDEX idx_users_tienda ON users(tienda_id) WHERE tienda_id IS NOT NULL;

-- Tabla de tokens de refresco
CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    revoked BOOLEAN DEFAULT false
);

CREATE INDEX idx_auth_tokens_user ON auth_tokens(user_id);
CREATE INDEX idx_auth_tokens_expires ON auth_tokens(expires_at) WHERE revoked = false;

-- ============================================
-- TIENDAS Y COMERCIOS
-- ============================================

CREATE TABLE tiendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    direccion VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    color_primario VARCHAR(7) DEFAULT '#FF6B35',
    color_secundario VARCHAR(7) DEFAULT '#1A535C',
    disponible BOOLEAN DEFAULT true,
    abierto BOOLEAN DEFAULT true,
    -- Ratings agregados (calculados)
    calificacion_servicio DECIMAL(3, 2) DEFAULT 0,
    calificacion_comida DECIMAL(3, 2) DEFAULT 0,
    calificacion_tiempo DECIMAL(3, 2) DEFAULT 0,
    num_calificaciones INTEGER DEFAULT 0,
    -- Tiempos estimados en minutos
    tiempo_pickup INTEGER DEFAULT 15,
    tiempo_delivery INTEGER DEFAULT 30,
    tiempo_sitio INTEGER DEFAULT 20,
    costo_delivery DECIMAL(10, 2) DEFAULT 0,
    -- Suspensión
    suspendido BOOLEAN DEFAULT false,
    fecha_suspension TIMESTAMP,
    motivo_suspension TEXT,
    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Índices geoespaciales
CREATE INDEX idx_tiendas_geolocation ON tiendas(lat, lng);
CREATE INDEX idx_tiendas_disponibles ON tiendas(disponible, abierto, deleted_at)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_tiendas_slug ON tiendas(slug);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tiendas_updated_at
    BEFORE UPDATE ON tiendas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HORARIOS DE TIENDA
-- ============================================

CREATE TABLE horarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),  -- 0=Lunes, 6=Domingo
    hora_apertura TIME NOT NULL,
    hora_cierre TIME NOT NULL,
    cerrado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tienda_id, dia_semana)
);

CREATE INDEX idx_horarios_tienda ON horarios(tienda_id);

-- ============================================
-- CATEGORÍAS DE MENÚ
-- ============================================

CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    icono VARCHAR(50),  -- Nombre del icono Lucide
    orden INTEGER DEFAULT 0,
    disponible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categorias_tienda ON categorias(tienda_id);
CREATE INDEX idx_categorias_orden ON categorias(tienda_id, orden);

-- ============================================
-- ITEMS DEL MENÚ
-- ============================================

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    imagen_url VARCHAR(500),
    disponible BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_menu_items_tienda ON menu_items(tienda_id);
CREATE INDEX idx_menu_items_categoria ON menu_items(categoria_id);
CREATE INDEX idx_menu_items_disponible ON menu_items(disponible);

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- OPCIONES DE ITEMS (tallas, extras, etc.)
-- ============================================

CREATE TABLE opciones_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL,  -- ej: "Tamaño"
    tipo VARCHAR(20) DEFAULT 'single',  -- 'single' o 'multiple'
    obligatorio BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE opcion_valores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opcion_id UUID REFERENCES opciones_menu(id) ON DELETE CASCADE,
    valor VARCHAR(50) NOT NULL,  -- ej: "Grande"
    precio_adicional DECIMAL(10, 2) DEFAULT 0,
    disponible BOOLEAN DEFAULT true
);

-- ============================================
-- PEDIDOS
-- ============================================

CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identificadores
    numero_pedido VARCHAR(20) UNIQUE NOT NULL,
    usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tienda_id UUID REFERENCES tiendas(id) ON DELETE SET NULL,
    -- Tipo de servicio
    tipo_servicio VARCHAR(20) NOT NULL CHECK (tipo_servicio IN ('delivery', 'pickup', 'sitio')),
    -- Estado
    estado VARCHAR(30) DEFAULT 'pendiente_pago' CHECK (
        estado IN (
            'pendiente_pago',
            'esperando_comprobante',
            'pagado',
            'confirmado',
            'preparando',
            'listo',
            'en_camino',
            'completado',
            'cancelado'
        )
    ),
    -- Delivery
    direccion_entrega TEXT,
    lat_entrega DECIMAL(10, 8),
    lng_entrega DECIMAL(11, 8),
    instrucciones_entrega TEXT,
    -- Montos
    subtotal DECIMAL(10, 2) DEFAULT 0,
    costo_delivery DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    -- Tiempo
    tiempo_estimado INTEGER,  -- minutos
    -- Comentarios generales del pedido
    comentarios TEXT,
    -- Pago
    metodo_pago VARCHAR(30),
    comprobante_url VARCHAR(500),
    pago_confirmado BOOLEAN DEFAULT false,
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_tienda ON pedidos(tienda_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_fecha ON pedidos(created_at DESC);
CREATE INDEX idx_pedidos_numero ON pedidos(numero_pedido);

CREATE TRIGGER update_pedidos_updated_at
    BEFORE UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ITEMS DEL PEDIDO
-- ============================================

CREATE TABLE pedido_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    -- Snapshot de datos (para no perder info si cambia el menú)
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    comentarios TEXT,  -- ej: "sin cebolla, término medio"
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pedido_items_pedido ON pedido_items(pedido_id);

-- Opciones seleccionadas por item
CREATE TABLE pedido_item_opciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_item_id UUID REFERENCES pedido_items(id) ON DELETE CASCADE,
    opcion_valor_id UUID REFERENCES opcion_valores(id) ON DELETE SET NULL,
    nombre_opcion VARCHAR(50) NOT NULL,
    nombre_valor VARCHAR(50) NOT NULL,
    precio_adicional DECIMAL(10, 2) DEFAULT 0
);

-- ============================================
-- MENSAJES DE CHAT
-- ============================================

CREATE TABLE mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    emisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    emisor_tipo VARCHAR(20) NOT NULL CHECK (emisor_tipo IN ('usuario', 'tienda', 'sistema')),
    tipo VARCHAR(20) DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagen', 'archivo', 'sistema')),
    contenido TEXT NOT NULL,
    archivo_url VARCHAR(500),
    archivo_nombre VARCHAR(255),
    archivo_tipo VARCHAR(100),
    leido BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mensajes_pedido ON mensajes(pedido_id);
CREATE INDEX idx_mensajes_emisor ON mensajes(emisor_id);
CREATE INDEX idx_mensajes_fecha ON mensajes(created_at);

-- ============================================
-- CALIFICACIONES
-- ============================================

CREATE TABLE calificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tienda_id UUID REFERENCES tiendas(id) ON DELETE SET NULL,
    -- Ratings individuales (1-5)
    rating_servicio INTEGER NOT NULL CHECK (rating_servicio BETWEEN 1 AND 5),
    rating_comida INTEGER NOT NULL CHECK (rating_comida BETWEEN 1 AND 5),
    rating_tiempo INTEGER NOT NULL CHECK (rating_tiempo BETWEEN 1 AND 5),
    -- Promedio calculado
    rating_promedio DECIMAL(3, 2) GENERATED ALWAYS AS (
        (rating_servicio + rating_comida + rating_tiempo) / 3.0
    ) STORED,
    -- Comentarios
    comentario TEXT,
    -- Validez
    valido BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(pedido_id)  -- Solo una calificación por pedido
);

CREATE INDEX idx_calificaciones_tienda ON calificaciones(tienda_id);
CREATE INDEX idx_calificaciones_fecha ON calificaciones(created_at DESC);
CREATE INDEX idx_calificaciones_rating ON calificaciones(rating_promedio);

-- ============================================
-- DIRECCIONES DE USUARIO
-- ============================================

CREATE TABLE direcciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nombre VARCHAR(100),  -- ej: "Casa", "Trabajo"
    direccion TEXT NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    instrucciones TEXT,  -- ej: "Frente al kiosko"
    es_principal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_direcciones_usuario ON direcciones(usuario_id);

-- ============================================
-- REPORTES E INCIDENCIAS
-- ============================================

CREATE TABLE incidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tienda_id UUID REFERENCES tiendas(id) ON DELETE SET NULL,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
    tipo VARCHAR(50) NOT NULL,  -- 'reporte', 'queja', 'solicitud'
    descripcion TEXT NOT NULL,
    estado VARCHAR(30) DEFAULT 'abierta',
    prioridad VARCHAR(20) DEFAULT 'normal',  -- 'baja', 'normal', 'alta', 'urgente'
    respuesta TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incidencias_tienda ON incidencias(tienda_id);
CREATE INDEX idx_incidencias_estado ON incidencias(estado);
CREATE INDEX idx_incidencias_prioridad ON incidencias(prioridad);

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para generar número de pedido único
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS VARCHAR(20) AS $$
DECLARE
    fecha VARCHAR(8);
    secuencia INTEGER;
    resultado VARCHAR(20);
BEGIN
    fecha := TO_CHAR(NOW(), 'YYYYMMDD');

    SELECT COALESCE(MAX(
        CAST(SUBSTRING(numero_pedido FROM 10) AS INTEGER)
    ), 0) + 1
    INTO secuencia
    FROM pedidos
    WHERE numero_pedido LIKE 'PE-' || fecha || '-%';

    resultado := 'PE-' || fecha || '-' || LPAD(secuencia::TEXT, 4, '0');

    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular distancia entre dos puntos (Haversine)
CREATE OR REPLACE FUNCTION calcular_distancia(
    lat1 DECIMAL,
    lng1 DECIMAL,
    lat2 DECIMAL,
    lng2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    r DECIMAL := 6371;  -- Radio de la Tierra en km
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dlat := RADIANS(lat2 - lat1);
    dlng := RADIANS(lng2 - lng1);
    a := SIN(dlat/2) * SIN(dlat/2) +
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
         SIN(dlng/2) * SIN(dlng/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    RETURN r * c;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS PARA ACTUALIZAR CALIFICACIONES
-- ============================================

CREATE OR REPLACE FUNCTION actualizar_calificaciones_tienda()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tiendas
        SET
            calificacion_servicio = (
                SELECT AVG(rating_servicio)
                FROM calificaciones
                WHERE tienda_id = NEW.tienda_id AND valido = true
            ),
            calificacion_comida = (
                SELECT AVG(rating_comida)
                FROM calificaciones
                WHERE tienda_id = NEW.tienda_id AND valido = true
            ),
            calificacion_tiempo = (
                SELECT AVG(rating_tiempo)
                FROM calificaciones
                WHERE tienda_id = NEW.tienda_id AND valido = true
            ),
            num_calificaciones = (
                SELECT COUNT(*)
                FROM calificaciones
                WHERE tienda_id = NEW.tienda_id AND valido = true
            )
        WHERE id = NEW.tienda_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        UPDATE tiendas
        SET
            calificacion_servicio = COALESCE((
                SELECT AVG(rating_servicio)
                FROM calificaciones
                WHERE tienda_id = OLD.tienda_id AND valido = true
            ), 0),
            num_calificaciones = (
                SELECT COUNT(*)
                FROM calificaciones
                WHERE tienda_id = OLD.tienda_id AND valido = true
            )
        WHERE id = OLD.tienda_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_calificaciones
AFTER INSERT OR DELETE ON calificaciones
FOR EACH ROW
EXECUTE FUNCTION actualizar_calificaciones_tienda();

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de tiendas con distancia desde un punto
CREATE OR REPLACE VIEW tiendas_con_distancia AS
SELECT
    t.*,
    0 as distancia
FROM tiendas t;

-- Vista de métricas por tienda
CREATE OR REPLACE VIEW metricas_tienda AS
SELECT
    tienda_id,
    COUNT(*) as total_pedidos,
    SUM(total) as ventas_totales,
    AVG(total) as ticket_promedio,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as tiempo_promedio_minutos,
    COUNT(CASE WHEN estado = 'completado' THEN 1 END) as pedidos_completados,
    COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as pedidos_cancelados
FROM pedidos
WHERE deleted_at IS NULL
GROUP BY tienda_id;

-- ============================================
-- SEED DATA: Usuario Super Admin
-- ============================================

INSERT INTO users (email, password_hash, telefono, nombre, rol) VALUES (
    'admin@clickandeat.ve',
    -- Password: Admin123!
    'pbkdf2_sha256$600000$salt$hashplaceholder',
    '+5804121234567',
    'Administrador',
    3
);

-- ============================================
-- DATOS DE PRUEBA: Tiendas de ejemplo
-- ============================================

INSERT INTO tiendas (nombre, slug, descripcion, direccion, lat, lng, telefono, disponible, abierto) VALUES
('Pizzería El Sol', 'pizzeria-el-sol', 'Las mejores pizzas de Punto Fijo, hechas con amor',
 'Av. Manaure, Centro', 11.6956, -70.1999, '+5804123456789', true, true),
('Hamburguesas El Parque', 'hamburguesas-el-parque', 'Hamburguesas artesanales',
 'Calle Comercio c/c Bolívar', 11.7000, -70.1950, '+5804123456790', true, true),
('Arepera del Pueblo', 'arepera-del-pueblo', 'Arepas filled con tradición falconiana',
 'Av. Libertador', 11.6920, -70.2020, '+5804123456791', true, true),
('Marisquería Cumaná', 'marisqueria-cumana', 'Delicias del mar directamente',
 'Av. Sanare', 11.7050, -70.1900, '+5804123456792', true, true),
('Pollito Broaster FC', 'pollito-broaster-fc', 'Pollo frito crispy y jugoso',
 'Calle El Milagro', 11.6900, -70.2050, '+5804123456793', true, true);
