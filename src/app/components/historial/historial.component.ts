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
  modalTipo: 'compra' | 'reserva' | null = null;
  compraSeleccionada: ItemVentaDTO | null = null;
  reservaSeleccionada: ItemReservaDTO | null = null;

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
        const raw = (response.reply as unknown[]) ?? [];
        this.compras = raw.map((item) => this.normalizeCompra(item));
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
        const raw = (response.reply as unknown[]) ?? [];
        this.reservas = raw.map((item) => this.normalizeReserva(item));
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

    const fechaObj = this.parseDate(fecha);
    if (!fechaObj) {
      return 'Fecha no disponible';
    }

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
  verDetalleCompra(compra: ItemVentaDTO): void {
    this.compraSeleccionada = compra;
    this.reservaSeleccionada = null;
    this.modalTipo = 'compra';
  }

  /**
   * Navega a los detalles de una reserva específica
   * @param idReserva ID de la reserva a ver
   */
  verDetalleReserva(reserva: ItemReservaDTO): void {
    this.reservaSeleccionada = reserva;
    this.compraSeleccionada = null;
    this.modalTipo = 'reserva';
  }

  cerrarDetalle(): void {
    this.modalTipo = null;
    this.compraSeleccionada = null;
    this.reservaSeleccionada = null;
  }

  /**
   * Obtiene el total de productos en una compra
   * @param compra Compra a evaluar
   * @returns Número total de productos
   */
  getTotalProductos(compra: ItemVentaDTO): number {
    return (compra.productos ?? []).reduce((total, detalle) => total + (detalle.cantidad ?? 0), 0);
  }

  getCompraTotal(compra: ItemVentaDTO): number {
    const total = this.toNumber(compra.total);
    if (total > 0) {
      return total;
    }
    return (compra.productos ?? []).reduce((acc, p) => acc + this.toNumber(p.valor) * this.toNumber(p.cantidad), 0);
  }

  getDetalleSubtotal(valor: number, cantidad: number): number {
    return this.toNumber(valor) * this.toNumber(cantidad);
  }

  private normalizeCompra(item: unknown): ItemVentaDTO {
    const raw = (item ?? {}) as Record<string, unknown>;
    const productosRaw = Array.isArray(raw['productos']) ? raw['productos'] : [];
    const productos = productosRaw.map((detalle) => {
      const d = (detalle ?? {}) as Record<string, unknown>;
      return {
        productoId: String(d['productoId'] ?? d['idProducto'] ?? 'Sin referencia'),
        valor: this.toNumber(d['valor']),
        cantidad: this.toNumber(d['cantidad']),
      };
    });

    return {
      clienteId: String(raw['clienteId'] ?? raw['emailUsuario'] ?? ''),
      fecha: this.parseDate(raw['fecha']) ?? null,
      productos,
      tipoPago: String(raw['tipoPago'] ?? raw['paymentType'] ?? 'Sin confirmar'),
      estado: String(raw['estado'] ?? raw['status'] ?? 'PENDIENTE'),
      fechaPago: this.parseDate(raw['fechaPago'] ?? raw['paymentDate']) ?? null,
      valorTransaccion: this.toNumber(raw['valorTransaccion'] ?? raw['transactionValue']),
      id: String(raw['id'] ?? raw['idVenta'] ?? 'Sin ID'),
      total: this.toNumber(raw['total']),
      promocionId: String(raw['promocionId'] ?? ''),
    } as ItemVentaDTO;
  }

  private normalizeReserva(item: unknown): ItemReservaDTO {
    const raw = (item ?? {}) as Record<string, unknown>;
    return {
      emailUsuaio: String(raw['emailUsuario'] ?? raw['emailUsuaio'] ?? ''),
      fechaReserva: this.parseDate(raw['fechaReserva']) ?? null,
      fechaFinReserva: this.parseDate(raw['fechaFinReserva']) ?? null,
      estadoReserva: String(raw['estadoReserva'] ?? 'PENDIENTE'),
      paymentType: String(raw['paymentType'] ?? 'Sin confirmar'),
      status: String(raw['status'] ?? 'Sin confirmar'),
      paymentDate: this.parseDate(raw['paymentDate']) ?? null,
      transactionValue: this.toNumber(raw['transactionValue']),
      idReserva: String(raw['idReserva'] ?? raw['id'] ?? 'Sin ID'),
      total: this.toNumber(raw['total']),
      cantidadPersonas: this.toNumber(raw['cantidadPersonas']),
      mesas: Array.isArray(raw['mesas']) ? (raw['mesas'] as ItemReservaDTO['mesas']) : [],
    } as ItemReservaDTO;
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private parseDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (Array.isArray(value) && value.length >= 3) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = value.map((v) => Number(v));
      if ([year, month, day].some((v) => Number.isNaN(v))) {
        return null;
      }
      const d = new Date(year, month - 1, day, hour, minute, second);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const year = Number(obj['year']);
      const month = Number(obj['monthValue'] ?? obj['month']);
      const day = Number(obj['dayOfMonth'] ?? obj['day']);
      const hour = Number(obj['hour'] ?? 0);
      const minute = Number(obj['minute'] ?? 0);
      const second = Number(obj['second'] ?? 0);
      if ([year, month, day].some((v) => Number.isNaN(v))) {
        return null;
      }
      const d = new Date(year, month - 1, day, hour, minute, second);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  }
}
