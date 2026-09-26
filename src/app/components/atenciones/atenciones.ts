import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Paciente } from '../../models/paciente.model';
import { Atencion } from '../../models/atencion.model';
import { CatalogoItem } from '../../models/catalogo-item.model';

import { AtencionService } from '../../services/atencion.service';
import { CatalogoService } from '../../services/catalogo';
import { AuthService } from '../../services/auth';
import { UiMessageService } from '../../shared/ui-message.service';

type VistaDestinoAtencion = 'inicio' | 'pacientes' | 'triaje';

@Component({
  selector: 'app-atenciones',
  imports: [CommonModule, FormsModule],
  templateUrl: './atenciones.html',
  styleUrl: './atenciones.css'
})
export class Atenciones implements OnInit, OnChanges {
  @Input() pacienteActual?: Paciente;

  @Output() atencionCreada = new EventEmitter<Atencion>();
  @Output() atencionEliminada = new EventEmitter<number>();
  @Output() irModulo = new EventEmitter<VistaDestinoAtencion>();

  atencionesPaciente: Atencion[] = [];

  cargandoCatalogos = false;
  cargandoAtenciones = false;
  guardando = false;
  eliminandoId?: number;

  modoEdicion = false;

  motivosConsulta: string[] = [
    'Dolor abdominal',
    'Dolor torácico',
    'Fiebre',
    'Disnea',
    'Trauma',
    'Cefalea',
    'Vómitos',
    'Diarrea',
    'Control',
    'Otro'
  ];

  procedencias: string[] = [
    'Propia voluntad',
    'Ambulancia',
    'Referido',
    'Transferido'
  ];

  condicionesLlegada: string[] = [
    'Caminando',
    'Silla de ruedas',
    'Camilla',
    'Inconsciente'
  ];

  parentescos: string[] = [
    'Madre',
    'Padre',
    'Cónyuge',
    'Hijo/a',
    'Hermano/a',
    'Familiar',
    'Acompañante',
    'Otro'
  ];

  formulario: Atencion = this.crearFormularioVacio(0);

  constructor(
    private atencionService: AtencionService,
    private catalogoService: CatalogoService,
    private authService: AuthService,
    private uiMessageService: UiMessageService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.prepararFormulario();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pacienteActual']) {
      const anterior = changes['pacienteActual'].previousValue?.id || 0;
      const actual = changes['pacienteActual'].currentValue?.id || 0;
      if (anterior === actual) return;
      this.prepararFormulario();
      this.cargarAtencionesPaciente();
    }
  }

  prepararFormulario(): void {
    this.modoEdicion = false;
    this.formulario = this.crearFormularioVacio(this.pacienteActual?.id || 0);
  }

  crearFormularioVacio(pacienteId: number): Atencion {
    return {
      pacienteId,
      motivoConsulta: '',
      motivoConsultaOtro: null,
      enfermedadActualBreve: '',
      procedencia: '',
      condicionLlegada: '',
      tieneAcompanante: false,
      nombreAcompanante: null,
      parentescoAcompanante: null,
      telefonoAcompanante: null,
      estado: 'Abierta'
    };
  }

  cargarCatalogos(): void {
    this.cargandoCatalogos = true;

    this.catalogoService.obtenerActivos().subscribe({
      next: (catalogos: CatalogoItem[]) => {
        this.motivosConsulta = this.obtenerNombresPorTipo(catalogos, 'MotivoConsulta', this.motivosConsulta);
        this.procedencias = this.obtenerNombresPorTipo(catalogos, 'Procedencia', this.procedencias);
        this.condicionesLlegada = this.obtenerNombresPorTipo(catalogos, 'CondicionLlegada', this.condicionesLlegada);
        this.parentescos = this.obtenerNombresPorTipo(catalogos, 'ParentescoAcompanante', this.parentescos);

        this.cargandoCatalogos = false;
      },
      error: (error: any) => {
        console.error('Error al cargar catálogos de atenciones:', error);

        this.cargandoCatalogos = false;

        this.uiMessageService.advertencia(
          'Catálogos no disponibles',
          'No se pudieron cargar los catálogos desde la base. Se usarán valores básicos.'
        );
      }
    });
  }

  obtenerNombresPorTipo(catalogos: CatalogoItem[], tipo: string, respaldo: string[]): string[] {
    const valores = catalogos
      .filter((item) => item.tipo === tipo && item.activo)
      .sort((a, b) => {
        const ordenA = a.orden || 0;
        const ordenB = b.orden || 0;

        if (ordenA !== ordenB) {
          return ordenA - ordenB;
        }

        return a.nombre.localeCompare(b.nombre);
      })
      .map((item) => item.nombre);

    return valores.length ? valores : respaldo;
  }

  cargarAtencionesPaciente(): void {
    if (!this.pacienteActual?.id) {
      this.atencionesPaciente = [];
      return;
    }

    this.cargandoAtenciones = true;

    this.atencionService.obtenerAtenciones(this.pacienteActual.id).subscribe({
      next: (datos: Atencion[]) => {
        this.atencionesPaciente = (datos || [])
          .filter((atencion) => atencion.pacienteId === this.pacienteActual?.id)
          .sort((a, b) => {
            const fechaA = new Date(a.fechaIngreso || '').getTime() || 0;
            const fechaB = new Date(b.fechaIngreso || '').getTime() || 0;

            return fechaB - fechaA;
          });

        this.cargandoAtenciones = false;
      },
      error: (error: any) => {
        console.error('Error al cargar atenciones:', error);

        this.atencionesPaciente = [];
        this.cargandoAtenciones = false;

        this.uiMessageService.error(
          'Error al cargar atenciones',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  guardarAtencion(): void {
    if (!this.pacienteActual?.id) {
      this.uiMessageService.advertencia(
        'Paciente requerido',
        'Primero debe seleccionar un paciente para crear una atención.'
      );
      return;
    }

    if (this.guardando) {
      return;
    }

    this.normalizarFormulario();

    if (!this.validarFormulario()) {
      return;
    }

    const atencionParaGuardar = this.construirAtencionParaGuardar();

    this.guardando = true;

    if (this.modoEdicion && atencionParaGuardar.id) {
      this.atencionService.actualizarAtencion(atencionParaGuardar.id, atencionParaGuardar).subscribe({
        next: (atencionActualizada: Atencion) => {
          this.guardando = false;

          this.uiMessageService.exito(
            'Atención actualizada',
            'La atención fue actualizada correctamente.'
          );

          this.modoEdicion = false;
          this.formulario = this.crearFormularioVacio(this.pacienteActual?.id || 0);

          this.cargarAtencionesPaciente();
          this.atencionCreada.emit(atencionActualizada);
        },
        error: (error: any) => {
          console.error('Error al actualizar atención:', error);

          this.guardando = false;

          this.uiMessageService.error(
            'Error al actualizar atención',
            this.obtenerMensajeError(error)
          );
        }
      });

      return;
    }

    this.atencionService.crearAtencion(atencionParaGuardar).subscribe({
      next: (atencionCreada: Atencion) => {
        this.guardando = false;

        this.uiMessageService.exito(
          'Atención creada',
          'La atención fue creada correctamente. Puede continuar con triaje.'
        );

        this.formulario = this.crearFormularioVacio(this.pacienteActual?.id || 0);

        this.cargarAtencionesPaciente();
        this.atencionCreada.emit(atencionCreada);
      },
      error: (error: any) => {
        console.error('Error al crear atención:', error);

        this.guardando = false;

        this.uiMessageService.error(
          'Error al crear atención',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  construirAtencionParaGuardar(): Atencion {
    const atencion: Atencion = {
      pacienteId: this.pacienteActual?.id || this.formulario.pacienteId,
      motivoConsulta: this.formulario.motivoConsulta,
      motivoConsultaOtro: this.formulario.motivoConsultaOtro,
      enfermedadActualBreve: this.formulario.enfermedadActualBreve,
      procedencia: this.formulario.procedencia,
      condicionLlegada: this.formulario.condicionLlegada,
      tieneAcompanante: this.formulario.tieneAcompanante,
      nombreAcompanante: this.formulario.nombreAcompanante,
      parentescoAcompanante: this.formulario.parentescoAcompanante,
      telefonoAcompanante: this.formulario.telefonoAcompanante,
      estado: this.formulario.estado || 'Abierta'
    };

    if (this.modoEdicion && this.formulario.id) {
      atencion.id = this.formulario.id;
      atencion.fechaIngreso = this.formulario.fechaIngreso || undefined;
    }

    return atencion;
  }

  editarAtencion(atencion: Atencion): void {
    if (!atencion?.id) {
      return;
    }

    if (!this.puedeEditarAtencion(atencion)) {
      this.uiMessageService.advertencia(
        'Edición no permitida',
        'No se puede editar una atención cerrada.'
      );
      return;
    }

    this.modoEdicion = true;

    this.formulario = {
      id: atencion.id,
      pacienteId: this.pacienteActual?.id || atencion.pacienteId,
      fechaIngreso: atencion.fechaIngreso || null,
      motivoConsulta: atencion.motivoConsulta || '',
      motivoConsultaOtro: atencion.motivoConsultaOtro || null,
      enfermedadActualBreve: atencion.enfermedadActualBreve || '',
      procedencia: atencion.procedencia || '',
      condicionLlegada: atencion.condicionLlegada || '',
      tieneAcompanante: !!atencion.tieneAcompanante,
      nombreAcompanante: atencion.nombreAcompanante || null,
      parentescoAcompanante: atencion.parentescoAcompanante || null,
      telefonoAcompanante: atencion.telefonoAcompanante || null,
      estado: atencion.estado || 'Abierta'
    };

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  eliminarAtencion(atencion: Atencion): void {
    if (!atencion?.id) {
      return;
    }

    if (!this.esAdministrador()) {
      this.uiMessageService.advertencia(
        'Acceso restringido',
        'Solo el administrador puede eliminar atenciones.'
      );
      return;
    }

    const codigo = `AT-${atencion.id}`;

    this.uiMessageService.confirmar(
      'Eliminar atención',
      `Se eliminará la atención ${codigo}. Use esta acción solo si fue creada por error o está duplicada.`,
      () => {
        this.eliminandoId = atencion.id;

        this.atencionService.eliminarAtencion(atencion.id!).subscribe({
          next: () => {
            this.eliminandoId = undefined;
            this.atencionEliminada.emit(atencion.id!);

            this.uiMessageService.exito(
              'Atención eliminada',
              'La atención fue eliminada correctamente.'
            );

            if (this.formulario.id === atencion.id) {
              this.modoEdicion = false;
              this.formulario = this.crearFormularioVacio(this.pacienteActual?.id || 0);
            }

            this.cargarAtencionesPaciente();
          },
          error: (error: any) => {
            console.error('Error al eliminar atención:', error);

            this.eliminandoId = undefined;

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

  continuarAtencion(atencion: Atencion): void {
    if (!atencion?.id) {
      this.uiMessageService.advertencia(
        'Atención no válida',
        'No se pudo abrir la atención seleccionada.'
      );
      return;
    }

    this.atencionCreada.emit(atencion);
  }

  limpiarFormulario(): void {
    this.modoEdicion = false;
    this.formulario = this.crearFormularioVacio(this.pacienteActual?.id || 0);
  }

  cancelarEdicion(): void {
    this.limpiarFormulario();
  }

  normalizarFormulario(): void {
    this.formulario.motivoConsulta = (this.formulario.motivoConsulta || '').trim();
    this.formulario.motivoConsultaOtro = this.limpiarTexto(this.formulario.motivoConsultaOtro);
    this.formulario.enfermedadActualBreve = (this.formulario.enfermedadActualBreve || '').trim();
    this.formulario.procedencia = (this.formulario.procedencia || '').trim();
    this.formulario.condicionLlegada = (this.formulario.condicionLlegada || '').trim();
    this.formulario.nombreAcompanante = this.limpiarTexto(this.formulario.nombreAcompanante);
    this.formulario.parentescoAcompanante = this.limpiarTexto(this.formulario.parentescoAcompanante);
    this.formulario.telefonoAcompanante = this.limpiarTexto(this.formulario.telefonoAcompanante);

    if (this.formulario.motivoConsulta !== 'Otro') {
      this.formulario.motivoConsultaOtro = null;
    }

    if (!this.formulario.tieneAcompanante) {
      this.formulario.nombreAcompanante = null;
      this.formulario.parentescoAcompanante = null;
      this.formulario.telefonoAcompanante = null;
    }
  }

  validarFormulario(): boolean {
    if (!this.formulario.motivoConsulta) {
      this.uiMessageService.advertencia(
        'Motivo requerido',
        'Debe seleccionar el motivo de consulta.'
      );
      return false;
    }

    if (
      this.formulario.motivoConsulta === 'Otro' &&
      !this.formulario.motivoConsultaOtro
    ) {
      this.uiMessageService.advertencia(
        'Motivo específico requerido',
        'Debe especificar el motivo de consulta.'
      );
      return false;
    }

    if (!this.formulario.enfermedadActualBreve || this.formulario.enfermedadActualBreve.length < 5) {
      this.uiMessageService.advertencia(
        'Enfermedad actual requerida',
        'Debe registrar una enfermedad actual breve con descripción mínima.'
      );
      return false;
    }

    if (!this.formulario.procedencia) {
      this.uiMessageService.advertencia(
        'Procedencia requerida',
        'Debe seleccionar la procedencia.'
      );
      return false;
    }

    if (!this.formulario.condicionLlegada) {
      this.uiMessageService.advertencia(
        'Condición requerida',
        'Debe seleccionar la condición de llegada.'
      );
      return false;
    }

    if (this.formulario.tieneAcompanante && !this.formulario.nombreAcompanante) {
      this.uiMessageService.advertencia(
        'Acompañante requerido',
        'Debe ingresar el nombre del acompañante.'
      );
      return false;
    }

    return true;
  }

  puedeEditarAtencion(atencion: Atencion): boolean {
    return atencion.estado !== 'Cerrada';
  }

  puedeEliminarAtencion(atencion: Atencion): boolean {
    if (!this.esAdministrador()) {
      return false;
    }

    return atencion.estado !== 'Cerrada';
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

  irA(modulo: VistaDestinoAtencion): void {
    this.irModulo.emit(modulo);
  }

  obtenerNombrePaciente(): string {
    if (!this.pacienteActual) {
      return 'Sin paciente seleccionado';
    }

    const nombres = this.pacienteActual.nombres || '';
    const apellidos = this.pacienteActual.apellidos || '';

    return `${nombres} ${apellidos}`.trim() || 'Paciente sin nombre';
  }

  obtenerCedulaPaciente(): string {
    return this.pacienteActual?.cedula || 'Sin cédula';
  }

  obtenerEdadPaciente(): string {
    const fechaNacimiento = this.pacienteActual?.fechaNacimiento;

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

    return edad >= 0 ? `${edad} años` : 'Edad no registrada';
  }

  obtenerEstadoTexto(estado?: string | null): string {
    return estado || 'Sin estado';
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

  trackByAtencion(index: number, atencion: Atencion): number {
    return atencion.id || index;
  }

  limpiarTexto(valor?: string | null): string | null {
    const texto = (valor || '').trim();
    return texto || null;
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

    if (error?.message) {
      return error.message;
    }

    return 'No se pudo completar la operación.';
  }
}
