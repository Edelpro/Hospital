import { API_BASE_URL } from './api-base';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Egreso } from '../models/egreso.model';

@Injectable({
  providedIn: 'root'
})
export class EgresoService {
  private readonly apiUrl = `${API_BASE_URL}/Egresos`;

  constructor(private http: HttpClient) {}

  obtenerPorAtencion(atencionId: number): Observable<Egreso | null> {
    return this.http.get<Egreso | null>(`${this.apiUrl}/atencion/${atencionId}`);
  }

  guardarEgreso(egreso: Egreso): Observable<Egreso> {
    return this.http.post<Egreso>(this.apiUrl, egreso);
  }

  eliminarEgreso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}