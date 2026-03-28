export interface Product {
  id: string;
  imageUrl: string;
  name: string;
  description: string;
  category: string;
  price: number;
  outOfStock: boolean;
  /** Inventario agregado (Mongo). */
  stockQuantity?: number;
  /** Catálogo activo para el cliente. */
  active?: boolean;
}

export type ProductCreateDto = Omit<Product, 'id' | 'stockQuantity' | 'active'>;
export type ProductUpdateDto = Partial<Omit<Product, 'id'>>;
