export type LotStatus = 'ACTIVO' | 'CONSUMIDO' | 'ANULADO';

export interface ProductLot {
  id: string;
  productId: string;
  supplierId: string;
  entryDate: string;
  /** Cantidad inicial del movimiento de entrada */
  initialQuantity: number;
  unitValue: number;
  quantityRemaining: number;
  quantityConsumed: number;
  status: LotStatus;
  voided: boolean;
}

export type ProductLotCreateDto = Pick<ProductLot, 'productId' | 'supplierId' | 'entryDate' | 'unitValue'> & {
  quantity: number;
};

export type ProductLotUpdateDto = Partial<ProductLotCreateDto>;

/** Inventario por producto (GET /api/admin/inventory). */
export interface InventoryLine {
  productId: string;
  productName: string;
  totalQuantity: number;
}

export type InventoryAdjustmentDirection = 'IN' | 'OUT';

export interface InventoryAdjustmentDto {
  productId: string;
  direction: InventoryAdjustmentDirection;
  quantity: number;
  reason: string;
  /** Si se indica: IN suma en ese lote; OUT descuenta solo de ese lote. Vacío = IN crea fila nueva / OUT reparte FIFO. */
  targetLotId?: string | null;
}

export interface DeleteLotResult {
  code: string;
  message: string;
}
