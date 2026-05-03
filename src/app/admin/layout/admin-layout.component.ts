import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

export interface AdminNavItem {
  path: string;
  label: string;
  icon: string;
}

export interface AdminNavGroup {
  title: string | null;
  items: AdminNavItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  readonly navGroups: AdminNavGroup[] = [
    {
      title: null,
      items: [{ path: '/admin/dashboard', label: 'Dashboard', icon: 'fa-gauge-high' }],
    },
    {
      title: 'Operaciones',
      items: [
        { path: '/admin/operations/products', label: 'Productos', icon: 'fa-bag-shopping' },
        { path: '/admin/operations/tables', label: 'Mesas', icon: 'fa-chair' },
        { path: '/admin/operations/inventory', label: 'Inventario', icon: 'fa-boxes-stacked' },
      ],
    },
    {
      title: 'Analítica',
      items: [
        { path: '/admin/analytics/sales', label: 'Ventas', icon: 'fa-chart-line' },
        { path: '/admin/analytics/reservations', label: 'Reservas', icon: 'fa-calendar-check' },
      ],
    },
    {
      title: 'Configuración',
      items: [{ path: '/admin/settings/suppliers', label: 'Proveedores', icon: 'fa-truck-field' }],
    },
  ];
}
