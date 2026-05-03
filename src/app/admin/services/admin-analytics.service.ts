import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MensajeDTO } from '../../dto/mensaje-dto';
import { assertOkReply } from '../utils/admin-api.util';
import type {
  DashboardOverviewDto,
  ProductPerformanceDto,
  ReservationsAnalyticsDto,
  SalesAnalyticsDto,
  TablePerformanceDto,
} from '../models/admin-analytics.model';

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.adminServiceUrl + '/analytics';

  dashboard(
    from: string,
    to: string,
    comparePrevious: boolean,
  ): Observable<DashboardOverviewDto> {
    const params = new HttpParams()
      .set('from', from)
      .set('to', to)
      .set('comparePrevious', String(comparePrevious));
    return this.http
      .get<MensajeDTO>(`${this.base}/dashboard`, { params })
      .pipe(map((m) => assertOkReply<DashboardOverviewDto>(m)));
  }

  sales(
    from: string,
    to: string,
    page: number,
    size: number,
    q: string,
    paymentStatus: string,
  ): Observable<SalesAnalyticsDto> {
    let params = new HttpParams()
      .set('from', from)
      .set('to', to)
      .set('page', String(page))
      .set('size', String(size))
      .set('paymentStatus', paymentStatus);
    if (q.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http
      .get<MensajeDTO>(`${this.base}/sales`, { params })
      .pipe(map((m) => assertOkReply<SalesAnalyticsDto>(m)));
  }

  reservations(
    from: string,
    to: string,
    page: number,
    size: number,
    q: string,
    estado: string,
  ): Observable<ReservationsAnalyticsDto> {
    let params = new HttpParams()
      .set('from', from)
      .set('to', to)
      .set('page', String(page))
      .set('size', String(size));
    if (q.trim()) {
      params = params.set('q', q.trim());
    }
    if (estado.trim()) {
      params = params.set('estado', estado.trim());
    }
    return this.http
      .get<MensajeDTO>(`${this.base}/reservations`, { params })
      .pipe(map((m) => assertOkReply<ReservationsAnalyticsDto>(m)));
  }

  productPerformance(from: string, to: string): Observable<ProductPerformanceDto[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http
      .get<MensajeDTO>(`${this.base}/product-performance`, { params })
      .pipe(map((m) => assertOkReply<ProductPerformanceDto[]>(m)));
  }

  tablePerformance(from: string, to: string): Observable<TablePerformanceDto[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http
      .get<MensajeDTO>(`${this.base}/table-performance`, { params })
      .pipe(map((m) => assertOkReply<TablePerformanceDto[]>(m)));
  }
}
