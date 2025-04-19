import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MensajeDTO } from '../dto/mensaje-dto';
import { FiltroProductoDTO } from '../dto/filtro-producto-dto';

@Injectable({
  providedIn: 'root'
})
export class PublicoService {

  private publicoURL = "https://tienda-sana-backend.onrender.com/api/public";
  constructor(private http: HttpClient) { }
 
 

  public listarProductos(pagina: number): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.publicoURL}/productos/get-all/${pagina}`);
  }
  public obtenerProducto(id: string): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.publicoURL}/productos/get-info/${id}`);
  }
  
  public filtroProductos(eventFilterDTO: FiltroProductoDTO): Observable<MensajeDTO>{
    return this.http.post<MensajeDTO>(`${this.publicoURL}/producto/filter-events`, eventFilterDTO);
  }

  public realizarPago(idOrden: string): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.publicoURL}/producto/receive-notification`, {});
  }

}
