import { Component, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ItemProductoDTO } from '../../dto/item-producto-dto';
import { ProductoDTO } from '../../dto/producto-dto';
import { ItemCarritoDTO } from '../../dto/item-carrito-dto';
import { FormGroup, FormsModule, FormBuilder } from '@angular/forms';
import { ClienteService } from '../../services/cliente.service';
import { PublicoService } from '../../services/publico.service'; // Adjust the path if necessary
import { TokenService } from '../../services/token.service'; // Adjust the path if necessary
import { MensajeDTO } from '../../dto/mensaje-dto'; // Adjust the path if necessary
import { ActualizarItemCarritoDTO } from '../../dto/actualizar-item-carrito-dto'; // Adjust the path if necessary

import Swal from 'sweetalert2';

@Component({
  selector: 'app-card-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './card-grid.component.html',
  styleUrls: ['./card-grid.component.css']
})
export class CardGridComponent {
  @Input() products: ItemProductoDTO[] = [];
  isLoading: boolean = false;
  cantidadSeleccionada: number = 1;
  producto?: ProductoDTO;

  get isAdmin(): boolean {
    return this.tokenService.getRol() === 'ADMIN';
  }

  constructor(private router: Router,
    private clienteService: ClienteService,
    private tokenService: TokenService,
    private route: ActivatedRoute,
    private publicoService: PublicoService) { }

  /**
   * Metodo para navegar a la página de detalle del producto
   * @param id ID del producto
   */
  irADetalleProducto(id: string): void {
    this.router.navigate(['/detalle-producto', id]);
  }

  irAEditarProductoAdmin(event: Event, producto: ItemProductoDTO): void {
    event.stopPropagation();
    void this.router.navigate(['/admin', 'products'], { queryParams: { edit: producto.id } });
  }

  /**
   * Método para inicializar el componente
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log("Evento ID:", id);

    if (id) {
      this.getProducto(id);
    }
  }

  /**
   * Método para crear el formulario reactivo
   * @param id ID del producto
   */
  public getProducto(id: string): void {
    this.publicoService.obtenerProducto(id).subscribe({
      next: (data) => {
        this.producto = data.reply;
        console.log(this.producto);
      },
      error: (error) => {
        console.error(error);
      },
    })
  }

  /**
     * Método para crear el formulario reactivo
     * @returns true si el producto está en el carrito, false si no lo está
     */
  agregarAlCarrito(event: Event, producto: ItemProductoDTO): void {
    event.stopPropagation(); // Detener propagación del evento

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
      });
      return;
    }

    const selectedProducto = this.products.find(p => p.id === producto.id);
    if (!selectedProducto) {
      Swal.fire("Error!", "Producto no encontrado.", "error");
      return;
    }

    const cantidad = this.cantidadSeleccionada;
    if (cantidad <= 0) {
      Swal.fire("Error!", "Debe seleccionar al menos una entrada", "error");
      return;
    }

    const userId = this.obtenerIdUsuario();

    this.isLoading = true;

    // 1) Leer stock real del producto (detalle) y 2) cantidad ya en carrito
    this.publicoService.obtenerProducto(selectedProducto.id).subscribe({
      next: (productRes: MensajeDTO) => {
        const p: ProductoDTO | undefined = productRes.reply;
        const stock = typeof p?.cantidad === 'number' ? p.cantidad : 0;

        this.clienteService.obtenerItemsCarrito(userId).subscribe({
          next: (cartRes: MensajeDTO) => {
            const items: ItemCarritoDTO[] = cartRes.reply || [];
            const existingQty = items.find(i => i.idProducto === selectedProducto.id)?.cantidad ?? 0;
            const newQty = existingQty + cantidad;

            if (stock <= 0) {
              Swal.fire("Sin stock", "Este producto está agotado.", "info");
              this.isLoading = false;
              return;
            }
            if (newQty > stock) {
              Swal.fire(
                "Stock insuficiente",
                `Ya tienes ${existingQty} en tu carrito. Máximo disponible: ${stock}.`,
                "warning"
              );
              this.isLoading = false;
              return;
            }

            // Si ya existe en carrito, actualiza; si no, agrega.
            if (existingQty > 0) {
              const updateCarItemDTO: ActualizarItemCarritoDTO = {
                idUsuario: userId,
                idProducto: selectedProducto.id,
                cantidad: newQty,
              };
              this.clienteService.actualizarItemCarrito(updateCarItemDTO).subscribe({
                next: () => {
                  Swal.fire("Éxito!", "Se actualizó la cantidad en tu carrito.", "success");
                  this.isLoading = false;
                },
                error: (error) => {
                  Swal.fire("Error!", error.error?.respuesta || "Hubo un problema al actualizar el carrito.", "error");
                  this.isLoading = false;
                }
              });
              return;
            }

            const carItem: ItemCarritoDTO = {
              idUsuario: userId,
              idProducto: selectedProducto.id,
              nombreProducto: selectedProducto.nombre,
              categoria: selectedProducto.categoria,
              precio: selectedProducto.precioUnitario,
              cantidad: cantidad,
              total: producto.precioUnitario * cantidad
            };

            this.clienteService.agregarItemCarrito(carItem).subscribe({
              next: () => {
                Swal.fire("Éxito!", "Se ha agregado el item al carrito", "success");
                this.isLoading = false;
              },
              error: (error) => {
                Swal.fire("Error!", error.error?.respuesta || "Hubo un problema al agregar el item.", "error");
                this.isLoading = false;
              }
            });
          },
          error: () => {
            Swal.fire("Error!", "No se pudo validar el carrito. Intenta nuevamente.", "error");
            this.isLoading = false;
          }
        });
      },
      error: () => {
        Swal.fire("Error!", "No se pudo validar el stock. Intenta nuevamente.", "error");
        this.isLoading = false;
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