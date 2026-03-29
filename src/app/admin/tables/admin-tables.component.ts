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
import { CloudinaryUploadService } from '../services/cloudinary-upload.service';

const ESTADOS_MESA = ['Disponible', 'Reservada', 'Ocupada'] as const;
const LOCALIDADES_MESA = ['Pasillo', 'Centro', 'Patio', 'Salon'] as const;
const DURACIONES_RESERVA_MINUTOS = [30, 60, 90, 120] as const;

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
  private readonly cloudinaryUpload = inject(CloudinaryUploadService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  tables: AdminTable[] = [];
  loading = true;
  editingId: string | null = null;
  imagePreview: string | null = null;
  selectedImageFile: File | null = null;
  uploadingImage = false;
  uploadProgress = 0;
  uploadErrorMessage: string | null = null;
  private sub = new Subscription();

  readonly estadosMesa = ESTADOS_MESA;
  readonly localidadesMesa = LOCALIDADES_MESA;
  readonly duracionesReservaMinutos = DURACIONES_RESERVA_MINUTOS;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    estado: ['Disponible' as string, Validators.required],
    localidad: ['', [Validators.required, Validators.maxLength(120)]],
    precioReserva: [0, [Validators.required, Validators.min(0)]],
    capacidad: [4, [Validators.required, Validators.min(1)]],
    duracionReservaMinutos: [120, Validators.required],
    imagen: [''], // Solo para guardar la URL final de Cloudinary o existente
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
    this.imagePreview = null;
    this.selectedImageFile = null;
    this.uploadingImage = false;
    this.uploadProgress = 0;
    this.uploadErrorMessage = null;
    this.form.reset({
      nombre: '',
      estado: 'Disponible',
      localidad: '',
      precioReserva: 0,
      capacidad: 4,
      duracionReservaMinutos: 120,
      imagen: '',
      visibleToClient: true,
    });
  }

  startEdit(row: AdminTable): void {
    this.editingId = row.id;
    this.imagePreview = row.imagen;
    this.selectedImageFile = null;
    this.uploadingImage = false;
    this.uploadProgress = 0;
    this.uploadErrorMessage = null;
    this.form.patchValue({
      nombre: row.nombre,
      estado: ESTADOS_MESA.includes(row.estado as (typeof ESTADOS_MESA)[number])
        ? row.estado
        : 'Disponible',
      localidad: row.localidad,
      precioReserva: row.precioReserva,
      capacidad: row.capacidad,
      duracionReservaMinutos: row.duracionReservaMinutos,
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

  onImagePick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const validationError = this.cloudinaryUpload.validateImage(file);
    if (validationError) {
      this.notify.warning(validationError);
      input.value = '';
      return;
    }

    this.selectedImageFile = file;
    this.uploadErrorMessage = null;
    this.uploadProgress = 0;
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Revise el formulario');
      return;
    }
    
    // Validar que haya imagen: seleccionada o existente
    if (!this.selectedImageFile && !this.form.get('imagen')?.value) {
      this.notify.warning('Debe seleccionar una imagen');
      return;
    }
    
    const v = this.form.getRawValue();
    const persist = (imageUrl: string): void => {
      const payload = {
        nombre: v.nombre,
        estado: v.estado,
        localidad: v.localidad,
        precioReserva: v.precioReserva,
        capacidad: v.capacidad,
        duracionReservaMinutos: v.duracionReservaMinutos,
        imagen: imageUrl,
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
    };

    if (this.selectedImageFile) {
      this.startUploadAndPersist(persist);
      return;
    }

    persist(v.imagen);
  }

  retryImageUpload(): void {
    this.submit();
  }

  private startUploadAndPersist(persist: (imageUrl: string) => void): void {
    if (!this.selectedImageFile) {
      return;
    }

    this.uploadingImage = true;
    this.uploadProgress = 0;
    this.uploadErrorMessage = null;

    this.sub.add(
      this.cloudinaryUpload.uploadImage(this.selectedImageFile).subscribe({
        next: (state) => {
          this.uploadProgress = state.progress;
          if (state.secureUrl) {
            this.uploadingImage = false;
            this.uploadErrorMessage = null;
            persist(state.secureUrl);
          }
        },
        error: (e) => {
          this.uploadingImage = false;
          this.uploadErrorMessage = e?.message ?? 'No se pudo subir la imagen';
          this.notify.error(this.uploadErrorMessage ?? 'No se pudo subir la imagen');
        },
      }),
    );
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
          duracionReservaMinutos: row.duracionReservaMinutos,
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
