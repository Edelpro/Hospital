import { API_BASE_URL } from './api-base';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  SolicitudAcceso,
  SolicitudAccesoCrearRequest,
  SolicitudAccesoAprobarRequest
} from '../models/solicitud-acceso.model';

import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class SolicitudAccesoService {
  private apiUrl = `${API_BASE_URL}/SolicitudesAcceso`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  crearSolicitud(request: SolicitudAccesoCrearRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }

  obtenerSolicitudes(): Observable<SolicitudAcceso[]> {
    return this.http.get<SolicitudAcceso[]>(this.apiUrl, {
      headers: this.obtenerHeaders()
    });
  }

  aprobarSolicitud(id: number, request: SolicitudAccesoAprobarRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/aprobar`, request, {
      headers: this.obtenerHeaders()
    });
  }

  rechazarSolicitud(id: number, observacion: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/${id}/rechazar`,
      JSON.stringify(observacion || ''),
      {
        headers: this.obtenerHeaders()
      }
    );
  }

  private obtenerHeaders(): HttpHeaders {
    const token = this.authService.obtenerToken();

    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }
}