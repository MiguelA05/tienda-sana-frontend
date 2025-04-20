import { inject, Injectable } from '@angular/core';
import { TokenService } from '../services/token.service';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RolesService {

  realRole: string = "";

  /**
   * Constructor de la clase RolesService
   * @param tokenService tokenService para manejar el token de autenticación
   * @param router router para navegar entre rutas
   */
  constructor(private tokenService: TokenService, private router: Router) { }

  /**
   * Método para verificar si el usuario tiene el rol adecuado para acceder a la ruta
   * @param next ruta activa
   * @param state estado de la ruta
   * @returns true si el usuario tiene el rol adecuado, false en caso contrario
   */
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const expectedRole: string[] = next.data["expectedRole"];
    this.realRole = this.tokenService.getRol();
    if (!this.tokenService.isLogged() || !expectedRole.some(r => this.realRole.includes(r))) {
      this.router.navigate([""]);
      return false;
    }
    return true;
  }
}

/**
 * Componente para verificar si el usuario tiene el rol adecuado para acceder a la ruta
 * @param next ruta activa
 * @param state estado de la ruta
 * @returns true si el usuario tiene el rol adecuado, false en caso contrario
 */
export const RolesGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state:
  RouterStateSnapshot): boolean => {
  return inject(RolesService).canActivate(next, state);
  }
