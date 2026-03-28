import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminSuppliersComponent } from './suppliers/admin-suppliers.component';
import { AdminProductsComponent } from './products/admin-products.component';
import { AdminLotsComponent } from './lots/admin-lots.component';
import { AdminTablesComponent } from './tables/admin-tables.component';

/**
 * Rutas hijas bajo /admin (carga perezosa desde app.routes).
 * La protección por rol ADMIN vive en la ruta padre.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'suppliers', component: AdminSuppliersComponent },
      { path: 'products', component: AdminProductsComponent },
      { path: 'lots', component: AdminLotsComponent },
      { path: 'tables', component: AdminTablesComponent },
    ],
  },
];
