import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Buffer } from "buffer";

const TOKEN_KEY = 'AuthToken';

@Injectable({
  providedIn: 'root'
})

/**
 * Servicio para la gestion del token de autenticacion
 * Contiene los metodos para guardar, obtener y eliminar el token del sessionStorage
 */
export class TokenService {

  constructor(private router: Router) {

  }

  /**
   * Metodo para guardar el token en el sessionStorage
   * @param token token a guardar
   */
  public setToken(token: string) {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Metodo para obtener el token del sessionStorage
   * @returns token guardado en el sessionStorage
   */
  public getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  /**
   * Metodo para saber si el token existe en el sessionStorage y el usuario esta logueado
   * @returns true si el token existe, false si no existe
   */
  public isLogged(): boolean {
    if (this.getToken()) {
      return true;
    }
    return false;
  }

  /**
   * Metodo para logear al usuario y redirigirlo a la pagina correspondiente
   * @param token token a guardar
   */
  public login(token: string) {
    this.setToken(token);
    const rol = this.getRol();
    let destino = rol == "ADMIN" ? "/home-admin" : "/";
    this.router.navigate([destino]).then(() => {
    window.location.reload();
    });
  }

  /**
   * Metodo para cerrar sesion y redirigir al usuario a la pagina de login
   */
  public logout() {
    window.sessionStorage.clear();
    this.router.navigate(["/login"]).then(() => {
      window.location.reload();
    });
  }

  /**
   * Metodo para decodificar el token y obtener los valores del payload
   * @param token token a decodificar
   * @returns valores del payload
   */
  private decodePayload(token: string): any {
    const payload = token!.split(".")[1];
    const payloadDecoded = Buffer.from(payload, 'base64').toString('ascii');
    const values = JSON.parse(payloadDecoded);
    return values;
  }

  /**
   * Metodo para obtener el id del usuario logueado
   * @returns id del usuario logueado
   */
  public getIDCuenta(): string {
    const token = this.getToken();
    if (token) {
      const values = this.decodePayload(token);
      return values.email;
    }
    return "";
  }

  /**
   * Metodo para obtener el rol del usuario logueado
   * @returns rol del usuario logueado
   */
  public getRol(): string {
    const token = this.getToken();
    if (token) {
      const values = this.decodePayload(token);
      return values.rol;
    }
    return "";
  }

  /**
   * Metodo para obtener el email del usuario logueado
   * @returns email del usuario logueado
   */
  public getEmail(): string {
    const token = this.getToken();
    if (token) {
      const values = this.decodePayload(token);
      return values.email;
    }
    return "";
  }

  /**
   * Metodo para obtener el nombre del usuario logueado
   * @returns nombre del usuario logueado
   */
  public getNombre(): string {
    const token = this.getToken();
    if (token) {
      const values = this.decodePayload(token);
      return values.nombre;
    }
    return "";
  }

  /**
   * Metodo para obtener el estado del usuario logueado
   * @returns estado del usuario logueado
   */
  public getEstado(): string {
    const token = this.getToken();
    if (token) {
      const values = this.decodePayload(token);
      return values.estado;
    }
    return "";
  }



}
