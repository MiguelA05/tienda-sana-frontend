import { Component, OnInit } from '@angular/core';
import { ProductoDTO } from '../../dto/producto-dto';
import { ItemCarritoDTO } from '../../dto/item-carrito-dto';


@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  templateUrl: './detalle-producto.component.html',
  styleUrls: ['./detalle-producto.component.css']
})
export class DetalleProductoComponent  {
  producto?: ProductoDTO;
  itemCarrito?: ItemCarritoDTO;
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

  

  agregarAlCarrito(): void {
    console.log(`Agregado al carrito: ${this.cantidadSeleccionada} unidades de ${this.producto?.nombre}`);
  }

  agregarAFavoritos(): void {
    console.log(`Producto agregado a favoritos: ${this.producto?.nombre}`);
  }
}