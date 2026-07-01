import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Categoria } from '../model/categoria.model';
import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private apiUrl = environment.apiUrl;


  constructor(private http: HttpClient) {}


  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/categoria/listar`);
  }
}
