import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.services';
import Swal from 'sweetalert2';
import { DataService } from '../../services/data.services';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-correo-recuperacion',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterModule],
  templateUrl: './correo-recuperacion.component.html',
  styleUrls: ['./correo-recuperacion.component.css']
})
export class CorreoRecuperacionComponent {
  recoveryForm!: FormGroup;
  isLoading: boolean = false;

  /**
   * constructor de la clase CorreoRecuperacionComponent
   * @param formBuilder formBuilder para construir formularios reactivos
   * @param authService authService para manejar la autenticación
   * @param dataService dataService para manejar datos compartidos entre componentes
   * @param router router para navegar entre rutas
   */
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private dataService: DataService,
    private router: Router
  ) {
    this.createForm();
  }

  /**
   * Método para inicializar el formulario de recuperación de contraseña
   */
  private createForm() {
    this.recoveryForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Método para enviar el código de recuperación al correo electrónico
   */
  public sendValidationCode() {
    this.isLoading = true;
    this.authService.enviarCodigoRecuperacion(this.recoveryForm.get('email')?.value).subscribe({
      next: (data) => {
        this.isLoading = false;
        Swal.fire({
          title: 'Correo enviado',
          text: 'Código de recuperación enviado con éxito',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
        this.dataService.setData(this.recoveryForm.get('email')?.value);
        this.router.navigate(['/cambiar-password']);
      },
      error: (error) => {
        this.isLoading = false;
        if (this.recoveryForm.get('email')?.value === '') {
          Swal.fire({
            title: 'Error',
            text: 'No se ha ingresado un correo electrónico',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        } else {
          Swal.fire({
            title: 'Error',
            text: error.error.reply,
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      }
    });
  }
}