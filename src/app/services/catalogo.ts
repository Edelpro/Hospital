import { API_BASE_URL } from './api-base';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CatalogoItem } from '../models/catalogo-item.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  private apiUrl = `${API_BASE_URL}/Catalogos`;

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(this.apiUrl);
  }

  obtenerActivos(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/activos`);
  }

  obtenerPorTipo(tipo: string): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/tipo/${tipo}`);
  }

  obtenerPorId(id: number): Observable<CatalogoItem> {
    return this.http.get<CatalogoItem>(`${this.apiUrl}/${id}`);
  }

  crear(item: CatalogoItem): Observable<CatalogoItem> {
    return this.http.post<CatalogoItem>(this.apiUrl, item);
  }

  actualizar(item: CatalogoItem): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${item.id}`, item);
  }

activar(id: number): Observable<void> {
  return this.http.put<void>(`${this.apiUrl}/${id}/activar`, {});
}

desactivar(id: number): Observable<void> {
  return this.http.put<void>(`${this.apiUrl}/${id}/desactivar`, {});
}

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}