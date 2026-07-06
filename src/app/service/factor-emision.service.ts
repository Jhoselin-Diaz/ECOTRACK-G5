import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FactorEmision } from '../model/factor-emision.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FactorEmisionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listar(): Observable<FactorEmision[]> {
    return this.http.get<FactorEmision[]>(`${this.apiUrl}/factores/listar`);
  }

  listarPorCategoria(idCategoria: number): Observable<FactorEmision[]> {
    return this.http.get<FactorEmision[]>(`${this.apiUrl}/factores/categoria/${idCategoria}`);
  }

  registrar(factor: FactorEmision, categoriaId: number): Observable<FactorEmision> {
    return this.http.post<FactorEmision>(`${this.apiUrl}/factores/registrar/${categoriaId}`, factor);
  }

  editar(idFactor: number, factor: FactorEmision, categoriaId: number): Observable<FactorEmision> {
    return this.http.put<FactorEmision>(`${this.apiUrl}/factores/editar/${idFactor}/${categoriaId}`, factor);
  }

  eliminar(idFactor: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/factores/eliminar/${idFactor}`, { responseType: 'text' });
  }
}
