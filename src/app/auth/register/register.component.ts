import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  username = '';
  correo = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';


  constructor(private router: Router, private authService: AuthService) {}


  registro(): void {
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }


    this.authService.registrar(this.username, this.correo, this.password).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.errorMessage = 'Error al registrar usuario. Intente nuevamente.';
        console.error('Registro error:', error);
      }
    });
  }
}



register.component.html:
<div class="auth-container">


  <!-- TARJETA DE REGISTRO -->
  <div class="auth-card">


    <!-- CABECERA -->
    <div class="auth-header">


      <div class="brand-mark">
        EC
      </div>


      <h1>
        EcoTrack
      </h1>


      <p>
        Registro
      </p>


    </div>


    <!-- MENSAJE DE ERROR -->
    @if (errorMessage) {


      <div class="error-message">


        {{ errorMessage }}


      </div>


    }


    <!-- FORMULARIO -->
    <form (ngSubmit)="registro()">


      <!-- USUARIO -->
      <mat-form-field appearance="outline">


        <mat-label>
          Usuario
        </mat-label>


        <input
          matInput
          type="text"
          [(ngModel)]="username"
          name="username"
          required>


      </mat-form-field>


      <!-- CORREO ELECTRÓNICO -->
      <mat-form-field appearance="outline">


        <mat-label>
          Correo electrónico
        </mat-label>


        <input
          matInput
          type="email"
          [(ngModel)]="correo"
          name="correo"
          required>


      </mat-form-field>


      <!-- CONTRASEÑA -->
      <mat-form-field appearance="outline">


        <mat-label>
          Contraseña
        </mat-label>


        <input
          matInput
          type="password"
          [(ngModel)]="password"
          name="password"
          required>


      </mat-form-field>


      <!-- CONFIRMAR CONTRASEÑA -->
      <mat-form-field appearance="outline">


        <mat-label>
          Confirmar contraseña
        </mat-label>


        <input
          matInput
          type="password"
          [(ngModel)]="confirmPassword"
          name="confirmPassword"
          required>


      </mat-form-field>


      <!-- BOTÓN REGISTRARSE -->
      <button
        type="submit"
        class="auth-button">


        Registrarse


      </button>


    </form>


    <!-- ENLACE LOGIN -->
    <p class="auth-link">


      ¿Ya tienes cuenta?


      <a routerLink="/login">


        Inicia Sesión


      </a>


    </p>


  </div>


</div>
