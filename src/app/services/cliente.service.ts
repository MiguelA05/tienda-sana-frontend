import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MensajeDTO } from '../dto/mensaje-dto';
import { ItemCarritoDTO } from '../dto/item-carrito-dto';
import { BorrarDetalleCarritoDTO } from '../dto/borrar-detalle-carrito-dto';
import { ActualizarItemCarritoDTO } from '../dto/actualizar-item-carrito-dto';
import { CrearVentaDTO } from '../dto/crear-venta-dto';

@Injectable({
  providedIn: 'root'
})

/**
 * Servicio para la gestion de los productos de un cliente
 * Contiene los metodos para listar los productos, agregar un producto al carrito, obtener los items del carrito, eliminar un item del carrito, actualizar un item del carrito y crear una orden de compra
 */
export class ClienteService {

  private clienteURL = "http://localhost:8080/api/cliente";
  constructor(private http: HttpClient) { }

  /**
   * Metodo para listar los productos de un cliente
   * @param clientId id del cliente
   * @returns 
   */
  public listarHistorialCompras(clientId: string): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.clienteURL}/order/history/${clientId}`);
  }

  /**
   * Metodo para obtener el total de items en el carrito de un cliente
   * @param clientId id del cliente
   * @returns respuesta del servidor
   */
  public getCartItemCount(clientId: string): Observable<number> {
    return this.http.get<number>(`${this.clienteURL}/carrito/item-count/${clientId}`);
  }

  /**
   * Metodo para obtener la informacion de un producto
   * @param id id del producto a buscar
   * @returns respuesta del servidor
   */
  public obtenerProducto(id: string): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.clienteURL}/producto/get/${id}`);
  }

  /**
   * Metodo para agregar un producto al carrito de un cliente
   * @param carItemDTO item a agregar al carrito
   * @returns respuesta del servidor
   */
  public agregarItemCarrito(carItemDTO: ItemCarritoDTO): Observable<MensajeDTO> {
    return this.http.put<MensajeDTO>(`${this.clienteURL}/carrito/add-item`, carItemDTO);
  }

  /**
   * Metodo para obtener los items del carrito de un cliente
   * @param id id del cliente
   * @returns respuesta del servidor
   */
  public obtenerItemsCarrito(id: string): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.clienteURL}/carrito/get-items/${id}`);
  }

  /**
   * Metodo para eliminar un item del carrito de un cliente
   * @param deleteCarDetailDTO item a eliminar del carrito
   * @returns respuesta del servidor
   */
  public eliminarItemCarrito(deleteCarDetailDTO: BorrarDetalleCarritoDTO): Observable<MensajeDTO> {
    return this.http.delete<MensajeDTO>(`${this.clienteURL}/carrito/delete-item`, { body: deleteCarDetailDTO });
  }

  /**
   * Metodo para actualizar un item del carrito de un cliente
   * @param updateCarItemDTO item a actualizar del carrito
   * @returns respuesta del servidor
   */
  public actualizarItemCarrito(updateCarItemDTO: ActualizarItemCarritoDTO): Observable<MensajeDTO> {
    return this.http.put<MensajeDTO>(`${this.clienteURL}/carrito/edit-item`, updateCarItemDTO);
  }

  /**
   * Metodo par crear una orden de compra
   * @param createOrderDTO DTO con los datos de la orden a crear
   * @returns respuesta del servidor
   */
  public crearVenta(createOrderDTO: CrearVentaDTO): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.clienteURL}/venta/create`, createOrderDTO);
  }

  /**
   * Metodo para pagar una orden de compra
   * @param idOrden id de la orden a pagar
   * @returns respuesta del servidor
   */
  public realizarPago(idOrden: string): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.clienteURL}/venta/make-payment/${idOrden}`, {});
  }

  /**
   * Metodo para obtener el estado de una orden de compra
   * @param orderId id de la orden a buscar
   * @returns respuesta del servidor
   */
  public obtenerEstadoOrden(orderId: string): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.clienteURL}/venta/status/${orderId}`);
  }

  /**
   * Metodo para cancelar una orden de compra
   * @param orderId id de la orden a cancelar
   * @returns respuesta del servidor
   */
  public cancelarVenta(orderId: String): Observable<MensajeDTO> {
    return this.http.delete<MensajeDTO>(`${this.clienteURL}/venta/cancel/${orderId}`);
  }



}
