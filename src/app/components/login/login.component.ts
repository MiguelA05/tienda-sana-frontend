import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { LoginDTO } from '../../dto/login-dto';
import { AuthService } from '../../services/auth.services';
import { TokenService } from '../../services/token.service';
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
   * Constructor de la clase LoginComponent
   * @param fb formBuilder para construir formularios reactivos
   * @param authService authService para manejar la autenticación
   * @param tokenService tokenService para manejar el token de autenticación
   */
  constructor(private fb: FormBuilder, private authService: AuthService, private tokenService:TokenService ) {}

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

    if (this.loginForm.valid) {
      const loginDTO= this.loginForm.value as LoginDTO;
      this.authService.iniciarSesion(loginDTO).subscribe({
        next: (data) => {
          this.tokenService.login(data.reply.token);
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error.reply,
          });
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