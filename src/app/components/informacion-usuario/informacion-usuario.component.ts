import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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

  constructor(
    private formBuilder: FormBuilder,
    private tokenService: TokenService,
    private cuentaService: CuentaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.obtenerInformacionUsuario();
  }

  public togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  private createForm() {
    this.userInforForm = this.formBuilder.group({
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      dni: [{ value: '', disabled: true }, [Validators.required]],
      name: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(50)]],
      phoneNumber: [{ value: '', disabled: true }, [Validators.required, this.numberLengthValidator(10, 15), Validators.pattern(/^[0-9]+$/)]],
      address: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(255)]],
      password: ['', [Validators.maxLength(20), Validators.minLength(7)]],
    });
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
    this.userInforForm.get('name')?.enable();
    this.userInforForm.get('phoneNumber')?.enable();
    this.userInforForm.get('address')?.enable();
    this.userInforForm.get('password')?.enable();
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

  public disableEditing() {
    this.isEditing = false;
    this.userInforForm.get('name')?.disable();
    this.userInforForm.get('phoneNumber')?.disable();
    this.userInforForm.get('address')?.disable();
    this.userInforForm.get('password')?.reset();
    this.userInforForm.get('password')?.disable();
    this.loadAccountData();
  }

  saveChanges() {
    if (this.userInforForm.invalid) {
      Object.keys(this.userInforForm.controls).forEach(field => {
        const control = this.userInforForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      return;
    }

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
    const email = this.tokenService.getIDCuenta();
    const rol = this.tokenService.getRol();
    this.cuentaService.obtenerInformacion(email).subscribe({
      next: (data) => {
        this.account = data.reply;
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

  // Updated error message methods to match form control names
  getNameErrorMessage(): string {
    const nameControl = this.userInforForm.get('name');

    if (nameControl?.hasError('required')) {
      return 'El nombre es obligatorio';
    }

    if (nameControl?.hasError('maxlength')) {
      return `El nombre no debe exceder los ${nameControl.getError('maxlength').requiredLength} caracteres`;
    }

    return 'Por favor ingrese un nombre válido';
  }

  getAddressErrorMessage(): string {
    const addressControl = this.userInforForm.get('address');

    if (addressControl?.hasError('required')) {
      return 'La dirección es obligatoria';
    }

    if (addressControl?.hasError('maxlength')) {
      return `La dirección no debe exceder los ${addressControl.getError('maxlength').requiredLength} caracteres`;
    }

    return 'Por favor ingrese una dirección válida';
  }

  getPhoneNumberErrorMessage(): string {
    const phoneControl = this.userInforForm.get('phoneNumber');

    if (phoneControl?.hasError('required')) {
      return 'El teléfono es obligatorio';
    }

    if (phoneControl?.hasError('numberLength')) {
      return 'El teléfono debe tener entre 10 y 15 dígitos';
    }

    if (phoneControl?.hasError('pattern')) {
      return 'El teléfono solo puede contener números';
    }

    return 'Por favor ingrese un número de teléfono válido';
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.userInforForm.get('password');

    if (passwordControl?.hasError('minlength')) {
      return `La contraseña debe tener al menos ${passwordControl.getError('minlength').requiredLength} caracteres`;
    }

    if (passwordControl?.hasError('maxlength')) {
      return `La contraseña no debe exceder los ${passwordControl.getError('maxlength').requiredLength} caracteres`;
    }

    return 'Por favor ingrese una contraseña válida';
  }

  // Updated to match form control names
  shouldShowError(controlName: string): boolean {
    const control = this.userInforForm.get(controlName);
    return control ? control.invalid && control.touched : false;
  }
}