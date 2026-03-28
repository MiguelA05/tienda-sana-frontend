import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MensajeDTO } from '../../dto/mensaje-dto';
import { InventoryLine, ProductLot, ProductLotCreateDto, ProductLotUpdateDto } from '../models/lot.model';
import { assertOkReply } from '../utils/admin-api.util';

interface ProductLotApi {
  id: string;
  productId: string;
  supplierId: string;
  entryDate: string;
  quantity: number;
  unitValue: number;
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
    entryDate: typeof l.entryDate === 'string' ? l.entryDate.slice(0, 10) : String(l.entryDate),
    quantity: l.quantity,
    unitValue: l.unitValue,
  };
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
      entryDate: dto.entryDate,
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
      entryDate: dto.entryDate!,
      quantity: dto.quantity!,
      unitValue: dto.unitValue!,
    };
    return this.http
      .put<MensajeDTO>(`${this.base}/lots/${id}`, body)
      .pipe(map((m) => lotFromApi(assertOkReply<ProductLotApi>(m))));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<MensajeDTO>(`${this.base}/lots/${id}`).pipe(
      map((m) => {
        assertOkReply<string>(m);
      }),
    );
  }
}
