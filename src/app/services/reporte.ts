import { API_BASE_URL } from './api-base';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReporteAtencion {
  fechaGeneracion: string;
  atencion: any;
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly apiUrl = `${API_BASE_URL}/Reportes`;

  constructor(private http: HttpClient) {}

  obtenerReporteAtencion(atencionId: number): Observable<ReporteAtencion> {
    return this.http.get<ReporteAtencion>(`${this.apiUrl}/atencion/${atencionId}`);
  }
}