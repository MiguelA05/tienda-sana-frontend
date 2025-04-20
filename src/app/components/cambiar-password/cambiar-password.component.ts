import { Component } from '@angular/core';
import { AbstractControlOptions, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.services';
import { CambiarContraseniaDTO } from '../../dto/cambiar-contrasenia-dto';
import { AuthService } from '../../services/auth.services';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './cambiar-password.component.html',
  styleUrls: ['./cambiar-password.component.css']
})
export class CambiarPasswordComponent {
  changePasswordForm!: FormGroup;
  email: string;
  isLoading: boolean = false;

  /**
   * Constructor de la clase CambiarPasswordComponent
   * @param formBuilder formBuilder para construir formularios reactivos 
   * @param dataService dataService para obtener datos compartidos entre componentes
   * @param authService authService para manejar la autenticación
   * @param router router para navegar entre rutas
   */
  constructor(
    private formBuilder: FormBuilder,
    private dataService: DataService,
    private authService: AuthService,
    private router: Router
  ) {
    this.email = this.dataService.getData();
    this.createForm();
  }

  /**
   * Método para enviar el formulario de cambio de contraseña
   */
  public changePassword() {
    const cambiarContra = this.changePasswordForm.value as CambiarContraseniaDTO;
    this.authService.cambiarContrasenia(cambiarContra).subscribe({
      next: () => {
        Swal.fire({
          title: 'Contraseña cambiada',
          text: 'La contraseña se ha cambiado, intente ingresar de nuevo',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
        this.router.navigate(['/']);
      },
      error: (error) => {
        Swal.fire({
          title: 'Error',
          text: error.error.reply,
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  /**
   * Método para verificar si el formulario es válido
   */
  private createForm() {
    this.changePasswordForm = this.formBuilder.group(
      {
        email: [this.email, [Validators.required, Validators.email]],
        codigoVerificacion: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
        nuevaContrasenia: ['', [Validators.required, Validators.maxLength(20), Validators.minLength(7)]],
        confirmacionContrasenia: ['', [Validators.required]]
      },
      { validators: this.passwordsMatchValidator } as AbstractControlOptions
    );
  }

  /**
   * Metodo para verificar si un campo es inválido
   * @param formGroup formGroup del formulario
   * @returns verdadero si el campo es inválido, falso si es válido
   */
  passwordsMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('nuevaContrasenia')?.value;
    const passwordConfirmation = formGroup.get('confirmacionContrasenia')?.value;
    return password === passwordConfirmation ? null : { passwordsMismatch: true };
  }

  /**
   * Método para verificar si un campo es inválido
   */
  public reenviarCodigo() {
    this.authService.enviarCodigoRecuperacion(this.email).subscribe({
      next: () => {
        Swal.fire({
          title: 'Código reenviado',
          text: 'El código de recuperación ha sido enviado a su correo electrónico',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      },
      error: (error) => {
        Swal.fire({
          title: 'Error',
          text: error.error.reply,
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }
}