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


  listarPorCategoria(idCategoria: number): Observable<FactorEmision[]> {
    return this.http.get<FactorEmision[]>(`${this.apiUrl}/factores/categoria/${idCategoria}`);
  }
}
