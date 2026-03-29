import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { ItemMesaDTO } from '../../dto/item-mesa-dto';
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

  private readonly fb = inject(FormBuilder);

  mesa?: ItemMesaDTO;
  isLoading = false;
  minDateTimeLocal = this.buildMinDateTimeLocal();

  readonly reservaForm = this.fb.nonNullable.group({
    cantidadPersonas: [2, [Validators.required, Validators.min(1)]],
    fechaReserva: ['', Validators.required],
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
    if (!this.esMesaDisponible()) {
      Swal.fire('Mesa no disponible', 'Esta mesa no se encuentra disponible para reservar en este momento.', 'warning');
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

    const fechaRaw = this.reservaForm.controls.fechaReserva.value;
    const fechaReserva = new Date(fechaRaw);
    if (Number.isNaN(fechaReserva.getTime()) || fechaReserva <= new Date()) {
      Swal.fire('Fecha inválida', 'Selecciona una fecha/hora futura para la reserva.', 'warning');
      return;
    }

    const payload: CrearReservaDirectaDTO = {
      emailUsuario: this.tokenService.getEmail(),
      mesaId: this.mesa.id,
      fechaReserva,
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
      },
      error: () => {
        Swal.fire('No disponible', 'No fue posible cargar el detalle de esta mesa.', 'error').then(() => {
          void this.router.navigate(['/'], { queryParams: { view: 'mesas' } });
        });
      },
    });
  }

  private esMesaDisponible(): boolean {
    return (this.mesa?.estado ?? '').toLowerCase() === 'disponible';
  }

  private buildMinDateTimeLocal(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    now.setSeconds(0, 0);
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

}
