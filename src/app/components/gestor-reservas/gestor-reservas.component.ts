import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MesaDTO } from '../../dto/mesa-dto';
import { ItemReservaDTO } from '../../dto/item-reserva-dto';
import { ClienteService } from '../../services/cliente.service';
import { CommonModule } from '@angular/common';
import { TokenService } from '../../services/token.service';
import { BorrarMesaGestorDTO } from '../../dto/borrar-mesa-gestor-dto';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { CrearReservaDTO } from '../../dto/crear-reserva-dto';
import { MensajeDTO } from '../../dto/mensaje-dto'; // Ensure this file exists and contains the definition for MensajeDTO
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-gestor-reservas',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './gestor-reservas.component.html',
  styleUrl: './gestor-reservas.component.css'
})
export class GestorReservasComponent {
  gestorForm!: FormGroup;
  mesasSeleccionadas: MesaDTO[] = [];
  fechaReserva: Date = new Date();
  cantidadPersonas: number = 1;
  isLoading: boolean = false;
  emailUsuario: string = '';
  reservaId: string | null = null;

  constructor(
    private clienteService: ClienteService,
    private router: Router,
    private tokenService: TokenService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.gestorForm = this.fb.group({
      cantidadPersonasForm: [1, [Validators.required, Validators.min(1)]],
      fechaReservaForm: ['', Validators.required]
    });

    this.isLoading = true;
    this.cargarMesasSeleccionadas();
    this.isLoading = false;
  }



  cargarMesasSeleccionadas(): void {
    console.log("Obteniendo mesas para el gestor...");
    const clienteId = this.tokenService.getIDCuenta();
    this.clienteService.obtenerItemsCarrito(clienteId).subscribe({
      next: (response) => {
        this.mesasSeleccionadas = response.reply;
        console.log("Items del gestor:", this.mesasSeleccionadas);
        this.calcularTotal();
      },
      error: (error) => {
        console.error("Error al obtener los items del gestor:", error);
      }
    });
  }

  eliminarMesa(index: number): void {
    const item = this.mesasSeleccionadas[index];
    const idUser = this.tokenService.getIDCuenta();

    const borrarMesaGestorDTO: BorrarMesaGestorDTO = {
      mesaId: item.id,
      emailUsuario: idUser
    };
    this.clienteService.eliminarMesaGestorReservas(borrarMesaGestorDTO).subscribe({
      next: () => {
        this.mesasSeleccionadas.splice(index, 1);
        this.calcularTotal();
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
      text: "Tendrá que agregar nuevamente lo mesa desde la página!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, eliminala!"
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminarMesa(index);
        Swal.fire({
          title: "Eliminada!",
          text: "Se han eliminado la mesa de su gestor de reservas.",
          icon: "success"
        });
      }
    });
  }

  calcularTotal(): number {
    return this.mesasSeleccionadas.reduce((total, mesa) => total + Number(mesa.precioReserva), 0);
  }

  calcularCapacidadTotal(): number {
    return this.mesasSeleccionadas.reduce((total, mesa) => total + Number(mesa.capacidad), 0);
  }

  continuarSeleccion(): void {
    this.router.navigate(['/?view=mesas']);
  }

  /**
    * Método para crear una venta
    */
  crearReserva(): void {
    const emailUsuario = this.tokenService.getEmail();
    console.log("Email del usuario:", emailUsuario);
    const crearReservaDTO: CrearReservaDTO = { emailUsuario: emailUsuario, fechaReserva: this.gestorForm.get('fechaReservaForm')?.value, mesas: this.mesasSeleccionadas, cantidadPersonas: this.gestorForm.get('cantidadPersonasForm')?.value };
    this.isLoading = true;

    this.clienteService.crearReserva(crearReservaDTO).subscribe({
      next: (response: MensajeDTO) => {

        this.reservaId = response.reply;
        this.isLoading = false;
        this.procederPago();;

      },
      error: (error) => {
        console.log("El error es: ", error.error.reply);
        console.error('Error al crear la venta:', error);

        this.isLoading = false;

      }
    });
  }

  procederPago(): void {
    // Validaciones
    if (this.mesasSeleccionadas.length === 0) {
      console.log('Debes seleccionar al menos una mesa', 'Error');
      return;
    }

    if (!this.fechaReserva) {
      console.log('Debes seleccionar una fecha para la reserva', 'Error');
      return;
    }

    if (this.cantidadPersonas <= 0) {
      console.log('Debes indicar la cantidad de personas', 'Error');
      return;
    }

    // Verificar capacidad
    const capacidadTotal = this.calcularCapacidadTotal();
    if (this.cantidadPersonas > capacidadTotal) {
      console.log(
        `Las mesas seleccionadas solo tienen capacidad para ${capacidadTotal} personas. Por favor, selecciona más mesas o reduce la cantidad de personas.`,
        'Advertencia'
      );
      return;
    }

    if (this.reservaId) {
      this.clienteService.realizarPagoReserva(this.reservaId).subscribe({
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


  /**
   * Metodo para verificar el estado del pago
   * @param estado Estado del pago
   */
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

  // Formateador de fecha para mostrar en la UI
  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString();
  }



}
