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
}