export interface ProductLot {
  id: string;
  productId: string;
  supplierId: string;
  entryDate: string;
  quantity: number;
  unitValue: number;
}

export type ProductLotCreateDto = Omit<ProductLot, 'id'>;
export type ProductLotUpdateDto = Partial<Omit<ProductLot, 'id'>>;

/** Inventario por producto (GET /api/admin/inventory). */
export interface InventoryLine {
  productId: string;
  productName: string;
  totalQuantity: number;
}
