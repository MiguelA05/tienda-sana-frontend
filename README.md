# Admin Panel - Restaurant System (Frontend)

Aplicación web administrativa para la gestión de **productos, mesas, inventario y analítica (ventas y reservas)** de un restaurante.

Incluye:
- Dashboard analítico
- Gestión de productos e inventario (lotes y ajustes)
- Visualización de métricas (ventas y reservas)

## Tech Stack

- Angular (standalone components) + Angular Router
- TypeScript
- Bootstrap + CSS
- Charting (Chart.js)
- HttpClient (REST) + Interceptor JWT

## Project Structure

Estructura real (resumen) del proyecto:

```text
src/
 ├── app/
 │   ├── admin/                # Panel admin (lazy-loaded bajo /admin)
 │   ├── components/           # Componentes UI (home, carrito, detalle producto, etc.)
 │   ├── services/             # API calls (auth, cliente, público, cuenta)
 │   ├── guardias/             # Guards (roles, permiso/login)
 │   ├── interceptador/        # Interceptor JWT (Authorization: Bearer ...)
 │   ├── dto/                  # DTOs de request/response usados por la UI
 │   ├── core/                 # Utilidades transversales (SEO, constantes)
 │   ├── app.routes.ts         # Rutas (público/cliente/admin)
 │   └── app.config.ts         # Providers globales
 ├── environments/             # Config por entorno (URLs del backend)
 └── index.html                # HTML base + metatags SEO

public/
 ├── robots.txt                # Indexación (bloquea /admin)
 └── sitemap.xml               # Sitemap estático (URLs base)
```

## Installation

```bash
git clone <repo>
cd tienda-sana-frontend
npm install
```

---

## Environment Variables

Este frontend **no usa Vite**, por lo que no existe `VITE_API_URL`.

La integración con backend se configura principalmente en:
- `src/environments/environment.ts` (desarrollo)
- `src/environments/environment.prod.ts` (producción)

Variables típicas a ajustar (URLs base):
- `authServiceUrl`
- `clienteServiceUrl`
- `cuentaServiceUrl`
- `publicoServiceUrl`
- `adminServiceUrl`

Nota: el proyecto incluye un script `set-env.js` que se ejecuta antes del build (ver `npm run prebuild`).

## Run

```bash
npm run start
```

La app queda disponible en `http://localhost:4200/`.

## Features

- Dashboard con métricas de ventas y reservas (panel admin)
- Gestión de productos (CRUD)
- Gestión de inventario (lotes, ajustes y stock)
- Gestión de mesas y reservas
- Analítica: reportes de ventas y reservas

## UI Architecture

- Diseño basado en módulos (feature-based) con separación por dominios:
  - Operaciones (CRUD): productos, mesas, inventario, proveedores
  - Analítica: dashboard, ventas, reservas
- Componentes desacoplados y reutilizables (layout + componentes de grid/tarjetas)
- Control de acceso:
  - Rutas admin bajo `/admin` protegidas por `RolesGuard`
  - Sesión y token manejados por `TokenService` + interceptor HTTP

## API Integration

El frontend consume endpoints REST desde el backend (Spring Boot), organizados por prefijo:

- `/api/auth` (login, registro, activación, recuperación)
- `/api/public` (catálogo público: productos, mesas, IA)
- `/api/cliente` (carrito, compras/ventas, reservas, pagos)
- `/api/account` (perfil y cuenta)
- `/api/admin` (panel admin: productos, inventario/lotes, mesas, proveedores, analítica)

## Scripts

```bash
npm run start
npm run build
npm run build:prod
npm run test
```

## Future Improvements

- Sitemap dinámico (incluir `/detalle-producto/:id` reales)
- Filtros avanzados y guardado de vistas/segmentos
- Exportación de reportes (CSV/PDF)
- Notificaciones en tiempo real (stock bajo, reservas próximas, etc.)
- SSR/Prerender para mejorar SEO social y tiempos de indexación

## License

MIT
