import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MensajeDTO } from '../dto/mensaje-dto';
import { ActualizarCuentaDTO } from '../dto/actualizar-cuenta-dto';
import { CrearVentaDTO } from '../dto/crear-venta-dto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

/**
 * Servicio para la gestion de la cuenta de un cliente
 * Contiene los metodos para obtener la informacion de la cuenta, actualizar la cuenta y eliminar la cuenta
 */
export class CuentaService {

  private accountURL = environment.cuentaServiceUrl;
  constructor(private http: HttpClient) { }

  /**
   * * Metodo para listar los productos de un cliente
   * @param id id del cliente
   * @returns respuesta del servidor
   */
  public obtenerInformacion(id: string): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.accountURL}/get/${id}`);
  }

  /**
   * Metodo para actualizar la cuenta de un cliente
   * @param actualizarCuenta actualizarCuentaDTO con los datos de la cuenta a actualizar
   * @returns respuesta del servidor
   */
  public actualizarCuenta(actualizarCuenta: ActualizarCuentaDTO): Observable<MensajeDTO> {
    return this.http.put<MensajeDTO>(`${this.accountURL}/update-account`, actualizarCuenta);
  }

  /**
   * Metodo para eliminar la cuenta de un cliente
   * @param id id del cliente
   * @returns respuesta del servidor
   */
  public eliminarCuenta(id: string): Observable<MensajeDTO> {
    return this.http.delete<MensajeDTO>(`${this.accountURL}/delete/${id}`);
  }

  

}
