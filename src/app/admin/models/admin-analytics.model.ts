export interface KpiDto {
  id: string;
  label: string;
  value: string;
  trendPercent: number | null;
  hint: string | null;
}

export interface SeriesPointDto {
  date: string;
  amount: number;
}

export interface LabelValueDto {
  label: string;
  value: number;
}

export interface ProductRankDto {
  productId: string;
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface ActivityRowDto {
  id: string;
  fecha: string;
  total: number;
  tipo: string;
  estado: string;
  drillRoute: string;
}

export interface DashboardOverviewDto {
  from: string;
  to: string;
  kpis: KpiDto[];
  salesByDayCurrent: SeriesPointDto[];
  salesByDayPrevious: SeriesPointDto[];
  salesByWeekday: LabelValueDto[];
  salesByHourSlot: LabelValueDto[];
  topProducts: ProductRankDto[];
  bottomProducts: ProductRankDto[];
  reservationsByDay: LabelValueDto[];
  reservationsByHourSlot: LabelValueDto[];
  recentActivity: ActivityRowDto[];
}

export interface SalesOrderRowDto {
  id: string;
  fecha: string;
  total: number;
  emailCliente: string | null;
  paymentType: string | null;
  estadoPago: string | null;
  paid: boolean;
}

export interface PagedTableDto<T> {
  rows: T[];
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface SalesAnalyticsDto {
  from: string;
  to: string;
  kpis: KpiDto[];
  salesByDayCurrent: SeriesPointDto[];
  salesByDayPrevious: SeriesPointDto[];
  salesByCategory: LabelValueDto[];
  salesByProduct: ProductRankDto[];
  salesByPaymentMethod: LabelValueDto[];
  orders: PagedTableDto<SalesOrderRowDto>;
}

export interface ReservationRowDto {
  id: string;
  fechaCreacion: string | null;
  fechaReserva: string | null;
  total: number;
  usuarioId: string | null;
  estadoReserva: string | null;
  paid: boolean;
}

export interface ReservationsAnalyticsDto {
  from: string;
  to: string;
  kpis: KpiDto[];
  reservationsByDay: LabelValueDto[];
  reservationsByHourSlot: LabelValueDto[];
  avgOccupationHours: number | null;
  tableRotation: number | null;
  reservations: PagedTableDto<ReservationRowDto>;
}

export interface ProductPerformanceDto {
  productId: string;
  unitsSold: number;
  popularity: string;
}

export interface TablePerformanceDto {
  tableId: string;
  tableName: string;
  reservationsInPeriod: number;
  occupancyRatePercent: number;
}
