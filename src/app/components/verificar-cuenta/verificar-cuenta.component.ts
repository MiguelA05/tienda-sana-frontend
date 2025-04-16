import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { DataService } from '../../services/data.services';
import { ActivarCuentaDTO } from '../../dto/activar-cuenta-dto';
import { AuthService } from '../../services/auth.services';
import Swal from 'sweetalert2';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verificar-cuenta',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterModule],
  templateUrl: './verificar-cuenta.component.html',
  styleUrl: './verificar-cuenta.component.css'
})
export class VerificarCuentaComponent {

  verificarCuentaForm!: FormGroup;
  email: string;
  isLoading: boolean=false;
  constructor(private formbuilder: FormBuilder, private dataService: DataService, private authService: AuthService, private router: Router) {
    this.email = this.dataService.getData();
    this.createForm();
  }

  public createForm() {
    console.log(this.email);
    this.verificarCuentaForm = this.formbuilder.group({
      email: [this.email, [Validators.required, Validators.email]],
      registrationValidationCode: ['', [Validators.required,Validators.minLength(6), Validators.maxLength(6)]]
    })
  }

  public activarCuenta(){
    this.isLoading=true;
    const activarCuenta = this.verificarCuentaForm.value as ActivarCuentaDTO;
    this.authService.validarCodigoRegistro(activarCuenta).subscribe({
      next: (data) => {
        this.isLoading=false;
        Swal.fire({
          title: 'Cuenta activada',
          text: 'La cuenta se ha activada correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        })
        this.router.navigate(['/login']);
        this.isLoading=false;
      },
      error: error => {
        Swal.fire({
          title: 'Error',
          text: error.error.respuesta,
          icon: 'error',
          confirmButtonText: 'Aceptar'
        })
        this.isLoading=false;
      }
    });
  }

  public reenviarCodigo() {
    this.isLoading=true;
    const emailToSend= this.verificarCuentaForm.get('email')?.value;
    this.authService.reenviarCodigoVerificacion(emailToSend).subscribe({
      next: (data) => {
        Swal.fire({
          title: 'Código reenviado',
          text: 'El código de verificación ha sido reenviado a su correo electrónico',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
        this.isLoading=false;
      },
      error: (error) => {
        if(this.email === '') {
          Swal.fire({
            title: 'Error',
            text: 'No se ha ingresado un correo electrónico',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          })
          this.isLoading=false;
        } else {
          Swal.fire({
            title: 'Error',
            text: error.error.reply,
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
          this.isLoading=false;
        }

      }
    });
  }

}
