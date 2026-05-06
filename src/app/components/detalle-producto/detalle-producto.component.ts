import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ProductoDTO } from '../../dto/producto-dto';
import { ItemCarritoDTO } from '../../dto/item-carrito-dto';
import { FormGroup, FormsModule, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { PublicoService } from '../../services/publico.service'; // Adjust the path if necessary
import { TokenService } from '../../services/token.service'; // Adjust the path if necessary
import { MensajeDTO } from '../../dto/mensaje-dto'; // Adjust the path if necessary
import { ActualizarItemCarritoDTO } from '../../dto/actualizar-item-carrito-dto'; // Adjust the path if necessary
import Swal from 'sweetalert2';
import {
  SITE_ORIGIN,
  absoluteUrl,
  truncateSeoDescription,
} from '../../core/site-seo.constants';


@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './detalle-producto.component.html',
  styleUrls: ['./detalle-producto.component.css']
})
export class DetalleProductoComponent implements OnInit {
  producto?: ProductoDTO;
  itemCarrito?: ItemCarritoDTO;
  detalleCarrtitoForm!: FormGroup;
  cantidadSeleccionada: number = 1;
  cantidadEnCarrito: number = 0;
  descuento: number = 0;
  precioOriginal: number = 0;
  isLoading: boolean=false;

  /** Sesión administrador: edición en panel en lugar de carrito. */
  get isAdmin(): boolean {
    return this.tokenService.getRol() === 'ADMIN';
  }

  /** Máximo que se puede agregar según stock y lo ya seleccionado en carrito. */
  get maxSeleccionable(): number {
    const stock = this.producto?.cantidad ?? 0;
    if (!this.tokenService.isLogged()) {
      return stock;
    }
    return Math.max(0, stock - (this.cantidadEnCarrito ?? 0));
  }


  /**
   * Constructor de la clase DetalleProductoComponent
   * @param route route para obtener parámetros de la URL
   * @param clienteService clienteService para manejar la lógica de negocio relacionada con el cliente
   * @param publicoService publicoService para manejar la lógica de negocio relacionada
   * @param formBuilder formBuilder para construir formularios reactivos
   * @param router router para navegar entre rutas
   * @param tokenService tokenService para manejar el token de autenticación
   */
  constructor(
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private publicoService: PublicoService,
    private formBuilder: FormBuilder,
    private router: Router,
    private tokenService: TokenService,
    private title: Title,
    private meta: Meta
  ) {
    this.detalleCarrtitoForm = this.formBuilder.group({});
  }

  /**
   * Método para inicializar el componente
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.getProducto(id);
    }
  }

  /**
   * Método para crear el formulario reactivo
   * @returns disponibilidad del producto
   */
  getDisponibilidadTexto(): string {
    if (!this.producto) return 'No disponible';

    if (this.producto.cantidad <= 0) {
      return 'Agotado';
    } else if (this.producto.cantidad <= 10) {
      return `¡Solo ${this.producto.cantidad} unidades disponibles!`;
    } else {
      return 'En stock';
    }
  }

  /** Clases para el punto de color junto a la disponibilidad. */
  stockDotModifier(): string {
    if (!this.producto) {
      return 'product-stock-dot--out';
    }
    if (this.producto.cantidad <= 0) {
      return 'product-stock-dot--out';
    }
    if (this.producto.cantidad <= 10) {
      return 'product-stock-dot--low';
    }
    return 'product-stock-dot--ok';
  }

  /**
   * Método para crear el formulario reactivo
   */
  incrementarCantidad(): void {
    if (this.isAdmin) {
      return;
    }
    const max = this.maxSeleccionable;
    if (this.producto && this.cantidadSeleccionada < max) {
      this.cantidadSeleccionada++;
    }
  }

  /**
   * Método para crear el formulario reactivo
   */
  decrementarCantidad(): void {
    if (this.isAdmin) {
      return;
    }
    if (this.cantidadSeleccionada > 1) {
      this.cantidadSeleccionada--;
    }
  }

  onCantidadChange(value: number): void {
    const v = Number(value);
    if (!Number.isFinite(v)) {
      this.cantidadSeleccionada = 1;
      return;
    }
    const max = Math.max(1, this.maxSeleccionable);
    this.cantidadSeleccionada = Math.min(Math.max(1, Math.floor(v)), max);
  }

  /** Navega al formulario de productos del admin con el producto seleccionado. */
  irAEditarEnAdmin(): void {
    const id = this.producto?.id;
    if (!id) {
      return;
    }
    void this.router.navigate(['/admin', 'products'], { queryParams: { edit: id } });
  }

  /**
   * Método para crear el formulario reactivo
   * @param id ID del producto
   */
  public getProducto(id: string): void {
    this.publicoService.obtenerProducto(id).subscribe({
      next: (data) => {
        this.producto = data.reply;
        this.cargarDatosProducto();
        this.cargarCantidadEnCarrito();
      },
      error: () => {},
    })
  }

  /**
   * Método para crear el formulario reactivo
   */
  private cargarDatosProducto(): void {
    if (this.producto) {
      this.detalleCarrtitoForm.patchValue({
        nombre: this.producto.nombre,
        categoria: this.producto.categoria,
        descripcion: this.producto.descripcion,
        precioUnitario: this.producto.precioUnitario,
        cantidad: this.producto.cantidad,
        imagen: this.producto.imagen
      });
      this.actualizarMetaProducto();
    }
  }

  private cargarCantidadEnCarrito(): void {
    if (!this.tokenService.isLogged()) {
      this.cantidadEnCarrito = 0;
      // clampa por si el usuario ya había cambiado el input
      this.onCantidadChange(this.cantidadSeleccionada);
      return;
    }
    const userId = this.obtenerIdUsuario();
    const productId = this.producto?.id;
    if (!userId || !productId) {
      return;
    }
    this.clienteService.obtenerItemsCarrito(userId).subscribe({
      next: (response: MensajeDTO) => {
        const items: ItemCarritoDTO[] = response.reply || [];
        this.cantidadEnCarrito = items.find(i => i.idProducto === productId)?.cantidad ?? 0;
        this.onCantidadChange(this.cantidadSeleccionada);
      },
      error: () => {
        // si falla, no bloqueamos el detalle; solo evitamos depender del dato
        this.cantidadEnCarrito = 0;
        this.onCantidadChange(this.cantidadSeleccionada);
      }
    });
  }

  private actualizarMetaProducto(): void {
    if (!this.producto) {
      return;
    }
    const id = this.producto.id;
    const pageUrl = `${SITE_ORIGIN}/detalle-producto/${id}`;
    const titulo = `${this.producto.nombre} | Tienda Sana`;
    const descripcion = truncateSeoDescription(
      `${this.producto.nombre} — ${this.producto.categoria}. ${this.producto.descripcion}`
    );
    const imagenAbs = absoluteUrl(this.producto.imagen || '/favicon.ico');

    this.title.setTitle(titulo);
    this.meta.updateTag({ name: 'description', content: descripcion });
    this.meta.updateTag({ property: 'og:type', content: 'product' });
    this.meta.updateTag({ property: 'og:url', content: pageUrl });
    this.meta.updateTag({ property: 'og:title', content: titulo });
    this.meta.updateTag({ property: 'og:description', content: descripcion });
    this.meta.updateTag({ property: 'og:image', content: imagenAbs });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: titulo });
    this.meta.updateTag({ name: 'twitter:description', content: descripcion });
    this.meta.updateTag({ name: 'twitter:image', content: imagenAbs });
  }

  /**
   * Método para crear el formulario reactivo
   * @returns true si el producto está en el carrito, false si no lo está
   */
  agregarAlCarrito(): void {
    if (this.isAdmin) {
      return;
    }
    this.isLoading = true;

    if (!this.tokenService.getToken()) {
      Swal.fire({
        title: "No estás logueado",
        text: "Para agregar al carrito, debes iniciar sesión.",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Iniciar sesión",
        cancelButtonText: "Cancelar"
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
        this.isLoading = false;
      });

      return;
    }
    const cantidad = this.cantidadSeleccionada;
    if (cantidad <= 0) {
      Swal.fire("Error!", "Debe seleccionar al menos una entrada", "error").then(() => {
        this.isLoading = false;
      });
      return;
    }

    const max = this.maxSeleccionable;
    if (max <= 0) {
      Swal.fire("Stock insuficiente", "Ya tienes todo el stock de este producto en tu carrito.", "info").then(() => {
        this.isLoading = false;
      });
      return;
    }
    if (cantidad > max) {
      Swal.fire("Stock insuficiente", `Solo puedes agregar ${max} unidades más.`, "warning").then(() => {
        this.cantidadSeleccionada = Math.max(1, max);
        this.isLoading = false;
      });
      return;
    }
    const carItem: ItemCarritoDTO = {
      idUsuario: this.obtenerIdUsuario(),
      idProducto: this.producto?.id ?? '',
      nombreProducto: this.producto?.nombre ?? '',
      categoria: this.producto?.categoria ?? '',
      precio: +(this.producto?.precioUnitario ?? '0'),
      cantidad: cantidad,
      total: +(this.producto?.precioUnitario ?? '0')*cantidad
    };

    const userId = this.obtenerIdUsuario();
    this.clienteService.obtenerItemsCarrito(userId).subscribe({
      next: (response: MensajeDTO) => {
        const items: ItemCarritoDTO[] = response.reply;
        const existingItem = items.find(item => item.idProducto === carItem.idProducto);

        const currentQty = existingItem?.cantidad ?? 0;
        const newQty = currentQty + cantidad;
        const stock = this.producto?.cantidad ?? 0;
        if (newQty > stock) {
          Swal.fire("Stock insuficiente", `Ya tienes ${currentQty} en el carrito. Máximo disponible: ${stock}.`, "warning")
            .then(() => { this.isLoading = false; });
          return;
        }

        if (existingItem) {
          const updateCarItemDTO: ActualizarItemCarritoDTO = {
            idUsuario: userId,
            idProducto: carItem.idProducto,
            cantidad: newQty
          };
          this.clienteService.actualizarItemCarrito(updateCarItemDTO).subscribe({
            next: () => {
              Swal.fire("Éxito!", "Se actualizó la cantidad en tu carrito", "success").then(() => {
                this.isLoading = false;
                this.cargarCantidadEnCarrito();
              });
            },
            error: (error) => {
              Swal.fire("Error!", error.error?.respuesta ?? "No se pudo actualizar el carrito", "error").then(() => {
                this.isLoading = false;
              });
            }
          });
          return;
        }

        this.clienteService.agregarItemCarrito(carItem).subscribe({
          next: () => {
            Swal.fire("Éxito!", "Se ha agregado el item al carrito", "success").then(() => {
              this.isLoading = false;
              this.cargarCantidadEnCarrito();
            });
          },
          error: (error) => {
            Swal.fire("Error!", error.error?.respuesta ?? "No se pudo agregar el item", "error").then(() => {
              this.isLoading = false;
            });
          }
        });
      },
      error: () => {
        Swal.fire("Error!", "Hubo un problema al verificar el carrito", "error").then(() => {
          this.isLoading = false; // Desactivamos después de que se cierre el diálogo
        });
      }
    });

  }

  /**
   * Método para crear el formulario reactivo
   * @returns ID del usuario
   */
  private obtenerIdUsuario(): string {
    return this.tokenService.getIDCuenta();
  }
}

