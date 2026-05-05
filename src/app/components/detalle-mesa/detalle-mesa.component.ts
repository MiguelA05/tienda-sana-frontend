import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { ItemMesaDTO } from '../../dto/item-mesa-dto';
import { MesaHorarioReservadoDTO } from '../../dto/mesa-horario-reservado-dto';
import { MensajeDTO } from '../../dto/mensaje-dto';
import { CrearReservaDirectaDTO } from '../../dto/crear-reserva-directa-dto';
import { ClienteService } from '../../services/cliente.service';
import { PublicoService } from '../../services/publico.service';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-detalle-mesa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './detalle-mesa.component.html',
  styleUrl: './detalle-mesa.component.css'
})
export class DetalleMesaComponent implements OnInit {

  private static readonly RESERVA_ANTICIPACION_MINUTOS = 30;
  private static readonly DURACION_DEFAULT_MINUTOS = 120;

  private readonly fb = inject(FormBuilder);

  mesa?: ItemMesaDTO;
  horariosReservados: MesaHorarioReservadoDTO[] = [];
  hourOptions: Array<{ value: string; label: string; disabled: boolean }> = [];
  isLoading = false;
  minDateLocal = this.buildMinDateLocal();

  readonly reservaForm = this.fb.nonNullable.group({
    cantidadPersonas: [2, [Validators.required, Validators.min(1)]],
    fechaReservaDate: ['', Validators.required],
    horaReserva: ['', Validators.required],
  });

  get isAdmin(): boolean {
    return this.tokenService.getRol() === 'ADMIN';
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly publicoService: PublicoService,
    private readonly clienteService: ClienteService,
    private readonly tokenService: TokenService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/'], { queryParams: { view: 'mesas' } });
      return;
    }
    this.cargarMesa(id);
  }

  disponibilidadLabel(): string {
    if (!this.mesa) {
      return 'Cargando disponibilidad';
    }
    return this.mesa.estado;
  }

  duracionReservaLabel(): string {
    const minutos = this.getDuracionReservaMinutos();
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

  estadoCssClass(): string {
    const estado = (this.mesa?.estado ?? '').toLowerCase();
    if (estado === 'disponible') {
      return 'mesa-status-dot--ok';
    }
    if (estado === 'reservada') {
      return 'mesa-status-dot--warn';
    }
    return 'mesa-status-dot--out';
  }

  irAEditarEnAdmin(): void {
    if (!this.mesa?.id) {
      return;
    }
    void this.router.navigate(['/admin', 'tables'], { queryParams: { edit: this.mesa.id } });
  }

  reservarYPagarDirecto(): void {
    this.reservaForm.markAllAsTouched();
    if (!this.mesa) {
      return;
    }
    if (this.reservaForm.invalid) {
      Swal.fire('Formulario incompleto', 'Completa fecha y cantidad de personas para continuar.', 'warning');
      return;
    }
    if (!this.tokenService.getToken()) {
      Swal.fire({
        title: 'No estás logueado',
        text: 'Para reservar una mesa, debes iniciar sesión.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Iniciar sesión',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          void this.router.navigate(['/login']);
        }
      });
      return;
    }

    const cantidad = Number(this.reservaForm.controls.cantidadPersonas.value);
    if (cantidad > this.mesa.capacidad) {
      Swal.fire('Capacidad excedida', `La mesa permite máximo ${this.mesa.capacidad} personas.`, 'warning');
      return;
    }

    const fechaRaw = this.reservaForm.controls.fechaReservaDate.value;
    const horaRaw = this.reservaForm.controls.horaReserva.value;
    const fechaReservaLocal = this.buildLocalDateTime(fechaRaw, horaRaw);
    const fechaReserva = new Date(fechaReservaLocal);
    if (Number.isNaN(fechaReserva.getTime()) || fechaReserva <= new Date()) {
      Swal.fire('Fecha inválida', 'Selecciona una fecha/hora futura para la reserva.', 'warning');
      return;
    }

    if (this.isHoraReservada(fechaReserva, this.getDuracionReservaMinutos())) {
      Swal.fire('Horario no disponible', 'La hora seleccionada se cruza con una franja ya reservada. Elige otra hora.', 'warning');
      this.rebuildHourOptions();
      return;
    }

    const payload: CrearReservaDirectaDTO = {
      emailUsuario: this.tokenService.getEmail(),
      mesaId: this.mesa.id,
      fechaReserva: fechaReservaLocal,
      cantidadPersonas: cantidad,
    };

    this.isLoading = true;
    this.clienteService.crearReservaDirecta(payload).subscribe({
      next: (response: MensajeDTO) => {
        const reservaId = String(response.reply);
        this.clienteService.realizarPagoReserva(reservaId).subscribe({
          next: (paymentResponse: MensajeDTO) => {
            const paymentUrl =
              typeof paymentResponse.reply === 'string'
                ? paymentResponse.reply
                : paymentResponse.reply?.paymentUrl;
            this.isLoading = false;
            if (paymentUrl) {
              window.location.href = paymentUrl;
              return;
            }
            Swal.fire('Error', 'No se pudo obtener la URL de pago de la reserva.', 'error');
          },
          error: (error) => {
            this.isLoading = false;
            Swal.fire('Error', error?.error?.reply || 'No se pudo iniciar el pago de la reserva.', 'error');
          },
        });
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire('Error', error?.error?.reply || 'No se pudo crear la reserva.', 'error');
      },
    });
  }

  private cargarMesa(id: string): void {
    this.publicoService.obtenerMesa(id).subscribe({
      next: (response: MensajeDTO) => {
        this.mesa = response.reply as ItemMesaDTO;
        const defaultPeople = Math.min(2, this.mesa.capacidad);
        this.reservaForm.patchValue({ cantidadPersonas: defaultPeople > 0 ? defaultPeople : 1 });
        this.initDateAndHourDefaults();
        this.cargarHorariosReservados(this.mesa.id);
      },
      error: () => {
        Swal.fire('No disponible', 'No fue posible cargar el detalle de esta mesa.', 'error').then(() => {
          void this.router.navigate(['/'], { queryParams: { view: 'mesas' } });
        });
      },
    });
  }

  private cargarHorariosReservados(mesaId: string): void {
    this.publicoService.obtenerHorariosReservadosMesa(mesaId).subscribe({
      next: (response: MensajeDTO) => {
        this.horariosReservados = (response.reply as MesaHorarioReservadoDTO[]) ?? [];
        this.rebuildHourOptions();
      },
      error: () => {
        this.horariosReservados = [];
        this.rebuildHourOptions();
      },
    });
  }

  formatSlotDate(value: string): string {
    return new Date(value).toLocaleDateString('es-CO', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatSlotTime(value: string): string {
    return new Date(value).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onFechaReservaChange(): void {
    this.rebuildHourOptions();
  }

  private initDateAndHourDefaults(): void {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    this.reservaForm.patchValue({ fechaReservaDate: `${yyyy}-${mm}-${dd}` });
    this.rebuildHourOptions();
  }

  private rebuildHourOptions(): void {
    const fechaSeleccionada = this.reservaForm.controls.fechaReservaDate.value;
    if (!fechaSeleccionada) {
      this.hourOptions = [];
      this.reservaForm.patchValue({ horaReserva: '' });
      return;
    }

    const duracion = this.getDuracionReservaMinutos();
    const now = new Date();
    const limiteInferior = new Date(now.getTime() + DetalleMesaComponent.RESERVA_ANTICIPACION_MINUTOS * 60 * 1000);
    const isToday = fechaSeleccionada === this.buildMinDateLocal();

    const options: Array<{ value: string; label: string; disabled: boolean }> = [];
    for (let minute = 0; minute < 24 * 60; minute += duracion) {
      const hh = String(Math.floor(minute / 60)).padStart(2, '0');
      const mm = String(minute % 60).padStart(2, '0');
      const value = `${hh}:${mm}`;
      const candidate = new Date(`${fechaSeleccionada}T${value}:00`);
      if (isToday && candidate < limiteInferior) {
        continue;
      }
      options.push({
        value,
        label: value,
        disabled: this.isHoraReservada(candidate, duracion),
      });
    }

    this.hourOptions = options;
    const horaActual = this.reservaForm.controls.horaReserva.value;
    const horaActualValida = options.some((option) => option.value === horaActual && !option.disabled);
    const primeraHoraDisponible = options.find((option) => !option.disabled)?.value ?? '';
    this.reservaForm.patchValue({ horaReserva: horaActualValida ? horaActual : primeraHoraDisponible });
  }

  private isHoraReservada(inicioReserva: Date, duracionMinutos: number): boolean {
    const finReserva = new Date(inicioReserva.getTime() + duracionMinutos * 60 * 1000);
    return this.horariosReservados.some((slot) => {
      const inicioSlot = new Date(slot.inicio);
      const finSlot = new Date(slot.fin);
      if (Number.isNaN(inicioSlot.getTime()) || Number.isNaN(finSlot.getTime())) {
        return false;
      }
      return inicioReserva < finSlot && inicioSlot < finReserva;
    });
  }

  private getDuracionReservaMinutos(): number {
    const raw = this.mesa?.duracionReservaMinutos;
    if (!raw || raw <= 0) {
      return DetalleMesaComponent.DURACION_DEFAULT_MINUTOS;
    }
    return raw;
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

}
