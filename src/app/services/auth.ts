import { API_BASE_URL } from './api-base';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, catchError, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { UsuarioSesion } from '../models/usuario-sesion.model';

interface LoginRequest {
  correo: string;
  clave: string;
}

interface LoginResponse {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
  iniciales: string;
  token: string;
  expiraEn: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${API_BASE_URL}/Auth`;
  private readonly storageUsuarioKey = 'hcu008_usuario_sesion';
  private readonly storageTokenKey = 'hcu008_token';

  private usuarioSubject = new BehaviorSubject<UsuarioSesion | null>(
    this.obtenerUsuarioDesdeStorage()
  );

  usuario$: Observable<UsuarioSesion | null> = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {}

  iniciarSesion(correo: string, clave: string): Observable<boolean> {
    const request: LoginRequest = {
      correo: correo.trim().toLowerCase(),
      clave: clave.trim()
    };

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      map((response) => {
        const sesion: UsuarioSesion = {
          id: response.id,
          nombres: response.nombres,
          apellidos: response.apellidos,
          correo: response.correo,
          rol: response.rol,
          iniciales: response.iniciales,
          token: response.token,
          expiraEn: response.expiraEn
        };

        this.guardarSesion(sesion);
        this.usuarioSubject.next(sesion);

        return true;
      }),
      catchError((error) => {
        this.cerrarSesion();

        if (error.status === 401) {
          return of(false);
        }

        return throwError(() => error);
      })
    );
  }

  cerrarSesion(): void {
    this.eliminarSesion();
    this.usuarioSubject.next(null);
  }

  obtenerUsuarioActual(): UsuarioSesion | null {
    const usuario = this.usuarioSubject.value;

    if (!usuario) {
      return null;
    }

    if (this.sesionExpirada(usuario)) {
      this.cerrarSesion();
      return null;
    }

    return usuario;
  }

  obtenerToken(): string | null {
    const usuario = this.obtenerUsuarioActual();

    if (!usuario?.token) {
      return null;
    }

    return usuario.token;
  }

  estaAutenticado(): boolean {
    return !!this.obtenerUsuarioActual();
  }

  esAdmin(): boolean {
    const rol = (this.obtenerUsuarioActual()?.rol || '').trim().toLowerCase();

    return (
      rol === 'admin' ||
      rol === 'administrador' ||
      rol === 'director médico' ||
      rol === 'director medico'
    );
  }

  esAdministrador(): boolean {
    return this.esAdmin();
  }

  esDoctor(): boolean {
    const rol = (this.obtenerUsuarioActual()?.rol || '').trim().toLowerCase();

    return (
      rol === 'doctor' ||
      rol === 'médico' ||
      rol === 'medico'
    );
  }

  obtenerNombreCompleto(): string {
    const usuario = this.obtenerUsuarioActual();

    if (!usuario) {
      return '';
    }

    return this.componerNombreCompleto(usuario.nombres, usuario.apellidos);
  }

  componerNombreCompleto(nombres?: string | null, apellidos?: string | null): string {
    const nombresLimpios = (nombres || '').trim().replace(/\s+/g, ' ');
    const apellidosLimpios = (apellidos || '').trim().replace(/\s+/g, ' ');

    if (!nombresLimpios) return apellidosLimpios;
    if (!apellidosLimpios) return nombresLimpios;

    return nombresLimpios.toLocaleLowerCase().endsWith(` ${apellidosLimpios.toLocaleLowerCase()}`)
      ? nombresLimpios
      : `${nombresLimpios} ${apellidosLimpios}`;
  }

  obtenerRolActual(): string {
    return this.obtenerUsuarioActual()?.rol || '';
  }

  private guardarSesion(sesion: UsuarioSesion): void {
    if (!this.navegadorDisponible()) {
      return;
    }

    window.localStorage.setItem(this.storageUsuarioKey, JSON.stringify(sesion));

    if (sesion.token) {
      window.localStorage.setItem(this.storageTokenKey, sesion.token);
    }
  }

  private eliminarSesion(): void {
    if (!this.navegadorDisponible()) {
      return;
    }

    window.localStorage.removeItem(this.storageUsuarioKey);
    window.localStorage.removeItem(this.storageTokenKey);
  }

  private obtenerUsuarioDesdeStorage(): UsuarioSesion | null {
    if (!this.navegadorDisponible()) {
      return null;
    }

    const data = window.localStorage.getItem(this.storageUsuarioKey);

    if (!data) {
      return null;
    }

    try {
      const usuario = JSON.parse(data) as UsuarioSesion;

      if (this.sesionExpirada(usuario)) {
        this.eliminarSesion();
        return null;
      }

      return usuario;
    } catch {
      this.eliminarSesion();
      return null;
    }
  }

  private sesionExpirada(usuario: UsuarioSesion): boolean {
    if (!usuario || !usuario.token || !usuario.expiraEn || !usuario.rol) {
      return true;
    }

    const rol = usuario.rol.trim().toLowerCase();

    const rolPermitido =
      rol === 'admin' ||
      rol === 'administrador' ||
      rol === 'director médico' ||
      rol === 'director medico' ||
      rol === 'doctor' ||
      rol === 'médico' ||
      rol === 'medico';

    if (!rolPermitido) {
      return true;
    }

    const fechaExpiracion = new Date(usuario.expiraEn);

    if (isNaN(fechaExpiracion.getTime())) {
      return true;
    }

    return fechaExpiracion <= new Date();
  }

  private navegadorDisponible(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }
}
