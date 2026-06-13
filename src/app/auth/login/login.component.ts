import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { UsuarioService } from '../../service/usuario.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {


  username = '';
  password = '';
  errorMessage = '';


  constructor(
    private router: Router,
    private authService: AuthService,
    private usuarioService: UsuarioService
  ) { }


  login(): void {


    this.authService.login(this.username, this.password).subscribe({
      next: (response: any) => {


        this.authService.saveToken(response.jwt);


        this.authService.saveRoles(response.roles);


        if (response.idUsuario) {
          this.usuarioService.guardarUsuarioId(response.idUsuario);
        }


        if (response.username) {
          this.usuarioService.guardarUsername(response.username);
        }


        this.router.navigate(['/inicio']);
      },
      error: (error) => {


        this.errorMessage =
          'Error de autenticación. Verifique sus credenciales.';


        console.error(error);
      }
    });
  }
}
