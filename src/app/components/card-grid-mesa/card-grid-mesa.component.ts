import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ItemMesaDTO } from '../../dto/item-mesa-dto';
import Swal from 'sweetalert2';
import {TokenService} from '../../services/token.service';
import {ClienteService} from '../../services/cliente.service';
import {MesaDTO} from '../../dto/mesa-dto';
import {MensajeDTO} from '../../dto/mensaje-dto';

@Component({
  selector: 'app-mesas-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-grid-mesa.component.html',
  styleUrl: './card-grid-mesa.component.css'
})
export class CardGridMesaComponent {
  @Input() mesas: ItemMesaDTO[] = [];
  isLoading = false;

  get isAdmin(): boolean {
    return this.tokenService.getRol() === 'ADMIN';
  }

  constructor(private router: Router,
              private clienteService: ClienteService,
              private tokenService: TokenService) {

  }

  irADetalleMesa(id: string): void {
    this.router.navigate(['/mesas', id]);
  }

  irAEditarMesaAdmin(event: Event, mesa: ItemMesaDTO): void {
    event.stopPropagation();
    void this.router.navigate(['/admin', 'tables'], { queryParams: { edit: mesa.id } });
  }

  abrirDetalleDesdeBoton(event: Event, mesa: ItemMesaDTO): void {
    event.stopPropagation();
    this.irADetalleMesa(mesa.id);
  }

  agregarAGestorReservas(event: Event, mesa: ItemMesaDTO): void {
    event.stopPropagation();

    if (this.isAdmin) {
      return;
    }

    if (!this.tokenService.getToken()) {
      Swal.fire({
        title: 'No estás logueado',
        text: 'Para reservar una mesa, debes iniciar sesión.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Iniciar sesión',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          void this.router.navigate(['/login']);
        }
      });
      return;
    }

    this.isLoading = true;
    this.clienteService.obtenerReservaEmail(this.tokenService.getEmail()).subscribe({
      next: (mensaje: MensajeDTO) => {
        if (mensaje.error) {
          this.isLoading = false;
          Swal.fire('Error', 'No se pudo preparar el gestor de reservas.', 'error');
          return;
        }

        const mesaGestor: MesaDTO = {
          id: mesa.id,
          nombre: mesa.nombre,
          estado: 'Disponible',
          localidad: mesa.localidad,
          precioReserva: mesa.precioReserva,
          capacidad: mesa.capacidad,
          imagen: mesa.imagen,
          idReserva: '-',
          idGestorReserva: String(mensaje.reply),
        };

        this.clienteService.agregarMesaGestorReservas(mesaGestor).subscribe({
          next: () => {
            this.isLoading = false;
            Swal.fire('Listo', 'Mesa agregada al gestor de reservas.', 'success');
          },
          error: (error) => {
            this.isLoading = false;
            Swal.fire('Error', error?.error?.reply || 'No se pudo agregar la mesa al gestor.', 'error');
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire('Error', error?.error?.reply || 'No se pudo preparar el gestor de reservas.', 'error');
      }
    });
  }
}

