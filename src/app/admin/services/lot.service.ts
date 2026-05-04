import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MensajeDTO } from '../../dto/mensaje-dto';
import {
  DeleteLotResult,
  InventoryAdjustmentDto,
  InventoryLine,
  ProductLot,
  ProductLotCreateDto,
  ProductLotUpdateDto,
} from '../models/lot.model';
import { assertOkReply } from '../utils/admin-api.util';

interface ProductLotApi {
  id: string;
  productId: string;
  supplierId: string;
  entryDate: string;
  initialQuantity: number;
  unitValue: number;
  quantityRemaining: number;
  quantityConsumed: number;
  status: string;
  voided: boolean;
}

interface InventoryApi {
  productId: string;
  productName: string;
  stockQuantity: number;
}

function lotFromApi(l: ProductLotApi): ProductLot {
  return {
    id: l.id,
    productId: l.productId,
    supplierId: l.supplierId,
    entryDate: typeof l.entryDate === 'string' ? l.entryDate : String(l.entryDate),
    initialQuantity: l.initialQuantity ?? (l as unknown as { quantity?: number }).quantity ?? 0,
    unitValue: l.unitValue,
    quantityRemaining: l.quantityRemaining ?? 0,
    quantityConsumed: l.quantityConsumed ?? 0,
    status: (l.status as ProductLot['status']) ?? 'ACTIVO',
    voided: l.voided ?? false,
  };
}

function normalizeToApiDateTime(value: string): string {
  const v = (value ?? '').trim();
  if (!v) return v;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return `${v}:00`;
  return v;
}

function invFromApi(i: InventoryApi): InventoryLine {
  return {
    productId: i.productId,
    productName: i.productName,
    totalQuantity: i.stockQuantity,
  };
}

@Injectable({ providedIn: 'root' })
export class LotService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.adminServiceUrl;

  getAll(productId?: string): Observable<ProductLot[]> {
    const url =
      productId && productId.length > 0
        ? `${this.base}/lots?productId=${encodeURIComponent(productId)}`
        : `${this.base}/lots`;
    return this.http.get<MensajeDTO>(url).pipe(
      map((m) => assertOkReply<ProductLotApi[]>(m).map(lotFromApi)),
    );
  }

  getById(id: string): Observable<ProductLot | undefined> {
    return this.getAll().pipe(map((list) => list.find((l) => l.id === id)));
  }

  getInventory(): Observable<InventoryLine[]> {
    return this.http.get<MensajeDTO>(`${this.base}/inventory`).pipe(
      map((m) => assertOkReply<InventoryApi[]>(m).map(invFromApi)),
    );
  }

  create(dto: ProductLotCreateDto): Observable<ProductLot> {
    const body = {
      productId: dto.productId,
      supplierId: dto.supplierId,
      entryDate: normalizeToApiDateTime(dto.entryDate),
      quantity: dto.quantity,
      unitValue: dto.unitValue,
    };
    return this.http
      .post<MensajeDTO>(`${this.base}/lots`, body)
      .pipe(map((m) => lotFromApi(assertOkReply<ProductLotApi>(m))));
  }

  update(id: string, dto: ProductLotUpdateDto): Observable<ProductLot> {
    const body = {
      productId: dto.productId!,
      supplierId: dto.supplierId!,
      entryDate: normalizeToApiDateTime(dto.entryDate!),
      quantity: dto.quantity!,
      unitValue: dto.unitValue!,
    };
    return this.http
      .put<MensajeDTO>(`${this.base}/lots/${id}`, body)
      .pipe(map((m) => lotFromApi(assertOkReply<ProductLotApi>(m))));
  }

  delete(id: string): Observable<DeleteLotResult> {
    return this.http.delete<MensajeDTO>(`${this.base}/lots/${id}`).pipe(
      map((m) => assertOkReply<DeleteLotResult>(m)),
    );
  }

  adjustInventory(dto: InventoryAdjustmentDto): Observable<void> {
    const body: Record<string, unknown> = {
      productId: dto.productId,
      direction: dto.direction,
      quantity: dto.quantity,
      reason: dto.reason.trim(),
    };
    if (dto.targetLotId && dto.targetLotId.length > 0) {
      body['targetLotId'] = dto.targetLotId;
    }
    return this.http.post<MensajeDTO>(`${this.base}/inventory/adjustment`, body).pipe(
      map((m) => {
        assertOkReply<string>(m);
      }),
    );
  }
}
