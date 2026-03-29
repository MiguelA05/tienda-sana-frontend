/**
 * Mesa en panel admin: mismos campos que el catálogo público (colección tables / ItemMesaDTO).
 */
export interface AdminTable {
  id: string;
  nombre: string;
  estado: string;
  localidad: string;
  precioReserva: number;
  capacidad: number;
  duracionReservaMinutos: number;
  imagen: string;
  /** Si es false, la mesa no se lista para el cliente. */
  visibleToClient: boolean;
}

/** Estado operativo para colores del mapa (derivado de `estado` en español). */
export type TableDisplayStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';

export type AdminTableCreateDto = Omit<AdminTable, 'id'>;
export type AdminTableUpdateDto = Partial<AdminTableCreateDto>;
