import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MensajeDTO } from '../dto/mensaje-dto';
import { FiltroProductoDTO } from '../dto/filtro-producto-dto';

@Injectable({
  providedIn: 'root'
})

/**
 * Servicio para la gestion de los productos publicos
 * Contiene los metodos para listar los productos, obtener la informacion de un producto, filtrar los productos y realizar el pago de una orden
 */
export class PublicoService {

  private publicoURL = "http://localhost:8080/api/public";
  constructor(private http: HttpClient) { }
 
 
  /**
   * Metodo para listar los productos de un usuario
   * @param pagina pagina a listar
   * @returns respuesta del servidor
   */
  public listarProductos(pagina: number): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.publicoURL}/productos/get-all/${pagina}`);
  }

  /**
   * Metodo para listar las mesas de un usuario
   * @param pagina pagina a listar
   * @returns respuesta del servidor
   */
  public listarMesas(pagina: number): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.publicoURL}/mesas/get-all/${pagina}`);
  }

  /**
   * Meetodo para obtener la informacion de un producto
   * @param id id del producto a buscar
   * @returns respuesta del servidor
   */
  public obtenerProducto(id: string): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.publicoURL}/productos/get-info/${id}`);
  }
  
  /**
   * Metodo para filtrar los productos por un filtro  
   * @param eventFilterDTO filtro de productos
   * @returns respuesta del servidor
   */
  public filtroProductos(eventFilterDTO: FiltroProductoDTO): Observable<MensajeDTO>{
    return this.http.post<MensajeDTO>(`${this.publicoURL}/producto/filter-events`, eventFilterDTO);
  }

  /**
   * Metodo para realizar el pago de una orden
   * @param idOrden id de la orden a pagar
   * @returns respuesta del servidor
   */
  public realizarPago(idOrden: string): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.publicoURL}/producto/receive-notification`, {});
  }

}
