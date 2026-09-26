import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Atencion } from '../../models/atencion.model';
import { TriajeService } from '../../services/triaje.service';
import { AtencionService } from '../../services/atencion.service';
import { AuthService } from '../../services/auth';
import { UiMessageService } from '../../shared/ui-message.service';

type FiltroPrioridad =
  | 'Todos'
  | 'Rojo'
  | 'Naranja'
  | 'Amarillo'
  | 'Verde'
  | 'Azul'
  | 'Sin triaje';

type FiltroEstado =
  | 'Todos'
  | 'Abierta'
  | 'En triaje'
  | 'Con evaluación'
  | 'Con diagnóstico'
  | 'Con prescripción'
  | 'Con exámenes'
  | 'Con evolución'
  | 'Con egreso'
  | 'Cerrada';

@Component({
  selector: 'app-tablero',
  imports: [CommonModule, FormsModule],
  templateUrl: './tablero.html',
  styleUrl: './tablero.css'
})
export class Tablero implements OnInit {
  @Output() atencionSeleccionada = new EventEmitter<Atencion>();
  @Output() atencionEliminada = new EventEmitter<number>();

  @Output() nuevoPaciente = new EventEmitter<void>();
  tablero: Atencion[] = [];
  alcance: 'Todas' | 'Activas' | 'Historial' = 'Todas';
  busqueda = '';
  pagina = 1;
  readonly tamanoPagina = 20;
  errorCarga = '';
  ultimaActualizacion?: Date;
  esActiva(a: Atencion): boolean { return a.estado !== 'Cerrada' && a.estado !== 'Con egreso'; }
  get totalHistorial(): number { return this.tablero.filter(a => !this.esActiva(a)).length; }
  get paginas(): number { return Math.max(1, Math.ceil(this.totalFiltrados / this.tamanoPagina)); }
  get registrosPagina(): Atencion[] { return this.tableroFiltrado.slice((this.pagina - 1) * this.tamanoPagina, this.pagina * this.tamanoPagina); }
  cambiarAlcance(valor: 'Todas' | 'Activas' | 'Historial'): void { this.alcance = valor; this.filtroEstado = 'Todos'; this.pagina = 1; }
  limpiarFiltros(): void { this.busqueda = ''; this.filtroEstado = 'Todos'; this.filtroPrioridad = 'Todos'; this.pagina = 1; }

  cargandoTablero = false;
  eliminandoAtencionId?: number;

  filtroPrioridad: FiltroPrioridad = 'Todos';
  filtroEstado: FiltroEstado = 'Todos';

  filtrosPrioridad: FiltroPrioridad[] = [
    'Todos',
    'Rojo',
    'Naranja',
    'Amarillo',
    'Verde',
    'Azul',
    'Sin triaje'
  ];

  filtrosEstado: FiltroEstado[] = [
    'Todos',
    'Abierta',
    'En triaje',
    'Con evaluación',
    'Con diagnóstico',
    'Con prescripción',
    'Con exámenes',
    'Con evolución',
    'Con egreso',
    'Cerrada'
  ];

  constructor(
    private triajeService: TriajeService,
    private atencionService: AtencionService,
    private authService: AuthService,
    private uiMessageService: UiMessageService
  ) {}

  ngOnInit(): void {
    this.cargarTablero();
  }

  cargarTablero(): void {
    if (this.cargandoTablero) return;
    this.cargandoTablero = true;
    this.errorCarga = '';

    this.atencionService.obtenerAtenciones().subscribe({
      next: (datos: Atencion[]) => {
        this.tablero = (datos || [])
          .sort((a, b) => {
            if (this.esActiva(a) !== this.esActiva(b)) return this.esActiva(a) ? -1 : 1;
            if (!this.esActiva(a)) return new Date(b.fechaIngreso || '').getTime() - new Date(a.fechaIngreso || '').getTime();
            const prioridadA = this.obtenerOrdenPrioridad(a.triaje?.prioridad);
            const prioridadB = this.obtenerOrdenPrioridad(b.triaje?.prioridad);

            if (prioridadA !== prioridadB) {
              return prioridadA - prioridadB;
            }

            const fechaA = new Date(a.fechaIngreso || '').getTime() || 0;
            const fechaB = new Date(b.fechaIngreso || '').getTime() || 0;

            return fechaA - fechaB;
          });

        this.ultimaActualizacion = new Date();
        this.pagina = Math.min(this.pagina, this.paginas);
        this.cargandoTablero = false;
      },
      error: (error: any) => {
        console.error('Error al cargar tablero:', error);

        this.cargandoTablero = false;
        this.errorCarga = this.obtenerMensajeError(error);
      }
    });
  }

  get tableroFiltrado(): Atencion[] {
    return this.tablero.filter((atencion) => {
      const prioridad = atencion.triaje?.prioridad || 'Sin triaje';
      const estado = atencion.estado || 'Sin estado';

      const cumplePrioridad =
        this.filtroPrioridad === 'Todos' ||
        this.filtroPrioridad === prioridad;

      const cumpleEstado =
        this.filtroEstado === 'Todos' ||
        this.filtroEstado === estado;

      const cumpleAlcance = this.alcance === 'Todas' || (this.alcance === 'Activas' ? this.esActiva(atencion) : !this.esActiva(atencion));
      const texto = (this.obtenerNombrePaciente(atencion) + ' ' + this.obtenerCedulaPaciente(atencion) + ' AT-' + atencion.id).toLocaleLowerCase('es');
      return cumplePrioridad && cumpleEstado && cumpleAlcance && texto.includes(this.busqueda.trim().toLocaleLowerCase('es'));
    });
  }

  get totalActivos(): number {
    return this.tablero.filter(a => this.esActiva(a)).length;
  }

  get totalCriticos(): number {
    return this.tablero.filter((atencion) => {
      const prioridad = atencion.triaje?.prioridad;
      return prioridad === 'Rojo' || prioridad === 'Naranja';
    }).length;
  }

  get totalSinTriaje(): number {
    return this.tablero.filter((atencion) => this.esActiva(atencion) && !atencion.triaje?.prioridad).length;
  }

  get totalFiltrados(): number {
    return this.tableroFiltrado.length;
  }

  cambiarFiltroPrioridad(filtro: FiltroPrioridad): void {
    this.filtroPrioridad = filtro; this.pagina = 1;
  }

  cambiarFiltroEstado(filtro: FiltroEstado): void {
    this.filtroEstado = filtro; this.pagina = 1;
  }

  seleccionarAtencion(atencion: Atencion): void {
    if (!atencion?.id) {
      this.uiMessageService.advertencia(
        'Atención no válida',
        'No se pudo abrir la atención seleccionada.'
      );

      return;
    }

    this.atencionSeleccionada.emit(atencion);
  }

  esAdministrador(): boolean {
    const rol = (this.authService.obtenerUsuarioActual()?.rol || '').trim().toLowerCase();

    return (
      rol === 'admin' ||
      rol === 'administrador' ||
      rol === 'director médico' ||
      rol === 'director medico'
    );
  }

  puedeEliminarAtencion(atencion: Atencion): boolean {
    if (!this.esAdministrador()) {
      return false;
    }

    const estado = (atencion.estado || '').trim();

    return estado !== 'Cerrada';
  }

  eliminarAtencion(atencion: Atencion, event?: Event): void {
    event?.stopPropagation();

    if (!atencion?.id) {
      return;
    }

    if (!this.puedeEliminarAtencion(atencion)) {
      this.uiMessageService.advertencia(
        'Eliminación no permitida',
        'Solo el administrador puede eliminar atenciones no cerradas.'
      );

      return;
    }

    const codigo = `AT-${atencion.id}`;
    const paciente = this.obtenerNombrePaciente(atencion);

    this.uiMessageService.confirmar(
      'Eliminar atención',
      `Se eliminará la atención ${codigo} de ${paciente}. Use esta opción solo para registros duplicados o creados por error.`,
      () => {
        this.eliminandoAtencionId = atencion.id;

        this.atencionService.eliminarAtencion(atencion.id!).subscribe({
          next: () => {
            this.uiMessageService.exito(
              'Atención eliminada',
              'La atención duplicada fue eliminada correctamente.'
            );

            this.eliminandoAtencionId = undefined;
            this.atencionEliminada.emit(atencion.id!);
            this.cargarTablero();
          },
          error: (error: any) => {
            console.error('Error al eliminar atención:', error);

            this.eliminandoAtencionId = undefined;

            this.uiMessageService.error(
              'Error al eliminar atención',
              this.obtenerMensajeError(error)
            );
          }
        });
      },
      'Eliminar',
      'Cancelar'
    );
  }

  trackByAtencion(index: number, atencion: Atencion): number {
    return atencion.id || index;
  }

  obtenerNombrePaciente(atencion: Atencion): string {
    const nombres = atencion.paciente?.nombres || '';
    const apellidos = atencion.paciente?.apellidos || '';

    return `${nombres} ${apellidos}`.trim() || 'Paciente sin nombre';
  }

  obtenerCedulaPaciente(atencion: Atencion): string {
    return atencion.paciente?.cedula || 'Sin cédula';
  }

  obtenerPrioridadTexto(prioridad?: string | null): string {
    return prioridad || 'Sin triaje';
  }

  obtenerEstadoTexto(estado?: string | null): string {
    return estado || 'Sin estado';
  }

  obtenerClasePrioridad(prioridad?: string | null): string {
    switch (prioridad) {
      case 'Rojo':
        return 'prioridad-rojo';
      case 'Naranja':
        return 'prioridad-naranja';
      case 'Amarillo':
        return 'prioridad-amarillo';
      case 'Verde':
        return 'prioridad-verde';
      case 'Azul':
        return 'prioridad-azul';
      default:
        return 'prioridad-sin-triaje';
    }
  }

  obtenerClaseFiltroPrioridad(filtro: FiltroPrioridad): string {
    switch (filtro) {
      case 'Rojo':
        return 'filtro-rojo';
      case 'Naranja':
        return 'filtro-naranja';
      case 'Amarillo':
        return 'filtro-amarillo';
      case 'Verde':
        return 'filtro-verde';
      case 'Azul':
        return 'filtro-azul';
      case 'Sin triaje':
        return 'filtro-sin-triaje';
      default:
        return 'filtro-todos';
    }
  }

  obtenerClaseFiltroEstado(filtro: FiltroEstado): string {
    switch (filtro) {
      case 'Abierta':
        return 'filtro-estado-abierta';
      case 'En triaje':
        return 'filtro-estado-triaje';
      case 'Con evaluación':
        return 'filtro-estado-evaluacion';
      case 'Con diagnóstico':
        return 'filtro-estado-diagnostico';
      case 'Con prescripción':
        return 'filtro-estado-prescripcion';
      case 'Con exámenes':
        return 'filtro-estado-examenes';
      case 'Con evolución':
        return 'filtro-estado-evolucion';
      case 'Con egreso':
        return 'filtro-estado-egreso';
      default:
        return 'filtro-todos';
    }
  }

  obtenerOrdenPrioridad(prioridad?: string | null): number {
    switch (prioridad) {
      case 'Rojo':
        return 1;
      case 'Naranja':
        return 2;
      case 'Amarillo':
        return 3;
      case 'Verde':
        return 4;
      case 'Azul':
        return 5;
      default:
        return 6;
    }
  }

  obtenerClaseEstado(estado?: string | null): string {
    switch (estado) {
      case 'Abierta':
        return 'estado-abierta';
      case 'En triaje':
        return 'estado-triaje';
      case 'Con evaluación':
        return 'estado-evaluacion';
      case 'Con diagnóstico':
        return 'estado-diagnostico';
      case 'Con prescripción':
        return 'estado-prescripcion';
      case 'Con exámenes':
        return 'estado-examenes';
      case 'Con evolución':
        return 'estado-evolucion';
      case 'Con egreso':
        return 'estado-egreso';
      default:
        return 'estado-pendiente';
    }
  }

  formatearFecha(fecha?: string | null): string {
    if (!fecha) {
      return 'Sin fecha';
    }

    const fechaConvertida = new Date(fecha);

    if (isNaN(fechaConvertida.getTime())) {
      return 'Fecha no válida';
    }

    return fechaConvertida.toLocaleString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  obtenerTiempoEspera(fecha?: string | null): string {
    if (!fecha) {
      return 'Sin tiempo';
    }

    const fechaIngreso = new Date(fecha);

    if (isNaN(fechaIngreso.getTime())) {
      return 'Sin tiempo';
    }

    const ahora = new Date();
    const diferenciaMinutos = Math.floor(
      (ahora.getTime() - fechaIngreso.getTime()) / 60000
    );

    if (diferenciaMinutos < 1) {
      return 'Menos de 1 minuto';
    }

    if (diferenciaMinutos < 60) {
      return `${diferenciaMinutos} min`;
    }

    const horas = Math.floor(diferenciaMinutos / 60);
    const minutos = diferenciaMinutos % 60;

    if (minutos === 0) {
      return `${horas} h`;
    }

    return `${horas} h ${minutos} min`;
  }

  obtenerMensajeError(error: any): string {
    if (error?.error?.errors) {
      const errores = error.error.errors;

      const mensajes = Object.keys(errores)
        .map((campo) => {
          const detalle = Array.isArray(errores[campo])
            ? errores[campo].join(' ')
            : errores[campo];

          return `${campo}: ${detalle}`;
        })
        .join('\n');

      return mensajes || 'Uno o más campos no pasaron la validación.';
    }

    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.error?.mensaje) {
      return error.error.mensaje;
    }

    if (error?.error?.title) {
      return error.error.title;
    }

    if (error?.status === 401) {
      return 'Sesión expirada o no autorizada. Inicie sesión nuevamente.';
    }

    if (error?.status === 403) {
      return 'No tiene permisos para realizar esta acción.';
    }

    if (error?.status === 0) return 'No se pudo conectar con la API. Compruebe que esté ejecutándose y vuelva a intentar.';
    if (error?.message) {
      return error.message;
    }

    return 'No se pudo completar la operación.';
  }
}
