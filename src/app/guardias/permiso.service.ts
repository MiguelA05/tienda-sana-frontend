import { inject, Injectable } from '@angular/core';
import { TokenService } from '../services/token.service';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class PermisoService {

  /**
   * Constructor de la clase PermisoService
   * @param tokenService tokenService para manejar el token de autenticación
   * @param router router para navegar entre rutas
   */
  constructor(private tokenService: TokenService, private router: Router) { }

  /**
   * Método para verificar si el usuario tiene permiso para acceder a la ruta
   * @param next ruta activa
   * @param state estado de la ruta
   * @returns true si el usuario no está autenticado, false en caso contrario
   */
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.tokenService.isLogged()) {
    this.router.navigate([""]);
    return false;
    }
    return true;
    }
}

/**
 * Componente para verificar si el usuario tiene permiso para acceder a la ruta
 * @param next nueva ruta activa
 * @param state estado de la ruta
 * @returns true si el usuario no está autenticado, false en caso contrario
 */
export const LoginGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state:
  RouterStateSnapshot): boolean => {
  return inject(PermisoService).canActivate(next, state);
  }
