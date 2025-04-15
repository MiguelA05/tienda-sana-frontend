import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MensajeDTO } from '../dto/mensaje-dto';
import { Observable } from 'rxjs';
import { LoginDTO } from '../dto/login-dto';
import { CrearCuentaDTO } from '../dto/crear-cuenta-dto';
import { ActivarCuentaDTO } from '../dto/activar-cuenta-dto';
import { CambiarContraseniaDTO } from '../dto/cambiar-contrasenia-dto';
import { TokenDTO } from '../dto/token-dto';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authURL = "http://localhost:8080/api/auth";

  constructor(private http: HttpClient) {


  }
  public crearCuenta(cuentaDTO: CrearCuentaDTO): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.authURL}/create-account`, cuentaDTO);
  }

  public iniciarSesion(loginDTO: LoginDTO): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.authURL}/login`, loginDTO);
  }

  public refresh(token: TokenDTO): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.authURL}/refresh`, token);
  }

  public validarCodigoRegistro(activateAccountDTO: ActivarCuentaDTO): Observable<MensajeDTO> {
    return this.http.put<MensajeDTO>(`${this.authURL}/validate-account`, activateAccountDTO);
  }

  public enviarCodigoRecuperacion(email: string): Observable<MensajeDTO> {
    return this.http.put<MensajeDTO>(`${this.authURL}/send-recover/${email}`, {});
  }

  //Prueba
  public cambiarContrasenia(cambiarContra: CambiarContraseniaDTO): Observable<MensajeDTO> {
    return this.http.put<MensajeDTO>(`${this.authURL}/change-password`, cambiarContra);
  }

  public reenviarCodigoVerificacion (email: string): Observable<MensajeDTO> {
    return this.http.put<MensajeDTO>(`${this.authURL}/resend-validation/${email}`, {});
  }
}
