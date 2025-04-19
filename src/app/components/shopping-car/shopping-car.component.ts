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

  isLoading: boolean=false;

  constructor(private clienteService: ClienteService, private tokenService: TokenService, private route: ActivatedRoute) {
  this.obtenerItemsCarrito();
  this.route.queryParams.subscribe(params => {
    const paymentStatus = params['status'];
    if (paymentStatus) {
      console.log('Payment status:', paymentStatus[0]);
      this.verificarEstadoPago(paymentStatus[0]);
    }
  });

  }


  crearVenta(): void {
    const emailUsuario = this.tokenService.getEmail();
    console.log("Email del usuario:", emailUsuario);
    const crearVentaDTO: CrearVentaDTO = { emailUsuario: emailUsuario, idPromocion: '' };
    this.isLoading = true;

    this.clienteService.crearVenta(crearVentaDTO).subscribe({
      next: (response: MensajeDTO) => {

        this.ventaId = response.reply;
        this.isLoading = false;
        this.realizarPago();;

      },
      error: (error) => {
        console.log("El error es: " ,error.error.reply);
        console.error('Error al crear la venta:', error);

        this.isLoading = false;

      }
    });
  }



  realizarPago(): void {
    if (this.ventaId) {
      this.clienteService.realizarPago(this.ventaId).subscribe({
        next: (response: MensajeDTO) => {
          const paymentUrl = response.reply.paymentUrl;
          window.location.href = paymentUrl;
        },
        error: (error) => {
          console.error('Error al realizar el pago:', error);
          Swal.fire('Error', 'No se pudo procesar el pago. Intenta nuevamente.', 'error');
        }
      });
    }
  }

  public verificarEstadoPago(estado: string): void {
    console.log("Verificando estado del pago:", estado);
    switch (estado) {
      case 'success':
        Swal.fire({
          title: 'Pago Exitoso',
          text: 'Tu pago ha sido procesado exitosamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
        break;
      case 'failure':
        Swal.fire({
          title: 'Pago Fallido',
          text: 'Hubo un problema con tu pago. Inténtalo nuevamente.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        break;
      case 'pending':
        Swal.fire({
          title: 'Pago Pendiente',
          text: 'Tu pago está en proceso. Te notificaremos cuando se complete.',
          icon: 'info',
          confirmButtonText: 'Aceptar'
        });
        break;
      default:
        Swal.fire({
          title: 'Estado desconocido',
          text: 'Hubo un problema al verificar el estado del pago.',
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        });
    }
  }


  obtenerItemsCarrito(): void {
    console.log("Obteniendo items del carrito...");
    const clienteId = this.tokenService.getIDCuenta();
    this.clienteService.obtenerItemsCarrito(clienteId).subscribe({
      next: (response) => {
        this.itemsCarrito = response.reply;
        console.log("Items del carrito:", this.itemsCarrito);
        this.calcularTotales();
      },
      error: (error) => {
        console.error("Error al obtener los items del carrito:", error);
      }
    });
  }

  calcularTotales(): void {
    this.subtotal = this.itemsCarrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    this.total = this.subtotal - (this.descuento);
  }

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
