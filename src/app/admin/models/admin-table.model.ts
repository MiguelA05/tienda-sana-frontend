/** Estado operativo de la mesa (API: TableStatus). */
export type TableOperationalStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';

/** Vista en mapa / badges (misma escala que el backend). */
export type TableDisplayStatus = TableOperationalStatus;

export interface AdminTable {
  id: string;
  capacity: number;
  location: string;
  /** Si está inactiva, no se usa en sala. */
  active: boolean;
  status: TableOperationalStatus;
}

export type AdminTableCreateDto = Pick<AdminTable, 'capacity' | 'location' | 'active'>;
export type AdminTableUpdateDto = Partial<AdminTableCreateDto>;
