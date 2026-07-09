import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface NotificacionAdminDTO {
  usuarioDestinoId: number;
  nombreAdminEnvia: string;
  contenidoMensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  enviarMensajeAdmin(payload: NotificacionAdminDTO): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/notificaciones-admin/enviar`, payload);
  }

  obtenerNoLeidas(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/notificaciones-usuario/no-leidas?usuarioId=${usuarioId}`);
  }

  marcarComoLeida(notificacionId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/notificaciones-usuario/leer/${notificacionId}`, {});
  }
}

