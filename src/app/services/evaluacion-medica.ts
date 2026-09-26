import { API_BASE_URL } from './api-base';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { EvaluacionMedica } from '../models/evaluacion-medica.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluacionMedicaService {
  private readonly apiUrl = `${API_BASE_URL}/EvaluacionesMedicas`;

  constructor(private http: HttpClient) {}

  obtenerEvaluacionPorAtencion(atencionId: number): Observable<EvaluacionMedica> {
    return this.http.get<EvaluacionMedica>(`${this.apiUrl}/atencion/${atencionId}`);
  }

  guardarEvaluacion(evaluacion: EvaluacionMedica): Observable<EvaluacionMedica> {
    return this.http.post<EvaluacionMedica>(`${this.apiUrl}/guardar`, evaluacion);
  }
}