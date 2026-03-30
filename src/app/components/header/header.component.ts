import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { TokenService } from '../../services/token.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isMenuOpen: boolean = false;
  /** Menú de usuario: control explícito (Bootstrap JS no siempre enlaza bien en Angular). */
  isUserDropdownOpen = false;
  title: string;
  nombreUsuario: string = "";
  isLogged = false;
  email: string = "";
  activeNav: 'inicio' | 'productos' | 'reservas' | null = null;
  isAdmin = false;
  isHomeRoute = false;
  hasScrolled = false;

  /**
   * Constructor de la clase HeaderComponent
   * @param tokenService tokenService para gestionar el token de autenticación
   * @param router router para navegar entre rutas
   */
  constructor(private tokenService: TokenService, private router: Router, private location: Location) {
    this.title = 'Tienda Sana';
    this.isLogged = this.tokenService.isLogged();
    if (this.isLogged) {
      this.email = this.tokenService.getEmail();
      this.nombreUsuario = this.tokenService.getNombre();
      this.isAdmin = this.tokenService.getRol() === 'ADMIN';
    }

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateRouteState(event.urlAfterRedirects);
    });

    this.updateRouteState(this.router.url);
    this.onWindowScroll();
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
    this.hasScrolled = window.scrollY > 20;
    this.updateActiveNavByScroll();
  }

  get useTransparentHeader(): boolean {
    return this.isHomeRoute && !this.hasScrolled;
  }

  irAInicio(): void {
    this.navigateToSection('inicio');
  }

  mostrarProductos(): void {
    this.navigateToSection('productos');
  }

  mostrarReservas(): void {
    this.navigateToSection('reservas');
  }

  accionPrincipal(): void {
    if (this.isLogged && !this.isAdmin) {
      this.router.navigate(['/gestor-reservas']);
      return;
    }
    this.mostrarReservas();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  toggleUserDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  closeUserDropdown(): void {
    this.isUserDropdownOpen = false;
  }

  /**
   * Cierra el menú después de navegar (mobile)
   */
  onNavigate(): void {
    this.closeMenu();
  }

  goHome(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/'], { queryParams: { reset: true }, fragment: 'inicio' });
    this.activeNav = 'inicio';
    this.onNavigate();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isUserDropdownOpen = false;
  }

  private updateRouteState(url: string): void {
    const urlTree = this.router.parseUrl(url || '/');
    const primary = urlTree.root.children['primary'];
    const path = primary?.segments?.map(s => s.path).join('/') ?? '';
    this.isHomeRoute = path === '';

    if (!this.isHomeRoute) {
      this.activeNav = null;
      return;
    }

    const fragment = urlTree.fragment;

    if (fragment === 'reservas') {
      this.activeNav = 'reservas';
      return;
    }
    if (fragment === 'productos') {
      this.activeNav = 'productos';
      return;
    }
    this.activeNav = 'inicio';

    // Sync nav with the actual viewport section after route navigation settles.
    setTimeout(() => this.updateActiveNavByScroll(), 0);
  }

  private updateActiveNavByScroll(): void {
    if (!this.isHomeRoute) {
      return;
    }

    const header = document.querySelector('.header-container') as HTMLElement | null;
    const headerOffset = header?.offsetHeight ?? 88;
    const catalogo = document.getElementById('catalogo');
    const reservas = document.getElementById('reservas');

    if (catalogo) {
      const rect = catalogo.getBoundingClientRect();
      const entersViewport = rect.top <= window.innerHeight * 0.68;
      const notPassed = rect.bottom >= headerOffset + 24;
      const closeToCatalog = window.scrollY >= catalogo.offsetTop - headerOffset - 96;

      if ((entersViewport && notPassed) || closeToCatalog) {
        this.activeNav = this.isSectionVisible(reservas) ? 'reservas' : 'productos';
        this.syncFragmentWithoutNavigation(this.activeNav);
        return;
      }
    }

    this.activeNav = 'inicio';
    this.syncFragmentWithoutNavigation('inicio');
  }

  private isSectionVisible(element: HTMLElement | null): boolean {
    return !!element && element.offsetParent !== null;
  }

  private navigateToSection(section: 'inicio' | 'productos' | 'reservas'): void {
    this.activeNav = section;
    this.isMenuOpen = false;

    const currentFragment = this.router.parseUrl(this.router.url).fragment ?? 'inicio';
    if (this.isHomeRoute && currentFragment === section) {
      this.scrollToSection(section);
      this.syncFragmentWithoutNavigation(section);
      return;
    }

    this.router.navigate(['/'], { fragment: section });
  }

  private scrollToSection(sectionId: 'inicio' | 'productos' | 'reservas'): void {
    if (sectionId === 'inicio') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const section = document.getElementById('catalogo');
    if (!section) {
      return;
    }

    const header = document.querySelector('.header-container') as HTMLElement | null;
    const headerOffset = header?.offsetHeight ?? 88;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const centerOffset = Math.max((window.innerHeight - section.getBoundingClientRect().height) / 2, 0);
    const targetY = Math.max(sectionTop - headerOffset - centerOffset + 36, 0);

    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  private syncFragmentWithoutNavigation(fragment: 'inicio' | 'productos' | 'reservas'): void {
    const tree = this.router.parseUrl(this.router.url || '/');
    const currentFragment = tree.fragment ?? 'inicio';
    if (currentFragment === fragment) {
      return;
    }

    const nextUrl = this.router.serializeUrl(this.router.createUrlTree(['/'], {
      queryParams: tree.queryParams,
      fragment
    }));

    this.location.replaceState(nextUrl);
  }

}
