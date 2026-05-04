import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import { LotService } from '../services/lot.service';
import { ProductService } from '../services/product.service';
import { SupplierService } from '../services/supplier.service';
import { NotificationService } from '../services/notification.service';
import { InventoryLine, ProductLot } from '../models/lot.model';
import { Product } from '../models/product.model';
import { Supplier } from '../models/supplier.model';

@Component({
  selector: 'app-admin-lots',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-lots.component.html',
  styleUrls: ['../styles/admin-form-layout.css', './admin-lots.component.css'],
})
export class AdminLotsComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly lotService = inject(LotService);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);
  private readonly notify = inject(NotificationService);

  lots: ProductLot[] = [];
  inventory: InventoryLine[] = [];
  products: Product[] = [];
  /** Todos (para mostrar nombre en tabla). */
  suppliers: Supplier[] = [];
  /** Solo activos para altas de lote. */
  suppliersSelect: Supplier[] = [];
  kpiOutOfStock = 0;
  kpiProducts = 0;
  kpiInventorySkus = 0;
  kpiInventoryUnits = 0;
  kpiLots = 0;
  loading = true;
  editingId: string | null = null;
  private sub = new Subscription();

  readonly form = this.fb.nonNullable.group({
    productId: ['', Validators.required],
    supplierId: ['', Validators.required],
    entryDate: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitValue: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  refresh(): void {
    this.loading = true;
    this.sub.add(
      forkJoin({
        lots: this.lotService.getAll(),
        inv: this.lotService.getInventory(),
        prods: this.productService.getAll(),
        sups: this.supplierService.getAll(),
      }).subscribe({
        next: ({ lots, inv, prods, sups }) => {
          this.lots = lots.sort((a, b) => b.entryDate.localeCompare(a.entryDate));
          this.inventory = inv;
          this.products = prods;
          this.suppliers = sups;
          this.suppliersSelect = sups.filter((s) => s.status === 'ACTIVE');
          this.kpiLots = lots.length;
          this.kpiProducts = prods.length;
          this.kpiOutOfStock = prods.filter((p) => p.outOfStock).length;
          this.kpiInventorySkus = inv.length;
          this.kpiInventoryUnits = inv.reduce((s, l) => s + (l.totalQuantity ?? 0), 0);
          this.loading = false;
        },
        error: () => {
          this.notify.error('No se pudieron cargar los datos de lotes');
          this.loading = false;
        },
      }),
    );
  }

  productName(id: string): string {
    return this.products.find((p) => p.id === id)?.name ?? id;
  }

  supplierName(id: string): string {
    if (id === '__OPENING_STOCK__') {
      return 'Inventario inicial';
    }
    return this.suppliers.find((s) => s.id === id)?.name ?? id;
  }

  isOpeningStock(row: ProductLot): boolean {
    return row.supplierId === '__OPENING_STOCK__';
  }

  private nowLocalDateTime(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  private toDateTimeLocal(value: string): string {
    const v = (value ?? '').trim();
    if (!v) return this.nowLocalDateTime();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00`;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return `${v}:00`;
    return v;
  }


  startCreate(): void {
    this.editingId = null;
    this.form.reset({
      productId: '',
      supplierId: '',
      entryDate: this.nowLocalDateTime(),
      quantity: 1,
      unitValue: 0,
    });
  }

  startEdit(row: ProductLot): void {
    this.editingId = row.id;
    this.form.patchValue({
      productId: row.productId,
      supplierId: row.supplierId,
      entryDate: this.toDateTimeLocal(row.entryDate),
      quantity: row.quantity,
      unitValue: row.unitValue,
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.startCreate();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Revise el formulario');
      return;
    }
    const v = this.form.getRawValue();
    if (this.editingId) {
      this.sub.add(
        this.lotService.update(this.editingId, v).subscribe({
          next: () => {
            this.notify.success('Lote actualizado');
            this.cancelEdit();
            this.refresh();
          },
          error: (e) => this.notify.error(e.message ?? 'Error'),
        }),
      );
    } else {
      this.sub.add(
        this.lotService.create(v).subscribe({
          next: () => {
            this.notify.success('Lote registrado');
            this.cancelEdit();
            this.refresh();
          },
          error: (e) => this.notify.error(e.message ?? 'Error'),
        }),
      );
    }
  }

  remove(row: ProductLot): void {
    this.sub.add(
      this.lotService.delete(row.id).subscribe({
        next: () => {
          this.notify.success('Lote eliminado');
          this.refresh();
        },
        error: (e) => this.notify.error(e.message ?? 'Error'),
      }),
    );
  }
}
