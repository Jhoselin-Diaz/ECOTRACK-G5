import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { 
  DashboardResumenDTO, 
  CategoriaHuellaDTO, 
  UsuarioActivoDTO, 
  UsuarioHuellaTotalDTO, 
  EvolucionHuellaDTO 
} from '../model/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerResumen(): Observable<DashboardResumenDTO> {
    return this.http.get<DashboardResumenDTO>(`${this.apiUrl}/dashboard/resumen/simple`);
  }

  obtenerHuellaCategorias(): Observable<CategoriaHuellaDTO[]> {
    return this.http.get<CategoriaHuellaDTO[]>(`${this.apiUrl}/dashboard/huella/categorias`);
  }

  obtenerUsuariosActivos(): Observable<UsuarioActivoDTO[]> {
    return this.http.get<UsuarioActivoDTO[]>(`${this.apiUrl}/dashboard/usuarios/activos`);
  }

  obtenerUsuariosMayorHuella(): Observable<UsuarioHuellaTotalDTO[]> {
    return this.http.get<UsuarioHuellaTotalDTO[]>(`${this.apiUrl}/dashboard/usuarios/mayorhuella`);
  }

  obtenerEvolucionHuella(): Observable<EvolucionHuellaDTO[]> {
    return this.http.get<EvolucionHuellaDTO[]>(`${this.apiUrl}/dashboard/huella/evolucion`);
  }
}
