import { Component, OnInit } from '@angular/core';
import { ProductoDTO } from '../../dto/producto-dto';
import { ItemCarritoDTO } from '../../dto/item-carrito-dto';
import { FormGroup, FormsModule, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { PublicoService } from '../../services/publico.service'; // Adjust the path if necessary
import { TokenService } from '../../services/token.service'; // Adjust the path if necessary
import { MensajeDTO } from '../../dto/mensaje-dto'; // Adjust the path if necessary
import { ActualizarItemCarritoDTO } from '../../dto/actualizar-item-carrito-dto'; // Adjust the path if necessary
import Swal from 'sweetalert2';


@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle-producto.component.html',
  styleUrls: ['./detalle-producto.component.css']
})
export class DetalleProductoComponent implements OnInit {
  producto?: ProductoDTO;
  itemCarrito?: ItemCarritoDTO;
  detalleCarrtitoForm!: FormGroup;
  cantidadSeleccionada: number = 1;
  descuento: number = 0;
  precioOriginal: number = 0;
  isLoading: boolean=false;


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
    private tokenService: TokenService
  ) {

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

  /**
   * Método para crear el formulario reactivo
   */
  incrementarCantidad(): void {
    if (this.producto && this.cantidadSeleccionada < this.producto.cantidad) {
      this.cantidadSeleccionada++;
    }
  }

  /**
   * Método para crear el formulario reactivo
   */
  decrementarCantidad(): void {
    if (this.cantidadSeleccionada > 1) {
      this.cantidadSeleccionada--;
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
        this.cargarDatosProducto()
      },
      error: (error) => {
        console.error(error);
      },
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
    }
  }

  /**
   * Método para crear el formulario reactivo
   * @returns true si el producto está en el carrito, false si no lo está
   */
  agregarAlCarrito(): void {
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
    const carItem: ItemCarritoDTO = {
      idUsuario: this.obtenerIdUsuario(),
      idProducto: this.producto?.id ?? '',
      nombreProducto: this.producto?.nombre ?? '',
      categoria: this.producto?.categoria ?? '',
      precio: +(this.producto?.precioUnitario ?? '0'),
      cantidad: cantidad,
      total: +(this.producto?.precioUnitario ?? '0')*cantidad
    };

    this.clienteService.obtenerItemsCarrito(this.obtenerIdUsuario()).subscribe({
      next: (response: MensajeDTO) => {
        const items: ItemCarritoDTO[] = response.reply;
        const existingItem = items.find(item => item.idProducto === carItem.idProducto);
          this.clienteService.agregarItemCarrito(carItem).subscribe({
            next: () => {
              console.log("7");
              Swal.fire("Éxito!", "Se ha agregado el item al carrito", "success").then(() => {
                this.isLoading = false; // Desactivamos después de que se cierre el diálogo
              });
            },
            error: (error) => {
              Swal.fire("Error!", error.error.respuesta, "error").then(() => {
                this.isLoading = false; // Desactivamos después de que se cierre el diálogo
              });
            }
          });
      },
      error: (error) => {
        console.error("Error al obtener los items del carrito", error);
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





