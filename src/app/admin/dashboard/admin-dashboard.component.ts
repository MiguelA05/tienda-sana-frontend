import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { AdminAnalyticsService } from '../services/admin-analytics.service';
import { errorMessage } from '../utils/admin-api.util';
import type { ActivityRowDto, DashboardOverviewDto, LabelValueDto, ProductRankDto } from '../models/admin-analytics.model';

Chart.register(
  BarElement,
  CategoryScale,
  BarController,
  Legend,
  LinearScale,
  Tooltip,
  LineController,
  LineElement,
  PointElement,
);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly analytics = inject(AdminAnalyticsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  @ViewChild('chartSalesLine') chartSalesLine?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartSalesWeekday') chartSalesWeekday?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartSalesHour') chartSalesHour?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartTopProducts') chartTopProducts?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartBottomProducts') chartBottomProducts?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartResDay') chartResDay?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartResHour') chartResHour?: ElementRef<HTMLCanvasElement>;

  loading = true;
  refreshing = false;
  data: DashboardOverviewDto | null = null;
  errorMessage: string | null = null;
  dateFrom = '';
  dateTo = '';
  comparePrevious = true;

  private charts: Chart[] = [];

  ngOnInit(): void {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    this.dateTo = this.toIso(to);
    this.dateFrom = this.toIso(from);
    this.load();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private toIso(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  load(): void {
    // validate date range
    this.errorMessage = null;
    const f = new Date(this.dateFrom);
    const t = new Date(this.dateTo);
    if (!this.dateFrom || !this.dateTo || isNaN(f.getTime()) || isNaN(t.getTime())) {
      this.errorMessage = 'Rango de fechas inválido.';
      this.data = null;
      this.loading = false;
      this.refreshing = false;
      return;
    }
    if (f.getTime() > t.getTime()) {
      this.errorMessage = 'La fecha "Desde" no puede ser posterior a la fecha "Hasta".';
      this.data = null;
      this.loading = false;
      this.refreshing = false;
      return;
    }

    if (this.loading && !this.data) {
      this.loading = true;
    } else {
      this.refreshing = true;
    }

    // El backend responde correctamente en modo comparativo; cuando el usuario desactiva
    // la comparación, ocultamos la parte comparativa en el UI pero seguimos cargando
    // el dashboard por la ruta estable.
    this.analytics.dashboard(this.dateFrom, this.dateTo, true).subscribe({
      next: (d) => {
        // If backend returns an empty dataset (no transactions) show a friendly message
        const totalAmount = (d.salesByDayCurrent ?? []).reduce((s, p) => s + (p?.amount ?? 0), 0);
        const hasActivity = (d.recentActivity ?? []).length > 0;
        if (totalAmount === 0 && !hasActivity) {
          this.errorMessage = 'No hay transacciones en el periodo seleccionado.';
          this.data = null;
          this.loading = false;
          this.refreshing = false;
          return;
        }

        this.data = d;
        this.loading = false;
        this.refreshing = false;
        this.cdr.detectChanges();
        requestAnimationFrame(() => this.buildCharts());
      },
      error: (err) => {
        this.loading = false;
        this.refreshing = false;
        this.data = null;
        this.errorMessage = errorMessage(err, 'No se pudo cargar el dashboard.');
      },
    });
  }

  trendText(k: { trendPercent: number | null }): string | null {
    if (!this.comparePrevious) {
      return null;
    }
    if (k.trendPercent == null || Number.isNaN(k.trendPercent)) {
      return null;
    }
    const v = k.trendPercent;
    const arrow = v >= 0 ? '▲' : '▼';
    return `${arrow} ${Math.abs(v).toFixed(1)} %`;
  }

  onActivityClick(row: ActivityRowDto): void {
    void this.router.navigateByUrl('/admin/' + row.drillRoute);
  }

  onChartClickSalesLine(): void {
    this.router.navigate(['/admin/analytics/sales'], {
      queryParams: { from: this.dateFrom, to: this.dateTo },
    });
  }

  private destroyCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }

  private buildCharts(): void {
    this.destroyCharts();
    if (!this.data) {
      return;
    }
    const text = '#495057';
    const grid = 'rgba(0,0,0,0.06)';
    const d = this.data;
    const showPrevious = this.comparePrevious;

    const lineEl = this.chartSalesLine?.nativeElement;
    if (lineEl) {
      const labels = d.salesByDayCurrent.map((p) => this.shortDate(p.date));
      const cur = d.salesByDayCurrent.map((p) => p.amount);
      const prev = showPrevious && d.salesByDayPrevious.length
        ? d.salesByDayPrevious.map((p) => p.amount)
        : [];
      const c = new Chart(lineEl, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Periodo actual',
              data: cur,
              borderColor: '#198754',
              backgroundColor: 'rgba(25,135,84,0.12)',
              tension: 0.25,
              fill: true,
            },
            ...(prev.length
              ? [
                  {
                    label: 'Periodo anterior',
                    data: prev,
                    borderColor: '#6c757d',
                    backgroundColor: 'transparent',
                    tension: 0.25,
                    fill: false,
                  },
                ]
              : []),
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: () => this.onChartClickSalesLine(),
          plugins: {
            legend: { labels: { color: text } },
            tooltip: { mode: 'index', intersect: false },
          },
          scales: {
            x: { ticks: { color: text, maxRotation: 45 }, grid: { color: grid } },
            y: { ticks: { color: text }, grid: { color: grid }, beginAtZero: true },
          },
        },
      });
      this.charts.push(c);
    }

    this.barH(this.chartSalesWeekday?.nativeElement, d.salesByWeekday, 'Ventas ($)', text, grid);
    this.barH(this.chartSalesHour?.nativeElement, d.salesByHourSlot, 'Ventas ($)', text, grid);
    this.hBarProducts(this.chartTopProducts?.nativeElement, d.topProducts, true, text, grid);
    this.hBarProducts(this.chartBottomProducts?.nativeElement, d.bottomProducts, false, text, grid);
    this.barH(
      this.chartResDay?.nativeElement,
      d.reservationsByDay,
      'Reservas (nº)',
      text,
      grid,
      true,
    );
    this.barH(this.chartResHour?.nativeElement, d.reservationsByHourSlot, 'Reservas (nº)', text, grid);
  }

  private shortDate(iso: string): string {
    return iso.length >= 10 ? iso.slice(5, 10) : iso;
  }

  private barH(
    canvas: HTMLCanvasElement | undefined,
    rows: LabelValueDto[],
    label: string,
    text: string,
    grid: string,
    verticalLabels = false,
  ): void {
    if (!canvas || !rows.length) {
      return;
    }
    const c = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: rows.map((r) => r.label),
        datasets: [{ label, data: rows.map((r) => r.value), backgroundColor: '#2b6a4f', borderRadius: 6 }],
      },
      options: {
        indexAxis: verticalLabels ? 'x' : 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
        scales: verticalLabels
          ? {
              x: { ticks: { color: text, maxRotation: 60 }, grid: { color: grid } },
              y: { beginAtZero: true, ticks: { color: text }, grid: { display: false } },
            }
          : {
              x: { beginAtZero: true, ticks: { color: text }, grid: { color: grid } },
              y: { ticks: { color: text }, grid: { display: false } },
            },
      },
    });
    this.charts.push(c);
  }

  private hBarProducts(
    canvas: HTMLCanvasElement | undefined,
    rows: ProductRankDto[],
    _top: boolean,
    text: string,
    grid: string,
  ): void {
    if (!canvas || !rows.length) {
      return;
    }
    const c = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: rows.map((r) => r.name.slice(0, 28) + (r.name.length > 28 ? '…' : '')),
        datasets: [
          {
            label: 'Unidades',
            data: rows.map((r) => r.unitsSold),
            backgroundColor: '#198754',
            borderRadius: 6,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1, color: text }, grid: { color: grid } },
          y: { ticks: { color: text }, grid: { display: false } },
        },
      },
    });
    this.charts.push(c);
  }
}
