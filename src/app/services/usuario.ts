import { API_BASE_URL } from './api-base';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  UsuarioSistema,
  UsuarioCrearRequest,
  UsuarioActualizarRequest
} from '../models/usuario-sistema.model';

import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${API_BASE_URL}/Usuarios`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  obtenerUsuarios(): Observable<UsuarioSistema[]> {
    return this.http.get<UsuarioSistema[]>(this.apiUrl, {
      headers: this.obtenerHeaders()
    });
  }

  crearUsuario(request: UsuarioCrearRequest): Observable<UsuarioSistema> {
    return this.http.post<UsuarioSistema>(this.apiUrl, request, {
      headers: this.obtenerHeaders()
    });
  }

  actualizarUsuario(id: number, request: UsuarioActualizarRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request, {
      headers: this.obtenerHeaders()
    });
  }

  activarUsuario(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/activar`, {}, {
      headers: this.obtenerHeaders()
    });
  }

  desactivarUsuario(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/desactivar`, {}, {
      headers: this.obtenerHeaders()
    });
  }

  cambiarClave(id: number, nuevaClave: string): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${id}/cambiar-clave`,
      JSON.stringify(nuevaClave),
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