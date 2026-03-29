import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../services/product.service';
import { NotificationService } from '../services/notification.service';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-products.component.html',
  styleUrls: ['../styles/admin-form-layout.css', './admin-products.component.css'],
})
export class AdminProductsComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly notify = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  products: Product[] = [];
  loading = true;
  editingId: string | null = null;
  imagePreview: string | null = null;
  private sub = new Subscription();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    category: ['', [Validators.required, Validators.maxLength(120)]],
    price: [0, [Validators.required, Validators.min(0)]],
    outOfStock: [false],
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
      this.productService.getAll().subscribe({
        next: (rows) => {
          this.products = rows;
          this.loading = false;
          this.applyEditQueryParam();
        },
        error: () => {
          this.notify.error('No se pudieron cargar los productos');
          this.loading = false;
        },
      }),
    );
  }

  startCreate(): void {
    this.editingId = null;
    this.imagePreview = null;
    this.form.reset({ name: '', description: '', category: '', price: 0, outOfStock: false });
  }

  startEdit(row: Product): void {
    this.editingId = row.id;
    this.imagePreview = row.imageUrl;
    this.form.patchValue({
      name: row.name,
      description: row.description,
      category: row.category,
      price: row.price,
      outOfStock: row.outOfStock,
    });
  }

  /** Desde la tienda pública: `/admin/products?edit=<id>` abre el formulario con ese producto. */
  private applyEditQueryParam(): void {
    const editId = this.route.snapshot.queryParamMap.get('edit');
    if (!editId) {
      return;
    }
    const row = this.products.find((p) => p.id === editId);
    if (row) {
      this.startEdit(row);
    } else {
      this.notify.warning('No se encontró el producto indicado en el catálogo.');
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.imagePreview = null;
    this.form.reset({ price: 0, outOfStock: false });
  }

  onImagePick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.notify.warning('Seleccione un archivo de imagen');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Revise los campos obligatorios');
      return;
    }
    const v = this.form.getRawValue();
    const imageUrl =
      this.imagePreview ??
      'https://placehold.co/320x200/e9ecef/198754?text=Producto';

    if (this.editingId) {
      this.sub.add(
        this.productService
          .update(this.editingId, {
            ...v,
            imageUrl,
          })
          .subscribe({
            next: () => {
              this.notify.success('Producto actualizado');
              this.cancelEdit();
              this.refresh();
            },
            error: (e) => this.notify.error(e.message ?? 'Error al actualizar'),
          }),
      );
    } else {
      this.sub.add(
        this.productService
          .create({
            name: v.name,
            description: v.description,
            category: v.category,
            price: v.price,
            outOfStock: v.outOfStock,
            imageUrl,
          })
          .subscribe({
            next: () => {
              this.notify.success('Producto creado');
              this.cancelEdit();
              this.refresh();
            },
            error: (e) => this.notify.error(e.message ?? 'Error al crear'),
          }),
      );
    }
  }

  toggleOutOfStock(row: Product): void {
    this.sub.add(
      this.productService.setOutOfStock(row, !row.outOfStock).subscribe({
        next: () => {
          this.notify.success(row.outOfStock ? 'Producto marcado disponible' : 'Producto marcado agotado');
          this.refresh();
        },
        error: (e) => this.notify.error(e.message ?? 'Error'),
      }),
    );
  }
}
