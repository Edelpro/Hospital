import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Tablero } from './tablero';
import { Atencion } from '../../models/atencion.model';
import { API_BASE_URL } from '../../services/api-base';

describe('Tablero y recuperación del historial', () => {
  let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({imports:[Tablero],providers:[provideHttpClient(),provideHttpClientTesting()]}); http=TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  const anteriores = Array.from({length:4},(_,i)=>({id:i+1,pacienteId:i+1,estado:'Con egreso',fechaIngreso:'2026-09-05T10:00:00',paciente:{nombres:'Paciente',apellidos:'Prueba '+i,cedula:'990000000'+i}} as Atencion));
  it('muestra las cuatro atenciones con egreso sin contarlas como activas', () => {
    const c=TestBed.createComponent(Tablero).componentInstance;c.ngOnInit();http.expectOne(`${API_BASE_URL}/Atenciones`).flush(anteriores);
    expect(c.registrosPagina.length).toBe(4);expect(c.totalActivos).toBe(0);expect(c.totalHistorial).toBe(4);
    c.cambiarAlcance('Activas');expect(c.totalFiltrados).toBe(0);c.cambiarAlcance('Historial');expect(c.totalFiltrados).toBe(4);
  });
  it('cuenta una prioridad naranja aunque la atención ya esté en el historial', () => {
    const c=TestBed.createComponent(Tablero).componentInstance;
    c.ngOnInit();
    http.expectOne(`${API_BASE_URL}/Atenciones`).flush([
      {...anteriores[0],triaje:{prioridad:'Naranja'}},
      {...anteriores[1],triaje:{prioridad:'Verde'}}
    ]);
    expect(c.totalActivos).toBe(0);
    expect(c.totalCriticos).toBe(1);
  });
  it('mantiene los datos si falla una actualización y permite reintentar', () => {
    const c=TestBed.createComponent(Tablero).componentInstance;c.ngOnInit();http.expectOne(`${API_BASE_URL}/Atenciones`).flush(anteriores);
    c.cargarTablero();http.expectOne(`${API_BASE_URL}/Atenciones`).flush('Servicio no disponible',{status:503,statusText:'Unavailable'});
    expect(c.tablero.length).toBe(4);expect(c.errorCarga).toContain('Servicio no disponible');expect(c.cargandoTablero).toBe(false);
    c.cargarTablero();http.expectOne(`${API_BASE_URL}/Atenciones`).flush(anteriores);expect(c.errorCarga).toBe('');
  });
  it('reinicia la página al filtrar y encuentra al paciente por identificación', () => {
    const c=TestBed.createComponent(Tablero).componentInstance;c.tablero=anteriores;c.pagina=3;c.cambiarFiltroEstado('Con egreso');expect(c.pagina).toBe(1);
    c.busqueda='9900000002';expect(c.totalFiltrados).toBe(1);c.limpiarFiltros();expect(c.totalFiltrados).toBe(4);
  });
});
