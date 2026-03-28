import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MensajeDTO } from '../../dto/mensaje-dto';
import { Product, ProductCreateDto, ProductUpdateDto } from '../models/product.model';
import { assertOkReply } from '../utils/admin-api.util';

interface AdminProductApi {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  stockQuantity: number;
  active: boolean;
  outOfStock: boolean;
}

function fromApi(p: AdminProductApi): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price,
    imageUrl: p.imageUrl,
    outOfStock: p.outOfStock,
    stockQuantity: p.stockQuantity,
    active: p.active,
  };
}

function toRequestBody(dto: {
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  outOfStock?: boolean;
}): Record<string, unknown> {
  return {
    name: dto.name,
    description: dto.description,
    category: dto.category,
    price: dto.price,
    imageUrl: dto.imageUrl,
    outOfStock: dto.outOfStock ?? false,
  };
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.adminServiceUrl;

  getAll(): Observable<Product[]> {
    return this.http.get<MensajeDTO>(`${this.base}/products`).pipe(
      map((m) => {
        const list = assertOkReply<AdminProductApi[]>(m);
        return list.map(fromApi);
      }),
    );
  }

  getById(id: string): Observable<Product | undefined> {
    return this.getAll().pipe(map((list) => list.find((p) => p.id === id)));
  }

  create(dto: ProductCreateDto): Observable<Product> {
    return this.http
      .post<MensajeDTO>(`${this.base}/products`, toRequestBody(dto))
      .pipe(map((m) => fromApi(assertOkReply<AdminProductApi>(m))));
  }

  update(id: string, dto: ProductUpdateDto): Observable<Product> {
    const body = toRequestBody({
      name: dto.name!,
      description: dto.description!,
      category: dto.category!,
      price: dto.price!,
      imageUrl: dto.imageUrl!,
      outOfStock: dto.outOfStock,
    });
    return this.http
      .put<MensajeDTO>(`${this.base}/products/${id}`, body)
      .pipe(map((m) => fromApi(assertOkReply<AdminProductApi>(m))));
  }

  /** Alterna el flag de agotado vía PUT con los demás campos del producto actual. */
  setOutOfStock(row: Product, outOfStock: boolean): Observable<Product> {
    return this.update(row.id, {
      name: row.name,
      description: row.description,
      category: row.category,
      price: row.price,
      imageUrl: row.imageUrl,
      outOfStock,
    });
  }

}
