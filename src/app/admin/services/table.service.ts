import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MensajeDTO } from '../../dto/mensaje-dto';
import { AdminTable, AdminTableCreateDto, TableDisplayStatus } from '../models/admin-table.model';
import { assertOkReply } from '../utils/admin-api.util';

interface RestaurantTableApi {
  id: string;
  nombre: string;
  estado: string;
  localidad: string;
  precioReserva: number;
  capacidad: number;
  imagen: string;
  visibleToClient: boolean;
}

function fromApi(t: RestaurantTableApi): AdminTable {
  return {
    id: t.id,
    nombre: t.nombre,
    estado: t.estado,
    localidad: t.localidad,
    precioReserva: t.precioReserva,
    capacidad: t.capacidad,
    imagen: t.imagen,
    visibleToClient: t.visibleToClient,
  };
}

/** Mapea texto de estado del cliente a categoría visual del mapa. */
export function estadoToDisplayStatus(estado: string): TableDisplayStatus {
  const e = (estado ?? '').trim().toLowerCase();
  if (e.includes('reserv')) {
    return 'RESERVED';
  }
  if (e.includes('ocup')) {
    return 'OCCUPIED';
  }
  return 'AVAILABLE';
}

/** Estado operativo en API admin (PATCH /status). */
export type TableOperationalStatus = TableDisplayStatus;

const STATUS_CYCLE: TableOperationalStatus[] = ['AVAILABLE', 'OCCUPIED', 'RESERVED'];

export function effectiveTableStatus(t: AdminTable): TableDisplayStatus {
  return estadoToDisplayStatus(t.estado);
}

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
      nombre: dto.nombre,
      estado: dto.estado,
      localidad: dto.localidad,
      precioReserva: dto.precioReserva,
      capacidad: dto.capacidad,
      imagen: dto.imagen,
      visibleToClient: dto.visibleToClient,
    };
    return this.http
      .post<MensajeDTO>(`${this.base}/tables`, body)
      .pipe(map((m) => fromApi(assertOkReply<RestaurantTableApi>(m))));
  }

  update(id: string, dto: AdminTableCreateDto): Observable<AdminTable> {
    const body = {
      nombre: dto.nombre,
      estado: dto.estado,
      localidad: dto.localidad,
      precioReserva: dto.precioReserva,
      capacidad: dto.capacidad,
      imagen: dto.imagen,
      visibleToClient: dto.visibleToClient,
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

  cycleOperationalStatus(id: string, t: AdminTable): Observable<AdminTable> {
    const current = effectiveTableStatus(t);
    return this.patchStatus(id, nextCycledStatus(current));
  }
}
