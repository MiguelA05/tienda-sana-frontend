import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { SupplierService } from '../services/supplier.service';
import { ProductService } from '../services/product.service';
import { LotService } from '../services/lot.service';
import { TableService } from '../services/table.service';
import { AdminTable } from '../models/admin-table.model';
import { effectiveTableStatus } from '../services/table.service';
import { Product } from '../models/product.model';
import { Supplier } from '../models/supplier.model';

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  DoughnutController,
  BarController,
  Legend,
  LinearScale,
  Tooltip,
);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('chartInventory') chartInventory?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartTables') chartTables?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCategories') chartCategories?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartSuppliers') chartSuppliers?: ElementRef<HTMLCanvasElement>;

  loading = true;
  supplierCount = 0;
  activeSuppliers = 0;
  productCount = 0;
  outOfStockCount = 0;
  lotCount = 0;
  tableCount = 0;
  occupiedOrReserved = 0;

  private chartInstances: Chart[] = [];
  private productsList: Product[] = [];
  private tablesList: AdminTable[] = [];
  private suppliersList: Supplier[] = [];

  constructor(
    private readonly suppliers: SupplierService,
    private readonly products: ProductService,
    private readonly lots: LotService,
    private readonly tables: TableService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      s: this.suppliers.getAll(),
      p: this.products.getAll(),
      l: this.lots.getAll(),
      t: this.tables.getAll(),
    }).subscribe({
      next: ({ s, p, l, t }) => {
        this.suppliersList = s;
        this.productsList = p;
        this.tablesList = t;
        this.supplierCount = s.length;
        this.activeSuppliers = s.filter((x) => x.status === 'ACTIVE').length;
        this.productCount = p.length;
        this.outOfStockCount = p.filter((x) => x.outOfStock).length;
        this.lotCount = l.length;
        this.tableCount = t.length;
        this.occupiedOrReserved = t.filter((tab) => this.busy(tab)).length;
        this.loading = false;
        setTimeout(() => this.buildCharts(), 0);
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private busy(t: AdminTable): boolean {
    if (!t.visibleToClient) {
      return false;
    }
    const e = effectiveTableStatus(t);
    return e === 'OCCUPIED' || e === 'RESERVED';
  }

  private destroyCharts(): void {
    for (const c of this.chartInstances) {
      c.destroy();
    }
    this.chartInstances = [];
  }

  private buildCharts(): void {
    this.destroyCharts();
    if (this.loading) {
      return;
    }

    const text = '#495057';
    const grid = 'rgba(0,0,0,0.06)';

    const invCanvas = this.chartInventory?.nativeElement;
    if (invCanvas) {
      const inStock = Math.max(0, this.productCount - this.outOfStockCount);
      const out = this.outOfStockCount;
      const c = new Chart(invCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Con stock', 'Agotados'],
          datasets: [
            {
              data: [inStock, out],
              backgroundColor: ['#198754', '#dc3545'],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: text, usePointStyle: true, padding: 16 },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const v = ctx.raw as number;
                  const sum = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                  const pct = sum ? Math.round((v / sum) * 100) : 0;
                  return ` ${ctx.label}: ${v} (${pct}%)`;
                },
              },
            },
          },
        },
      });
      this.chartInstances.push(c);
    }

    const tblCanvas = this.chartTables?.nativeElement;
    if (tblCanvas) {
      const seg = this.tableSegments(this.tablesList);
      const c = new Chart(tblCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Disponibles', 'Reservadas', 'Ocupadas', 'Ocultas al público'],
          datasets: [
            {
              data: [
                seg.disponibles,
                seg.reservadas,
                seg.ocupadas,
                seg.inactivas,
              ],
              backgroundColor: ['#198754', '#0dcaf0', '#ffc107', '#adb5bd'],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: text, usePointStyle: true, padding: 12 },
            },
          },
        },
      });
      this.chartInstances.push(c);
    }

    const catCanvas = this.chartCategories?.nativeElement;
    if (catCanvas) {
      const { labels, values } = this.productsByCategory(this.productsList);
      const c = new Chart(catCanvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Productos',
              data: values,
              backgroundColor: 'rgba(25, 135, 84, 0.75)',
              borderColor: '#198754',
              borderWidth: 1,
              borderRadius: 6,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: text },
              grid: { color: grid },
            },
            y: {
              ticks: { color: text },
              grid: { display: false },
            },
          },
        },
      });
      this.chartInstances.push(c);
    }

    const supCanvas = this.chartSuppliers?.nativeElement;
    if (supCanvas) {
      const inactive = Math.max(0, this.supplierCount - this.activeSuppliers);
      const c = new Chart(supCanvas, {
        type: 'bar',
        data: {
          labels: ['Activos', 'Inactivos'],
          datasets: [
            {
              label: 'Proveedores',
              data: [this.activeSuppliers, inactive],
              backgroundColor: ['#2b6a4f', '#dee2e6'],
              borderColor: ['#1f6a4b', '#adb5bd'],
              borderWidth: 1,
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: text },
              grid: { color: grid },
            },
            x: {
              ticks: { color: text },
              grid: { display: false },
            },
          },
        },
      });
      this.chartInstances.push(c);
    }
  }

  private tableSegments(tables: AdminTable[]): {
    disponibles: number;
    reservadas: number;
    ocupadas: number;
    inactivas: number;
  } {
    let disponibles = 0;
    let reservadas = 0;
    let ocupadas = 0;
    let inactivas = 0;
    for (const t of tables) {
      if (!t.visibleToClient) {
        inactivas++;
        continue;
      }
      const e = effectiveTableStatus(t);
      if (e === 'AVAILABLE') {
        disponibles++;
      } else if (e === 'RESERVED') {
        reservadas++;
      } else if (e === 'OCCUPIED') {
        ocupadas++;
      }
    }
    return { disponibles, reservadas, ocupadas, inactivas };
  }

  private productsByCategory(products: Product[]): {
    labels: string[];
    values: number[];
  } {
    const map = new Map<string, number>();
    for (const p of products) {
      const key = (p.category || 'Sin categoría').trim() || 'Sin categoría';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const pairs = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (pairs.length === 0) {
      return { labels: ['Sin datos'], values: [0] };
    }
    return {
      labels: pairs.map(([k]) => k),
      values: pairs.map(([, v]) => v),
    };
  }
}
