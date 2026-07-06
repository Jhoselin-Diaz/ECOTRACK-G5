import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../model/usuario.model';
import { environment } from '../environments/environment';

/**
 * Respuesta actual del backend: { jwt, roles }
 *
 * El backend todavía NO devuelve idUsuario ni username.
 * Cuando el backend agregue esos campos, bastará con actualizar
 * esta interfaz y el método login() en LoginComponent para guardarlos.
 */
export interface AuthResponse {
  jwt: string;
  roles: string[] | Set<string>;
  // Preparados para cuando el backend los devuelva:
  idUsuario?: number;
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private readonly tokenKey = 'auth_token';
  private readonly rolesKey = 'auth_roles';

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/authenticate`, { username, password });
  }

  registrar(username: string, correo: string, password: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios/inserta`, { username, correo, password, enabled: true });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.rolesKey);
    localStorage.removeItem('auth_username');
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('rol');
    localStorage.removeItem('auth_rol');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRoles(): string[] {
    const rolesStr = localStorage.getItem(this.rolesKey);
    return rolesStr ? JSON.parse(rolesStr) : [];
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  saveRoles(roles: string[] | Set<string>): void {
    const rolesArray = Array.isArray(roles) ? roles : Array.from(roles);
    localStorage.setItem(this.rolesKey, JSON.stringify(rolesArray));
    // Guardar explícitamente el primer rol como string simple en 'rol' y 'auth_rol'
    if (rolesArray.length > 0) {
      localStorage.setItem('rol', rolesArray[0]);
      localStorage.setItem('auth_rol', rolesArray[0]);
    } else {
      localStorage.removeItem('rol');
      localStorage.removeItem('auth_rol');
    }
  }

  saveUsername(username: string): void {
    localStorage.setItem('auth_username', username);
  }

  saveUsuarioId(id: number): void {
    localStorage.setItem('usuario_id', String(id));
  }
}

