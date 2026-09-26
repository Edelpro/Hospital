import { TestBed } from '@angular/core/testing';
import { Atencion } from './models/atencion.model';
import { App } from './app';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './services/auth';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('muestra la presentación pública antes del acceso al sistema', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('La emergencia hospitalaria');
    expect(compiled.querySelector('app-presentacion-proyecto')).not.toBeNull();
    expect(compiled.querySelector('.hospital-layout')).toBeNull();
  });
  it('rechaza una sesión sin expiración', () => {
    localStorage.setItem('hcu008_usuario_sesion', JSON.stringify({id: 1, rol: 'Admin', token: 'prueba'}));
    expect(TestBed.inject(AuthService).estaAutenticado()).toBe(false);
  });
  it('impide que un doctor abra usuarios', () => {
    localStorage.setItem('hcu008_usuario_sesion', JSON.stringify({id: 1, rol: 'Doctor', token: 'prueba', expiraEn: new Date(Date.now()+60000).toISOString()}));
    const app = TestBed.createComponent(App).componentInstance;
    app.ngOnInit(); app.cambiarVista('admin-usuarios');
    expect(app.vistaActiva).toBe('inicio');
  });
  it('conserva la vista si falta seleccionar una atención', () => {
    localStorage.setItem('hcu008_usuario_sesion', JSON.stringify({id: 1, rol: 'Doctor', token: 'prueba', expiraEn: new Date(Date.now()+60000).toISOString()}));
    const app = TestBed.createComponent(App).componentInstance;
    app.ngOnInit(); app.vistaActiva='pacientes'; app.cambiarVista('triaje');
    expect(app.vistaActiva).toBe('pacientes');
  });
  it('abre el reporte de una atención cerrada aunque no tenga triaje', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.seleccionarAtencion({id: 7, pacienteId: 1, estado: 'Cerrada'} as Atencion);
    expect(app.vistaActiva).toBe('reportes');
  });
  it('continúa en evoluciones cuando la atención ya tiene exámenes', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.seleccionarAtencion({id: 7, pacienteId: 1, estado: 'Con exámenes', triaje: {id: 1}} as Atencion);
    expect(app.vistaActiva).toBe('evoluciones');
  });
});
