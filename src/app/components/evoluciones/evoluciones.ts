import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Atencion } from '../../models/atencion.model';
import { Evolucion } from '../../models/evolucion.model';
import { CatalogoItem } from '../../models/catalogo-item.model';
import { EvolucionService } from '../../services/evolucion';
import { CatalogoService } from '../../services/catalogo';
import { AuthService } from '../../services/auth';
import { UiMessageService } from '../../shared/ui-message.service';
import { cargarPlantillasLocales, guardarPlantillasLocales } from '../../shared/plantillas-locales';

type VistaDestinoEvoluciones = 'inicio' | 'pacientes' | 'egreso';

interface PlantillaEvolucion {
  id: string;
  titulo: string;
  detalle: string;
  tipoEvolucion: string;
  condicionPaciente: string;
  subjetivo: string;
  objetivo: string;
  analisis: string;
  plan: string;
  respuestaTratamiento: string;
  requiereReevaluacion: boolean;
  esCritica: boolean;
  clase: string;
}

@Component({
  selector: 'app-evoluciones',
  imports: [CommonModule, FormsModule],
  templateUrl: './evoluciones.html',
  styleUrl: './evoluciones.css'
})
export class Evoluciones implements OnInit, OnChanges {
  get soloLectura(): boolean { return this.atencionActual?.estado === 'Cerrada'; }

  @Input() atencionActual?: Atencion;

  @Output() evolucionGuardada = new EventEmitter<Evolucion>();
  @Output() registroEliminado = new EventEmitter<void>();
  @Output() irModulo = new EventEmitter<VistaDestinoEvoluciones>();

  evoluciones: Evolucion[] = [];

  cargandoEvoluciones = false;
  guardandoEvolucion = false;
  cargandoCatalogos = false;

  tiposEvolucion: string[] = [
    'Inicial',
    'Reevaluación',
    'Post tratamiento',
    'Control de signos vitales',
    'Interconsulta',
    'Pre egreso',
    'Deterioro clínico',
    'Otro'
  ];

  condicionesPaciente: string[] = [
    'Estable',
    'Mejorado',
    'Sin cambios',
    'En observación',
    'Delicado',
    'Crítico',
    'Deteriorado'
  ];

  formulario: Evolucion = this.crearFormularioVacio(0);
  nombreNuevaPlantilla = '';

  plantillas: PlantillaEvolucion[] = [
    {
      id: 'estable',
      titulo: 'Paciente estable',
      detalle: 'Evolución favorable',
      tipoEvolucion: 'Reevaluación',
      condicionPaciente: 'Estable',
      subjetivo: 'Paciente refiere mejoría clínica parcial, sin nuevos síntomas de alarma al momento.',
      objetivo: 'Paciente consciente, colaborador, hemodinámicamente estable, sin signos de dificultad respiratoria evidente.',
      analisis: 'Evolución clínica favorable al momento, sin datos actuales de deterioro clínico.',
      plan: 'Continuar manejo indicado, vigilancia clínica, control de signos vitales y reevaluación según evolución.',
      respuestaTratamiento: 'Respuesta favorable al tratamiento inicial.',
      requiereReevaluacion: true,
      esCritica: false,
      clase: 'tpl-green'
    },
    {
      id: 'dolor',
      titulo: 'Dolor controlado',
      detalle: 'Post analgesia',
      tipoEvolucion: 'Post tratamiento',
      condicionPaciente: 'Mejorado',
      subjetivo: 'Paciente refiere disminución de dolor posterior a manejo analgésico.',
      objetivo: 'Paciente con mejor tolerancia al reposo, sin signos clínicos de alarma inmediatos evidentes.',
      analisis: 'Dolor en control posterior a tratamiento inicial. Mantener vigilancia y correlación con diagnóstico presuntivo.',
      plan: 'Continuar analgesia según indicación, reevaluar intensidad del dolor, signos vitales y necesidad de estudios complementarios.',
      respuestaTratamiento: 'Mejoría posterior a analgesia.',
      requiereReevaluacion: true,
      esCritica: false,
      clase: 'tpl-blue'
    },
    {
      id: 'sinCambios',
      titulo: 'Sin cambios',
      detalle: 'Observación',
      tipoEvolucion: 'Reevaluación',
      condicionPaciente: 'Sin cambios',
      subjetivo: 'Paciente no refiere cambios importantes respecto a valoración previa.',
      objetivo: 'Paciente permanece en observación, con condición clínica similar a evaluación anterior.',
      analisis: 'Evolución estacionaria. Requiere mantener observación y reevaluación clínica.',
      plan: 'Continuar vigilancia, tratamiento indicado y revisar resultados pendientes si aplica.',
      respuestaTratamiento: 'Sin cambios clínicos relevantes al momento.',
      requiereReevaluacion: true,
      esCritica: false,
      clase: 'tpl-yellow'
    },
    {
      id: 'deterioro',
      titulo: 'Deterioro',
      detalle: 'Alerta clínica',
      tipoEvolucion: 'Deterioro clínico',
      condicionPaciente: 'Deteriorado',
      subjetivo: 'Paciente con empeoramiento clínico o persistencia de síntomas de alarma.',
      objetivo: 'Paciente requiere reevaluación prioritaria, control de signos vitales, valoración de vía aérea, respiración, circulación y estado neurológico.',
      analisis: 'Deterioro clínico durante observación. Requiere intervención inmediata y definir necesidad de referencia, interconsulta o mayor nivel de complejidad.',
      plan: 'Activar manejo según condición clínica, monitorización, soporte inicial, exámenes urgentes si amerita, interconsulta o referencia según evolución.',
      respuestaTratamiento: 'Respuesta insuficiente o deterioro posterior al manejo inicial.',
      requiereReevaluacion: true,
      esCritica: true,
      clase: 'tpl-red'
    },
    {
      id: 'preEgreso',
      titulo: 'Pre egreso',
      detalle: 'Listo para salida',
      tipoEvolucion: 'Pre egreso',
      condicionPaciente: 'Mejorado',
      subjetivo: 'Paciente refiere mejoría clínica, tolera indicaciones y no presenta nuevos síntomas de alarma al momento.',
      objetivo: 'Paciente estable, consciente, orientado, sin signos de compromiso vital evidente.',
      analisis: 'Paciente con evolución favorable, candidato a egreso según criterio clínico e indicaciones.',
      plan: 'Preparar egreso, explicar signos de alarma, tratamiento domiciliario si aplica, control por consulta externa o retorno inmediato si presenta deterioro.',
      respuestaTratamiento: 'Buena respuesta clínica.',
      requiereReevaluacion: false,
      esCritica: false,
      clase: 'tpl-green'
    }
  ];

  constructor(
    private evolucionService: EvolucionService,
    private catalogoService: CatalogoService,
    private authService: AuthService,
    private uiMessageService: UiMessageService
  ) {}

  ngOnInit(): void {
    this.plantillas.push(...cargarPlantillasLocales<PlantillaEvolucion>('hcu008-plantillas-evoluciones'));
    this.cargarCatalogosEvoluciones();
  }

  crearPlantillaPersonalizada(): void {
    if (!this.formulario.objetivo?.trim() || !this.formulario.analisis?.trim() || !this.formulario.plan?.trim()) {
      this.uiMessageService.advertencia('Datos requeridos', 'Complete objetivo, análisis y plan antes de crear la plantilla.'); return;
    }
    const titulo = this.nombreNuevaPlantilla.trim();
    if (!titulo) {
      this.uiMessageService.advertencia('Nombre requerido', 'Escriba un nombre para identificar la plantilla.');
      return;
    }
    const plantilla: PlantillaEvolucion = { id: `local-${Date.now()}`, titulo, detalle: this.formulario.condicionPaciente, tipoEvolucion: this.formulario.tipoEvolucion, condicionPaciente: this.formulario.condicionPaciente, subjetivo: this.formulario.subjetivo || '', objetivo: this.formulario.objetivo, analisis: this.formulario.analisis, plan: this.formulario.plan, respuestaTratamiento: this.formulario.respuestaTratamiento || '', requiereReevaluacion: this.formulario.requiereReevaluacion, esCritica: this.formulario.esCritica, clase: this.formulario.esCritica ? 'tpl-red' : 'tpl-green' };
    const guardadas = cargarPlantillasLocales<PlantillaEvolucion>('hcu008-plantillas-evoluciones'); guardadas.push(plantilla); guardarPlantillasLocales('hcu008-plantillas-evoluciones', guardadas); this.plantillas.push(plantilla);
    this.nombreNuevaPlantilla = '';
    this.uiMessageService.exito('Plantilla creada', 'La evolución quedó disponible en plantillas rápidas de este equipo.');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['atencionActual']) {
      const anterior = changes['atencionActual'].previousValue?.id || 0;
      const actual = changes['atencionActual'].currentValue?.id || 0;
      if (anterior === actual) return;
      this.cargarEvoluciones();
    }
  }

  cargarCatalogosEvoluciones(): void {
    this.cargandoCatalogos = true;

    this.catalogoService.obtenerActivos().subscribe({
      next: (catalogos: CatalogoItem[]) => {
        this.tiposEvolucion = this.obtenerNombresPorTipo(catalogos, 'TipoEvolucion');
        this.condicionesPaciente = this.obtenerNombresPorTipo(catalogos, 'CondicionPaciente');

        this.aplicarCatalogosRespaldoSiFaltan();
        this.aplicarValoresInicialesFormulario();

        this.cargandoCatalogos = false;
      },
      error: (error: any) => {
        console.error('Error al cargar catálogos de evoluciones:', error);

        this.aplicarCatalogosRespaldoSiFaltan();
        this.aplicarValoresInicialesFormulario();

        this.cargandoCatalogos = false;

        this.uiMessageService.advertencia(
          'Catálogos no disponibles',
          'No se pudieron cargar tipos de evolución y condición del paciente desde la base. Se usarán valores básicos.'
        );
      }
    });
  }

  obtenerNombresPorTipo(catalogos: CatalogoItem[], tipo: string): string[] {
    return catalogos
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
  }

  aplicarCatalogosRespaldoSiFaltan(): void {
    if (!this.tiposEvolucion.length) {
      this.tiposEvolucion = [
        'Inicial',
        'Reevaluación',
        'Post tratamiento',
        'Control de signos vitales',
        'Interconsulta',
        'Pre egreso',
        'Deterioro clínico',
        'Otro'
      ];
    }

    if (!this.condicionesPaciente.length) {
      this.condicionesPaciente = [
        'Estable',
        'Mejorado',
        'Sin cambios',
        'En observación',
        'Delicado',
        'Crítico',
        'Deteriorado'
      ];
    }
  }

  aplicarValoresInicialesFormulario(): void {
    if (!this.formulario.tipoEvolucion || !this.tiposEvolucion.includes(this.formulario.tipoEvolucion)) {
      this.formulario.tipoEvolucion = this.tiposEvolucion.includes('Reevaluación')
        ? 'Reevaluación'
        : this.tiposEvolucion[0] || '';
    }

    if (!this.formulario.condicionPaciente || !this.condicionesPaciente.includes(this.formulario.condicionPaciente)) {
      this.formulario.condicionPaciente = this.condicionesPaciente.includes('Estable')
        ? 'Estable'
        : this.condicionesPaciente[0] || '';
    }
  }

  irA(modulo: VistaDestinoEvoluciones): void {
    this.irModulo.emit(modulo);
  }

  crearFormularioVacio(atencionId: number): Evolucion {
    const tiposDisponibles = this.tiposEvolucion || [];
    const condicionesDisponibles = this.condicionesPaciente || [];

    return {
      atencionId,
      tipoEvolucion: tiposDisponibles.includes('Reevaluación') ? 'Reevaluación' : tiposDisponibles[0] || 'Reevaluación',
      condicionPaciente: condicionesDisponibles.includes('Estable') ? 'Estable' : condicionesDisponibles[0] || 'Estable',
      subjetivo: null,
      objetivo: '',
      analisis: '',
      plan: '',
      signosVitalesResumen: null,
      respuestaTratamiento: null,
      requiereReevaluacion: true,
      esCritica: false,
      estado: 'Activa'
    };
  }

  cargarEvoluciones(): void {
    if (!this.atencionActual?.id) {
      this.evoluciones = [];
      this.formulario = this.crearFormularioVacio(0);
      this.aplicarValoresInicialesFormulario();
      return;
    }

    this.cargandoEvoluciones = true;
    this.formulario = this.crearFormularioVacio(this.atencionActual.id);
    this.formulario.signosVitalesResumen = this.obtenerSignosVitalesResumen();
    this.aplicarValoresInicialesFormulario();

    this.evolucionService.obtenerPorAtencion(this.atencionActual.id).subscribe({
      next: (datos: Evolucion[]) => {
        this.evoluciones = datos || [];
        this.cargandoEvoluciones = false;
      },
      error: (error: any) => {
        console.error('Error al cargar evoluciones:', error);

        this.evoluciones = [];
        this.cargandoEvoluciones = false;

        this.uiMessageService.error(
          'Error al cargar evoluciones',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  aplicarPlantilla(plantilla: PlantillaEvolucion): void {
    this.formulario.tipoEvolucion = this.tiposEvolucion.includes(plantilla.tipoEvolucion)
      ? plantilla.tipoEvolucion
      : this.tiposEvolucion[0] || plantilla.tipoEvolucion;

    this.formulario.condicionPaciente = this.condicionesPaciente.includes(plantilla.condicionPaciente)
      ? plantilla.condicionPaciente
      : this.condicionesPaciente[0] || plantilla.condicionPaciente;

    this.formulario.subjetivo = this.combinarTexto(this.formulario.subjetivo, plantilla.subjetivo);
    this.formulario.objetivo = this.combinarTexto(this.formulario.objetivo, plantilla.objetivo);
    this.formulario.analisis = this.combinarTexto(this.formulario.analisis, plantilla.analisis);
    this.formulario.plan = this.combinarTexto(this.formulario.plan, plantilla.plan);
    this.formulario.respuestaTratamiento = this.combinarTexto(
      this.formulario.respuestaTratamiento,
      plantilla.respuestaTratamiento
    );

    this.formulario.requiereReevaluacion = plantilla.requiereReevaluacion;
    this.formulario.esCritica = plantilla.esCritica;
    this.formulario.signosVitalesResumen = this.obtenerSignosVitalesResumen();

    this.uiMessageService.informacion(
      'Plantilla aplicada',
      'Se agregaron datos base. Puede editar el texto antes de guardar.'
    );
  }

  guardarEvolucion(): void {
    if (this.soloLectura) return;
    if (!this.atencionActual?.id) {
      this.uiMessageService.advertencia(
        'Atención requerida',
        'Primero debe abrir una atención activa para registrar evoluciones.'
      );
      return;
    }

    if (this.guardandoEvolucion) {
      return;
    }

    this.normalizarFormulario();

    if (!this.validarEvolucion()) {
      return;
    }

    const evolucionParaGuardar: Evolucion = {
      ...this.formulario,
      atencionId: this.atencionActual.id,
      tipoEvolucion: this.formulario.tipoEvolucion.trim(),
      condicionPaciente: this.formulario.condicionPaciente.trim(),
      subjetivo: this.limpiarTexto(this.formulario.subjetivo),
      objetivo: this.formulario.objetivo.trim(),
      analisis: this.formulario.analisis.trim(),
      plan: this.formulario.plan.trim(),
      signosVitalesResumen: this.limpiarTexto(this.formulario.signosVitalesResumen),
      respuestaTratamiento: this.limpiarTexto(this.formulario.respuestaTratamiento),
      requiereReevaluacion: !!this.formulario.requiereReevaluacion,
      esCritica: !!this.formulario.esCritica,
      estado: this.formulario.estado || 'Activa'
    };

    this.guardandoEvolucion = true;

    this.evolucionService.guardarEvolucion(evolucionParaGuardar).subscribe({
      next: (evolucionGuardada: Evolucion) => {
        this.guardandoEvolucion = false;

        this.uiMessageService.exito(
          'Evolución guardada',
          'La evolución médica fue registrada correctamente.'
        );

        this.evolucionGuardada.emit(evolucionGuardada);

        this.formulario = this.crearFormularioVacio(this.atencionActual?.id || 0);
        this.formulario.signosVitalesResumen = this.obtenerSignosVitalesResumen();
        this.aplicarValoresInicialesFormulario();

        this.cargarEvoluciones();
      },
      error: (error: any) => {
        console.error('Error al guardar evolución:', error);

        this.guardandoEvolucion = false;

        this.uiMessageService.error(
          'Error al guardar evolución',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  normalizarFormulario(): void {
    this.formulario.tipoEvolucion = (this.formulario.tipoEvolucion || '').trim();
    this.formulario.condicionPaciente = (this.formulario.condicionPaciente || '').trim();
    this.formulario.subjetivo = this.limpiarTexto(this.formulario.subjetivo);
    this.formulario.objetivo = (this.formulario.objetivo || '').trim();
    this.formulario.analisis = (this.formulario.analisis || '').trim();
    this.formulario.plan = (this.formulario.plan || '').trim();
    this.formulario.signosVitalesResumen = this.limpiarTexto(this.formulario.signosVitalesResumen);
    this.formulario.respuestaTratamiento = this.limpiarTexto(this.formulario.respuestaTratamiento);
    this.formulario.estado = this.formulario.estado || 'Activa';
  }

  validarEvolucion(): boolean {
    if (!this.formulario.tipoEvolucion) {
      this.uiMessageService.advertencia('Tipo requerido', 'Debe seleccionar el tipo de evolución.');
      return false;
    }

    if (!this.formulario.condicionPaciente) {
      this.uiMessageService.advertencia('Condición requerida', 'Debe seleccionar la condición del paciente.');
      return false;
    }

    if (!this.formulario.objetivo || this.formulario.objetivo.length < 8) {
      this.uiMessageService.advertencia(
        'Objetivo requerido',
        'Debe registrar hallazgos objetivos o estado clínico actual.'
      );
      return false;
    }

    if (!this.formulario.analisis || this.formulario.analisis.length < 8) {
      this.uiMessageService.advertencia(
        'Análisis requerido',
        'Debe registrar análisis clínico de la evolución.'
      );
      return false;
    }

    if (!this.formulario.plan || this.formulario.plan.length < 8) {
      this.uiMessageService.advertencia(
        'Plan requerido',
        'Debe registrar plan o conducta médica.'
      );
      return false;
    }

    if (
      this.formulario.esCritica &&
      this.formulario.condicionPaciente !== 'Crítico' &&
      this.formulario.condicionPaciente !== 'Deteriorado'
    ) {
      this.uiMessageService.advertencia(
        'Condición no coherente',
        'Si marca evolución crítica, la condición debería ser Crítico o Deteriorado.'
      );
      return false;
    }

    return true;
  }

  editarEvolucion(evolucion: Evolucion): void {
    this.formulario = {
      id: evolucion.id,
      atencionId: evolucion.atencionId,
      tipoEvolucion: evolucion.tipoEvolucion,
      condicionPaciente: evolucion.condicionPaciente,
      subjetivo: evolucion.subjetivo || null,
      objetivo: evolucion.objetivo,
      analisis: evolucion.analisis,
      plan: evolucion.plan,
      signosVitalesResumen: evolucion.signosVitalesResumen || null,
      respuestaTratamiento: evolucion.respuestaTratamiento || null,
      requiereReevaluacion: !!evolucion.requiereReevaluacion,
      esCritica: !!evolucion.esCritica,
      estado: evolucion.estado || 'Activa',
      fechaRegistro: evolucion.fechaRegistro || null
    };

    this.aplicarValoresInicialesFormulario();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.uiMessageService.informacion(
      'Modo edición',
      'Está editando una evolución registrada.'
    );
  }

  cancelarEdicion(): void {
    this.formulario = this.crearFormularioVacio(this.atencionActual?.id || 0);
    this.formulario.signosVitalesResumen = this.obtenerSignosVitalesResumen();
    this.aplicarValoresInicialesFormulario();
  }

  eliminarEvolucion(evolucion: Evolucion): void {
    if (!evolucion.id) {
      return;
    }

    if (!this.puedeEliminarEvolucion(evolucion)) {
      this.uiMessageService.advertencia(
        'Acción restringida',
        'Solo un usuario administrador puede eliminar evoluciones.'
      );
      return;
    }

    this.uiMessageService.confirmar(
      'Eliminar evolución',
      'Se eliminará esta evolución médica.',
      () => {
        this.evolucionService.eliminarEvolucion(evolucion.id!).subscribe({
          next: () => {
            this.registroEliminado.emit();
            this.uiMessageService.exito(
              'Evolución eliminada',
              'La evolución fue eliminada correctamente.'
            );

            if (this.formulario.id === evolucion.id) {
              this.cancelarEdicion();
            }

            this.cargarEvoluciones();
          },
          error: (error: any) => {
            console.error('Error al eliminar evolución:', error);

            this.uiMessageService.error(
              'Error al eliminar evolución',
              this.obtenerMensajeError(error)
            );
          }
        });
      },
      'Eliminar',
      'Cancelar'
    );
  }

  puedeEliminarEvolucion(evolucion: Evolucion): boolean {
    if (!evolucion?.id) {
      return false;
    }

    if (!this.esAdministrador()) {
      return false;
    }

    return true;
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

  continuarEgreso(): void {
    if (this.evoluciones.length === 0) {
      this.uiMessageService.confirmar(
        'Continuar sin evolución',
        'No se ha registrado evolución médica en esta atención. ¿Desea continuar a egreso de todas formas?',
        () => {
          this.irA('egreso');
        },
        'Continuar',
        'Volver'
      );

      return;
    }

    this.irA('egreso');
  }

  limpiarFormularioEvolucion(): void {
    this.uiMessageService.confirmar(
      'Limpiar formulario',
      'Esta acción limpiará los datos ingresados en pantalla. No eliminará evoluciones guardadas.',
      () => {
        this.cancelarEdicion();

        this.uiMessageService.informacion(
          'Formulario limpio',
          'El formulario de evolución fue limpiado correctamente.'
        );
      },
      'Limpiar',
      'Cancelar'
    );
  }

  obtenerSignosVitalesResumen(): string {
    const triaje = this.atencionActual?.triaje;

    if (!triaje) {
      return 'Sin signos vitales registrados en triaje.';
    }

    const partes: string[] = [];

    if (triaje.presionSistolica && triaje.presionDiastolica) {
      partes.push(`TA ${triaje.presionSistolica}/${triaje.presionDiastolica}`);
    }

    if (triaje.frecuenciaCardiaca) {
      partes.push(`FC ${triaje.frecuenciaCardiaca}`);
    }

    if (triaje.frecuenciaRespiratoria) {
      partes.push(`FR ${triaje.frecuenciaRespiratoria}`);
    }

    if (triaje.saturacionOxigeno) {
      partes.push(`SatO₂ ${triaje.saturacionOxigeno}%`);
    }

    if (triaje.temperatura) {
      partes.push(`T ${triaje.temperatura}°C`);
    }

    return partes.length ? partes.join(' · ') : 'Sin signos vitales registrados en triaje.';
  }

  combinarTexto(actual: string | null | undefined, nuevo: string): string {
    const textoActual = (actual || '').trim();
    const textoNuevo = nuevo.trim();

    if (!textoActual) {
      return textoNuevo;
    }

    if (textoActual.includes(textoNuevo)) {
      return textoActual;
    }

    return `${textoActual}\n${textoNuevo}`;
  }

  limpiarTexto(valor?: string | null): string | null {
    const texto = (valor || '').trim();
    return texto || null;
  }

  obtenerNombrePaciente(): string {
    const nombres = this.atencionActual?.paciente?.nombres || '';
    const apellidos = this.atencionActual?.paciente?.apellidos || '';

    return `${nombres} ${apellidos}`.trim() || 'Paciente sin nombre';
  }

  obtenerCedulaPaciente(): string {
    return this.atencionActual?.paciente?.cedula || 'Sin cédula';
  }

  obtenerMotivoConsulta(): string {
    return this.atencionActual?.motivoConsulta || 'Sin motivo registrado';
  }

  obtenerTotalEvoluciones(): number {
    return this.evoluciones.length;
  }

  obtenerTotalCriticas(): number {
    return this.evoluciones.filter((e) => e.esCritica).length;
  }

  obtenerTotalReevaluacion(): number {
    return this.evoluciones.filter((e) => e.requiereReevaluacion).length;
  }

  obtenerClaseEvolucion(evolucion: Evolucion): string {
    if (
      evolucion.esCritica ||
      evolucion.condicionPaciente === 'Crítico' ||
      evolucion.condicionPaciente === 'Deteriorado'
    ) {
      return 'evolution-critical';
    }

    if (evolucion.condicionPaciente === 'Delicado' || evolucion.requiereReevaluacion) {
      return 'evolution-warning';
    }

    return '';
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

  trackByEvolucion(index: number, evolucion: Evolucion): number {
    return evolucion.id || index;
  }

  trackByPlantilla(index: number, plantilla: PlantillaEvolucion): string {
    return plantilla.id || String(index);
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
