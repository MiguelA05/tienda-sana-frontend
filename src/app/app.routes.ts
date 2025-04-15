import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { CambiarPasswordComponent } from './components/cambiar-password/cambiar-password.component';
import { ShoppingCarComponent } from './components/shopping-car/shopping-car.component';


export const routes: Routes = [
   { path: '', component: HomeComponent },
   { path: 'login', component: LoginComponent },
   { path: 'register', component: RegisterComponent },
   { path: 'cambiar-password', component: CambiarPasswordComponent },
   { path: 'carrito', component: ShoppingCarComponent },
   { path: "**", pathMatch: "full", redirectTo: "" }
];
