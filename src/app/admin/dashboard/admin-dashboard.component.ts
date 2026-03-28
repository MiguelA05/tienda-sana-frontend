import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SupplierService } from '../services/supplier.service';
import { ProductService } from '../services/product.service';
import { LotService } from '../services/lot.service';
import { TableService } from '../services/table.service';
import { AdminTable } from '../models/admin-table.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  supplierCount = 0;
  activeSuppliers = 0;
  productCount = 0;
  outOfStockCount = 0;
  lotCount = 0;
  tableCount = 0;
  occupiedOrReserved = 0;

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
        this.supplierCount = s.length;
        this.activeSuppliers = s.filter((x) => x.status === 'ACTIVE').length;
        this.productCount = p.length;
        this.outOfStockCount = p.filter((x) => x.outOfStock).length;
        this.lotCount = l.length;
        this.tableCount = t.length;
        this.occupiedOrReserved = t.filter((tab) => this.busy(tab)).length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private busy(t: AdminTable): boolean {
    if (!t.active) {
      return false;
    }
    return t.status === 'OCCUPIED' || t.status === 'RESERVED';
  }
}
