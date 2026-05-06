import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../services/cliente.service';
import { ItemCarritoDTO } from '../../dto/item-carrito-dto';
import { TokenService } from '../../services/token.service';
import { CommonModule } from '@angular/common';
import { BorrarDetalleCarritoDTO } from '../../dto/borrar-detalle-carrito-dto';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ActualizarItemCarritoDTO } from '../../dto/actualizar-item-carrito-dto';
import { CrearVentaDTO } from '../../dto/crear-venta-dto';
import { MensajeDTO } from '../../dto/mensaje-dto';
import { PaymentResponseVentaDTO } from '../../dto/payment-response-venta-dto';
import { ActivatedRoute } from '@angular/router';
import { PublicoService } from '../../services/publico.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-shopping-car',
  templateUrl: './shopping-car.component.html',
  styleUrls: ['./shopping-car.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],

})
export class ShoppingCarComponent {
  itemsCarrito: ItemCarritoDTO[] = [];
  subtotal: number = 0;
  descuento: number = 0;
  total: number = 0;
  cuponInvalido: boolean = false;
  ventaId: string | null = null;

  isTableLoading: boolean = false;
  isLoading: boolean = false;

  /**
   * Constructor de la clase ShoppingCarComponent
   * @param clienteService clienteService para manejar la lógica de negocio relacionada con el cliente
   * @param tokenService tokenService para manejar el token de autenticación
   * @param route route para obtener parámetros de la URL
   */
  constructor(
    private clienteService: ClienteService,
    private tokenService: TokenService,
    private route: ActivatedRoute,
    private publicoService: PublicoService
  ) {
    this.obtenerItemsCarrito();

    this.route.queryParams.subscribe(params => {
      const paymentGatewayStatus = params['collection_status'] || params['status'];
      const paymentId = params['payment_id'];
      const pendingVentaId = sessionStorage.getItem('pendingVentaId');

      // Si hay venta pendiente y algún estado, procesa normalmente
      if (pendingVentaId && paymentGatewayStatus) {
        console.log(`Retorno de pasarela detectado. Venta pendiente: ${pendingVentaId}, Estado Pasarela: ${paymentGatewayStatus}, PaymentID: ${paymentId}`);
        this.procesarRetornoPasarela(paymentGatewayStatus, pendingVentaId);
        sessionStorage.removeItem('pendingVentaId');
      }
      // Si hay venta pendiente pero NO hay estado, asume retorno incompleto
      else if (pendingVentaId && !paymentGatewayStatus) {
        Swal.fire({
          title: 'Pago No Completado',
          text: `Parece que interrumpiste el proceso de pago antes de completarlo. La orden asociada (ID: ${pendingVentaId}) será cancelada.`,
          icon: 'warning',
          confirmButtonText: 'Entendido'
        }).then(() => {
          this.llamarCancelarVenta(pendingVentaId);
          sessionStorage.removeItem('pendingVentaId');
        });
      }
      // Si solo hay estado pero no venta pendiente
      else if (paymentGatewayStatus) {
        console.warn('Estado de pago en URL sin venta pendiente en sesión:', paymentGatewayStatus);
        if (paymentGatewayStatus === 'approved' || paymentGatewayStatus === 'success') {
          Swal.fire('Pago Registrado', 'Se detectó un pago, pero no se pudo asociar directamente a una sesión activa.', 'success');
        } else if (paymentGatewayStatus === 'rejected' || paymentGatewayStatus === 'failure') {
          Swal.fire('Pago Fallido', 'Se detectó un intento de pago fallido.', 'error');
        }
      }
    });
  }
  /**
   * Método para crear una venta
   */
  crearVenta(): void {
    if (this.itemsCarrito.length === 0) {
      Swal.fire({
        title: 'Carrito vacío',
        text: 'No puedes realizar un pago con el carrito vacío. Agrega productos antes de continuar.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const emailUsuario = this.tokenService.getEmail();
    const crearVentaDTO: CrearVentaDTO = { emailUsuario: emailUsuario, idPromocion: '' };
    this.isLoading = true;

    this.clienteService.crearVenta(crearVentaDTO).subscribe({
      next: (response: MensajeDTO) => {
        this.ventaId = response.reply;
        this.realizarPago();
      },
      error: (error) => {
        console.log("El error es: ", error.error?.reply || error.message);
        console.error('Error al crear la venta:', error);
        this.isLoading = false;
        Swal.fire('Error', `No se pudo iniciar el proceso de pago: ${error.error?.reply || 'Intente nuevamente.'}`, 'error');
      }
    });
  }


  /**
   * Método para realizar el pago
   */
  realizarPago(): void {
    if (this.ventaId) {
      this.clienteService.realizarPago(this.ventaId).subscribe({
        next: (response: MensajeDTO) => {
          this.isLoading = false;
          const paymentUrl = response.reply.paymentUrl;
          sessionStorage.removeItem('pendingVentaId'); // Limpia antes de guardar
          sessionStorage.setItem('pendingVentaId', this.ventaId!);
          window.location.href = paymentUrl;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al obtener URL de pago:', error);
          const msg = (error?.error?.reply || error?.error?.message || error?.message || '')
            .toString()
            .trim();

          // Caso especial: stock insuficiente (validación server-side antes de crear preferencia).
          if (msg.toLowerCase().includes('stock insuficiente')) {
            this.refrescarCarritoYMostrarStock(msg);
            if (this.ventaId) {
              this.llamarCancelarVenta(this.ventaId);
            }
            return;
          }

          Swal.fire('Error', msg || 'No se pudo redirigir a la pasarela de pago. Intenta nuevamente.', 'error');
          if (this.ventaId) {
            this.llamarCancelarVenta(this.ventaId);
          }
        }
      });
    } else {
      this.isLoading = false;
      console.error("realizarPago llamado sin ventaId");
      Swal.fire('Error Interno', 'No se pudo procesar el pago debido a un error interno (ventaId faltante).', 'error');
    }
  }

  private refrescarCarritoYMostrarStock(serverMessage: string): void {
    // 1) refresca carrito
    this.obtenerItemsCarrito();

    // 2) valida por producto consultando stock actual y muestra detalle en modal
    if (!this.itemsCarrito || this.itemsCarrito.length === 0) {
      Swal.fire('Stock insuficiente', serverMessage, 'warning');
      return;
    }

    const checks$ = this.itemsCarrito.map((item) =>
      this.publicoService.obtenerProducto(item.idProducto).pipe(
        map((res: MensajeDTO) => {
          const p = res.reply as any;
          const disponible = typeof p?.cantidad === 'number' ? p.cantidad : 0;
          const nombre = (p?.nombre || item.nombreProducto || item.idProducto).toString();
          return {
            idProducto: item.idProducto,
            nombre,
            solicitado: item.cantidad,
            disponible,
            ok: item.cantidad <= disponible,
          };
        }),
        catchError(() =>
          of({
            idProducto: item.idProducto,
            nombre: item.nombreProducto || item.idProducto,
            solicitado: item.cantidad,
            disponible: 0,
            ok: true, // si no se pudo validar, no marcamos como problema para no confundir
          })
        )
      )
    );

    forkJoin(checks$).subscribe((results) => {
      const issues = results.filter((r) => !r.ok);
      if (issues.length === 0) {
        Swal.fire('Stock insuficiente', serverMessage, 'warning');
        return;
      }

      const html = `
        <p style="margin:0 0 8px 0;">Algunos productos ya no tienen stock suficiente:</p>
        <ul style="text-align:left; margin:0; padding-left:18px;">
          ${issues
            .map(
              (i) =>
                `<li><strong>${i.nombre}</strong>: solicitaste ${i.solicitado}, disponible ${i.disponible}.</li>`
            )
            .join('')}
        </ul>
        <p style="margin:10px 0 0 0;">Ajusta cantidades en el carrito e intenta de nuevo.</p>
      `;

      void Swal.fire({
        title: 'Stock insuficiente',
        html,
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
    });
  }

  /**
   * Procesa el retorno de la pasarela de pago.
   * @param status El estado devuelto por la pasarela (e.g., 'approved', 'rejected', 'pending', 'failure', 'success').
   * @param ventaId El ID de la venta que se intentó pagar.
   */
  private procesarRetornoPasarela(status: string | undefined, ventaId: string): void {
    sessionStorage.removeItem('pendingVentaId');

    if (status === 'approved' || status === 'success') {
      Swal.fire({
        title: 'Pago Exitoso',
        text: 'Tu pago ha sido procesado exitosamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        this.itemsCarrito = [];
        this.calcularTotales();
        this.obtenerItemsCarrito();
      });
    } else if (status === 'pending' || status === 'in_process') {
      Swal.fire({
        title: 'Pago Pendiente',
        text: 'Tu pago está siendo procesado. Te notificaremos cuando se complete.',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      });
    } else {
      let message = 'El proceso de pago no se completó o fue rechazado.';
      if (!status) {
        message = 'Parece que interrumpiste el proceso de pago antes de completarlo.';
      }
      Swal.fire({
        title: 'Pago No Completado',
        text: `${message} La orden asociada (ID: ${ventaId}) será cancelada.`,
        icon: 'warning',
        confirmButtonText: 'Entendido'
      }).then(() => {
        this.llamarCancelarVenta(ventaId);
      });
    }
  }

  /**
   * Llama al servicio para cancelar una venta.
   * @param ventaId El ID de la venta a cancelar.
   */
  private llamarCancelarVenta(ventaId: string): void {
    if (!ventaId) {
      console.warn("llamarCancelarVenta: ventaId es nulo o indefinido.");
      return;
    }
    console.log("Intentando cancelar venta:", ventaId);
    this.isLoading = true; // Indicate activity
    this.clienteService.cancelarVenta(ventaId).subscribe({
      next: (response: MensajeDTO) => {
        this.isLoading = false;
        console.log('Venta cancelada exitosamente:', response.reply);
      },
      error: (err) => {
        this.isLoading = false;
        const errorMessage = err.error?.reply || err.message || 'Error desconocido.';
        console.error(`Error al cancelar la venta (ID: ${ventaId}):`, errorMessage);
        Swal.fire('Error de Cancelación', `No se pudo cancelar automáticamente la orden (ID: ${ventaId}). ${errorMessage}. Si el problema persiste, contacte a soporte.`, 'error');
        this.obtenerItemsCarrito(); // Refresh cart to reflect actual state
      }
    });
  }

  /**
   * Metodo para obtener los items del carrito
   */
  obtenerItemsCarrito(): void {
    this.isTableLoading = true;
    const clienteId = this.tokenService.getIDCuenta();
    this.clienteService.obtenerItemsCarrito(clienteId).subscribe({
      next: (response) => {
        this.itemsCarrito = response.reply;
        this.calcularTotales();
        this.isTableLoading = false;
      },
      error: (error) => {
        console.error("Error al obtener los items del carrito:", error);
        this.isTableLoading = false;
      }
    });
  }

  /**
   * Metodo para calcular los totales del carrito
   */
  calcularTotales(): void {
    this.subtotal = this.itemsCarrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    this.total = this.subtotal - (this.descuento);
  }

  /**
   * Metodo para actualizar la cantidad de un item en el carrito
   * @param item Item del carrito a actualizar
   * @returns true si la cantidad es válida, false si no lo es
   */
  actualizarCantidad(item: ItemCarritoDTO): void {
    const nuevaCantidad = item.cantidad;

    if (nuevaCantidad < 1) {
      Swal.fire('Error', 'La cantidad debe ser al menos 1', 'error');
      return;
    }

    const updateCarItemDTO: ActualizarItemCarritoDTO = {
      cantidad: nuevaCantidad,
      idProducto: item.idProducto,
      idUsuario: this.tokenService.getIDCuenta()
    };

    this.clienteService.actualizarItemCarrito(updateCarItemDTO).subscribe({
      next: (data) => {
        Swal.fire('Éxito', 'Cantidad actualizada en el carrito', 'success');
        this.obtenerItemsCarrito();
      },
      error: (error) => {
        console.error('Error al actualizar la cantidad', error);
        Swal.fire('Error', 'Hubo un problema al actualizar la cantidad', 'error');
      }
    });
  }

  /**
   * Metodo para eliminar un item del carrito
   * @param index Índice del item a eliminar
   */
  eliminarItem(index: number): void {
    const item = this.itemsCarrito[index];
    const idUser = this.tokenService.getIDCuenta();

    const deleteCarDetailDTO: BorrarDetalleCarritoDTO = {
      idProducto: item.idProducto,
      idUsuario: idUser
    };
    this.clienteService.eliminarItemCarrito(deleteCarDetailDTO).subscribe({
      next: () => {
        this.itemsCarrito.splice(index, 1);
        this.calcularTotales();
      },
      error: (error) => {
        console.error('Error al eliminar el ítem:', error);
        Swal.fire('Error', 'Hubo un problema al eliminar el item del carrito, intente nuevamente', 'error');
      }
    });
  }

  /**
   * Metodo para confirmar la eliminación de un item del carrito
   * @param index Índice del item a eliminar
   */
  public confirmarEliminacion(index: number) {
    Swal.fire({
      title: "Estas seguro?",
      text: "Tendrá que seleccionar nuevamente los productos desde la página!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, eliminalo!"
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminarItem(index);
        Swal.fire({
          title: "Eliminado!",
          text: "Se han eliminado los productos de su carrito.",
          icon: "success"
        });
      }
    });
  }





}
