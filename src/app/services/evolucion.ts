import { API_BASE_URL } from './api-base';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Evolucion } from '../models/evolucion.model';

@Injectable({
  providedIn: 'root'
})
export class EvolucionService {
  private readonly apiUrl = `${API_BASE_URL}/Evoluciones`;

  constructor(private http: HttpClient) {}

  obtenerPorAtencion(atencionId: number): Observable<Evolucion[]> {
    return this.http.get<Evolucion[]>(`${this.apiUrl}/atencion/${atencionId}`);
  }

  guardarEvolucion(evolucion: Evolucion): Observable<Evolucion> {
    return this.http.post<Evolucion>(this.apiUrl, evolucion);
  }

  eliminarEvolucion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}