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

        if (response.idUsuario) {
          this.usuarioService.guardarUsuarioId(response.idUsuario);
        }

        if (response.username) {
          this.usuarioService.guardarUsername(response.username);
        }

        // Obtener roles en cualquier formato posible (directo o anidado en user.rol / user.authority)
        let rolesList: string[] = [];
        const rawRoles = response.roles || response.rol || response.authority || response.authorities || [];

        if (typeof rawRoles === 'string') {
          rolesList = [rawRoles];
        } else if (Array.isArray(rawRoles)) {
          rolesList = rawRoles;
        } else if (rawRoles instanceof Set) {
          rolesList = Array.from(rawRoles);
        } else if (rawRoles && typeof rawRoles === 'object') {
          try {
            rolesList = Array.from(rawRoles as any);
          } catch (e) {
            rolesList = [];
          }
        }

        // Buscar en objeto anidado si no se encontraron en el nivel superior
        if (rolesList.length === 0 && response.user) {
          const userRoles = response.user.roles || response.user.rol || response.user.authority || response.user.authorities || [];
          if (typeof userRoles === 'string') {
            rolesList = [userRoles];
          } else if (Array.isArray(userRoles)) {
            rolesList = userRoles;
          } else if (userRoles instanceof Set) {
            rolesList = Array.from(userRoles);
          } else if (userRoles && typeof userRoles === 'object') {
            try {
              rolesList = Array.from(userRoles as any);
            } catch (e) {
              rolesList = [];
            }
          }
        }

        this.authService.saveRoles(rolesList);

        // Recuperar inmediatamente el rol guardado en LocalStorage y evaluar
        const rol = localStorage.getItem('rol') || '';
        const rolClean = rol.toUpperCase().trim();

        if (rolClean === 'ROLE_ADMIN' || rolClean === 'ADMIN') {
          this.router.navigate(['/admin/inicio']);
        } else {
          this.router.navigate(['/usuario/inicio']);
        }
      },
      error: (error) => {

        this.errorMessage =
          'Error de autenticación. Verifique sus credenciales.';

        console.error(error);
      }
    });
  }
}
