import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ItemMesaDTO } from '../../dto/item-mesa-dto';
import {ItemProductoDTO} from '../../dto/item-producto-dto';
import Swal from 'sweetalert2';
import {ItemCarritoDTO} from '../../dto/item-carrito-dto';
import {TokenService} from '../../services/token.service';
import {ClienteService} from '../../services/cliente.service';
import {MesaDTO} from '../../dto/mesa-dto';
import {CrearReservaDTO} from '../../dto/crear-reserva-dto';
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
  cantidadSeleccionada: number = 1;
  isLoading: boolean = false;

  constructor(private router: Router,
              private clienteService: ClienteService,
              private tokenService: TokenService) {

  }

  irADetalleMesa(id: string): void {
    this.router.navigate(['/mesas', id]);
  }

  reservarMesa(event: Event, mesa: ItemMesaDTO): void {
    console.log("Programar la funcion de registrar reserva");

    event.stopPropagation(); // Detener propagación del evento

    if (!this.tokenService.getToken()) {
      Swal.fire({
        title: "No estás logueado",
        text: "Para reservar una mesa, debes iniciar sesión.",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Iniciar sesión",
        cancelButtonText: "Cancelar"
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
      return;
    }

    const selectedMesa = this.mesas.find(p => p.id === mesa.id);
    if (!selectedMesa) {
      Swal.fire("Error!", "Mesa no encontrada.", "error");
      return;
    }

    const cantidad = this.cantidadSeleccionada;
    if (cantidad <= 0) {
      Swal.fire("Error!", "Debe seleccionar al menos una mesa", "error");
      return;
    }

    let email:any;

    this.clienteService.obtenerReservaEmail(this.tokenService.getEmail()).subscribe((mensaje: MensajeDTO) => {
      if (!mensaje.error) {
        email = mensaje.reply; // <- aquí accedes a los datos
        console.log(mensaje.reply)
        const reservation: MesaDTO = {
          id: mesa.id,
          nombre: mesa.nombre,
          estado: "Reservada",
          localidad: mesa.localidad,
          precioReserva: mesa.precioReserva,
          capacidad: mesa.capacidad,
          imagen: mesa.imagen,
          idReserva: "-",
          idGestorReserva: ""+email
        };

        if (!reservation.id || !reservation.estado || reservation.capacidad <= 0) {
          console.error("Datos inválidos para agregar al gestor de reservas:", reservation);
          Swal.fire("Error!", "Los datos enviados al servidor son inválidos.", "error");
          this.isLoading = false;
          return;
        }

        this.isLoading = true;

        this.clienteService.agregarMesaGestorReservas(reservation).subscribe({
          next: () => {
            Swal.fire("Éxito!", "Se ha agregado la reserva al gestor de reservas", "success");
            this.isLoading = false;
          },
          error: (error) => {
            Swal.fire("Error!", error.error.respuesta || "Hubo un problema al agregar el item.", "error");
            this.isLoading = false;
          }
        });
      } else {
        Swal.fire("Error!",'Ocurrió un error: '+ mensaje);
      }
    });



  }

}

