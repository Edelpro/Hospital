import { API_BASE_URL } from './api-base';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Prescripcion } from '../models/prescripcion.model';

@Injectable({
  providedIn: 'root'
})
export class PrescripcionService {
  private readonly apiUrl = `${API_BASE_URL}/Prescripciones`;

  constructor(private http: HttpClient) {}

  obtenerPorAtencion(atencionId: number): Observable<Prescripcion[]> {
    return this.http.get<Prescripcion[]>(`${this.apiUrl}/atencion/${atencionId}`);
  }

  guardarPrescripcion(prescripcion: Prescripcion): Observable<Prescripcion> {
    return this.http.post<Prescripcion>(this.apiUrl, prescripcion);
  }

  eliminarPrescripcion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}