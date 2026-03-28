/** Estado según API (solo `active` en Mongo). */
export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export interface Supplier {
  id: string;
  category: string;
  name: string;
  suppliedProduct: string;
  contact: string;
  address: string;
  city: string;
  status: SupplierStatus;
}

export type SupplierCreateDto = Omit<Supplier, 'id' | 'status'>;
export type SupplierUpdateDto = Partial<Omit<Supplier, 'id' | 'status'>>;
