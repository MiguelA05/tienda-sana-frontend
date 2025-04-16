import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { CambiarPasswordComponent } from './components/cambiar-password/cambiar-password.component';
import { ShoppingCarComponent } from './components/shopping-car/shopping-car.component';
import { InformacionUsuarioComponent } from './components/informacion-usuario/informacion-usuario.component';
import { correoRecuperacionComponent } from './components/correo-recuperacion/correo-recuperacion.component';
import { VerificarCuentaComponent } from './components/verificar-cuenta/verificar-cuenta.component';
import { DetalleProductoComponent } from './components/detalle-producto/detalle-producto.component';


export const routes: Routes = [
   { path: '', component: HomeComponent },
   { path: 'info-usuario', component: InformacionUsuarioComponent },
   { path: 'login', component: LoginComponent },
   { path: 'register', component: RegisterComponent },
   { path: 'cambiar-password', component: CambiarPasswordComponent },
   { path: 'carrito', component: ShoppingCarComponent },
   { path: 'correo-recuperacion', component: correoRecuperacionComponent },
   { path: 'verificar-cuenta', component: VerificarCuentaComponent },
   { path: 'detalle-producto/:id', component: DetalleProductoComponent },
   { path: "**", pathMatch: "full", redirectTo: "" }
   
];
