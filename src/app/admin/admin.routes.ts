import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminSuppliersComponent } from './suppliers/admin-suppliers.component';
import { AdminProductsComponent } from './products/admin-products.component';
import { AdminLotsComponent } from './lots/admin-lots.component';
import { AdminTablesComponent } from './tables/admin-tables.component';
import { AdminAnalyticsSalesComponent } from './analytics/admin-analytics-sales.component';
import { AdminAnalyticsReservationsComponent } from './analytics/admin-analytics-reservations.component';

/**
 * Rutas hijas bajo /admin (carga perezosa desde app.routes).
 * Dashboard = vista principal; Operaciones (CRUD); Analítica; Configuración.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: AdminDashboardComponent },

      { path: 'operations/products', component: AdminProductsComponent },
      { path: 'operations/tables', component: AdminTablesComponent },
      { path: 'operations/inventory', component: AdminLotsComponent },

      { path: 'analytics/sales', component: AdminAnalyticsSalesComponent },
      { path: 'analytics/reservations', component: AdminAnalyticsReservationsComponent },

      { path: 'settings/suppliers', component: AdminSuppliersComponent },

      /* Compatibilidad rutas antiguas */
      { path: 'suppliers', redirectTo: 'settings/suppliers', pathMatch: 'full' },
      { path: 'products', redirectTo: 'operations/products', pathMatch: 'full' },
      { path: 'lots', redirectTo: 'operations/inventory', pathMatch: 'full' },
      { path: 'tables', redirectTo: 'operations/tables', pathMatch: 'full' },
    ],
  },
];
