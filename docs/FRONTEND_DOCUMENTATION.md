# Documentación técnica — Tienda Sana (Frontend)

Dominio producción: `https://www.tiendasana.shop`

Este documento describe **la estructura real del frontend**, sus componentes, flujo de navegación, integración con el backend, reglas/decisiones de UI y puntos críticos para operar y evolucionar el proyecto.

> Seguridad: esta documentación evita secretos, tokens o configuraciones sensibles. Los endpoints admin y acciones críticas deben validarse siempre en backend; el frontend solo aplica UX y navegación.

## 1) Stack y decisiones principales

- **Framework**: Angular (standalone components) + Angular Router.
- **UI**: Bootstrap + estilos propios + FontAwesome + Angular Material (instalado).
- **Comunicación HTTP**: `HttpClient` + interceptor JWT.
- **Autorización en UI**:
  - `RolesGuard`: protege rutas por rol (`CLIENTE`, `ADMIN`).
  - `LoginGuard`: evita acceso a login/registro cuando ya hay sesión.
- **SEO (SPA)**:
  - Metadatos base en `src/index.html` (title, description, og/tw, canonical).
  - Actualización dinámica de `canonical` y metas en runtime para páginas clave.
  - `robots.txt` y `sitemap.xml` en `public/` para Search Console.

## 2) Estructura del proyecto (carpetas)

Raíz:
- `angular.json`: configuración de build/serve, assets desde `public/`.
- `package.json`: scripts y dependencias.
- `public/`: **assets estáticos** copiados al build (ej. `favicon.ico`, `robots.txt`, `sitemap.xml`).
- `src/`:
  - `index.html`: plantilla HTML base (SEO base + JSON-LD).
  - `environments/`: URLs backend por entorno.
  - `app/`: aplicación Angular.

`src/app/` (alto nivel):
- `app.routes.ts`: **rutas principales** (públicas, cliente, admin).
- `app.config.ts`: providers globales (router, http interceptors, animations).
- `app.component.*`: layout general (Header/Footer, detección de layout admin, canonical/meta).
- `components/`: componentes públicos y de cliente.
- `admin/`: panel de administración (lazy-loaded bajo `/admin`).
- `services/`: servicios HTTP para `public`, `auth`, `cliente`, `cuenta`, token, etc.
- `guardias/`: guards de rutas.
- `interceptador/`: interceptor para adjuntar JWT.
- `dto/`: contratos de datos del frontend (request/response).
- `core/`: utilidades y constantes transversales (SEO).

## 3) Rutas de navegación (Router)

Definidas en `src/app/app.routes.ts`:
- `/` → `HomeComponent`
- `/login` → `LoginComponent` (con `LoginGuard`)
- `/register` → `RegisterComponent` (con `LoginGuard`)
- `/correo-recuperacion` → `CorreoRecuperacionComponent`
- `/cambiar-password` → `CambiarPasswordComponent`
- `/verificar-cuenta` → `VerificarCuentaComponent`
- `/carrito` → `ShoppingCarComponent` (**solo CLIENTE**)
- `/historial` → `HistorialComponent` (**solo CLIENTE**)
- `/info-usuario` → `InformacionUsuarioComponent` (**CLIENTE o ADMIN**)
- `/detalle-producto/:id` → `DetalleProductoComponent`
- `/mesas/:id` → `DetalleMesaComponent`
- `/gestor-reservas` → `GestorReservasComponent` (**solo CLIENTE**)
- `/admin/*` → lazy-load `ADMIN_ROUTES` (solo `ADMIN`)
- `**` → fallback a `/`

Rutas admin (`src/app/admin/admin.routes.ts`):
- `/admin/dashboard`
- `/admin/operations/products`
- `/admin/operations/tables`
- `/admin/operations/inventory`
- `/admin/analytics/sales`
- `/admin/analytics/reservations`
- `/admin/settings/suppliers`
- Redirecciones de compatibilidad: `/admin/products`, `/admin/lots`, `/admin/tables`, `/admin/suppliers`

## 4) Layout y composición UI

- `AppComponent` decide si está en layout admin: cuando la URL empieza por `/admin`.
  - Esto permite mostrar/ocultar header/footer o aplicar estilos distintos.
- `HeaderComponent` y `FooterComponent` son componentes compartidos.

## 5) Autenticación y autorización en frontend

### 5.1 Token y sesión

- `TokenService` (en `src/app/services/token.service.ts`) gestiona token y claims (rol, id, etc.).
- El rol se usa en:
  - `RolesGuard` para permitir/denegar navegación.
  - UI condicional (por ejemplo, `DetalleProductoComponent` tiene modo admin).

### 5.2 Interceptor JWT

Archivo: `src/app/interceptador/usuario.interceptor.ts`
- Si el usuario está logueado y la ruta **no** es `api/auth` ni `api/public`, adjunta:
  - `Authorization: Bearer <token>`

## 6) Integración con backend (URLs y entornos)

Se definen en:
- `src/environments/environment.ts` (dev)
- `src/environments/environment.prod.ts` (prod)

**Importante**: actualmente `environment.prod.ts` apunta a `http://localhost:8080/...`.
En producción debes ajustar a tu backend real (Render u otro), por ejemplo:
- `https://tienda-sana-backend-<...>.onrender.com/api/public`

Servicios HTTP:
- `PublicoService` → `/api/public` (catálogo público, mesas, IA, webhooks MP)
- `AuthService` → `/api/auth` (login, registro, activación, recuperación)
- `ClienteService` → `/api/cliente` (carrito, ventas, reservas, pagos)
- `CuentaService` → `/api/account` (perfil/actualización)
- `admin/*` (panel): `src/app/admin/services/*` y contratos en `src/app/admin/api/admin-api.contracts.ts`

## 7) Componentes por dominio (visión funcional)

### 7.1 Catálogo público

- `HomeComponent`: listado, filtros, recomendaciones IA.
- `CardGridComponent`, `CardComponent`: representación de producto.
- `DetalleProductoComponent`: detalle + carrito (cliente) / edición (admin).

### 7.2 Carrito y compras

- `ShoppingCarComponent`: items, cantidades, total, acción de pago.
- `HistorialComponent`: historial de compras (y reservas si aplica).

### 7.3 Mesas y reservas

- `CardGridMesaComponent`, `DetalleMesaComponent`: visualización mesas.
- `GestorReservasComponent`: agrega/gestiona mesas para reservar.

### 7.4 Panel Admin

Módulo lazy-load con vistas:
- Inventario por lotes y ajustes.
- CRUD de productos, mesas, proveedores.
- Analítica de ventas y reservas.

## 8) Contratos de datos (DTO)

En `src/app/dto/` se modelan request/response usados por la UI.
Patrón común:
- Backend responde `MensajeDTO` con:
  - `error` (boolean)
  - `reply` (payload)

## 9) SEO, indexación y buenas prácticas (SPA)

### 9.1 Archivos estáticos

En `public/`:
- `robots.txt`: permite indexación y bloquea `/admin/`.
- `sitemap.xml`: sitemap básico (URLs estáticas).

### 9.2 Metas y canonical

- `src/index.html`: metas base + JSON-LD de `Organization`/`WebSite`.
- `AppComponent`: actualiza `canonical` y metas por navegación.
- `DetalleProductoComponent`: ajusta `title/description/og` cuando ya cargó el producto.

**Nota**: al ser SPA, Google puede indexar, pero para “rich previews” en redes sociales suele ser mejor SSR/Prerender.

## 10) Scripts, build y ejecución

Scripts relevantes (de `package.json`):
- `npm run start`: genera env (`set-env.js`) y ejecuta `ng serve`.
- `npm run build`: build Angular.
- `npm run build:prod`: build con configuración `production`.

Build output:
- `dist/tienda-sana-frontend/`

## 11) Checklist de despliegue (producción)

- Ajustar `environment.prod.ts` con el backend real.
- Verificar que `robots.txt` y `sitemap.xml` se sirvan en:
  - `https://www.tiendasana.shop/robots.txt`
  - `https://www.tiendasana.shop/sitemap.xml`
- Configurar redirección 301 entre `www` y no-`www` (dominio canónico único).
- Registrar sitemap en Search Console: `https://www.tiendasana.shop/sitemap.xml`

## 12) Riesgos y puntos a vigilar

- **URLs de producción** en `environment.prod.ts` (actualmente localhost).
- **SPA SEO**: sin SSR, algunos crawlers pueden no ejecutar JS.
- **Admin**: asegurar que el backend valide rol (no confiar solo en guard frontend).
- **Manejo de errores**: normalizar mensajes (backend a veces retorna `MessageDTO` y otras `Map`).

## 13) Guía operativa (deploy y producción)

### 13.1 Entornos y configuración

- **local**
  - Frontend: `http://localhost:4200`
  - Backend: `http://localhost:8080`
  - Ajustar `src/environments/environment.ts` (ya apunta a localhost).
- **prod**
  - Dominio: `https://www.tiendasana.shop`
  - Ajustar `src/environments/environment.prod.ts` con el backend real (HTTPS).

### 13.2 Checklist de producción (frontend)

- **Base URLs**
  - Verificar `environment.prod.ts` (no debe apuntar a localhost).
- **CORS**
  - Backend debe permitir origen `https://www.tiendasana.shop`.
- **SEO**
  - Confirmar que se sirven:
    - `/robots.txt`
    - `/sitemap.xml`
  - Registrar sitemap en Search Console.
- **Admin**
  - Verificar que el rol `ADMIN` funciona (routes guard + token).
- **Assets**
  - Cloudinary: el panel admin usa firma del backend; validar flujo de subida en prod.

## 14) Mapa de UI (rutas → vistas)

Rutas públicas/cliente (ver `app.routes.ts`):
- `/` → Home (catálogo + filtros + recomendación IA)
- `/detalle-producto/:id` → detalle + agregar a carrito (cliente) / edición (admin)
- `/mesas/:id` → detalle mesa
- `/carrito` → carrito (CLIENTE)
- `/historial` → historial ventas/reservas (CLIENTE)
- `/gestor-reservas` → gestor reserva (CLIENTE)
- `/info-usuario` → perfil (CLIENTE/ADMIN)
- `/login`, `/register`, `/correo-recuperacion`, `/verificar-cuenta`, `/cambiar-password`

Rutas admin (ver `admin/admin.routes.ts`):
- `/admin/dashboard`
- `/admin/operations/products`
- `/admin/operations/tables`
- `/admin/operations/inventory`
- `/admin/analytics/sales`
- `/admin/analytics/reservations`
- `/admin/settings/suppliers`

## 15) Glosario de dominio (frontend)

- **Token / JWT**: credencial guardada en cliente para adjuntar `Authorization: Bearer ...` a llamadas protegidas.
- **Rol**: `CLIENTE` o `ADMIN`; controla rutas y modos de UI.
- **MensajeDTO**: wrapper de respuestas del backend (`error` + `reply`).
- **Carrito**: items seleccionados por el cliente para compra.
- **Venta**: orden de compra; se paga vía Mercado Pago.
- **Reserva**: bloqueo de mesa(s) por un rango horario; también se paga vía Mercado Pago.
- **Lote / Inventario**: vista admin para entradas/ajustes y control FIFO (se refleja en stock).

