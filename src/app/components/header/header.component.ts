import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isMenuOpen: boolean = false;
  title: string;
  nombreUsuario: string = "";
  isLogged = false;
  email: string = "";
  activeNav: 'productos' | 'mesas' = 'productos';

  /**
   * Constructor de la clase HeaderComponent
   * @param tokenService tokenService para gestionar el token de autenticación
   * @param router router para navegar entre rutas
   */
  constructor(private tokenService: TokenService, private router: Router) {
    this.title = 'Tienda Sana';
    this.isLogged = this.tokenService.isLogged();
    if (this.isLogged) {
      this.email = this.tokenService.getEmail();
      this.nombreUsuario = this.tokenService.getNombre();
    }
    // Detecta cambios de ruta para actualizar el nav activo
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (event.url === '/' || event.url.startsWith('/?reset')) {
          this.activeNav = 'productos';
        }
      }
    });
  }

  /**
   * Método para deslogar al usuario
   */
  public logout() {
    this.tokenService.logout();
  }

  /**
   * Método para navegar en la aplicación
   */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const header = document.querySelector('.main-header');
    if (header) {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  }

  mostrarProductos(): void {
    this.activeNav = 'productos';
    this.router.navigate([''], { queryParams: { view: 'productos' } });
  }

  mostrarMesas(): void {
    this.activeNav = 'mesas';
    this.router.navigate([''], { queryParams: { view: 'mesas' } });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  goHome(event: Event) {
    event.preventDefault();
    this.router.navigate(['/'], { queryParams: { reset: true } });
  }

}
