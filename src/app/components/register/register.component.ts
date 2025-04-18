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

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService, private dataService: DataService) {}

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
  
  // Métodos para verificar si un campo es inválido
  get isCedulaInvalid(): boolean {
    return this.isFieldInvalid('dni');
  }

  get isNombreInvalid(): boolean {
    return this.isFieldInvalid('nombre');
  }

  get isDireccionInvalid(): boolean {
    return this.isFieldInvalid('direccion');
  }

  get isTelefonoInvalid(): boolean {
    return this.isFieldInvalid('telefono');
  }

  get isEmailInvalid(): boolean {
    return this.isFieldInvalid('email');
  }

  get isTermsInvalid(): boolean {
    return this.isFieldInvalid('terms');
  }

  get isPasswordInvalid(): boolean {
    return this.isFieldInvalid('contrasenia');
  }

  get isConfirmaPasswordInvalid(): boolean {
    return this.isFieldInvalid('confirmacionContrasena');
  }

  private isFieldInvalid(field: string): boolean {
    const control = this.registroForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }


  /**
   * 
   * @param formGroup 
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  toggleConfirmPasswordVisibility(): void {
    this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible;
  }


  passwordsMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('contrasenia')?.value;
    const confirmaPassword = formGroup.get('confirmacionContrasena')?.value;
    // Si las contraseñas no coinciden, devuelve un error, de lo contrario, null
    return password == confirmaPassword ? null : { passwordsMismatch: true };

  }

}