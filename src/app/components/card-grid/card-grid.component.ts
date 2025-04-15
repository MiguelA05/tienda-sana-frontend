import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { TokenService } from '../../services/token.service';
import { ItemProductoDTO } from '../../dto/item-producto-dto';

@Component({
  selector: 'app-card-grid',
  standalone: true,
  imports: [CommonModule, RouterModule,],
  templateUrl: './card-grid.component.html',
  styleUrl: './card-grid.component.css'
})
export class CardGridComponent {

  @Input() products: ItemProductoDTO[]=[]
  constructor(private router: Router, private tokenService: TokenService) {
    this.products = [];
  }

  irADetalleProducto(idProducto: string): void {
    
    this.router.navigate(['/detalle-producto', idProducto]);
    
    
    
  }

}
