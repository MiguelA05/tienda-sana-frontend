import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ItemProductoDTO } from '../../dto/item-producto-dto';

@Component({
  selector: 'app-card-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './card-grid.component.html',
  styleUrls: ['./card-grid.component.css']
})
export class CardGridComponent {
  @Input() products: ItemProductoDTO[] = [];

  constructor(private router: Router) {}

  /**
   * Metodo para navegar a la página de detalle del producto
   * @param id ID del producto
   */
  irADetalleProducto(id: string): void {
    this.router.navigate(['/detalle-producto', id]);
  }
}