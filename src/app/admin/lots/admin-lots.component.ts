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

  readonly adjustForm = this.fb.nonNullable.group({
    productId: ['', Validators.required],
    direction: ['IN' as 'IN' | 'OUT', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    reason: ['', [Validators.required, Validators.minLength(3)]],
    targetLotId: [''],
  });

  ngOnInit(): void {
    this.refresh();
    this.sub.add(
      this.adjustForm.get('direction')!.valueChanges.subscribe(() => {
        this.adjustForm.patchValue({ targetLotId: '' }, { emitEvent: false });
      }),
    );
    this.sub.add(
      this.adjustForm.get('productId')!.valueChanges.subscribe(() => {
        this.adjustForm.patchValue({ targetLotId: '' }, { emitEvent: false });
      }),
    );
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
    if (id === '__ADJUSTMENT__') {
      return 'Ajuste manual';
    }
    return this.suppliers.find((s) => s.id === id)?.name ?? id;
  }

  isOpeningStock(row: ProductLot): boolean {
    return row.supplierId === '__OPENING_STOCK__';
  }

  /** Stock total del producto seleccionado en el formulario de ajuste (desde GET /inventory). */
  adjustSelectedStockTotal(): number {
    const pid = this.adjustForm.getRawValue().productId;
    if (!pid) return 0;
    return this.inventory.find((l) => l.productId === pid)?.totalQuantity ?? 0;
  }

  /** Lotes del producto elegido para acotar salida a un lote o sumar entrada a un lote existente. */
  adjustLotsForProduct(): ProductLot[] {
    const pid = this.adjustForm.getRawValue().productId;
    if (!pid) return [];
    return this.lots.filter((l) => l.productId === pid && !l.voided);
  }

  adjustLotsForOutPick(): ProductLot[] {
    return this.adjustLotsForProduct().filter((l) => l.quantityRemaining > 0);
  }

  adjustLotSelectOptions(): ProductLot[] {
    return this.adjustForm.getRawValue().direction === 'OUT'
      ? this.adjustLotsForOutPick()
      : this.adjustLotsForProduct();
  }

  canEditOrDelete(row: ProductLot): boolean {
    return !this.isOpeningStock(row) && row.status === 'ACTIVO' && !row.voided;
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
    if (!this.canEditOrDelete(row)) {
      this.notify.warning('Este lote no admite edición (consumido, anulado o inventario inicial).');
      return;
    }
    this.editingId = row.id;
    this.form.patchValue({
      productId: row.productId,
      supplierId: row.supplierId,
      entryDate: this.toDateTimeLocal(row.entryDate),
      quantity: row.initialQuantity,
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
    if (!this.canEditOrDelete(row)) {
      this.notify.warning('No se puede eliminar este lote.');
      return;
    }
    const msg =
      row.quantityConsumed > 0
        ? 'Este lote ya ha sido utilizado. ¿Desea anularlo? Se registrará un ajuste compensatorio por el stock restante del lote.'
        : '¿Eliminar este lote? Se compensará el ingreso en el historial de inventario.';
    if (!confirm(msg)) {
      return;
    }
    this.sub.add(
      this.lotService.delete(row.id).subscribe({
        next: (r) => {
          if (r.code === 'DELETED') {
            this.notify.success(r.message);
          } else if (r.code === 'VOIDED_WITH_ADJUSTMENT' || r.code === 'VOIDED_CONSUMED_LOT') {
            this.notify.success(r.message);
          } else {
            this.notify.info(r.message);
          }
          this.refresh();
        },
        error: (e) => this.notify.error(e.message ?? 'Error'),
      }),
    );
  }

  submitAdjust(): void {
    if (this.adjustForm.invalid) {
      this.adjustForm.markAllAsTouched();
      this.notify.warning('Revise el formulario de ajuste');
      return;
    }
    const v = this.adjustForm.getRawValue();
    const reason = v.reason.trim();
    if (reason.length < 3) {
      this.notify.warning('El motivo debe tener al menos 3 caracteres');
      return;
    }

    const stockTotal = this.adjustSelectedStockTotal();
    if (v.direction === 'OUT') {
      if (v.quantity > stockTotal) {
        this.notify.error(
          `No hay suficiente stock: hay ${stockTotal} unidades disponibles para este producto.`,
        );
        return;
      }
      const tid = v.targetLotId?.trim();
      if (tid) {
        const lot = this.lots.find((l) => l.id === tid);
        if (!lot) {
          this.notify.error('Lote no encontrado en la lista actual');
          return;
        }
        if (v.quantity > lot.quantityRemaining) {
          this.notify.error(
            `En el lote seleccionado solo hay ${lot.quantityRemaining} unidades disponibles.`,
          );
          return;
        }
      }
    }

    const tid = v.targetLotId?.trim();
    this.sub.add(
      this.lotService
        .adjustInventory({
          productId: v.productId,
          direction: v.direction,
          quantity: v.quantity,
          reason,
          targetLotId: tid && tid.length > 0 ? tid : null,
        })
        .subscribe({
          next: () => {
            this.notify.success('Ajuste de inventario registrado');
            this.adjustForm.patchValue({ reason: '', quantity: 1, targetLotId: '' });
            this.refresh();
          },
          error: (e) => this.notify.error(e.message ?? 'Error'),
        }),
    );
  }
}
