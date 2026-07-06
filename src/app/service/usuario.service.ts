import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { UsuarioResponseDTO, UsuarioDTO } from '../model/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

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


  listarUsuarios(): Observable<UsuarioResponseDTO[]> {
    return this.http.get<UsuarioResponseDTO[]>(`${this.apiUrl}/usuarios/lista`);
  }

  crearUsuario(dto: UsuarioDTO): Observable<UsuarioResponseDTO> {
    return this.http.post<UsuarioResponseDTO>(`${this.apiUrl}/usuarios/inserta`, dto);
  }

  actualizarUsuario(id: number, dto: UsuarioDTO): Observable<UsuarioResponseDTO> {
    return this.http.put<UsuarioResponseDTO>(`${this.apiUrl}/usuarios/actualiza/${id}`, dto);
  }

  eliminarUsuario(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/usuarios/elimina/${id}`, { responseType: 'text' });
  }

  cambiarEstado(id: number, enabled: boolean): Observable<any> {
    return new Observable(observer => {
      observer.next({ success: true, id, enabled });
      observer.complete();
    });
  }
}
