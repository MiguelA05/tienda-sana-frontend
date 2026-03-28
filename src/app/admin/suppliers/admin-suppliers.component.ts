import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { SupplierService } from '../services/supplier.service';
import { NotificationService } from '../services/notification.service';
import { Supplier, SupplierStatus } from '../models/supplier.model';

@Component({
  selector: 'app-admin-suppliers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-suppliers.component.html',
  styleUrl: './admin-suppliers.component.css',
})
export class AdminSuppliersComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly supplierService = inject(SupplierService);
  private readonly notify = inject(NotificationService);

  suppliers: Supplier[] = [];
  loading = true;
  editingId: string | null = null;
  private sub = new Subscription();

  readonly form = this.fb.nonNullable.group({
    category: ['', [Validators.required, Validators.maxLength(120)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    suppliedProduct: ['', [Validators.required, Validators.maxLength(200)]],
    contact: ['', [Validators.required, Validators.maxLength(200)]],
    address: ['', [Validators.required, Validators.maxLength(300)]],
    city: ['', [Validators.required, Validators.maxLength(120)]],
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
      this.supplierService.getAll().subscribe({
        next: (rows) => {
          this.suppliers = rows;
          this.loading = false;
        },
        error: () => {
          this.notify.error('No se pudieron cargar los proveedores');
          this.loading = false;
        },
      }),
    );
  }

  startCreate(): void {
    this.editingId = null;
    this.form.reset();
  }

  startEdit(row: Supplier): void {
    this.editingId = row.id;
    this.form.patchValue({
      category: row.category,
      name: row.name,
      suppliedProduct: row.suppliedProduct,
      contact: row.contact,
      address: row.address,
      city: row.city,
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Revise los campos obligatorios');
      return;
    }
    const v = this.form.getRawValue();
    if (this.editingId) {
      this.sub.add(
        this.supplierService.update(this.editingId, v).subscribe({
          next: () => {
            this.notify.success('Proveedor actualizado');
            this.cancelEdit();
            this.refresh();
          },
          error: (e) => this.notify.error(e.message ?? 'Error al actualizar'),
        }),
      );
    } else {
      this.sub.add(
        this.supplierService.create(v).subscribe({
          next: () => {
            this.notify.success('Proveedor creado');
            this.cancelEdit();
            this.refresh();
          },
          error: (e) => this.notify.error(e.message ?? 'Error al crear'),
        }),
      );
    }
  }

  deactivate(row: Supplier): void {
    if (row.status === 'INACTIVE') {
      return;
    }
    this.sub.add(
      this.supplierService.deactivate(row.id).subscribe({
        next: () => {
          this.notify.success('Proveedor desactivado');
          this.refresh();
        },
        error: (e) => this.notify.error(e.message ?? 'Error'),
      }),
    );
  }

  activate(row: Supplier): void {
    if (row.status === 'ACTIVE') {
      return;
    }
    this.sub.add(
      this.supplierService.activate(row.id).subscribe({
        next: () => {
          this.notify.success('Proveedor reactivado');
          this.refresh();
        },
        error: (e) => this.notify.error(e.message ?? 'Error'),
      }),
    );
  }

  labelStatus(s: SupplierStatus): string {
    const m: Record<SupplierStatus, string> = {
      ACTIVE: 'Activo',
      INACTIVE: 'Inactivo',
    };
    return m[s];
  }

  badgeClass(s: SupplierStatus): string {
    return s === 'ACTIVE' ? 'bg-success' : 'bg-secondary';
  }
}
