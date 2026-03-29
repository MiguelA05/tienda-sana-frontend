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
  private static readonly RESERVA_ANTICIPACION_MINUTOS = 30;
  private static readonly DURACION_DEFAULT_MINUTOS = 120;

  gestorForm!: FormGroup;
  mesasSeleccionadas: MesaDTO[] = [];
  hourOptions: Array<{ value: string; label: string }> = [];
  minDateLocal = this.buildMinDateLocal();
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
      cantidadPersonasForm: [1, [Validators.required, this.capacidadPersonasValidator()]],
      fechaReservaDateForm: ['', Validators.required],
      horaReservaForm: ['', Validators.required]
    });

    this.initDateAndHourDefaults();
    this.isLoading = true;
    this.cargarMesasSeleccionadas();
    // Mover isLoading a false al final de cargarMesasSeleccionadas o en el 'finalize'
  }

  capacidadPersonasValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      const cantidadPersonas = Number(control.value);
      const minimo = this.minimoPersonas();
      const capacidadTotal = this.calcularCapacidadTotal();
      if (!Number.isFinite(cantidadPersonas)) {
        return { cantidadInvalida: true };
      }
      if (cantidadPersonas < minimo) {
        return { personasMinimas: { minimoRequerido: minimo } };
      }
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
        this.normalizeCantidadPersonasValue();
        this.gestorForm.get('cantidadPersonasForm')?.updateValueAndValidity();
        this.rebuildHourOptions();
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
        this.normalizeCantidadPersonasValue();
        this.gestorForm.get('cantidadPersonasForm')?.updateValueAndValidity();
        this.rebuildHourOptions();
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

  minimoPersonas(): number {
    const mesas = this.mesasSeleccionadas?.length ?? 0;
    return Math.max(mesas, 1);
  }

  maximoPersonas(): number {
    const capacidadTotal = this.calcularCapacidadTotal();
    return Math.max(capacidadTotal, this.minimoPersonas());
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
   
      if (this.gestorForm.get('cantidadPersonasForm')?.hasError('capacidadExcedida')) {
         Swal.fire('Capacidad Excedida', 'La cantidad de personas excede la capacidad de las mesas seleccionadas.', 'warning');
        return;
      }
       if (this.gestorForm.get('cantidadPersonasForm')?.hasError('required') || this.gestorForm.get('cantidadPersonasForm')?.hasError('cantidadInvalida')) {
        Swal.fire('Cantidad de personas inválida', 'Ingresa una cantidad numérica válida de personas.', 'warning');
        return;
      }
      if (this.gestorForm.get('cantidadPersonasForm')?.hasError('personasMinimas')) {
        Swal.fire('Cantidad mínima no válida', `Debes reservar al menos ${this.minimoPersonas()} persona(s), una por cada mesa seleccionada.`, 'warning');
        return;
      }
      if (this.gestorForm.get('fechaReservaDateForm')?.hasError('required') || this.gestorForm.get('horaReservaForm')?.hasError('required')) {
        Swal.fire('Fecha Requerida', 'Por favor, selecciona fecha y hora para la reserva.', 'warning');
        return;
      }
      return;
    }

     const emailUsuario = this.tokenService.getEmail();
    const fechaRaw = this.gestorForm.get('fechaReservaDateForm')?.value;
    const horaRaw = this.gestorForm.get('horaReservaForm')?.value;
    const fechaLocal = this.buildLocalDateTime(fechaRaw, horaRaw);
    const fecha = new Date(fechaLocal);

    if (Number.isNaN(fecha.getTime()) || fecha <= new Date()) {
      Swal.fire('Fecha inválida', 'La fecha y hora de la reserva deben ser posteriores al momento actual.', 'warning');
      return;
    }

    const cantidadPersonasSeleccionada = this.gestorForm.get('cantidadPersonasForm')?.value;
    
    const crearReservaDTO: CrearReservaDTO = { 
        emailUsuario: emailUsuario, 
      fechaReserva: fechaLocal,
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

  onFechaReservaChange(): void {
    this.rebuildHourOptions();
  }

  getDuracionReservaLabel(): string {
    const minutos = this.getDuracionReservaMinutosGestor();
    if (minutos === 30) {
      return '30 min';
    }
    if (minutos === 60) {
      return '1 hora';
    }
    if (minutos === 90) {
      return '1:30 horas';
    }
    if (minutos % 60 === 0) {
      return `${minutos / 60} horas`;
    }
    return `${minutos} min`;
  }

  private initDateAndHourDefaults(): void {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    this.gestorForm.patchValue({ fechaReservaDateForm: `${yyyy}-${mm}-${dd}` });
    this.rebuildHourOptions();
  }

  private rebuildHourOptions(): void {
    const fechaSeleccionada = this.gestorForm.get('fechaReservaDateForm')?.value;
    if (!fechaSeleccionada) {
      this.hourOptions = [];
      this.gestorForm.patchValue({ horaReservaForm: '' });
      return;
    }

    const duracion = this.getDuracionReservaMinutosGestor();
    const now = new Date();
    const limiteInferior = new Date(now.getTime() + GestorReservasComponent.RESERVA_ANTICIPACION_MINUTOS * 60 * 1000);
    const isToday = fechaSeleccionada === this.buildMinDateLocal();

    const options: Array<{ value: string; label: string }> = [];
    for (let minute = 0; minute < 24 * 60; minute += duracion) {
      const hh = String(Math.floor(minute / 60)).padStart(2, '0');
      const mm = String(minute % 60).padStart(2, '0');
      const value = `${hh}:${mm}`;
      const candidate = new Date(`${fechaSeleccionada}T${value}:00`);
      if (isToday && candidate < limiteInferior) {
        continue;
      }
      options.push({ value, label: value });
    }

    this.hourOptions = options;
    const horaActual = this.gestorForm.get('horaReservaForm')?.value;
    const horaActualValida = options.some((opt) => opt.value === horaActual);
    this.gestorForm.patchValue({ horaReservaForm: horaActualValida ? horaActual : (options[0]?.value ?? '') });
  }

  private getDuracionReservaMinutosGestor(): number {
    if (!this.mesasSeleccionadas || this.mesasSeleccionadas.length === 0) {
      return GestorReservasComponent.DURACION_DEFAULT_MINUTOS;
    }
    const maxima = this.mesasSeleccionadas
      .map((mesa) => Number(mesa.duracionReservaMinutos ?? 0))
      .filter((valor) => !Number.isNaN(valor) && valor > 0)
      .reduce((max, valor) => Math.max(max, valor), 0);

    return maxima > 0 ? maxima : GestorReservasComponent.DURACION_DEFAULT_MINUTOS;
  }

  private buildMinDateLocal(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private buildLocalDateTime(fecha: string, hora: string): string {
    return `${fecha}T${hora}:00`;
  }

  private normalizeCantidadPersonasValue(): void {
    const control = this.gestorForm.get('cantidadPersonasForm');
    if (!control) {
      return;
    }
    const minimo = this.minimoPersonas();
    const maximo = this.maximoPersonas();
    const actual = Number(control.value);

    if (!Number.isFinite(actual)) {
      control.setValue(minimo);
      return;
    }
    if (actual < minimo) {
      control.setValue(minimo);
      return;
    }
    if (actual > maximo) {
      control.setValue(maximo);
    }
  }



}
