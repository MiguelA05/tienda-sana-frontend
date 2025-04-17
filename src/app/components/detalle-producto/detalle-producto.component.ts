import { Component, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

export interface ProductoDTO {
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  imagenUrl: string;
  CategoriaProducto: string;
  calificacionPromedio: number;
  EstadoPrducto: string;
}

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterModule, FormsModule],
  templateUrl: './detalle-producto.component.html',
  styleUrls: ['./detalle-producto.component.css']
})
export class DetalleProductoComponent implements OnInit {
  producto: ProductoDTO | null = null;
  estrellas: number[] = [1, 2, 3, 4, 5];
  cantidadSeleccionada: number = 1;
  mostrarDescripcionCompleta: boolean = false;

  constructor(
    private route: ActivatedRoute,
    
  ) {}

  ngOnInit(): void {
    // Obtenemos el ID del producto de la URL (comentado para pruebas)
  // const id = this.route.snapshot.paramMap.get('id');
  // if (id) {
  //   this.cargarProducto(+id);
  // }
    // Producto quemado para pruebas
    this.producto = {
      nombre: 'Producto de Ejemplo',
      descripcion: 'Este es un producto de ejemplo para pruebas.',
      precio: 150.99,
      cantidad: 20,
      imagenUrl: 'https://via.placeholder.com/300',
      CategoriaProducto: 'Electrónica',
      calificacionPromedio: 4.2,
      EstadoPrducto: 'Disponible'
    };
  }

  cargarProducto(id: number): void {
    // Aquí deberías hacer una llamada al servicio para obtener el producto por su ID
    // Por ejemplo:
    // this.productoService.getProductoById(id).subscribe(producto => {
    //   this.producto = producto;
    // });
    
    // Simulación de un producto para el ejemplo
    
  }

  agregarAlCarrito(): void {
    if (this.producto) {
      // Aquí deberías llamar al servicio para agregar el producto al carrito
      // this.carritoService.agregarAlCarrito(this.producto, this.cantidadSeleccionada);
      // Mostrar mensaje de éxito o actualizar UI
    }
  }

  agregarAFavoritos(): void {
    
  }

  calcularPrecioOriginal(): number {
    return 0; // Aquí deberías calcular el precio original si es necesario
  }
  
  incrementarCantidad(): void {
    
  }
  
  decrementarCantidad(): void {
    
  }
}