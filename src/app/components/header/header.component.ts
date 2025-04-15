import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TokenService } from '../../services/token.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  title: string;
  nombreUsuario: string = "";
  isLogged = false;
  email: string = "";

  constructor(private tokenService: TokenService,private router: Router) {
    this.title = 'Tienda Sana';
    this.isLogged = this.tokenService.isLogged();
    if (this.isLogged) {
      this.email = this.tokenService.getEmail();
      this.nombreUsuario = this.tokenService.getNombre();
    }
  }

  public logout() {
    this.tokenService.logout();
  }

  public llevarIncioSesion() {
    let ruta;
    let rutaAlterna="/register";
    ruta="/";
    
    console.log(this.router.url);
    console.log("-");
    console.log(ruta);
    console.log(this.router.url === ruta);
    if (this.router.url === ruta) {
      this.router.navigateByUrl(rutaAlterna, { skipLocationChange: true }).then(() => {
        this.router.navigate([ruta]);
      });
    } else {
      this.router.navigate([ruta]);
    }

  }


}
