import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { LoginDTO } from '../../dto/login-dto';
import { AuthService } from '../../services/auth.services';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {  
  isLoading: boolean = false;
  loginForm!: FormGroup;
  isPasswordVisible = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private tokenService:TokenService ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      contrasenia: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
      remember: [false]
    });
  }

  public login(): void {
    if (this.loginForm.valid) {
      const loginDTO= this.loginForm.value as LoginDTO;

    }
  }

  public togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}