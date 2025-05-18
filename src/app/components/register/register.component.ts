import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
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
  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService, private dataService: DataService) { }

  /**
   * Método para inicializar el componente
   */
  ngOnInit(): void {
    this.registroForm = this.fb.group({
      dni: ['', [Validators.required, Validators.maxLength(10)]],
      nombre: [
        '',
        [
          Validators.required,
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/) // Solo letras y espacios
        ]
      ],
      direccion: ['', [Validators.required, Validators.maxLength(255)]],
      telefono: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(15), Validators.pattern(/^[0-9]+$/)]],
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
      contrasenia: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
        ]
      ],
      confirmacionContrasena: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordsMatchValidator } // Aplica el validador aquí
    );
  }


  /** 
   * Método para registrar un nuevo usuario en la plataforma
  */
  registrar(): void {
    // Marcar todos los campos como touched para mostrar errores si existen
    Object.keys(this.registroForm.controls).forEach(key => {
      this.registroForm.get(key)?.markAsTouched();
    });


    if (!this.registroForm.get('terms')?.value) {
      Swal.fire({
        title: 'Error',
        text: 'Debe aceptar los términos y condiciones para continuar.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return; // Detener el proceso de registro
    }

    if (this.registroForm.valid) {
      const crearCuentaDTO = this.registroForm.value as CrearCuentaDTO;
      console.log(crearCuentaDTO);
      this.authService.crearCuenta(crearCuentaDTO).subscribe({
        next: (data) => {
          this.isLoading = false;
          Swal.fire({
            title: 'Cuenta creada',
            text: 'La cuenta se ha creado correctamente, revise en su correo electrónico para activar su cuenta.' +
              'En la carpeta de spam o correo no deseado.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          })
          this.dataService.setData(this.registroForm.get('email')?.value);
          this.router.navigate(['/verificar-cuenta']);
        },
        error: (error) => {
          this.isLoading = false;
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
   * Método para obtener el mensaje de error del campo DNI
   * @returns Mensaje de error específico
   */
  getDniErrorMessage(): string {
    const dniControl = this.registroForm.get('dni');

    if (dniControl?.hasError('required')) {
      return 'El número de cédula es obligatorio';
    }

    if (dniControl?.hasError('maxlength')) {
      return `La cédula no debe exceder los ${dniControl.getError('maxlength').requiredLength} caracteres`;
    }

    return 'Por favor ingrese un número de cédula válido';
  }

  /**
   * Método para obtener el mensaje de error del campo nombre
   * @returns Mensaje de error específico
   */
  getNombreErrorMessage(): string {
    const nombreControl = this.registroForm.get('nombre');

    if (nombreControl?.hasError('required')) {
      return 'El nombre es obligatorio';
    }
    if (nombreControl?.hasError('maxlength')) {
      return `El nombre no debe exceder los ${nombreControl.getError('maxlength').requiredLength} caracteres`;
    }
    if (nombreControl?.hasError('pattern')) {
      return 'El nombre solo puede contener letras y espacios';
    }

    return 'Por favor ingrese un nombre válido';
  }

  /**
   * Método para obtener el mensaje de error del campo dirección
   * @returns Mensaje de error específico
   */
  getDireccionErrorMessage(): string {
    const direccionControl = this.registroForm.get('direccion');

    if (direccionControl?.hasError('required')) {
      return 'La dirección es obligatoria';
    }

    if (direccionControl?.hasError('maxlength')) {
      return `La dirección no debe exceder los ${direccionControl.getError('maxlength').requiredLength} caracteres`;
    }

    return 'Por favor ingrese una dirección válida';
  }

  /**
   * Método para obtener el mensaje de error del campo teléfono
   * @returns Mensaje de error específico
   */
  getTelefonoErrorMessage(): string {
    const telefonoControl = this.registroForm.get('telefono');

    if (telefonoControl?.hasError('required')) {
      return 'El teléfono es obligatorio';
    }

    if (telefonoControl?.hasError('minlength')) {
      return `El teléfono debe tener al menos ${telefonoControl.getError('minlength').requiredLength} caracteres`;
    }

    if (telefonoControl?.hasError('maxlength')) {
      return `El teléfono no debe exceder los ${telefonoControl.getError('maxlength').requiredLength} caracteres`;
    }

    if (telefonoControl?.hasError('pattern')) {
      return 'El teléfono solo puede contener números';
    }

    return 'Por favor ingrese un número de teléfono válido';
  }

  /**
   * Método para obtener el mensaje de error del campo email
   * @returns Mensaje de error específico
   */
  getEmailErrorMessage(): string {
    const emailControl = this.registroForm.get('email');

    if (emailControl?.hasError('required')) {
      return 'El correo electrónico es obligatorio';
    }

    if (emailControl?.hasError('email') || emailControl?.hasError('pattern')) {
      return 'Por favor ingrese un formato de correo electrónico válido (nombreusuario@dominio)';
    }

    return 'Por favor ingrese un correo electrónico válido';
  }

  /**
   * Método para obtener el mensaje de error del campo contraseña
   * @returns Mensaje de error específico
   */
  getPasswordErrorMessage(): string {
    const passwordControl = this.registroForm.get('contrasenia');

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

  /**
   * Método para obtener el mensaje de error del campo confirmación de contraseña
   * @returns Mensaje de error específico
   */
  getConfirmPasswordErrorMessage(): string {
    const confirmPasswordControl = this.registroForm.get('confirmacionContrasena');

    if (confirmPasswordControl?.hasError('required')) {
      return 'La confirmación de contraseña es obligatoria';
    }

    return 'Por favor confirme su contraseña';
  }
  

  /**
   * Método para obtener el mensaje de error de términos y condiciones
   * @returns Mensaje de error específico
   */
  getTermsErrorMessage(): string {
    return 'Debe aceptar los términos y condiciones para continuar';
  }

  /**
   * Método para verificar si debe mostrar el error de contraseñas no coincidentes
   * @returns true si las contraseñas no coinciden y el campo ha sido tocado
   */
  shouldShowPasswordMismatchError(): boolean {
    return this.registroForm.hasError('passwordsMismatch') &&
      (!!this.registroForm.get('confirmacionContrasena')?.touched ||
        !!this.registroForm.get('contrasenia')?.touched);
  }

  /**
   * Método para verificar si un campo debe mostrar error
   * @param controlName Nombre del control a verificar
   * @returns true si el campo tiene error y ha sido tocado
   */
  shouldShowError(controlName: string): boolean {
    const control = this.registroForm.get(controlName);
    return control ? control.invalid && control.touched : false;
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