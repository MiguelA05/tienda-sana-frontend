import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      cedula: ['', [Validators.required, Validators.maxLength(10)]],
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      direccion: ['', [Validators.required, Validators.maxLength(255)]],
      telefono: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(15)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
      confirmaPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]]
    });
  }

  // Métodos para verificar si un campo es inválido
  get isCedulaInvalid(): boolean {
    return this.isFieldInvalid('cedula');
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
    return this.isFieldInvalid('password');
  }

  get isConfirmaPasswordInvalid(): boolean {
    return this.isFieldInvalid('confirmaPassword');
  }

  private isFieldInvalid(field: string): boolean {
    const control = this.registroForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  registrar(): void {
    if (this.registroForm.invalid) {
      this.markFormGroupTouched(this.registroForm);
      return;
    }

    this.isLoading = true;

    // Simulación de envío (reemplazar con llamada real al servicio)
    setTimeout(() => {
      console.log('Formulario enviado:', this.registroForm.value);
      this.isLoading = false;
      this.registroForm.reset();
      this.router.navigate(['/login']);
    }, 1500);
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

}