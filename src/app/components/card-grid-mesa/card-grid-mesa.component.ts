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
  ];

  constructor(private router: Router) {
  }

  irADetalleMesa(id: string): void {
    this.router.navigate(['/mesas', id]);
  }
}

