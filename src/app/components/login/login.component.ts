import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginDTO } from '../../dto/login-dto';
import { AuthService } from '../../services/auth.services';
import { TokenService } from '../../services/token.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  isLoading: boolean = false;
  loginForm!: FormGroup;
  isPasswordVisible = false;

  /**
   * @param fb formBuilder para construir formularios reactivos
   * @param authService authService para manejar la autenticación
   * @param tokenService tokenService para manejar el token de autenticación
   * @param router Router para la navegación
   */
  constructor(private fb: FormBuilder, private authService: AuthService, private tokenService: TokenService, private router: Router) { }


  /**
   * Método para inicializar el componente
   */
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      contrasenia: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
      remember: [false]
    });
  }

  /**
   * Método para enviar el formulario de inicio de sesión
   */
  public login(): void {
    // Marcar todos los campos como touched para mostrar errores si existen
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });

    if (!this.loginForm.valid) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    if (this.loginForm.valid) {
      const loginDTO = this.loginForm.value as LoginDTO;
      this.authService.iniciarSesion(loginDTO).subscribe({
        next: (data) => {
          this.isLoading = false;
          this.tokenService.login(data.reply.token);
        },
        error: (error) => {
          this.isLoading = false;
          if (error.error.reply === 'Cuenta no activada' || error.error.respuesta === 'Cuenta no activada') {
            Swal.fire({
              icon: 'warning',
              title: 'Cuenta no activada en el sistema',
              text: 'Tu cuenta aún no ha sido activada. ¿Deseas activar tu cuenta ahora?',
              showCancelButton: true,
              confirmButtonText: 'Activar cuenta',
              cancelButtonText: 'Cancelar'
            }).then(result => {
              if (result.isConfirmed) {
                // Redirige a la pantalla de verificación de cuenta
                this.router.navigate(['/verificar-cuenta'], {
                  queryParams: { email: this.loginForm.get('email')?.value }
                });
              }
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error de inicio de sesión',
              text: error.error.reply,
            });
          }
        }

      })

    }
  }

  /**
   * Método para mostrar u ocultar la contraseña
   */
  public togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }


  /**
   * Método para obtener el mensaje de error del campo email según la validación fallida
   * @returns Mensaje de error específico o null si no hay error
   */
  public getEmailErrorMessage(): string | null {
    const emailControl = this.loginForm.get('email');

    if (emailControl?.hasError('required')) {
      return 'El correo electrónico es obligatorio';
    }

    if (emailControl?.hasError('email')) {
      return 'Por favor, ingrese un formato de correo electrónico válido';
    }

    return null;
  }

  /**
   * Método para obtener el mensaje de error del campo contraseña según la validación fallida
   * @returns Mensaje de error específico o null si no hay error
   */
  public getPasswordErrorMessage(): string | null {
    const passwordControl = this.loginForm.get('contrasenia');

    if (passwordControl?.hasError('required')) {
      return 'La contraseña es obligatoria';
    }

    if (passwordControl?.hasError('minlength')) {
      return `La contraseña debe tener al menos ${passwordControl.getError('minlength').requiredLength} caracteres`;
    }

    if (passwordControl?.hasError('maxlength')) {
      return `La contraseña no debe exceder los ${passwordControl.getError('maxlength').requiredLength} caracteres`;
    }

    return null;
  }

  /**
   * Método para verificar si un campo debe mostrar error
   * @param controlName Nombre del control a verificar
   * @returns Verdadero si el campo tiene error y ha sido tocado
   */
  public shouldShowError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return control ? control.invalid && control.touched : false;
  }
}