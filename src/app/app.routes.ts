import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { CambiarPasswordComponent } from './components/cambiar-password/cambiar-password.component';
import { ShoppingCarComponent } from './components/shopping-car/shopping-car.component';
import { InformacionUsuarioComponent } from './components/informacion-usuario/informacion-usuario.component';
import { CorreoRecuperacionComponent } from './components/correo-recuperacion/correo-recuperacion.component';
import { VerificarCuentaComponent } from './components/verificar-cuenta/verificar-cuenta.component';
import { DetalleProductoComponent } from './components/detalle-producto/detalle-producto.component';
import { HistorialComponent } from './components/historial/historial.component';
import { GestorReservasComponent } from './components/gestor-reservas/gestor-reservas.component';
import { LoginGuard } from './guardias/permiso.service';
import { RolesGuard } from './guardias/roles.service';


export const routes: Routes = [
   { path: '', component: HomeComponent },
   { path: 'info-usuario', component: InformacionUsuarioComponent, canActivate: [RolesGuard],
       data: { expectedRole: ['CLIENTE'] } },
   { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
   { path: 'register', component: RegisterComponent, canActivate: [LoginGuard] },
   { path: 'cambiar-password', component: CambiarPasswordComponent, canActivate: [LoginGuard] },
   { path: 'carrito', component: ShoppingCarComponent, canActivate: [RolesGuard], data: { expectedRole: ['CLIENTE'] } },
   { path: 'correo-recuperacion', component: CorreoRecuperacionComponent, canActivate: [LoginGuard] },
   { path: 'verificar-cuenta', component: VerificarCuentaComponent, canActivate: [LoginGuard] },
   { path: 'detalle-producto/:id', component: DetalleProductoComponent },
   { path: 'historial', component: HistorialComponent}, //, canActivate: [RolesGuard]
   { path: 'gestor-reservas', component: GestorReservasComponent},
   { path: "**", pathMatch: "full", redirectTo: "" }
   
];
