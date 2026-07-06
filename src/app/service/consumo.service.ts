import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Consumo } from '../model/consumo.model';
import { DetalleHuellaDTO } from '../model/huella.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConsumoService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  listar(): Observable<Consumo[]> {
    return this.http.get<Consumo[]>(`${this.apiUrl}/consumos/listar`);
  }

  listarFiltro(): Observable<Consumo[]> {
    return this.http.get<Consumo[]>(`${this.apiUrl}/consumos/listar/Filtro`);
  }

  obtenerHistoricoFiltrado(headers?: HttpHeaders): Observable<DetalleHuellaDTO[]> {
    return this.http.get<DetalleHuellaDTO[]>(`${this.apiUrl}/consumos/historico/filtrar`, { headers });
  }

  registrar(consumo: Consumo): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/consumos/registrar`, consumo);
  }

  editar(id: number, consumo: Consumo): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/consumos/editar/${id}`, consumo);
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/consumos/eliminar/${id}`, { responseType: 'text' });
  }
}