import { API_BASE_URL } from './api-base';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Triaje } from '../models/triaje.model';
import { Atencion } from '../models/atencion.model';

@Injectable({
  providedIn: 'root'
})
export class TriajeService {
  private readonly apiUrl = `${API_BASE_URL}/Triajes`;

  constructor(private http: HttpClient) {}

  guardarTriaje(triaje: Triaje): Observable<Triaje> {
    return this.http.post<Triaje>(`${this.apiUrl}/guardar`, triaje);
  }

  obtenerTriajePorAtencion(atencionId: number): Observable<Triaje> {
    return this.http.get<Triaje>(`${this.apiUrl}/atencion/${atencionId}`);
  }

  obtenerTablero(): Observable<Atencion[]> {
    return this.http.get<Atencion[]>(`${this.apiUrl}/tablero`);
  }
}