import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MensajeDTO } from '../../dto/mensaje-dto';
import { Supplier, SupplierCreateDto, SupplierUpdateDto } from '../models/supplier.model';
import { assertOkReply } from '../utils/admin-api.util';

interface SupplierApi {
  id: string;
  category: string;
  name: string;
  product: string;
  contact: string;
  address: string;
  city: string;
  active: boolean;
}

function fromApi(s: SupplierApi): Supplier {
  return {
    id: s.id,
    category: s.category,
    name: s.name,
    suppliedProduct: s.product,
    contact: s.contact,
    address: s.address,
    city: s.city,
    status: s.active ? 'ACTIVE' : 'INACTIVE',
  };
}

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.adminServiceUrl;

  getAll(): Observable<Supplier[]> {
    return this.http.get<MensajeDTO>(`${this.base}/suppliers`).pipe(
      map((m) => assertOkReply<SupplierApi[]>(m).map(fromApi)),
    );
  }

  getById(id: string): Observable<Supplier | undefined> {
    return this.getAll().pipe(map((list) => list.find((s) => s.id === id)));
  }

  create(dto: SupplierCreateDto): Observable<Supplier> {
    const body = {
      category: dto.category,
      name: dto.name,
      product: dto.suppliedProduct,
      contact: dto.contact,
      address: dto.address,
      city: dto.city,
    };
    return this.http
      .post<MensajeDTO>(`${this.base}/suppliers`, body)
      .pipe(map((m) => fromApi(assertOkReply<SupplierApi>(m))));
  }

  update(id: string, dto: SupplierUpdateDto): Observable<Supplier> {
    const body = {
      category: dto.category!,
      name: dto.name!,
      product: dto.suppliedProduct!,
      contact: dto.contact!,
      address: dto.address!,
      city: dto.city!,
    };
    return this.http
      .put<MensajeDTO>(`${this.base}/suppliers/${id}`, body)
      .pipe(map((m) => fromApi(assertOkReply<SupplierApi>(m))));
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<MensajeDTO>(`${this.base}/suppliers/${id}`).pipe(
      map((m) => {
        assertOkReply<string>(m);
      }),
    );
  }

  activate(id: string): Observable<Supplier> {
    return this.http
      .patch<MensajeDTO>(`${this.base}/suppliers/${id}/activate`, {})
      .pipe(map((m) => fromApi(assertOkReply<SupplierApi>(m))));
  }
}
