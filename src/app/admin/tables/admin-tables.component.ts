import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { TableService, TableOperationalStatus } from '../services/table.service';
import { NotificationService } from '../services/notification.service';
import { AdminTable } from '../models/admin-table.model';
import { AdminTableMapComponent } from './table-map/table-map.component';

const ESTADOS_MESA = ['Disponible', 'Reservada', 'Ocupada'] as const;

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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  tables: AdminTable[] = [];
  loading = true;
  editingId: string | null = null;
  private sub = new Subscription();

  readonly estadosMesa = ESTADOS_MESA;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    estado: ['Disponible' as string, Validators.required],
    localidad: ['', [Validators.required, Validators.maxLength(120)]],
    precioReserva: [0, [Validators.required, Validators.min(0)]],
    capacidad: [4, [Validators.required, Validators.min(1)]],
    imagen: ['', [Validators.required, Validators.maxLength(2000)]],
    visibleToClient: [true],
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
          this.applyEditQueryParam();
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
      nombre: '',
      estado: 'Disponible',
      localidad: '',
      precioReserva: 0,
      capacidad: 4,
      imagen: '',
      visibleToClient: true,
    });
  }

  startEdit(row: AdminTable): void {
    this.editingId = row.id;
    this.form.patchValue({
      nombre: row.nombre,
      estado: ESTADOS_MESA.includes(row.estado as (typeof ESTADOS_MESA)[number])
        ? row.estado
        : 'Disponible',
      localidad: row.localidad,
      precioReserva: row.precioReserva,
      capacidad: row.capacidad,
      imagen: row.imagen,
      visibleToClient: row.visibleToClient,
    });
  }

  /** Desde la tienda pública: `/admin/tables?edit=<id>` abre el formulario con esa mesa. */
  private applyEditQueryParam(): void {
    const editId = this.route.snapshot.queryParamMap.get('edit');
    if (!editId) {
      return;
    }
    const row = this.tables.find((t) => t.id === editId);
    if (row) {
      this.startEdit(row);
    } else {
      this.notify.warning('No se encontró la mesa indicada.');
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
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
    const payload = {
      nombre: v.nombre,
      estado: v.estado,
      localidad: v.localidad,
      precioReserva: v.precioReserva,
      capacidad: v.capacidad,
      imagen: v.imagen,
      visibleToClient: v.visibleToClient,
    };
    if (this.editingId) {
      this.sub.add(
        this.tableService.update(this.editingId, payload).subscribe({
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
        this.tableService.create(payload).subscribe({
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
    if (!t.visibleToClient) {
      return;
    }
    this.sub.add(
      this.tableService.cycleOperationalStatus(t.id, t).subscribe({
        next: () => {
          this.notify.info('Estado operativo actualizado');
          this.refresh();
        },
        error: (e) => this.notify.error(e.message ?? 'Error'),
      }),
    );
  }

  toggleVisibleToClient(row: AdminTable): void {
    this.sub.add(
      this.tableService
        .update(row.id, {
          nombre: row.nombre,
          estado: row.estado,
          localidad: row.localidad,
          precioReserva: row.precioReserva,
          capacidad: row.capacidad,
          imagen: row.imagen,
          visibleToClient: !row.visibleToClient,
        })
        .subscribe({
          next: () => {
            this.notify.success(
              row.visibleToClient ? 'Mesa oculta del catálogo público' : 'Mesa visible en el catálogo',
            );
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
