import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MensajeDTO } from '../../dto/mensaje-dto';
import {
  AdminTable,
  AdminTableCreateDto,
  AdminTableUpdateDto,
  TableDisplayStatus,
  TableOperationalStatus,
} from '../models/admin-table.model';
import { assertOkReply } from '../utils/admin-api.util';

interface RestaurantTableApi {
  id: string;
  capacity: number;
  location: string;
  active: boolean;
  status: TableOperationalStatus;
}

function fromApi(t: RestaurantTableApi): AdminTable {
  return {
    id: t.id,
    capacity: t.capacity,
    location: t.location,
    active: t.active,
    status: t.status,
  };
}

/** Estado mostrado en mapa (mesa inactiva se estiliza aparte). */
export function effectiveTableStatus(t: AdminTable): TableDisplayStatus {
  return t.status;
}

const STATUS_CYCLE: TableOperationalStatus[] = ['AVAILABLE', 'OCCUPIED', 'RESERVED'];

export function nextCycledStatus(current: TableOperationalStatus): TableOperationalStatus {
  const i = STATUS_CYCLE.indexOf(current);
  const next = (i < 0 ? 0 : i + 1) % STATUS_CYCLE.length;
  return STATUS_CYCLE[next];
}

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.adminServiceUrl;

  getAll(): Observable<AdminTable[]> {
    return this.http.get<MensajeDTO>(`${this.base}/tables`).pipe(
      map((m) => assertOkReply<RestaurantTableApi[]>(m).map(fromApi)),
    );
  }

  getById(id: string): Observable<AdminTable | undefined> {
    return this.getAll().pipe(map((list) => list.find((x) => x.id === id)));
  }

  create(dto: AdminTableCreateDto): Observable<AdminTable> {
    const body = {
      capacity: dto.capacity,
      location: dto.location,
      active: dto.active,
    };
    return this.http
      .post<MensajeDTO>(`${this.base}/tables`, body)
      .pipe(map((m) => fromApi(assertOkReply<RestaurantTableApi>(m))));
  }

  update(id: string, dto: AdminTableUpdateDto): Observable<AdminTable> {
    const body = {
      capacity: dto.capacity!,
      location: dto.location!,
      active: dto.active!,
    };
    return this.http
      .put<MensajeDTO>(`${this.base}/tables/${id}`, body)
      .pipe(map((m) => fromApi(assertOkReply<RestaurantTableApi>(m))));
  }

  patchStatus(id: string, status: TableOperationalStatus): Observable<AdminTable> {
    return this.http
      .patch<MensajeDTO>(`${this.base}/tables/${id}/status`, { status })
      .pipe(map((m) => fromApi(assertOkReply<RestaurantTableApi>(m))));
  }

  /** Ciclo operativo en mapa: AVAILABLE → OCCUPIED → RESERVED → … */
  cycleOperationalStatus(id: string, current: TableOperationalStatus): Observable<AdminTable> {
    return this.patchStatus(id, nextCycledStatus(current));
  }
}
