import { Component, OnInit } from '@angular/core';
import { ProductoDTO } from '../../dto/producto-dto';
import { ItemCarritoDTO } from '../../dto/item-carrito-dto';
import { FormGroup, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  templateUrl: './detalle-producto.component.html',
  styleUrls: ['./detalle-producto.component.css'],
  imports: [CommonModule, FormsModule],
})
export class DetalleProductoComponent  {
  producto?: ProductoDTO;
  itemCarrito?: ItemCarritoDTO;
  detalleCarrtitoForm: FormGroup;

  constructor() {
  }


  

  
}