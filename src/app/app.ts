import { inject } from '@angular/core';
import { AtencionService } from './services/atencion.service';
import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiMessageService } from './shared/ui-message.service';
import { Login } from './components/login/login';
import { AuthService } from './services/auth';
import { UsuarioSesion } from './models/usuario-sesion.model';

import { Paciente } from './models/paciente.model';
import { Atencion } from './models/atencion.model';

import { Pacientes } from './components/pacientes/pacientes';
import { Tablero } from './components/tablero/tablero';
import { Atenciones } from './components/atenciones/atenciones';
import { Triaje } from './components/triaje/triaje';
import { EvaluacionMedica } from './components/evaluacion-medica/evaluacion-medica';
import { Diagnosticos } from './components/diagnosticos/diagnosticos';
import { Prescripciones } from './components/prescripciones/prescripciones';
import { Examenes } from './components/examenes/examenes';
import { Evoluciones } from './components/evoluciones/evoluciones';
import { Egreso } from './components/egreso/egreso';
import { Reportes } from './components/reportes/reportes';
import { Placeholders } from './components/placeholders/placeholders';
import { UiModal } from './components/ui-modal/ui-modal';
import { AdminCatalogos } from './pages/admin-catalogos/admin-catalogos';
import { AdminUsuarios } from './pages/admin-usuarios/admin-usuario';
import { PresentacionProyecto } from './pages/presentacion-proyecto/presentacion-proyecto';
import { Mensajeria } from './components/mensajeria/mensajeria';

type VistaActiva =
  | 'inicio'
  | 'tablero'
  | 'pacientes'
  | 'atenciones'
  | 'triaje'
  | 'evaluacion'
  | 'diagnosticos'
  | 'prescripciones'
  | 'examenes'
  | 'evoluciones'
  | 'egreso'
  | 'reportes'
  | 'mensajeria'
  | 'admin-catalogos'
  | 'admin-usuarios';

interface EventoInstalacion extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    PresentacionProyecto,
    Login,
    Pacientes,
    Atenciones,
    Tablero,
    Triaje,
    EvaluacionMedica,
    Diagnosticos,
    Prescripciones,
    Examenes,
    Evoluciones,
    Egreso,
    Reportes,
    Placeholders,
    AdminCatalogos,
    AdminUsuarios,
    Mensajeria,
    UiModal
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  mostrarPresentacion = typeof window === 'undefined' || window.location.pathname !== '/app';
  instalacionDisponible = false;
  private eventoInstalacion?: EventoInstalacion;

  @HostListener('window:beforeinstallprompt', ['$event'])
  prepararInstalacion(evento: Event): void {
    evento.preventDefault();
    this.eventoInstalacion = evento as EventoInstalacion;
    this.instalacionDisponible = true;
  }

  @HostListener('window:appinstalled')
  confirmarInstalacion(): void {
    this.instalacionDisponible = false;
    this.eventoInstalacion = undefined;
    this.uiMessageService.exito('Aplicación instalada', 'HCU 008 ya está disponible como aplicación en este dispositivo.');
  }

  async instalarAplicacion(): Promise<void> {
    if (!this.eventoInstalacion) {
      this.uiMessageService.advertencia(
        'Instalación no disponible',
        'Si la aplicación ya está instalada, ábrala desde Windows. También puede usar la opción Instalar aplicación del menú de Chrome o Edge.'
      );
      return;
    }
    await this.eventoInstalacion.prompt();
    const eleccion = await this.eventoInstalacion.userChoice;
    if (eleccion.outcome === 'dismissed') {
      this.uiMessageService.advertencia('Instalación cancelada', 'Puede instalar HCU 008 más tarde desde este mismo botón.');
    }
    this.eventoInstalacion = undefined;
    this.instalacionDisponible = false;
  }

  abrirSistema(): void {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/app');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    this.mostrarPresentacion = false;
  }

  private atencionService = inject(AtencionService);
  refrescarAtencion(): void {
    const id = this.atencionActual?.id;
    if (!id) return;
    this.atencionService.obtenerAtencion(id).subscribe({
      next: a=>{ if (this.atencionActual?.id === id) this.atencionActual=a; },
      error:()=>this.uiMessageService.advertencia('Actualización pendiente','Vuelva al tablero para consultar el estado actualizado.')
    });
  }
  actualizarPacienteSeleccionado(paciente: Paciente): void {
    if (this.pacienteActual?.id === paciente.id) this.pacienteActual = paciente;
  }
  limpiarPacienteEliminado(id: number): void {
    if (this.pacienteActual?.id === id) { this.pacienteActual=undefined; this.atencionActual=undefined; }
  }
  menuAbierto = false;
  get tituloVista(): string {
    const titulos: Record<VistaActiva, string> = {inicio: 'Tablero de emergencia', tablero: 'Tablero de emergencia', pacientes: 'Pacientes', atenciones: 'Atenciones', triaje: 'Triaje', evaluacion: 'Evaluación médica', diagnosticos: 'Diagnósticos', prescripciones: 'Prescripciones', examenes: 'Exámenes', evoluciones: 'Evoluciones', egreso: 'Egreso', reportes: 'Reporte clínico', mensajeria: 'Mensajería clínica', 'admin-usuarios': 'Usuarios y accesos', 'admin-catalogos': 'Catálogos'};
    return titulos[this.vistaActiva];
  }
  vistaActiva: VistaActiva = 'inicio';

  pacienteActual?: Paciente;
  atencionActual?: Atencion;

  usuarioActual: UsuarioSesion | null = null;

  constructor(
    public authService: AuthService,
    private uiMessageService: UiMessageService
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.obtenerUsuarioActual();

    this.authService.usuario$.subscribe((usuario) => {
      this.usuarioActual = usuario;

      if (!usuario) {
        this.pacienteActual = undefined;
        this.atencionActual = undefined;
        this.vistaActiva = 'inicio';
      }
    });
  }

  procesarSesionIniciada(usuario: UsuarioSesion): void {
    this.usuarioActual = usuario;
    this.vistaActiva = 'inicio';
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();

    this.usuarioActual = null;
    this.pacienteActual = undefined;
    this.atencionActual = undefined;
    this.vistaActiva = 'inicio';
  }

  esAdministrador(): boolean {
    return this.authService.esAdmin();
  }

  esAdmin(): boolean {
    return this.esAdministrador();
  }

  esDoctor(): boolean {
    return this.authService.esDoctor();
  }

  cambiarVista(vista: VistaActiva): void {
    if (!this.usuarioActual) {
      this.vistaActiva = 'inicio';
      return;
    }

    if (
      (vista === 'admin-catalogos' || vista === 'admin-usuarios') &&
      !this.esAdministrador()
    ) {
      this.uiMessageService.advertencia(
        'Acceso restringido',
        'Este módulo solo está disponible para usuarios administradores.'
      );

      this.vistaActiva = 'inicio';
      return;
    }

    if (this.requiereAtencionActiva(vista) && !this.atencionActual?.id) {
      this.uiMessageService.advertencia(
        'Atención requerida',
        'Primero debe abrir o crear una atención activa para ingresar a este módulo.'
      );

      return;
    }

    this.vistaActiva = vista;
  }

  requiereAtencionActiva(vista: VistaActiva): boolean {
    return (
      vista === 'triaje' ||
      vista === 'evaluacion' ||
      vista === 'diagnosticos' ||
      vista === 'prescripciones' ||
      vista === 'examenes' ||
      vista === 'evoluciones' ||
      vista === 'egreso' ||
      vista === 'reportes'
      || vista === 'mensajeria'
    );
  }

  esVista(vista: VistaActiva): boolean {
    return this.vistaActiva === vista;
  }

  seleccionarPaciente(paciente: Paciente): void {
    this.pacienteActual = paciente;
    this.atencionActual = undefined;
    this.vistaActiva = 'atenciones';
  }

  seleccionarAtencion(atencion: Atencion): void {
    this.atencionActual = atencion;
    this.refrescarAtencion();

    if (atencion.paciente) {
      this.pacienteActual = atencion.paciente;
    }

    if (atencion.estado === 'Cerrada' || atencion.estado === 'Con egreso') { this.vistaActiva='reportes'; return; }
    if (!atencion.triaje) {
      this.vistaActiva = 'triaje';
      return;
    }

    switch (atencion.estado) {
      case 'Abierta':
        this.vistaActiva = 'triaje';
        return;

      case 'En triaje':
        this.vistaActiva = 'evaluacion';
        return;

      case 'Con evaluación':
        this.vistaActiva = 'diagnosticos';
        return;

      case 'Con diagnóstico':
        this.vistaActiva = 'prescripciones';
        return;

      case 'Con prescripción':
        this.vistaActiva = 'examenes';
        return;

      case 'Con exámenes':
        this.vistaActiva = 'evoluciones';
        return;

      case 'Con evolución':
        this.vistaActiva = 'egreso';
        return;

      case 'Con egreso':
        this.vistaActiva = 'reportes';
        return;

      default:
        this.vistaActiva = 'triaje';
        return;
    }
  }

  procesarAtencionCreada(atencion: Atencion): void {
    this.atencionActual = atencion;

    if (atencion.paciente) {
      this.pacienteActual = atencion.paciente;
    }

    this.vistaActiva = 'triaje';
  }

  procesarAtencionEliminada(atencionId: number): void {
    if (this.atencionActual?.id === atencionId) {
      this.atencionActual = undefined;
      this.pacienteActual = undefined;
      this.vistaActiva = 'inicio';
    }
  }

  procesarTriajeGuardado(triajeGuardado: any): void {
    this.refrescarAtencion();

    this.vistaActiva = 'evaluacion';
  }

  procesarEvaluacionGuardada(): void {
    this.refrescarAtencion();

    this.vistaActiva = 'diagnosticos';
  }

  procesarDiagnosticoGuardado(): void {
    this.refrescarAtencion();
  }

  procesarPrescripcionGuardada(): void {
    this.refrescarAtencion();
  }

  procesarExamenGuardado(): void {
    this.refrescarAtencion();
  }

  procesarEvolucionGuardada(): void {
    this.refrescarAtencion();
  }

  procesarEgresoGuardado(): void {
    this.refrescarAtencion();

    this.vistaActiva = 'reportes';
  }

  obtenerCodigoAtencion(): string {
    if (!this.atencionActual?.id) {
      return 'Sin atención';
    }

    return `AT-${this.atencionActual.id}`;
  }

  obtenerEdadTexto(fechaNacimiento?: string | null): string {
    if (!fechaNacimiento) {
      return 'Edad no registrada';
    }

    const nacimiento = new Date(fechaNacimiento);

    if (isNaN(nacimiento.getTime())) {
      return 'Edad no registrada';
    }

    const hoy = new Date();

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    if (edad < 0) {
      return 'Edad no registrada';
    }

    return `${edad} años`;
  }

  obtenerNombrePacienteActual(): string {
    if (!this.pacienteActual) {
      return 'Sin paciente seleccionado';
    }

    const nombres = this.pacienteActual.nombres || '';
    const apellidos = this.pacienteActual.apellidos || '';

    return `${nombres} ${apellidos}`.trim() || 'Paciente sin nombre';
  }

  obtenerEstadoAtencion(): string {
    return this.atencionActual?.estado || 'Sin atención activa';
  }

  esModuloTemporal(): boolean {
    return false;
  }
}
