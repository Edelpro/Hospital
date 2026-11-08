import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CatalogoItem } from '../../models/catalogo-item.model';
import { PlantillaClinica } from '../../models/plantilla-clinica.model';
import { CatalogoService } from '../../services/catalogo';
import { PlantillaClinicaService } from '../../services/plantilla-clinica.service';
import { UiMessageService } from '../../shared/ui-message.service';

type ModuloPlantilla = PlantillaClinica['modulo'];
type EstadoFiltro = 'Todas' | 'Activas' | 'Inactivas';

interface ModuloConfig {
  id: ModuloPlantilla;
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
}

interface FormularioPlantilla {
  nombre: string;
  codigo: string;
  descripcion: string;
  tipoDiagnostico: string;
  condicion: string;
  observacion: string;
  medicamento: string;
  presentacion: string;
  dosis: string;
  viaAdministracion: string;
  frecuencia: string;
  duracion: string;
  cantidad: string;
  indicaciones: string;
  nombreExamen: string;
  tipoExamen: string;
  prioridad: string;
  indicacionClinica: string;
  requiereAyuno: boolean;
  esUrgente: boolean;
  tipoEvolucion: string;
  condicionPaciente: string;
  subjetivo: string;
  objetivo: string;
  analisis: string;
  plan: string;
  respuestaTratamiento: string;
  requiereReevaluacion: boolean;
  esCritica: boolean;
}

@Component({
  selector: 'app-admin-plantillas',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-plantillas.html',
  styleUrl: './admin-plantillas.css'
})
export class AdminPlantillas implements OnInit {
  readonly modulos: ModuloConfig[] = [
    { id: 'Diagnosticos', titulo: 'Diagnósticos', descripcion: 'Códigos CIE-10 y criterios frecuentes', icono: 'bx-list-check', color: 'green' },
    { id: 'Prescripciones', titulo: 'Prescripciones', descripcion: 'Medicamentos, dosis y frecuencias', icono: 'bxs-capsule', color: 'orange' },
    { id: 'Examenes', titulo: 'Exámenes', descripcion: 'Solicitudes e indicaciones clínicas', icono: 'bx-test-tube', color: 'blue' },
    { id: 'Evoluciones', titulo: 'Evoluciones', descripcion: 'Notas y planes de seguimiento', icono: 'bx-notepad', color: 'purple' }
  ];

  moduloSeleccionado: ModuloPlantilla = 'Diagnosticos';
  plantillas: PlantillaClinica[] = [];
  catalogos: CatalogoItem[] = [];
  formulario: FormularioPlantilla = this.crearFormularioVacio();
  busqueda = '';
  filtroEstado: EstadoFiltro = 'Todas';
  cargando = false;
  guardando = false;

  constructor(
    private readonly plantillaService: PlantillaClinicaService,
    private readonly catalogoService: CatalogoService,
    private readonly mensajes: UiMessageService
  ) {}

  ngOnInit(): void {
    this.cargarPlantillas();
    this.catalogoService.obtenerActivos().subscribe({
      next: catalogos => {
        this.catalogos = catalogos || [];
        this.aplicarValoresIniciales();
      },
      error: () => this.aplicarValoresIniciales()
    });
  }

  seleccionarModulo(modulo: ModuloPlantilla): void {
    if (this.moduloSeleccionado === modulo) return;
    this.moduloSeleccionado = modulo;
    this.formulario = this.crearFormularioVacio();
    this.aplicarValoresIniciales();
  }

  cargarPlantillas(): void {
    this.cargando = true;
    this.plantillaService.obtenerTodas().subscribe({
      next: plantillas => {
        this.plantillas = plantillas || [];
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        this.mensajes.error('No se pudieron cargar las plantillas', this.obtenerMensajeError(error));
      }
    });
  }

  get plantillasFiltradas(): PlantillaClinica[] {
    const texto = this.busqueda.trim().toLocaleLowerCase('es');
    return this.plantillas.filter(plantilla => {
      const coincideModulo = plantilla.modulo === this.moduloSeleccionado;
      const coincideEstado = this.filtroEstado === 'Todas' ||
        (this.filtroEstado === 'Activas' ? plantilla.activo : !plantilla.activo);
      const resumen = this.obtenerResumen(plantilla).toLocaleLowerCase('es');
      const coincideTexto = !texto || plantilla.nombre.toLocaleLowerCase('es').includes(texto) || resumen.includes(texto);
      return coincideModulo && coincideEstado && coincideTexto;
    });
  }

  contarPlantillas(modulo: ModuloPlantilla): number {
    return this.plantillas.filter(item => item.modulo === modulo).length;
  }

  crearPlantilla(): void {
    if (this.guardando) return;
    const validacion = this.validar();
    if (validacion) {
      this.mensajes.advertencia('Revise la plantilla', validacion);
      return;
    }

    this.guardando = true;
    const nueva: PlantillaClinica = {
      modulo: this.moduloSeleccionado,
      nombre: this.formulario.nombre.trim(),
      contenidoJson: JSON.stringify(this.obtenerContenido()),
      claseColor: this.obtenerClaseColor(),
      activo: true
    };

    this.plantillaService.crear(nueva).subscribe({
      next: () => {
        this.guardando = false;
        this.formulario = this.crearFormularioVacio();
        this.aplicarValoresIniciales();
        this.cargarPlantillas();
        this.mensajes.exito('Plantilla creada', `“${nueva.nombre}” ya está disponible en ${this.obtenerTituloModulo(nueva.modulo)}.`);
      },
      error: error => {
        this.guardando = false;
        this.mensajes.error('No se pudo crear la plantilla', this.obtenerMensajeError(error));
      }
    });
  }

  cambiarEstado(plantilla: PlantillaClinica): void {
    if (!plantilla.id) return;
    const nuevoEstado = !plantilla.activo;
    this.plantillaService.cambiarEstado(plantilla.id, nuevoEstado).subscribe({
      next: () => {
        plantilla.activo = nuevoEstado;
        this.mensajes.exito('Estado actualizado', `La plantilla quedó ${nuevoEstado ? 'activa' : 'inactiva'}.`);
      },
      error: error => this.mensajes.error('No se pudo actualizar la plantilla', this.obtenerMensajeError(error))
    });
  }

  eliminar(plantilla: PlantillaClinica): void {
    if (!plantilla.id) return;
    this.mensajes.confirmar(
      'Eliminar plantilla',
      `Se eliminará “${plantilla.nombre}” de ${this.obtenerTituloModulo(plantilla.modulo)}.`,
      () => this.plantillaService.eliminar(plantilla.id!).subscribe({
        next: () => {
          this.plantillas = this.plantillas.filter(item => item.id !== plantilla.id);
          this.mensajes.exito('Plantilla eliminada', 'La plantilla dejó de estar disponible para los doctores.');
        },
        error: error => this.mensajes.error('No se pudo eliminar la plantilla', this.obtenerMensajeError(error))
      }),
      'Eliminar',
      'Cancelar'
    );
  }

  limpiarFormulario(): void {
    this.formulario = this.crearFormularioVacio();
    this.aplicarValoresIniciales();
  }

  obtenerOpciones(tipo: string, respaldo: string[]): string[] {
    const opciones = this.catalogos
      .filter(item => item.tipo === tipo && item.activo)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0))
      .map(item => item.nombre);
    return opciones.length ? opciones : respaldo;
  }

  obtenerTituloModulo(modulo: ModuloPlantilla): string {
    return this.modulos.find(item => item.id === modulo)?.titulo || modulo;
  }

  obtenerResumen(plantilla: PlantillaClinica): string {
    try {
      const contenido = JSON.parse(plantilla.contenidoJson || '{}');
      switch (plantilla.modulo) {
        case 'Diagnosticos': return [contenido.codigo, contenido.descripcion, contenido.tipoDiagnostico].filter(Boolean).join(' · ');
        case 'Prescripciones': return [contenido.medicamento, contenido.dosis, contenido.viaAdministracion, contenido.frecuencia].filter(Boolean).join(' · ');
        case 'Examenes': return [contenido.nombreExamen, contenido.tipoExamen, contenido.prioridad].filter(Boolean).join(' · ');
        case 'Evoluciones': return [contenido.tipoEvolucion, contenido.condicionPaciente, contenido.objetivo].filter(Boolean).join(' · ');
      }
    } catch { /* La API valida el JSON; se muestra un resumen seguro si existe un registro antiguo. */ }
    return 'Contenido clínico guardado';
  }

  trackByModulo(_index: number, modulo: ModuloConfig): ModuloPlantilla { return modulo.id; }
  trackByPlantilla(index: number, plantilla: PlantillaClinica): number { return plantilla.id || index; }

  private aplicarValoresIniciales(): void {
    this.formulario.tipoDiagnostico ||= this.obtenerOpciones('TipoDiagnostico', ['Presuntivo'])[0];
    this.formulario.condicion ||= this.obtenerOpciones('CondicionDiagnostico', ['Principal'])[0];
    this.formulario.viaAdministracion ||= this.obtenerOpciones('ViaAdministracion', ['VO', 'IV', 'IM'])[0];
    this.formulario.frecuencia ||= this.obtenerOpciones('FrecuenciaMedicacion', ['Dosis única', 'Cada 8 horas'])[0];
    this.formulario.tipoExamen ||= this.obtenerOpciones('TipoExamen', ['Laboratorio', 'Imagen'])[0];
    this.formulario.prioridad ||= this.obtenerOpciones('PrioridadExamen', ['Rutina', 'Urgente'])[0];
    this.formulario.tipoEvolucion ||= this.obtenerOpciones('TipoEvolucion', ['Reevaluación'])[0];
    this.formulario.condicionPaciente ||= this.obtenerOpciones('CondicionPaciente', ['Estable'])[0];
  }

  private validar(): string {
    if (this.formulario.nombre.trim().length < 3) return 'Escriba un nombre de al menos 3 caracteres.';
    switch (this.moduloSeleccionado) {
      case 'Diagnosticos':
        if (!this.formulario.codigo.trim() || !this.formulario.descripcion.trim()) return 'Complete el código CIE-10 y la descripción.';
        break;
      case 'Prescripciones':
        if (!this.formulario.medicamento.trim() || !this.formulario.dosis.trim()) return 'Complete el medicamento y la dosis.';
        break;
      case 'Examenes':
        if (!this.formulario.nombreExamen.trim() || !this.formulario.indicacionClinica.trim()) return 'Complete el nombre del examen y la indicación clínica.';
        break;
      case 'Evoluciones':
        if (!this.formulario.objetivo.trim() || !this.formulario.analisis.trim() || !this.formulario.plan.trim()) return 'Complete objetivo, análisis y plan.';
        break;
    }
    return '';
  }

  private obtenerContenido(): Record<string, unknown> {
    const f = this.formulario;
    switch (this.moduloSeleccionado) {
      case 'Diagnosticos':
        return { codigo: f.codigo.trim().toUpperCase(), descripcion: f.descripcion.trim(), tipoDiagnostico: f.tipoDiagnostico, condicion: f.condicion, observacion: f.observacion.trim() };
      case 'Prescripciones':
        return { medicamento: f.medicamento.trim(), presentacion: f.presentacion.trim(), dosis: f.dosis.trim(), viaAdministracion: f.viaAdministracion, frecuencia: f.frecuencia, duracion: f.duracion.trim() || 'Según evolución', cantidad: f.cantidad.trim(), indicaciones: f.indicaciones.trim() };
      case 'Examenes':
        return { tipoExamen: f.tipoExamen, nombreExamen: f.nombreExamen.trim(), prioridad: f.prioridad, indicacionClinica: f.indicacionClinica.trim(), observacion: f.observacion.trim(), requiereAyuno: f.requiereAyuno, esUrgente: f.esUrgente };
      case 'Evoluciones':
        return { detalle: f.condicionPaciente, tipoEvolucion: f.tipoEvolucion, condicionPaciente: f.condicionPaciente, subjetivo: f.subjetivo.trim(), objetivo: f.objetivo.trim(), analisis: f.analisis.trim(), plan: f.plan.trim(), respuestaTratamiento: f.respuestaTratamiento.trim(), requiereReevaluacion: f.requiereReevaluacion, esCritica: f.esCritica };
    }
  }

  private obtenerClaseColor(): string {
    if (this.moduloSeleccionado === 'Diagnosticos') return 'dx-green';
    if (this.moduloSeleccionado === 'Prescripciones') return 'rx-green';
    if (this.moduloSeleccionado === 'Examenes') return 'ex-green';
    return this.formulario.esCritica ? 'tpl-red' : 'tpl-green';
  }

  private crearFormularioVacio(): FormularioPlantilla {
    return {
      nombre: '', codigo: '', descripcion: '', tipoDiagnostico: '', condicion: '', observacion: '',
      medicamento: '', presentacion: '', dosis: '', viaAdministracion: '', frecuencia: '', duracion: '', cantidad: '', indicaciones: '',
      nombreExamen: '', tipoExamen: '', prioridad: '', indicacionClinica: '', requiereAyuno: false, esUrgente: false,
      tipoEvolucion: '', condicionPaciente: '', subjetivo: '', objetivo: '', analisis: '', plan: '', respuestaTratamiento: '',
      requiereReevaluacion: true, esCritica: false
    };
  }

  private obtenerMensajeError(error: any): string {
    if (typeof error?.error === 'string') return error.error;
    if (error?.error?.mensaje) return error.error.mensaje;
    if (error?.error?.title) return error.error.title;
    if (error?.status === 401) return 'La sesión expiró. Inicie sesión nuevamente.';
    if (error?.status === 403) return 'Solo el Administrador puede gestionar plantillas.';
    return error?.message || 'No se pudo completar la operación.';
  }
}
