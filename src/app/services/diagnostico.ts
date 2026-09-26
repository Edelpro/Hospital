import { API_BASE_URL } from './api-base';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Diagnostico } from '../models/diagnostico.model';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticoService {
  private readonly apiUrl = `${API_BASE_URL}/Diagnosticos`;

  constructor(private http: HttpClient) {}

  obtenerPorAtencion(atencionId: number): Observable<Diagnostico[]> {
    return this.http.get<Diagnostico[]>(`${this.apiUrl}/atencion/${atencionId}`);
  }

  guardarDiagnostico(diagnostico: Diagnostico): Observable<Diagnostico> {
    return this.http.post<Diagnostico>(`${this.apiUrl}/guardar`, diagnostico);
  }

  eliminarDiagnostico(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}