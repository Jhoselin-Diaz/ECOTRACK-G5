import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class UsuarioService {


  guardarUsername(username: string): void {
    localStorage.setItem('auth_username', username);
  }


  obtenerUsername(): string {
    return localStorage.getItem('auth_username') || '';
  }


  guardarUsuarioId(id: number): void {
    localStorage.setItem('usuario_id', id.toString());
  }


  obtenerUsuarioId(): number {
    return Number(localStorage.getItem('usuario_id')) || 0;
  }


  limpiar(): void {
    localStorage.clear();
  }
}
