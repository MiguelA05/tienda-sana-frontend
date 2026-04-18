import { Component, Input, OnInit } from '@angular/core';
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
export class CardGridMesaComponent implements OnInit {
  @Input() mesas: ItemMesaDTO[] = [];
  isLoading = false;
  mesasEnGestor = new Set<string>();

  get isAdmin(): boolean {
    return this.tokenService.getRol() === 'ADMIN';
  }

  constructor(private router: Router,
              private clienteService: ClienteService,
              private tokenService: TokenService) {

  }

  ngOnInit(): void {
    this.cargarMesasEnGestor();
  }

  irADetalleMesa(id: string): void {
    this.router.navigate(['/mesas', id]);
  }

  irAEditarMesaAdmin(event: Event, mesa: ItemMesaDTO): void {
    event.stopPropagation();
    void this.router.navigate(['/admin', 'tables'], { queryParams: { edit: mesa.id } });
  }

  agregarAGestorReservas(event: Event, mesa: ItemMesaDTO): void {
    event.stopPropagation();

    if (this.isAdmin) {
      return;
    }

    if (this.estaMesaEnGestor(mesa.id)) {
      Swal.fire('Información', 'Esta mesa ya fue agregada al gestor de reservas.', 'info');
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
          duracionReservaMinutos: mesa.duracionReservaMinutos,
          idReserva: '-',
          idGestorReserva: String(mensaje.reply),
        };

        this.clienteService.agregarMesaGestorReservas(mesaGestor).subscribe({
          next: () => {
            this.isLoading = false;
            this.mesasEnGestor.add(mesa.id);
            Swal.fire('Listo', 'Mesa agregada al gestor de reservas.', 'success');
          },
          error: (error) => {
            this.isLoading = false;
            const message = error?.error?.reply || 'No se pudo agregar la mesa al gestor.';
            const isMesaDuplicada = error?.status === 409 ||
              String(message).toLowerCase().includes('ya fue agregada');

            if (isMesaDuplicada) {
              this.mesasEnGestor.add(mesa.id);
              Swal.fire('Información', 'Esta mesa ya fue agregada al gestor de reservas.', 'info');
              return;
            }

            Swal.fire('Error', message, 'error');
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire('Error', error?.error?.reply || 'No se pudo preparar el gestor de reservas.', 'error');
      }
    });
  }

  estaMesaEnGestor(mesaId: string): boolean {
    return this.mesasEnGestor.has(mesaId);
  }

  private cargarMesasEnGestor(): void {
    if (this.isAdmin || !this.tokenService.getToken()) {
      return;
    }

    this.clienteService.listarMesasGestorReservas(this.tokenService.getEmail()).subscribe({
      next: (mensaje: MensajeDTO) => {
        const mesasGestor = Array.isArray(mensaje.reply) ? mensaje.reply as Array<{ id?: string }> : [];
        this.mesasEnGestor = new Set(mesasGestor.map(m => String(m.id ?? '')).filter(id => id.length > 0));
      },
      error: () => {
        this.mesasEnGestor.clear();
      }
    });
  }
}

