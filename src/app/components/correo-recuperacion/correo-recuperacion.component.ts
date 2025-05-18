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
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
          )
        ]
      ],
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

  /**
   * Método para verificar si un campo debe mostrar error
   * @param controlName Nombre del control a verificar
   * @returns true si el campo tiene error y ha sido tocado
   */
  shouldShowError(controlName: string): boolean {
    const control = this.recoveryForm.get(controlName);
    return control ? control.invalid && control.touched : false;
  }

  /**
   * Método para obtener el mensaje de error del campo email
   * @returns Mensaje de error específico
   */
  getEmailErrorMessage(): string {
    const emailControl = this.recoveryForm.get('email');

    if (emailControl?.hasError('required')) {
      return 'El correo electrónico es obligatorio';
    }

    if (emailControl?.hasError('email') || emailControl?.hasError('pattern')) {
      return 'Por favor ingrese un formato de correo electrónico válido (nombreusuario@dominio)';
    }

    return 'Por favor ingrese un correo electrónico válido';
  }
}