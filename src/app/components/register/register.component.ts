import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registroForm!: FormGroup;
  isLoading: boolean = false;
  
  // Para verificar si un campo ha sido tocado y es inválido
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
  
  get isPasswordInvalid(): boolean {
    return this.isFieldInvalid('password');
  }
  
  get isTermsInvalid(): boolean {
    return this.isFieldInvalid('terms');
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      cedula: ['', [Validators.required, Validators.maxLength(10)]],
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      direccion: ['', [Validators.required, Validators.maxLength(255)]],
      telefono: ['', [Validators.required, Validators.maxLength(15), Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
      terms: [false, [Validators.requiredTrue]]
    });
  }

  // Método para verificar si un campo ha sido tocado y es inválido
  isFieldInvalid(field: string): boolean {
    const control = this.registroForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Método para marcar todos los campos como tocados
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
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
      
      // Aquí puedes llamar a tu servicio para registrar al usuario
      // this.authService.register(this.registroForm.value).subscribe(...)
      
      this.isLoading = false;
      this.registroForm.reset();
      
      // Puedes agregar aquí navegación después del registro exitoso
      // this.router.navigate(['/login']);
    }, 1500);
  }
}