# Integración del panel admin con el API Spring Boot

Este documento resume cómo reemplazar los servicios mock en `src/app/admin/services/` por llamadas HTTP reales.

## 1. Entorno y cliente HTTP

- Los servicios ya tienen comentarios `// import { HttpClient }` y rutas de ejemplo en `src/app/admin/api/admin-api.contracts.ts`.
- Inyecta `HttpClient` (ya provisto en `app.config.ts` con interceptores).
- Usa una base URL central, por ejemplo `export const environment = { apiUrl: 'https://api.ejemplo.com' };` y concatena con las rutas de `ADMIN_API_PATHS`.

## 2. Patrón de sustitución

Para cada método mock:

1. Elimina o reduce el uso de `BehaviorSubject` local si el backend es la fuente de verdad.
2. Sustituye `of(...).pipe(delay(...))` por `this.http.get/post/put/delete(...)`.
3. Mapea los DTO del backend a los modelos de `src/app/admin/models/` si los nombres de campos difieren.
4. Propaga errores HTTP con `catchError` y muestra mensajes vía `NotificationService`.

## 3. Endpoints de referencia

| Recurso    | Operaciones (ejemplo) |
|-----------|------------------------|
| Proveedores | `GET/POST /api/suppliers`, `PUT/DELETE /api/suppliers/:id` |
| Productos  | `GET/POST /api/products`, `PUT /api/products/:id`, opcional `PATCH` stock |
| Lotes      | `GET /api/lots`, `GET /api/lots/inventory`, `POST/PUT/DELETE` por id |
| Mesas      | `GET/POST/PUT /api/admin/tables`, `PATCH` walk-in si lo separan |

Ajusta prefijos (`/api`, `/v1`, etc.) a lo que exponga Spring.

## 4. Autenticación y roles

- La ruta `/admin` ya usa `RolesGuard` con `expectedRole: ['ADMIN']`.
- El `usuarioInterceptor` debería adjuntar el token JWT a las peticiones admin igual que al resto del cliente.

## 5. Imágenes de producto

- Sustituye la vista previa local (`FileReader`) por `FormData` en `POST/PUT` multipart, o por subida a almacenamiento y guardado de URL devuelta por el backend.

## 6. Mesas y reservas

- El campo `reservationState` hoy es mock; en integración debe poblar desde el dominio de reservas o un `GET` agregado.
- `walkInOverride` puede mapearse a un `PATCH` dedicado para no pisar el estado de reservas.

Tras cada cambio, ejecutar `ng build` y pruebas manuales del flujo admin con un usuario `ADMIN` real.
