import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { DataService } from '../../services/data.services';
import { ActivarCuentaDTO } from '../../dto/activar-cuenta-dto';
import { AuthService } from '../../services/auth.services';
import Swal from 'sweetalert2';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verificar-cuenta',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterModule],
  templateUrl: './verificar-cuenta.component.html',
  styleUrl: './verificar-cuenta.component.css'
})
export class VerificarCuentaComponent implements OnInit {

  verificarCuentaForm!: FormGroup;
  email: string;
  isLoading: boolean = false;

  /**
   * Constructor de la clase VerificarCuentaComponent
   * @param formbuilder FormBuilder para construir formularios reactivos
   * @param dataService DataService para manejar datos compartidos entre componentes
   * @param authService AuthService para manejar la autenticación
   * @param router Router para navegar entre rutas
   */
  constructor( private route: ActivatedRoute, private formbuilder: FormBuilder, private dataService: DataService, private authService: AuthService, private router: Router) {
    this.email = this.dataService.getData();
    this.createForm();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const email = params['email'] || '';
      this.verificarCuentaForm = this.formbuilder.group({
        email: [{ value: email, disabled: true }, [Validators.required, Validators.email]],
        codigoVerificacionRegistro: ['', Validators.required]
      });
    });
  }

  /**
   * Método para inicializar el formulario de verificación de cuenta
   */
  public createForm() {
    console.log(this.email);
    this.verificarCuentaForm = this.formbuilder.group({
      email: [
        { value: this.email, disabled: true },
        [
          Validators.required,
          Validators.email,
          Validators.pattern(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
          )
        ]
      ],
      codigoVerificacionRegistro: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    })
  }

  /**
   * Método para verificar la cuenta del usuario
   */
  public activarCuenta() {
    const activarCuenta = this.verificarCuentaForm.getRawValue() as ActivarCuentaDTO;
    console.log("ESTE ES EL EMAIL: "+activarCuenta.email);
    this.authService.validarCodigoRegistro(activarCuenta).subscribe({
      next: (data) => {
        Swal.fire({
          title: 'Cuenta activada',
          text: 'La cuenta se ha activada correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        })
        this.router.navigate(['/login']);
      },
      error: error => {
        Swal.fire({
          title: 'Error',
          text: "Error al activar la cuenta, el código de verificación es incorrecto",
          icon: 'error',
          confirmButtonText: 'Aceptar'
        })
        this.isLoading = false;
      }
    });
  }

  /**
   * Método para reenviar el código de verificación al correo electrónico
   */
  public reenviarCodigo() {
    const emailToSend = this.verificarCuentaForm.get('email')?.value;
    this.isLoading = true;
    this.authService.reenviarCodigoVerificacion(emailToSend).subscribe({
      next: (data) => {
        this.isLoading = false;
        Swal.fire({
          title: 'Código reenviado',
          text: 'El código de verificación ha sido reenviado a su correo electrónico',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
        this.isLoading = false;
      },
      error: (error) => {
        if (this.verificarCuentaForm.get('email')?.value === '') {
          this.isLoading = false;
          Swal.fire({
            title: 'Error',
            text: 'No se ha ingresado un correo electrónico',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          })
          this.isLoading = false;
        } else {
          Swal.fire({
            title: 'Error',
            text: error.error.reply,
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
          this.isLoading = false;
        }

      }
    });
  }

}
