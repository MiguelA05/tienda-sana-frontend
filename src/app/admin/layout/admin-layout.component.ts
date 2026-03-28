import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  readonly nav = [
    { path: '/admin/dashboard', label: 'Resumen', icon: 'fa-chart-line' },
    { path: '/admin/suppliers', label: 'Proveedores', icon: 'fa-truck-field' },
    { path: '/admin/products', label: 'Productos', icon: 'fa-bag-shopping' },
    { path: '/admin/lots', label: 'Lotes e inventario', icon: 'fa-boxes-stacked' },
    { path: '/admin/tables', label: 'Mesas', icon: 'fa-chair' },
  ];
}
