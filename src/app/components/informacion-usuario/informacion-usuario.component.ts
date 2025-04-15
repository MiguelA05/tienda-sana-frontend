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

  constructor(
    private formBuilder: FormBuilder, 
    private tokenService: TokenService, 
    private cuentaService: CuentaService, 
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.createForm();
    
  }

  private createForm() {
    this.userInforForm = this.formBuilder.group({
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      dni: [{ value: '', disabled: true }, [Validators.required]],
      name: [{ value: '', disabled: true }, [Validators.required]],
      phoneNumber: [{ value: '', disabled: true }, [Validators.required, this.numberLengthValidator(10, 15)]],
      address: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.maxLength(20), Validators.minLength(7)]],
      confirmaPassword: ['', [Validators.required]]
    },
    { validators: this.passwordsMatchValidator } as AbstractControlOptions);
  }

  passwordsMatchValidator(formGroup: FormGroup): ValidationErrors | null {
    const password = formGroup.get('password')?.value;
    const confirmaPassword = formGroup.get('confirmaPassword')?.value;
    
    // Solo validamos cuando ambos campos tienen valor
    if (!password || !confirmaPassword) {
      return null;
    }
    
    // Si las contraseñas no coinciden, devuelve un error, de lo contrario, null
    return password === confirmaPassword ? null : { passwordsMismatch: true };
  }
  
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
        this.cuentaService.eliminarCuenta(this.account.idUsuario).subscribe({
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

  public disableEditing() {
    this.isEditing = false;
    
    // Deshabilitar los campos editables
    this.userInforForm.get('name')?.disable();
    this.userInforForm.get('phoneNumber')?.disable();
    this.userInforForm.get('address')?.disable();
    
    // Limpiar y deshabilitar los campos de contraseña
    this.userInforForm.get('password')?.setValue('');
    this.userInforForm.get('confirmaPassword')?.setValue('');
    this.userInforForm.get('password')?.disable();
    this.userInforForm.get('confirmaPassword')?.disable();
    
    // Restaurar los valores originales
    this.loadAccountData();
  }
  
  saveChanges() {
    if (this.userInforForm.invalid) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.userInforForm.controls).forEach(key => {
        const control = this.userInforForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    if (!this.account) {
      return;
    }
    
    const formValues = this.userInforForm.getRawValue();
    
    const cuentaActualizar: ActualizarCuentaDTO = {
      id: this.account.idUsuario,
      nombre: formValues.name,
      telefono: formValues.phoneNumber,
      direccion: formValues.address,
      contrasenia: formValues.password
    };

    if (!cuentaActualizar.contrasenia || cuentaActualizar.contrasenia === '') {
      Swal.fire({
        title: 'Error',
        text: 'La contraseña no puede estar vacía',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Mostrar indicador de carga
    Swal.fire({
      title: 'Guardando cambios',
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

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

  public obtenerInformacionUsuario() {
    const id = this.tokenService.getIDCuenta();
    
    if (!id) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Mostrar indicador de carga
    Swal.fire({
      title: 'Cargando datos',
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.cuentaService.obtenerInformacion(id).subscribe({
      next: (data) => {
        Swal.close();
        //this.account = data.cuenta;
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