import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { CambiarPasswordComponent } from './componentes/cambiar-password/cambiar-password.component';


export const routes: Routes = [
   { path: '', component: HomeComponent },
   { path: 'login', component: LoginComponent },
   { path: 'register', component: RegisterComponent },
   { path: 'cambiar-password', component: CambiarPasswordComponent },
   { path: "**", pathMatch: "full", redirectTo: "" }
];
