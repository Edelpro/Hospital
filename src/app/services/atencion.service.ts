import { API_BASE_URL } from './api-base';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Atencion } from '../models/atencion.model';

@Injectable({
  providedIn: 'root'
})
export class AtencionService {
  private readonly apiUrl = `${API_BASE_URL}/Atenciones`;

  constructor(private http: HttpClient) {}

  obtenerAtenciones(pacienteId?: number): Observable<Atencion[]> {
    return this.http.get<Atencion[]>(this.apiUrl, {params: pacienteId ? {pacienteId} : {}});
  }

  obtenerAtencionesActivas(): Observable<Atencion[]> {
    return this.http.get<Atencion[]>(`${this.apiUrl}/activas`);
  }

  obtenerAtencion(id: number): Observable<Atencion> {
    return this.http.get<Atencion>(`${this.apiUrl}/${id}`);
  }

  crearAtencion(atencion: Atencion): Observable<Atencion> {
    return this.http.post<Atencion>(this.apiUrl, atencion);
  }

  actualizarAtencion(id: number, atencion: Atencion): Observable<Atencion> {
    return this.http.put<Atencion>(`${this.apiUrl}/${id}`, atencion);
  }

  cerrarAtencion(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/cerrar`, {});
  }

  eliminarAtencion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}