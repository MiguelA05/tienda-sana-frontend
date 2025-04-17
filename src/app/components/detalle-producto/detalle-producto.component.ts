import { Component, OnInit } from '@angular/core';

export interface ProductoDTO {
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  imagenUrl: string;
  CategoriaProducto: string;
  calificacionPromedio: number;
  EstadoPrducto: string;
  descuento?: number;
  cantidadResenias?: number;
}

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  templateUrl: './detalle-producto.component.html',
  styleUrls: ['./detalle-producto.component.css']
})
export class DetalleProductoComponent implements OnInit {
  producto: ProductoDTO | null = null;
  estrellas: number[] = [1, 2, 3, 4, 5];
  cantidadSeleccionada: number = 1;

  // Propiedades calculadas
  productoCantidad: number = 0;
  productoPrecio: string = '';
  productoPrecioOriginal: string = '';
  productoDescuento: number | null = null;
  productoCalificacion: number = 0;
  productoResenias: number | null = null;
  estadoProducto: string = '';
  estadoProductoClass: string = '';
  cantidadTexto: string = '';
  cantidadClass: string = '';
  cantidadIconClass: string = '';

  ngOnInit(): void {
    // Producto quemado para pruebas
    this.producto = {
      nombre: 'Producto de Ejemplo',
      descripcion: 'Este es un producto de ejemplo para pruebas.',
      precio: 150.99,
      cantidad: 20,
      imagenUrl: 'https://via.placeholder.com/300',
      CategoriaProducto: 'Electrónica',
      calificacionPromedio: 4.2,
      EstadoPrducto: 'Disponible',
      descuento: 20,
      cantidadResenias: 15
    };

    this.actualizarPropiedades();
  }

  actualizarPropiedades(): void {
    if (this.producto) {
      this.productoCantidad = this.producto.cantidad;
      this.productoPrecio = this.producto.precio.toFixed(2);
      this.productoPrecioOriginal = this.producto.descuento
        ? (this.producto.precio / (1 - this.producto.descuento / 100)).toFixed(2)
        : '';
      this.productoDescuento = this.producto.descuento || null;
      this.productoCalificacion = this.producto.calificacionPromedio;
      this.productoResenias = this.producto.cantidadResenias || null;
      this.estadoProducto = this.producto.EstadoPrducto;
      this.estadoProductoClass =
        this.producto.EstadoPrducto === 'Disponible' ? 'status-available' : 'status-unavailable';

      if (this.productoCantidad > 0) {
        this.cantidadTexto =
          this.productoCantidad < 5
            ? `¡Últimas ${this.productoCantidad} unidades!`
            : `En stock: ${this.productoCantidad}`;
        this.cantidadClass = this.productoCantidad < 5 ? 'low-stock' : '';
        this.cantidadIconClass = 'in-stock';
      } else {
        this.cantidadTexto = 'Agotado';
        this.cantidadClass = 'out-of-stock';
        this.cantidadIconClass = 'out-of-stock';
      }
    }
  }

  incrementarCantidad(): void {
    if (this.cantidadSeleccionada < this.productoCantidad) {
      this.cantidadSeleccionada++;
    }
  }

  decrementarCantidad(): void {
    if (this.cantidadSeleccionada > 1) {
      this.cantidadSeleccionada--;
    }
  }

  agregarAlCarrito(): void {
    console.log(`Agregado al carrito: ${this.cantidadSeleccionada} unidades de ${this.producto?.nombre}`);
  }

  agregarAFavoritos(): void {
    console.log(`Producto agregado a favoritos: ${this.producto?.nombre}`);
  }
}