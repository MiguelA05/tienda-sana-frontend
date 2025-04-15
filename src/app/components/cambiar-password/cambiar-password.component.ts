import { Component } from '@angular/core';
import { AbstractControlOptions, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
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

  constructor(private formBuilder: FormBuilder, private dataService: DataService, private authService: AuthService, private router: Router) {
    this.email = this.dataService.getData()
    this.createForm();
  }

  public changePassword() {
    const cambiarContra = this.changePasswordForm.value as CambiarContraseniaDTO
    this.authService.cambiarContrasenia(cambiarContra).subscribe({
      next: (data) => {
        Swal.fire({
          title: 'Contraseña cambiada',
          text: 'La contraseña se ha cambiado, intente ingresar de nuevo',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        })
        this.router.navigate(['/']);
      },
      error: (error) => {
        Swal.fire({
          title: 'Error',
          text: error.error.reply,
          icon: 'error',
          confirmButtonText: 'Aceptar'
        })
      }
    });

  }

  private createForm() {
    this.changePasswordForm = this.formBuilder.group(
      {
        email: [this.email, [Validators.required, Validators.email]],
        verificationCode: ['', [Validators.required], Validators.minLength(6), Validators.maxLength(6)],
        newPassword: ['', [Validators.required, Validators.maxLength(20), Validators.minLength(7)]],
        passwordConfirmation: ['', [Validators.required]]
      },
      { validators: this.passwordsMatchValidator } as AbstractControlOptions
    );
  }

  // Validador para confirmar que las contraseñas coincidan
  passwordsMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('newPassword')?.value;
    const passwordConfirmation = formGroup.get('passwordConfirmation')?.value;
    // Devuelve un error si las contraseñas no coinciden
    return password === passwordConfirmation ? null : { passwordsMismatch: true };
  }

  public reenviarCodigo() {

    this.authService.enviarCodigoRecuperacion(this.email).subscribe({
      next: (data) => {
        Swal.fire({
          title: 'Código reenviado',
          text: 'El código de recuperación ha sido enviado a su correo electrónico',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      },
      error: (error) => {
        if(this.email === '') {
          Swal.fire({
            title: 'Error',
            text: 'No se ha ingresado un correo electrónico',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          })
        } else {
          Swal.fire({
            title: 'Error',
            text: error.error.reply,
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }

      }
    });
  }

  
}
