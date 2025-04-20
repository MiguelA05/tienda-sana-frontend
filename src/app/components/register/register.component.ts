import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CrearCuentaDTO } from '../../dto/crear-cuenta-dto';
import { AuthService } from '../../services/auth.services';
import { DataService } from '../../services/data.services';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registroForm!: FormGroup;
  isLoading: boolean = false;
  isPasswordVisible = false;
  isConfirmPasswordVisible = false;

  /**
   * Constructor de la clase RegisterComponent
   * @param fb formBuilder para construir formularios reactivos
   * @param router router para navegar entre rutas
   * @param authService authService para manejar la autenticación
   * @param dataService dataService para manejar datos compartidos entre componentes
   */
  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService, private dataService: DataService) {}

  /**
   * Método para inicializar el componente
   */
  ngOnInit(): void {
    this.registroForm = this.fb.group({
      dni: ['', [Validators.required, Validators.maxLength(10)]],
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      direccion: ['', [Validators.required, Validators.maxLength(255)]],
      telefono: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(15)]],
      email: ['', [Validators.required, Validators.email]],
      contrasenia: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
      confirmacionContrasena: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordsMatchValidator } // Aplica el validador aquí
  );
  }


  /** 
   * Método para registrar un nuevo usuario en la plataforma
  */
  registrar(): void {
    if (this.registroForm.valid) {
     const crearCuentaDTO = this.registroForm.value as CrearCuentaDTO;
     console.log(crearCuentaDTO);
     this.authService.crearCuenta(crearCuentaDTO).subscribe({
        next: (data) => {
          Swal.fire({
            title: 'Cuenta creada',
            text: 'La cuenta se ha creado correctamente, revise en su correo electrónico para activar su cuenta.'+ 
            'En la carpeta de spam o correo no deseado.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          })
          this.dataService.setData(this.registroForm.get('email')?.value);
          this.router.navigate(['/verificar-cuenta']);
        },
        error: (error) => {
          Swal.fire({
            title: 'Error',
            text: error.error.respuesta,
            icon: 'error',
            confirmButtonText: 'Aceptar'
          })
        }
      }); 
    }
  }
  
  /**
   * Metodo para verificar si el campo cédula es inválido
   * @returns true si el campo es inválido, false si no lo es
   */
  get isCedulaInvalid(): boolean {
    return this.isFieldInvalid('dni');
  }

  /**
   * Metodo para verificar si el campo nombre es inválido
   * @returns true si el campo es inválido, false si no lo es
   */
  get isNombreInvalid(): boolean {
    return this.isFieldInvalid('nombre');
  }

  /**
   * Metodo para verificar si el campo dirección es inválido
   * @returns true si el campo es inválido, false si no lo es
   */
  get isDireccionInvalid(): boolean {
    return this.isFieldInvalid('direccion');
  }

  /**
   * Metodo para verificar si el campo teléfono es inválido
   * @returns true si el campo es inválido, false si no lo es
   */
  get isTelefonoInvalid(): boolean {
    return this.isFieldInvalid('telefono');
  }

  /**
   * Metodo para verificar si el campo email es inválido
   * @returns true si el campo es inválido, false si no lo es
   */ 
  get isEmailInvalid(): boolean {
    return this.isFieldInvalid('email');
  }

  /**
   * Metodo para verificar si el campo términos y condiciones es inválido
   * @returns true si el campo es inválido, false si no lo es
   */
  get isTermsInvalid(): boolean {
    return this.isFieldInvalid('terms');
  }

  /**
   * Metodo para verificar si el campo contraseña es inválido
   * @returns true si el campo es inválido, false si no lo es
   */
  get isPasswordInvalid(): boolean {
    return this.isFieldInvalid('contrasenia');
  }

  /**
   * Metodo para verificar si el campo confirmación de contraseña es inválido
   * @returns true si el campo es inválido, false si no lo es
   */
  get isConfirmaPasswordInvalid(): boolean {
    return this.isFieldInvalid('confirmacionContrasena');
  }

  /**
   * Metodo para verificar si el campo es inválido
   * @param field nombre del campo
   * @returns true si el campo es inválido, false si no lo es
   */
  private isFieldInvalid(field: string): boolean {
    const control = this.registroForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }


  /**
   * Metodo para marcar todos los campos del formulario como tocados
   * @param formGroup FormGroup a marcar como tocado
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
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

  /**
   * Método para validar si las contraseñas coinciden
   * @param formGroup FormGroup a validar
   * @returns true si las contraseñas coinciden, false si no coinciden
   */
  passwordsMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('contrasenia')?.value;
    const confirmaPassword = formGroup.get('confirmacionContrasena')?.value;
    // Si las contraseñas no coinciden, devuelve un error, de lo contrario, null
    return password == confirmaPassword ? null : { passwordsMismatch: true };

  }

}