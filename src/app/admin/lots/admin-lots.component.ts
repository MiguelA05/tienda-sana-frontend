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
    return this.suppliers.find((s) => s.id === id)?.name ?? id;
  }


  startCreate(): void {
    this.editingId = null;
    this.form.reset({
      productId: '',
      supplierId: '',
      entryDate: new Date().toISOString().slice(0, 10),
      quantity: 1,
      unitValue: 0,
    });
  }

  startEdit(row: ProductLot): void {
    this.editingId = row.id;
    this.form.patchValue({
      productId: row.productId,
      supplierId: row.supplierId,
      entryDate: row.entryDate,
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
