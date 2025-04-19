import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MensajeDTO } from '../dto/mensaje-dto';
import { ActualizarCuentaDTO } from '../dto/actualizar-cuenta-dto';
import { CrearVentaDTO } from '../dto/crear-venta-dto';

@Injectable({
  providedIn: 'root'
})
export class CuentaService {

  private accountURL = "https://tienda-sana-backend.onrender.com/api/account";
  constructor(private http: HttpClient) { }


  public obtenerInformacion(id: string): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.accountURL}/get/${id}`);
  }

  public actualizarCuenta(actualizarCuenta: ActualizarCuentaDTO): Observable<MensajeDTO> {
    return this.http.put<MensajeDTO>(`${this.accountURL}/update-account`, actualizarCuenta);
  }

  public eliminarCuenta(id: string): Observable<MensajeDTO> {
    return this.http.delete<MensajeDTO>(`${this.accountURL}/delete/${id}`);
  }

  

}
