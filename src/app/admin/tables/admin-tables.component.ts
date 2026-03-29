import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { TableService } from '../services/table.service';
import { NotificationService } from '../services/notification.service';
import { AdminTable, TableOperationalStatus } from '../models/admin-table.model';
import { AdminTableMapComponent } from './table-map/table-map.component';

@Component({
  selector: 'app-admin-tables',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminTableMapComponent],
  templateUrl: './admin-tables.component.html',
  styleUrls: ['../styles/admin-form-layout.css', './admin-tables.component.css'],
})
export class AdminTablesComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly tableService = inject(TableService);
  private readonly notify = inject(NotificationService);

  tables: AdminTable[] = [];
  loading = true;
  editingId: string | null = null;
  private sub = new Subscription();

  readonly form = this.fb.nonNullable.group({
    capacity: [4, [Validators.required, Validators.min(1)]],
    location: ['Interior', [Validators.required, Validators.maxLength(120)]],
    active: [true],
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
      this.tableService.getAll().subscribe({
        next: (rows) => {
          this.tables = rows;
          this.loading = false;
        },
        error: () => {
          this.notify.error('No se pudieron cargar las mesas');
          this.loading = false;
        },
      }),
    );
  }

  startCreate(): void {
    this.editingId = null;
    this.form.reset({
      capacity: 4,
      location: 'Interior',
      active: true,
    });
  }

  startEdit(row: AdminTable): void {
    this.editingId = row.id;
    this.form.patchValue({
      capacity: row.capacity,
      location: row.location,
      active: row.active,
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
        this.tableService
          .update(this.editingId, {
            capacity: v.capacity,
            location: v.location,
            active: v.active,
          })
          .subscribe({
            next: () => {
              this.notify.success('Mesa actualizada');
              this.cancelEdit();
              this.refresh();
            },
            error: (e) => this.notify.error(e.message ?? 'Error'),
          }),
      );
    } else {
      this.sub.add(
        this.tableService
          .create({
            capacity: v.capacity,
            location: v.location,
            active: v.active,
          })
          .subscribe({
            next: () => {
              this.notify.success('Mesa creada');
              this.cancelEdit();
              this.refresh();
            },
            error: (e) => this.notify.error(e.message ?? 'Error'),
          }),
      );
    }
  }

  onWalkInCycle(t: AdminTable): void {
    if (!t.active) {
      return;
    }
    this.sub.add(
      this.tableService.cycleOperationalStatus(t.id, t.status).subscribe({
        next: () => {
          this.notify.info('Estado operativo actualizado');
          this.refresh();
        },
        error: (e) => this.notify.error(e.message ?? 'Error'),
      }),
    );
  }

  toggleActive(row: AdminTable): void {
    this.sub.add(
      this.tableService
        .update(row.id, {
          capacity: row.capacity,
          location: row.location,
          active: !row.active,
        })
        .subscribe({
          next: () => {
            this.notify.success(row.active ? 'Mesa deshabilitada' : 'Mesa habilitada');
            this.refresh();
          },
          error: (e) => this.notify.error(e.message ?? 'Error'),
        }),
    );
  }

  setReservationState(row: AdminTable, state: TableOperationalStatus): void {
    this.sub.add(
      this.tableService.patchStatus(row.id, state).subscribe({
        next: () => {
          this.notify.info('Estado de mesa actualizado');
          this.refresh();
        },
        error: (e) => this.notify.error(e.message ?? 'Error'),
      }),
    );
  }
}
