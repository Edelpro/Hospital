import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { API_BASE_URL } from './api-base';
import { PlantillaClinica } from '../models/plantilla-clinica.model';

@Injectable({ providedIn: 'root' })
export class PlantillaClinicaService {
  private readonly apiUrl = `${API_BASE_URL}/PlantillasClinicas`;
  private readonly cambiosSubject = new Subject<PlantillaClinica['modulo'] | null>();
  readonly cambios$ = this.cambiosSubject.asObservable();
  constructor(private http: HttpClient) {}

  obtenerActivas(modulo: PlantillaClinica['modulo']): Observable<PlantillaClinica[]> {
    return this.http.get<PlantillaClinica[]>(this.apiUrl, { params: new HttpParams().set('modulo', modulo) });
  }

  obtenerTodas(): Observable<PlantillaClinica[]> { return this.http.get<PlantillaClinica[]>(`${this.apiUrl}/todos`); }
  crear(plantilla: PlantillaClinica): Observable<PlantillaClinica> {
    return this.http.post<PlantillaClinica>(this.apiUrl, plantilla).pipe(
      tap(() => this.cambiosSubject.next(plantilla.modulo))
    );
  }

  cambiarEstado(id: number, activo: boolean): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/estado?activo=${activo}`, {}).pipe(
      tap(() => this.cambiosSubject.next(null))
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cambiosSubject.next(null))
    );
  }
}
