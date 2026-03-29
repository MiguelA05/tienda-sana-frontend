import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminTable, TableDisplayStatus } from '../../models/admin-table.model';
import { effectiveTableStatus } from '../../services/table.service';

@Component({
  selector: 'app-admin-table-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-map.component.html',
  styleUrl: './table-map.component.css',
})
export class AdminTableMapComponent {
  @Input({ required: true }) tables: AdminTable[] = [];

  /** Click en tarjeta: ciclo de estado operativo (padre). */
  @Output() walkInCycle = new EventEmitter<AdminTable>();

  effective(t: AdminTable): TableDisplayStatus {
    return effectiveTableStatus(t);
  }

  cardClass(t: AdminTable): string {
    if (!t.visibleToClient) {
      return 'map-card map-card--disabled';
    }
    const e = this.effective(t);
    if (e === 'OCCUPIED') {
      return 'map-card map-card--occupied';
    }
    if (e === 'RESERVED') {
      return 'map-card map-card--reserved';
    }
    return 'map-card map-card--free';
  }

  /** Mismo texto de estado que ve el cliente en el catálogo. */
  statusLabel(t: AdminTable): string {
    if (!t.visibleToClient) {
      return 'Oculta al público';
    }
    return t.estado?.trim() || '—';
  }

  /** Referencia corta para no mostrar el id completo. */
  shortRef(id: string): string {
    if (!id || id.length <= 10) {
      return id;
    }
    return `…${id.slice(-6)}`;
  }

  onCardClick(t: AdminTable): void {
    if (!t.visibleToClient) {
      return;
    }
    this.walkInCycle.emit(t);
  }
}
