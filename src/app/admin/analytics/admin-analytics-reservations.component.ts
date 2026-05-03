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
  Tooltip,
} from 'chart.js';
import { AdminAnalyticsService } from '../services/admin-analytics.service';
import type { ReservationsAnalyticsDto } from '../models/admin-analytics.model';

Chart.register(BarElement, CategoryScale, BarController, Legend, LinearScale, Tooltip);

@Component({
  selector: 'app-admin-analytics-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-analytics-reservations.component.html',
  styleUrl: './admin-analytics-reservations.component.css',
})
export class AdminAnalyticsReservationsComponent implements OnInit, OnDestroy {
  private readonly analytics = inject(AdminAnalyticsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);

  @ViewChild('cDay') cDay?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cHour') cHour?: ElementRef<HTMLCanvasElement>;

  loading = true;
  data: ReservationsAnalyticsDto | null = null;
  dateFrom = '';
  dateTo = '';
  search = '';
  estado = '';
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
      .reservations(this.dateFrom, this.dateTo, this.page, this.pageSize, this.search, this.estado)
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
    if (this.data && this.page + 1 < this.data.reservations.totalPages) {
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

    const bar = (canvas: HTMLCanvasElement | undefined, rows: { label: string; value: number }[], vertical: boolean) => {
      if (!canvas || !rows.length) {
        return;
      }
      this.charts.push(
        new Chart(canvas, {
          type: 'bar',
          data: {
            labels: rows.map((r) => r.label.slice(0, 16)),
            datasets: [{ data: rows.map((r) => r.value), backgroundColor: '#0d6efd', borderRadius: 6 }],
          },
          options: {
            indexAxis: vertical ? 'x' : 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: vertical
              ? {
                  x: { ticks: { color: text, maxRotation: 60 }, grid: { color: grid } },
                  y: { beginAtZero: true, ticks: { color: text }, grid: { display: false } },
                }
              : {
                  x: { beginAtZero: true, ticks: { color: text }, grid: { color: grid } },
                  y: { ticks: { color: text }, grid: { display: false } },
                },
          },
        }),
      );
    };

    bar(this.cDay?.nativeElement, d.reservationsByDay, true);
    bar(this.cHour?.nativeElement, d.reservationsByHourSlot, false);
  }
}
