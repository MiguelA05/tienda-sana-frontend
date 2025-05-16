import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { TokenService } from '../../services/token.service';
import { MensajeDTO } from '../../dto/mensaje-dto';
import { ItemVentaDTO } from '../../dto/item-venta-dto';
import { ItemReservaDTO } from '../../dto/item-reserva-dto';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class HistorialComponent implements OnInit {

  compras: ItemVentaDTO[] = [];
  reservas: ItemReservaDTO[] = [];
  isLoadingCompras: boolean = false;
  isLoadingReservas: boolean = false;
  tipoHistorial: 'compras' | 'reservas' = 'compras';

  constructor(
    private clienteService: ClienteService,
    private tokenService: TokenService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (!this.tokenService.getToken()) {
      Swal.fire({
        title: "No estás logueado",
        text: "Para ver el historial, debes iniciar sesión.",
        icon: "info",
        confirmButtonText: "Iniciar sesión"
      }).then(() => {
        this.router.navigate(['/login']);
      });
      return;
    }
    this.cargarHistorialCompras();
    this.cargarHistorialReservas();
  }

  /**
   * Cambia entre las vistas de compras y reservas
   * @param tipo Tipo de historial a mostrar ('compras' o 'reservas')
   */
  cambiarTipoHistorial(tipo: 'compras' | 'reservas'): void {
    this.tipoHistorial = tipo;
  }

  /**
   * Carga el historial de compras del usuario
   */
  cargarHistorialCompras(): void {
    this.isLoadingCompras = true;
    const idUsuario = this.tokenService.getIDCuenta();

    this.clienteService.listarComprasCliente(idUsuario).subscribe({
      next: (response: MensajeDTO) => {
        this.compras = response.reply;
        this.isLoadingCompras = false;
      },
      error: (error) => {
        console.error("Error al cargar el historial de compras", error);
        this.isLoadingCompras = false;
        Swal.fire("Error", "No se pudo cargar el historial de compras", "error");
      }
    });
  }

  /**
   * Carga el historial de reservas del usuario
   */
  cargarHistorialReservas(): void {
    this.isLoadingReservas = true;
    const idUsuario = this.tokenService.getIDCuenta();

    this.clienteService.listarReservasCliente(idUsuario).subscribe({
      next: (response: MensajeDTO) => {
        this.reservas = response.reply;
        this.isLoadingReservas = false;
      },
      error: (error) => {
        console.error("Error al cargar el historial de reservas", error);
        this.isLoadingReservas = false;
        Swal.fire("Error", "No se pudo cargar el historial de reservas", "error");
      }
    });
  }

  /**
   * Formatea una fecha para mostrar en formato legible
   * @param fecha Fecha a formatear
   * @returns Fecha formateada
   */
  formatearFecha(fecha: string | Date | null): string {
    if (!fecha) return 'Fecha no disponible';

    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return fechaObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene el color de estado para la compra o reserva
   * @param estado Estado de la compra o reserva
   * @returns Clase CSS correspondiente al estado
   */
  getEstadoClass(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'completado':
      case 'pagado':
      case 'confirmado':
        return 'text-success';
      case 'pendiente':
      case 'en proceso':
        return 'text-warning';
      case 'cancelado':
      case 'rechazado':
        return 'text-danger';
      default:
        return '';
    }
  }

  /**
   * Navega a los detalles de una compra específica
   * @param idCompra ID de la compra a ver
   */
  verDetalleCompra(idCompra: string): void {
    this.router.navigate(['/detalle-compra', idCompra]);
  }

  /**
   * Navega a los detalles de una reserva específica
   * @param idReserva ID de la reserva a ver
   */
  verDetalleReserva(idReserva: string): void {
    this.router.navigate(['/detalle-reserva', idReserva]);
  }

  /**
   * Obtiene el total de productos en una compra
   * @param compra Compra a evaluar
   * @returns Número total de productos
   */
  getTotalProductos(compra: ItemVentaDTO  ): number {
    return compra.productos.reduce((total, detalle) => total + detalle.cantidad, 0);
  }
}
