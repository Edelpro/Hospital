import { API_BASE_URL } from './api-base';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Examen } from '../models/examen.model';

@Injectable({
  providedIn: 'root'
})
export class ExamenService {
  private apiUrl = `${API_BASE_URL}/Examenes`;

  constructor(private http: HttpClient) {}

  obtenerPorAtencion(atencionId: number): Observable<Examen[]> {
    return this.http.get<Examen[]>(`${this.apiUrl}/atencion/${atencionId}`);
  }

  guardarExamen(examen: Examen): Observable<Examen> {
    return this.http.post<Examen>(this.apiUrl, examen);
  }

  eliminarExamen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}