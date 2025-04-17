import { Component, OnInit } from '@angular/core';
import { ProductoDTO } from '../../dto/producto-dto';
import { ItemCarritoDTO } from '../../dto/item-carrito-dto';
import { FormGroup, FormsModule, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { PublicoService } from '../../services/publico.service'; // Adjust the path if necessary
import { TokenService } from '../../services/token.service'; // Adjust the path if necessary
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
  

  constructor(
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private publicoService: PublicoService,
    private formBuilder: FormBuilder,
    private router: Router,
    private tokenService: TokenService
  ) {
   
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log("Evento ID:", id);

    if (id) {
      this.getProducto(id);
    }
  }

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

  incrementarCantidad(): void {
    if (this.producto && this.cantidadSeleccionada < this.producto.cantidad) {
      this.cantidadSeleccionada++;
    }
  }

  decrementarCantidad(): void {
    if (this.cantidadSeleccionada > 1) {
      this.cantidadSeleccionada--;
    }
  }

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

  agregarAlCarrito(): void {
    if (this.producto && this.producto.cantidad > 0) {
      console.log(`Agregando ${this.cantidadSeleccionada} unidades de ${this.producto.nombre} al carrito`);
      // Aquí implementarías la lógica para agregar al carrito
      // Por ejemplo: this.carritoService.agregarProducto(this.producto.id, this.cantidadSeleccionada);
    }
  }


  private obtenerIdUsuario(): string {
    return this.tokenService.getIDCuenta();
  }


  }


  

  
