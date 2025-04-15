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
export class ClienteService {

  private clienteURL = "http://localhost:8080/api/client";
  constructor(private http: HttpClient) { }


  public listarHistorialCompras(clientId: string): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.clienteURL}/order/history/${clientId}`);
  }

  public obtenerProducto(id: string): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.clienteURL}/producto/get/${id}`);
  }

  public agregarItemCarrito(carItemDTO: ItemCarritoDTO): Observable<MensajeDTO> {
    return this.http.put<MensajeDTO>(`${this.clienteURL}/shoppingcar/add-item`, carItemDTO);
  }

  public obtenerItemsCarrito(id: string): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.clienteURL}/shoppingcar/get-items/${id}`);
  }

  public eliminarItemCarrito(deleteCarDetailDTO: BorrarDetalleCarritoDTO): Observable<MensajeDTO> {
    return this.http.delete<MensajeDTO>(`${this.clienteURL}/shoppingcar/delete-item`, { body: deleteCarDetailDTO });
  }

  public actualizarItemCarrito(updateCarItemDTO: ActualizarItemCarritoDTO): Observable<MensajeDTO> {
    return this.http.put<MensajeDTO>(`${this.clienteURL}/shoppingcar/edit-item`, updateCarItemDTO);
  }

  public crearVenta(createOrderDTO: CrearVentaDTO): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.clienteURL}/venta/create`, createOrderDTO);
  }

  public realizarPago(idOrden: string): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.clienteURL}/venta/make-payment/${idOrden}`, {});
  }

  public obtenerEstadoOrden(orderId: string): Observable<MensajeDTO> {
    return this.http.get<MensajeDTO>(`${this.clienteURL}/venta/status/${orderId}`);
  }

  public cancelarVenta(orderId: String): Observable<MensajeDTO> {
    return this.http.delete<MensajeDTO>(`${this.clienteURL}/venta/cancel/${orderId}`);
  }



}
