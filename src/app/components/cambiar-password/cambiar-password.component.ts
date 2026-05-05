import { Component, OnInit } from '@angular/core';
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
export class CambiarPasswordComponent implements OnInit {
  changePasswordForm!: FormGroup;
  email!: string;
  isLoading: boolean = false;
  isPasswordVisible = false;
  isConfirmPasswordVisible = false;

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

  }
  ngOnInit(): void {
    this.email = localStorage.getItem('emailRecuperacion') || '';
    this.createForm();
  }

  /**
   * Método para enviar el formulario de cambio de contraseña
   */
  public changePassword() {
    const cambiarContra = this.changePasswordForm.getRawValue() as CambiarContraseniaDTO;
    console.log("ESTE ES EL CODIGO: "+cambiarContra.codigoVerificacion);
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
        email: [
          { value: this.email, disabled: true }, ,
          [
            Validators.required,
            Validators.email,
            Validators.pattern(
              /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
            )
          ]
        ],
        codigoVerificacion: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
        nuevaContrasenia: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(20),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
          ]
        ],
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
    const emailToSend = this.changePasswordForm.get('email')?.value;
    this.isLoading = true;
    this.authService.enviarCodigoRecuperacion(emailToSend).subscribe({
      next: (data) => {
        this.isLoading = false;
        Swal.fire({
          title: 'Código reenviado',
          text: 'El código de recuperación ha sido enviado a su correo electrónico',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
        this.isLoading = false;
      },
      error: (error) => {
        if (this.changePasswordForm.get('email')?.value === '') {
          this.isLoading = false;
          Swal.fire({
            title: 'Error',
            text: 'No se ha ingresado un correo electrónico',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          })
          this.isLoading = false;
        } else {
          Swal.fire({
            title: 'Error',
            text: error.error.reply,
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
          this.isLoading = false;
        }

      }
    });
  }

  /**
  * Método para obtener el mensaje de error del campo contraseña
  * @returns Mensaje de error específico
  */
  getPasswordErrorMessage(): string {
    const passwordControl = this.changePasswordForm.get('nuevaContrasenia');

    if (passwordControl?.hasError('required')) {
      return 'La contraseña es obligatoria';
    }

    if (passwordControl?.hasError('minlength')) {
      return `La contraseña debe tener al menos ${passwordControl.getError('minlength').requiredLength} caracteres`;
    }

    if (passwordControl?.hasError('maxlength')) {
      return `La contraseña no debe exceder los ${passwordControl.getError('maxlength').requiredLength} caracteres`;
    }
    if (passwordControl?.hasError('pattern')) {
      const value = passwordControl.value || '';
      if (!/[A-Z]/.test(value)) {
        return 'La contraseña debe contener al menos una letra mayúscula';
      }
      if (!/[a-z]/.test(value)) {
        return 'La contraseña debe contener al menos una letra minúscula';
      }
      if (!/\d/.test(value)) {
        return 'La contraseña debe contener al menos un número';
      }
      if (!/[\W_]/.test(value)) {
        return 'La contraseña debe contener al menos un carácter especial';
      }
      return 'La contraseña no cumple con los requisitos de seguridad';
    }
    return 'Por favor ingrese una contraseña válida';
  }


  getConfirmPasswordErrorMessage(): string {
    const confirmPasswordControl = this.changePasswordForm.get('confirmacionContrasena');

    if (confirmPasswordControl?.hasError('required')) {
      return 'La confirmación de contraseña es obligatoria';
    }

    return 'Por favor confirme su contraseña';
  }

  /**
   * Método para obtener el mensaje de error del campo email
   * @returns Mensaje de error específico
   */
  getEmailErrorMessage(): string {
    const emailControl = this.changePasswordForm.get('email');

    if (emailControl?.hasError('required')) {
      return 'El correo electrónico es obligatorio';
    }

    if (emailControl?.hasError('email') || emailControl?.hasError('pattern')) {
      return 'Por favor ingrese un formato de correo electrónico válido (nombreusuario@dominio)';
    }

    return 'Por favor ingrese un correo electrónico válido';
  }

  /**
   * Método para verificar si debe mostrar el error de contraseñas no coincidentes
   * @returns true si las contraseñas no coinciden y el campo ha sido tocado
   */
  shouldShowPasswordMismatchError(): boolean {
    return this.changePasswordForm.hasError('passwordsMismatch') &&
      (!!this.changePasswordForm.get('confirmacionContrasenia')?.touched ||
        !!this.changePasswordForm.get('nuevaContrasenia')?.touched);
  }

  /**
   * Método para verificar si un campo debe mostrar error
   * @param controlName Nombre del control a verificar
   * @returns true si el campo tiene error y ha sido tocado
   */
  shouldShowError(controlName: string): boolean {
    const control = this.changePasswordForm.get(controlName);
    return control ? control.invalid && control.touched : false;
  }


  /**
   * Método para mostrar u ocultar la contraseña
   */
  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  /**
   * Método para mostrar u ocultar la confirmación de contraseña
   */
  toggleConfirmPasswordVisibility(): void {
    this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible;
  }

}