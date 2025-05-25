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
import { FormBuilder, FormGroup, Validators, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

export function fechaHoraFuturaValidator(): (control: AbstractControl) => ValidationErrors | null {
  return (control: AbstractControl): ValidationErrors | null => {
    const fechaSeleccionada = new Date(control.value);
    const ahora = new Date();
    ahora.setSeconds(0, 0);
    if (fechaSeleccionada <= ahora) {
      return { fechaPasada: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-gestor-reservas',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './gestor-reservas.component.html',
  styleUrl: './gestor-reservas.component.css'
})
export class GestorReservasComponent {
  gestorForm!: FormGroup;
  mesasSeleccionadas: MesaDTO[] = [];
  fechaActual: Date = new Date(); 
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
      cantidadPersonasForm: [1, [Validators.required, Validators.min(1), this.capacidadPersonasValidator()]],
      fechaReservaForm: ['', [Validators.required, fechaHoraFuturaValidator()]]
    });

    this.isLoading = true;
    this.cargarMesasSeleccionadas();
    // Mover isLoading a false al final de cargarMesasSeleccionadas o en el 'finalize'
  }

  capacidadPersonasValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      const cantidadPersonas = control.value;
      const capacidadTotal = this.calcularCapacidadTotal();
      if (this.mesasSeleccionadas.length > 0 && cantidadPersonas > capacidadTotal) {
        return { capacidadExcedida: { capacidadRequerida: cantidadPersonas, capacidadDisponible: capacidadTotal } };
      }
      return null;
    };
  }


  cargarMesasSeleccionadas(): void {
    console.log("Obteniendo mesas para el gestor...");
    const clienteId = this.tokenService.getIDCuenta();
    this.isLoading = true;
    this.clienteService.obtenerMesasGestorReservas(clienteId).subscribe({
      next: (response) => {
        this.mesasSeleccionadas = response.reply;
        console.log("Items del gestor:", this.mesasSeleccionadas);
        this.gestorForm.get('cantidadPersonasForm')?.updateValueAndValidity();
        this.isLoading = false;
      },
      error: (error) => {
        console.error("Error al obtener los items del gestor:", error);
        this.isLoading = false;
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
        // Actualizar la validez del control de cantidad de personas después de eliminar una mesa
        this.gestorForm.get('cantidadPersonasForm')?.updateValueAndValidity();
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
    this.gestorForm.markAllAsTouched();

    if (this.gestorForm.invalid) {
   
      if (this.gestorForm.get('fechaReservaForm')?.hasError('fechaPasada')) {
        Swal.fire('Fecha Inválida', 'La fecha y hora de la reserva deben ser posteriores al momento actual.', 'warning');
        return; // Detener si la fecha es pasada
      }
      if (this.gestorForm.get('cantidadPersonasForm')?.hasError('capacidadExcedida')) {
         Swal.fire('Capacidad Excedida', 'La cantidad de personas excede la capacidad de las mesas seleccionadas.', 'warning');
        return;
      }
       if (this.gestorForm.get('cantidadPersonasForm')?.hasError('required') || this.gestorForm.get('cantidadPersonasForm')?.hasError('min')) {
        Swal.fire('Cantidad de Personas Inválida', 'Por favor, ingrese una cantidad válida de personas (mínimo 1).', 'warning');
        return;
      }
      if (this.gestorForm.get('fechaReservaForm')?.hasError('required')) {
        Swal.fire('Fecha Requerida', 'Por favor, seleccione una fecha y hora para la reserva.', 'warning');
        return;
      }
      return;
    }

     const emailUsuario = this.tokenService.getEmail();
    let fecha = this.gestorForm.get('fechaReservaForm')?.value;
    const cantidadPersonasSeleccionada = this.gestorForm.get('cantidadPersonasForm')?.value;
    
    const crearReservaDTO: CrearReservaDTO = { 
        emailUsuario: emailUsuario, 
        fechaReserva: fecha,
        mesas: this.mesasSeleccionadas, 
        cantidadPersonas: cantidadPersonasSeleccionada
    };
    this.isLoading = true;
    this.clienteService.crearReserva(crearReservaDTO).subscribe({
      next: (response: MensajeDTO) => {
        this.reservaId = response.reply;
        this.procederPago();
       
      },
      error: (error) => {
        console.log("El error es: ", error.error?.reply || error.message);
        console.error('Error al crear la reserva:', error);
        this.isLoading = false;
        Swal.fire('Error', `No se pudo crear la reserva: ${error.error?.reply || 'Intente nuevamente.'}`, 'error');
      }
    });
  }

  procederPago(): void {
    // Las validaciones principales ya se hicieron en crearReserva()
    // Aquí solo nos aseguramos de que reservaId exista.
    if (!this.reservaId) {
      Swal.fire('Error Interno', 'No se pudo obtener el ID de la reserva para proceder al pago.', 'error');
      return;
    }

    this.clienteService.realizarPagoReserva(this.reservaId).subscribe({
      next: (response: MensajeDTO) => {
        // Asumiendo que response.reply contiene la URL de pago directamente o un objeto con ella
        const paymentUrl = typeof response.reply === 'string' ? response.reply : response.reply.paymentUrl;
        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          console.error('URL de pago no encontrada en la respuesta:', response);
          Swal.fire('Error', 'No se pudo obtener la URL de pago. Intenta nuevamente.', 'error');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al realizar el pago:', error);
        Swal.fire('Error', 'No se pudo procesar el pago. Intenta nuevamente.', 'error');
      }
    });
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
