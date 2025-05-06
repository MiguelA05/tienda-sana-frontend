import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ItemMesaDTO } from '../../dto/item-mesa-dto';

@Component({
  selector: 'app-mesas-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-grid-mesa.component.html',
  styleUrl: './card-grid-mesa.component.css'
})
export class CardGridMesaComponent {
  @Input() mesas: ItemMesaDTO[] = [
    {
      idMesa: '1',
      nombre: 'Mesa 1',
      estado: 'disponible',
      capacidad: 4,
      localidad: 'Zona 1',
      precioReserva: 100,
      imagenReferencial: 'https://example.com/mesa1.jpg'
    },
    {
      idMesa: '2',
      nombre: 'Mesa 2',
      estado: 'reservada',
      capacidad: 6,
      localidad: 'Zona 2',
      precioReserva: 150,
      imagenReferencial: 'https://example.com/mesa2.jpg'
    },
    {
      idMesa: '3',
      nombre: 'Mesa 3',
      estado: 'disponible',
      capacidad: 8,
      localidad: 'Zona 3',
      precioReserva: 200,
      imagenReferencial: 'https://example.com/mesa3.jpg'
    }

  ];

  constructor(private router: Router) {
  }

  irADetalleMesa(id: string): void {
    this.router.navigate(['/mesas', id]);
  }
}

