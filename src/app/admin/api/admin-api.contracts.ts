/**
 * Contratos REST del panel admin (alineados con Spring Boot).
 * Base: `environment.adminServiceUrl` → `/api/admin`
 *
 * Proveedores: PATCH `/{id}/activate` reactiva; DELETE `/{id}` desactiva.
 * Lotes: DELETE `/lots/{id}` elimina lote y ajusta stock del producto.
 */
export const ADMIN_API_PATHS = {
  suppliers: '/suppliers',
  products: '/products',
  lots: '/lots',
  inventory: '/inventory',
  tables: '/tables',
} as const;
