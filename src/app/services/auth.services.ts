import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MensajeDTO } from '../dto/mensaje-dto';
import { Observable } from 'rxjs';
import { LoginDTO } from '../dto/login-dto';
import { CrearCuentaDTO } from '../dto/crear-cuenta-dto';
import { ActivarCuentaDTO } from '../dto/activar-cuenta-dto';
import { CambiarContraseniaDTO } from '../dto/cambiar-contrasenia-dto';
import { TokenDTO } from '../dto/token-dto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

/**
 * * Servicio para la autenticacion de usuarios
 * * Contiene los metodos para crear una cuenta, iniciar sesion, refrescar el token, validar el codigo de registro, enviar el codigo de recuperacion de contrasenia y cambiar la contrasenia
 */
export class AuthService {

  private authURL = environment.authServiceUrl;

  constructor(private http: HttpClient) {
    console.log(1);
    console.log("AuthService URL: ", this.authURL);
  }

  /**
   * Metodo para crear una cuenta de usuario
   * @param cuentaDTO cuentaDTO con los datos de la cuenta a crear
   * @returns respuesta del servidor
   */
  public crearCuenta(cuentaDTO: CrearCuentaDTO): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.authURL}/create-account`, cuentaDTO);
  }

  /**
   * Metodo para iniciar sesion
   * @param loginDTO loginDTO con los datos de inicio de sesion
   * @returns respuesta del servidor
   */
  public iniciarSesion(loginDTO: LoginDTO): Observable<MensajeDTO> {
    console.log("AuthService URL: ", this.authURL);
    return this.http.post<MensajeDTO>(`${this.authURL}/login`, loginDTO);
  }

  /**
   * Metodo para refrescar el token de acceso
   * @param token tokenDTO con el token de refresco
   * @returns respuesta del servidor
   */
  public refresh(token: TokenDTO): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.authURL}/refresh`, token);
  }

  /**
   * Metodo para validar el codigo de registro
   * @param activateAccountDTO DTO con los datos de la cuenta a activar
   * @returns respuesta del servidor
   */
  public validarCodigoRegistro(activateAccountDTO: ActivarCuentaDTO): Observable<MensajeDTO> {
    return this.http.put<MensajeDTO>(`${this.authURL}/validate-account`, activateAccountDTO);
  }

  /**
   * Metodo para enviar el codigo de recuperacion de contrasenia
   * @param email email del usuario a recuperar
   * @returns respuesta del servidor
   */
  public enviarCodigoRecuperacion(email: string): Observable<MensajeDTO> {
    return this.http.put<MensajeDTO>(`${this.authURL}/send-recover/${email}`, {});
  }

  /**
   * Metodo para cambiar la contrasenia del usuario
   * @param cambiarContra DTO DTO con los datos de la contrasenia a cambiar
   * @returns respuesta del servidor
   */
  public cambiarContrasenia(cambiarContra: CambiarContraseniaDTO): Observable<MensajeDTO> {
    return this.http.put<MensajeDTO>(`${this.authURL}/change-password`, cambiarContra);
  }

  /**
   * Metodo para reenviar el codigo de verificacion al email
   * @param email email del usuario a recuperar
   * @returns respuesta del servidor
   */
  public reenviarCodigoVerificacion (email: string): Observable<MensajeDTO> {
    return this.http.put<MensajeDTO>(`${this.authURL}/resend-validation/${email}`, {});
  }
}
