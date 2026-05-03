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
import { ActivatedRoute } from '@angular/router';
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
import type { SalesAnalyticsDto } from '../models/admin-analytics.model';

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
  selector: 'app-admin-analytics-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-analytics-sales.component.html',
  styleUrl: './admin-analytics-sales.component.css',
})
export class AdminAnalyticsSalesComponent implements OnInit, OnDestroy {
  private readonly analytics = inject(AdminAnalyticsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);

  @ViewChild('cLine') cLine?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cCat') cCat?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cPay') cPay?: ElementRef<HTMLCanvasElement>;

  loading = true;
  data: SalesAnalyticsDto | null = null;
  dateFrom = '';
  dateTo = '';
  search = '';
  paymentStatus: 'ALL' | 'PAID' | 'PENDING' = 'ALL';
  page = 0;
  pageSize = 15;

  private charts: Chart[] = [];

  ngOnInit(): void {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    this.dateTo = to.toISOString().slice(0, 10);
    this.dateFrom = from.toISOString().slice(0, 10);
    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.search = id;
    }
    this.load();
  }

  ngOnDestroy(): void {
    this.charts.forEach((c) => c.destroy());
  }

  load(): void {
    this.loading = true;
    this.analytics
      .sales(this.dateFrom, this.dateTo, this.page, this.pageSize, this.search, this.paymentStatus)
      .subscribe({
        next: (d) => {
          this.data = d;
          this.loading = false;
          this.cdr.detectChanges();
          requestAnimationFrame(() => this.buildCharts());
        },
        error: () => {
          this.loading = false;
          this.data = null;
        },
      });
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.load();
    }
  }

  nextPage(): void {
    if (this.data && this.page + 1 < this.data.orders.totalPages) {
      this.page++;
      this.load();
    }
  }

  private buildCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
    if (!this.data) {
      return;
    }
    const text = '#495057';
    const grid = 'rgba(0,0,0,0.06)';
    const d = this.data;

    const line = this.cLine?.nativeElement;
    if (line) {
      const labels = d.salesByDayCurrent.map((p) => p.date.slice(5, 10));
      this.charts.push(
        new Chart(line, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Actual',
                data: d.salesByDayCurrent.map((p) => p.amount),
                borderColor: '#198754',
                tension: 0.25,
                fill: false,
              },
              {
                label: 'Periodo anterior',
                data: d.salesByDayPrevious.map((p) => p.amount),
                borderColor: '#6c757d',
                tension: 0.25,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: text } } },
            scales: {
              x: { ticks: { color: text }, grid: { color: grid } },
              y: { beginAtZero: true, ticks: { color: text }, grid: { color: grid } },
            },
          },
        }),
      );
    }

    this.hBar(this.cCat?.nativeElement, d.salesByCategory, 'Por categoría ($)', text, grid);
    this.hBar(this.cPay?.nativeElement, d.salesByPaymentMethod, 'Por método ($)', text, grid);
  }

  private hBar(
    canvas: HTMLCanvasElement | undefined,
    rows: { label: string; value: number }[],
    title: string,
    text: string,
    grid: string,
  ): void {
    if (!canvas || !rows.length) {
      return;
    }
    this.charts.push(
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: rows.map((r) => r.label.slice(0, 24)),
          datasets: [{ label: title, data: rows.map((r) => r.value), backgroundColor: '#2b6a4f', borderRadius: 6 }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { color: text }, grid: { color: grid } },
            y: { ticks: { color: text }, grid: { display: false } },
          },
        },
      }),
    );
  }
}
