import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

/**
 * Notificaciones tipo toast para el panel admin (misma familia visual que SweetAlert2 en el cliente).
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3200,
    timerProgressBar: true,
  });

  success(message: string): void {
    void this.toast.fire({ icon: 'success', title: message });
  }

  error(message: string): void {
    void this.toast.fire({ icon: 'error', title: message });
  }

  warning(message: string): void {
    void this.toast.fire({ icon: 'warning', title: message });
  }

  info(message: string): void {
    void this.toast.fire({ icon: 'info', title: message });
  }
}
