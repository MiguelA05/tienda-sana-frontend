import { Component, OnInit } from '@angular/core';
import { AbstractControl, AbstractControlOptions, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { TokenService } from '../../services/token.service';
import { InformacionCuentaDTO } from '../../dto/informacion-cuenta-dto';
import { CuentaService } from '../../services/cuenta.service';
import { ActualizarCuentaDTO } from '../../dto/actualizar-cuenta-dto';
import Swal from 'sweetalert2';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-informacion-usuario',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, FormsModule],
  templateUrl: './informacion-usuario.component.html',
  styleUrls: ['./informacion-usuario.component.css']
})
export class InformacionUsuarioComponent implements OnInit {

  account?: InformacionCuentaDTO;
  userInforForm!: FormGroup;
  isEditing: boolean = false;
  isPasswordVisible: boolean = false;

  /**
   * Constructor de la clase InformacionUsuarioComponent
   * @param formBuilder formBuilder para construir formularios reactivos
   * @param tokenService tokenService para manejar el token de autenticación
   * @param cuentaService cuentaService para manejar la lógica de negocio relacionada con la cuenta
   * @param router router para navegar entre rutas
   */
  constructor(
    private formBuilder: FormBuilder, 
    private tokenService: TokenService, 
    private cuentaService: CuentaService, 
    private router: Router
  ) {}
  
  /**
   * Metodo para inicializar el componente
   */
  ngOnInit(): void {
    this.createForm();
    this.obtenerInformacionUsuario();
    
  }

  /**
   * Método para mostrar u ocultar la contraseña
   */
  public togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  /**
   * Método para inicializar el formulario de información del usuario
   */
  private createForm() {
    this.userInforForm = this.formBuilder.group({
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      dni: [{ value: '', disabled: true }, [Validators.required]],
      name: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(50)]],
      phoneNumber: [{ value: '', disabled: true }, [Validators.required, this.numberLengthValidator(10, 15)]],
      address: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(255)]],
      password: ['', [Validators.maxLength(20), Validators.minLength(7)]],
    });
  }

 /**
  * Metodo para validar la longitud de un número
  * @param minLength minima longitud
  * @param maxLength maxima longitud
  * @returns true si la longitud es valida, false si no lo es
  */
  numberLengthValidator(minLength: number, maxLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      
      if (value.toString().length < minLength || value.toString().length > maxLength) {
        return { numberLength: true };
      }
      return null;
    };
  }

  /**
   * Método para activar el modo de edición
   */
  enableEditing() {
    this.isEditing = true;
    
    // Habilitar solo los campos editables
    this.userInforForm.get('name')?.enable();
    this.userInforForm.get('phoneNumber')?.enable();
    this.userInforForm.get('address')?.enable();
    this.userInforForm.get('password')?.enable();
    this.userInforForm.get('confirmaPassword')?.enable();
    
    // Limpiar los campos de contraseña
    this.userInforForm.get('password')?.setValue('');
    this.userInforForm.get('confirmaPassword')?.setValue('');
  }

  /**
   * Metodo para eliminar la cuenta del usuario
   */
  public deleteAccount() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.account) {
        this.cuentaService.eliminarCuenta(this.account.email).subscribe({
          next: () => {
            Swal.fire({
              title: 'Cuenta eliminada',
              text: 'La cuenta se ha eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
            setTimeout(() => {
              this.tokenService.logout();
              this.router.navigate(['/login']);
            }, 1000);
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: error.error.reply || 'No se pudo eliminar la cuenta',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

  /**
   * Método para cancelar la edición y restaurar los valores originales
   */
  public disableEditing() {
    this.isEditing = false;
    
    // Deshabilitar los campos editables
    this.userInforForm.get('name')?.disable();
    this.userInforForm.get('phoneNumber')?.disable();
    this.userInforForm.get('address')?.disable();
    
    // Limpiar y deshabilitar los campos de contraseña
    this.userInforForm.get('password')?.reset();
    this.userInforForm.get('confirmaPassword')?.setValue('');
    this.userInforForm.get('password')?.disable();
    this.userInforForm.get('confirmaPassword')?.disable();
    
    // Restaurar los valores originales
    this.loadAccountData();
  }
  
  /**
   * Metodo para guardar los cambios realizados en el formulario
   * @returns true si se guardaron los cambios, false si no se guardaron
   */
  saveChanges() {
    console.log('pase el if de invalido');
    if (!this.account) {
      Swal.fire({
        title: 'Error',
        text: 'No se ha encontrado la cuenta',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    
    const formValues = this.userInforForm.getRawValue();
    
    const cuentaActualizar: ActualizarCuentaDTO = {
      email: this.account.email,
      nombre: formValues.name,
      telefono: formValues.phoneNumber,
      direccion: formValues.address,
      contrasenia: formValues.password
    };

    this.cuentaService.actualizarCuenta(cuentaActualizar).subscribe({
      next: () => {
        Swal.fire({
          title: 'Datos Actualizados',
          text: 'La cuenta se ha actualizado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
        this.disableEditing();
        this.obtenerInformacionUsuario();
      }, 
      error: (error) => {
        Swal.fire({
          title: 'Error',
          text: error.error.reply || 'No se pudieron actualizar los datos',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  /**
   * Método para cargar los datos de la cuenta en el formulario
   */
  public loadAccountData() {
    if (this.account) {
      this.userInforForm.patchValue({
        email: this.account.email,
        dni: this.account.dni,
        name: this.account.nombre,
        phoneNumber: this.account.telefono,
        address: this.account.direccion
      });
    }
  }

  /**
   * Método para obtener la información del usuario
   */
  public obtenerInformacionUsuario() {
    const email = this.tokenService.getIDCuenta();
    const rol = this.tokenService.getRol();
    console.log(rol);
    this.cuentaService.obtenerInformacion(email).subscribe({
      next: (data) => {
        this. account = data.reply;
        console.log(this.account);
        this.loadAccountData();
      },
      error: (error) => {
        Swal.close();
        Swal.fire({
          title: 'Error',
          text: error.error.reply || 'No se pudo obtener la información de la cuenta',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }
}