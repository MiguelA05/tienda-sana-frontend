import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MensajeDTO } from '../dto/mensaje-dto';
import { FiltroProductoDTO } from '../dto/filtro-producto-dto';

@Injectable({
  providedIn: 'root'
})
export class PublicoService {

  private publicoURL = "http://localhost:8080/api/public";
  constructor(private http: HttpClient) { }
  //TODO hacer este metodo en el backend para obtener los diferentes tipos de eventos (Hasta el controlador)
  public listarCategorias(): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.publicoURL}/producto/get-categoria`);
  }
 

  public listarProductos(pagina: number): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.publicoURL}/producto/get-all/${pagina}`);
  }
  public obtenerProducto(id: string): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.publicoURL}/producto/get-info/${id}`);
  }
  public filtroProductos(eventFilterDTO: FiltroProductoDTO): Observable<MensajeDTO>{
    return this.http.post<MensajeDTO>(`${this.publicoURL}/producto/filter-events`, eventFilterDTO);
  }

  public realizarPago(idOrden: string): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.publicoURL}/producto/receive-notification`, {});
  }

  //TODO preguntar lo del recibir noitficacion
}
