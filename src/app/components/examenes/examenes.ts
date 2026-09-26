import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Atencion } from '../../models/atencion.model';
import { AuthService } from '../../services/auth';
import { Examen } from '../../models/examen.model';
import { CatalogoItem } from '../../models/catalogo-item.model';
import { ExamenService } from '../../services/examen';
import { CatalogoService } from '../../services/catalogo';
import { UiMessageService } from '../../shared/ui-message.service';
import { cargarPlantillasLocales, guardarPlantillasLocales } from '../../shared/plantillas-locales';

type VistaDestinoExamenes = 'inicio' | 'pacientes' | 'evoluciones';

interface ExamenFrecuente {
  tipoExamen: string;
  nombreExamen: string;
  prioridad: string;
  indicacionClinica: string;
  observacion: string;
  requiereAyuno: boolean;
  esUrgente: boolean;
  grupo: string;
  clase: string;
}

@Component({
  selector: 'app-examenes',
  imports: [CommonModule, FormsModule],
  templateUrl: './examenes.html',
  styleUrl: './examenes.css'
})
export class Examenes implements OnInit, OnChanges {
  get soloLectura(): boolean { return this.atencionActual?.estado === 'Cerrada'; }

  @Input() atencionActual?: Atencion;

  @Output() examenGuardado = new EventEmitter<Examen>();
  @Output() registroEliminado = new EventEmitter<void>();
  @Output() irModulo = new EventEmitter<VistaDestinoExamenes>();

  examenes: Examen[] = [];

  cargandoExamenes = false;
  guardandoExamen = false;
  cargandoCatalogos = false;

  busquedaExamenFrecuente = '';

  tiposExamen: string[] = ['Laboratorio', 'Imagen', 'Cardiología', 'Procedimiento diagnóstico', 'Otro'];
  prioridades: string[] = ['Rutina', 'Urgente', 'Emergente'];
  estadosExamen: string[] = ['Solicitado', 'Tomado', 'Pendiente resultado', 'Resultado disponible', 'Cancelado'];

  formulario: Examen = this.crearFormularioVacio(0);
  nombreNuevaPlantilla = '';

  examenesFrecuentes: ExamenFrecuente[] = [
    {
      tipoExamen: 'Laboratorio',
      nombreExamen: 'Hemograma completo',
      prioridad: 'Rutina',
      indicacionClinica: 'Valoración inicial, síndrome febril, anemia, sangrado o sospecha infecciosa.',
      observacion: 'Correlacionar con clínica y signos vitales.',
      requiereAyuno: false,
      esUrgente: false,
      grupo: 'Laboratorio',
      clase: 'ex-green'
    },
    {
      tipoExamen: 'Laboratorio',
      nombreExamen: 'Glucosa / glicemia',
      prioridad: 'Urgente',
      indicacionClinica: 'Alteración del estado de conciencia, diabetes, convulsión, sepsis o valoración metabólica.',
      observacion: 'Registrar valor y conducta según resultado.',
      requiereAyuno: false,
      esUrgente: true,
      grupo: 'Metabólico',
      clase: 'ex-red'
    },
    {
      tipoExamen: 'Laboratorio',
      nombreExamen: 'Urea y creatinina',
      prioridad: 'Rutina',
      indicacionClinica: 'Valoración de función renal, hidratación, sepsis, hipertensión, diabetes o previo a medicación.',
      observacion: '',
      requiereAyuno: false,
      esUrgente: false,
      grupo: 'Renal',
      clase: 'ex-green'
    },
    {
      tipoExamen: 'Laboratorio',
      nombreExamen: 'Electrolitos séricos',
      prioridad: 'Urgente',
      indicacionClinica: 'Vómitos, diarrea, deshidratación, arritmia, convulsión, alteración neurológica o paciente crítico.',
      observacion: 'Sodio, potasio y cloro según disponibilidad institucional.',
      requiereAyuno: false,
      esUrgente: true,
      grupo: 'Metabólico',
      clase: 'ex-red'
    },
    {
      tipoExamen: 'Laboratorio',
      nombreExamen: 'Uroanálisis',
      prioridad: 'Rutina',
      indicacionClinica: 'Síntomas urinarios, fiebre sin foco, dolor lumbar, embarazo o dolor abdominal.',
      observacion: '',
      requiereAyuno: false,
      esUrgente: false,
      grupo: 'Urinario',
      clase: 'ex-blue'
    },
    {
      tipoExamen: 'Laboratorio',
      nombreExamen: 'Prueba de embarazo',
      prioridad: 'Rutina',
      indicacionClinica: 'Paciente femenina en edad fértil con dolor abdominal, sangrado, amenorrea, trauma o previo a imagen/medicación.',
      observacion: '',
      requiereAyuno: false,
      esUrgente: false,
      grupo: 'Gineco',
      clase: 'ex-purple'
    },
    {
      tipoExamen: 'Laboratorio',
      nombreExamen: 'Troponina I',
      prioridad: 'Urgente',
      indicacionClinica: 'Dolor torácico, disnea, sospecha de síndrome coronario agudo o equivalentes anginosos.',
      observacion: 'Correlacionar con electrocardiograma y evolución clínica.',
      requiereAyuno: false,
      esUrgente: true,
      grupo: 'Cardio',
      clase: 'ex-red'
    },
    {
      tipoExamen: 'Cardiología',
      nombreExamen: 'Electrocardiograma 12 derivaciones',
      prioridad: 'Urgente',
      indicacionClinica: 'Dolor torácico, palpitaciones, síncope, disnea, alteraciones electrolíticas o sospecha cardíaca.',
      observacion: 'Realizar e interpretar de forma prioritaria si dolor torácico activo.',
      requiereAyuno: false,
      esUrgente: true,
      grupo: 'Cardio',
      clase: 'ex-red'
    },
    {
      tipoExamen: 'Imagen',
      nombreExamen: 'Radiografía de tórax',
      prioridad: 'Rutina',
      indicacionClinica: 'Disnea, tos, fiebre, dolor torácico, trauma torácico o sospecha de neumonía.',
      observacion: '',
      requiereAyuno: false,
      esUrgente: false,
      grupo: 'Imagen',
      clase: 'ex-orange'
    },
    {
      tipoExamen: 'Imagen',
      nombreExamen: 'Radiografía de extremidad',
      prioridad: 'Rutina',
      indicacionClinica: 'Trauma, dolor óseo, deformidad, limitación funcional o sospecha de fractura.',
      observacion: 'Especificar segmento anatómico: hombro, brazo, antebrazo, muñeca, cadera, fémur, rodilla, pierna, tobillo o pie.',
      requiereAyuno: false,
      esUrgente: false,
      grupo: 'Trauma',
      clase: 'ex-yellow'
    },
    {
      tipoExamen: 'Imagen',
      nombreExamen: 'Ecografía abdominal',
      prioridad: 'Rutina',
      indicacionClinica: 'Dolor abdominal, sospecha hepatobiliar, líquido libre, masa abdominal o patología abdominal.',
      observacion: '',
      requiereAyuno: true,
      esUrgente: false,
      grupo: 'Abdomen',
      clase: 'ex-orange'
    },
    {
      tipoExamen: 'Laboratorio',
      nombreExamen: 'Gasometría arterial',
      prioridad: 'Urgente',
      indicacionClinica: 'Insuficiencia respiratoria, shock, sepsis, alteración ácido-base o paciente crítico.',
      observacion: 'Correlacionar con saturación, ventilación y estado clínico.',
      requiereAyuno: false,
      esUrgente: true,
      grupo: 'Crítico',
      clase: 'ex-red'
    }
  ];

  constructor(
  private examenService: ExamenService,
  private catalogoService: CatalogoService,
  private authService: AuthService,
  private uiMessageService: UiMessageService
) {}

  ngOnInit(): void {
    this.examenesFrecuentes.push(...cargarPlantillasLocales<ExamenFrecuente>('hcu008-plantillas-examenes'));
    this.cargarCatalogosExamenes();
  }

  crearPlantillaPersonalizada(): void {
    if (!this.formulario.nombreExamen?.trim() || !this.formulario.indicacionClinica?.trim()) {
      this.uiMessageService.advertencia('Datos requeridos', 'Complete nombre e indicación clínica antes de crear la plantilla.'); return;
    }
    const grupo = this.nombreNuevaPlantilla.trim();
    if (!grupo) {
      this.uiMessageService.advertencia('Nombre requerido', 'Escriba un nombre para identificar la plantilla.');
      return;
    }
    const plantilla: ExamenFrecuente = { tipoExamen: this.formulario.tipoExamen, nombreExamen: this.formulario.nombreExamen.trim(), prioridad: this.formulario.prioridad, indicacionClinica: this.formulario.indicacionClinica.trim(), observacion: this.formulario.observacion || '', requiereAyuno: this.formulario.requiereAyuno, esUrgente: this.formulario.esUrgente, grupo, clase: 'ex-green' };
    const guardadas = cargarPlantillasLocales<ExamenFrecuente>('hcu008-plantillas-examenes'); guardadas.push(plantilla); guardarPlantillasLocales('hcu008-plantillas-examenes', guardadas); this.examenesFrecuentes.push(plantilla);
    this.nombreNuevaPlantilla = '';
    this.uiMessageService.exito('Plantilla creada', 'El examen quedó disponible en opciones frecuentes de este equipo.');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['atencionActual']) {
      const anterior = changes['atencionActual'].previousValue?.id || 0;
      const actual = changes['atencionActual'].currentValue?.id || 0;
      if (anterior === actual) return;
      this.cargarExamenes();
    }
  }

  cargarCatalogosExamenes(): void {
    this.cargandoCatalogos = true;

    this.catalogoService.obtenerActivos().subscribe({
      next: (catalogos: CatalogoItem[]) => {
        this.tiposExamen = this.obtenerNombresPorTipo(catalogos, 'TipoExamen');
        this.prioridades = this.obtenerNombresPorTipo(catalogos, 'PrioridadExamen');
        this.estadosExamen = this.obtenerNombresPorTipo(catalogos, 'EstadoExamen');

        this.aplicarCatalogosRespaldoSiFaltan();
        this.aplicarValoresInicialesFormulario();

        this.cargandoCatalogos = false;
      },
      error: (error: any) => {
        console.error('Error al cargar catálogos de exámenes:', error);

        this.aplicarCatalogosRespaldoSiFaltan();
        this.aplicarValoresInicialesFormulario();

        this.cargandoCatalogos = false;

        this.uiMessageService.advertencia(
          'Catálogos no disponibles',
          'No se pudieron cargar tipos, prioridades y estados desde la base. Se usarán valores básicos.'
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
    if (!this.tiposExamen.length) {
      this.tiposExamen = ['Laboratorio', 'Imagen', 'Cardiología', 'Procedimiento diagnóstico', 'Otro'];
    }

    if (!this.prioridades.length) {
      this.prioridades = ['Rutina', 'Urgente', 'Emergente'];
    }

    if (!this.estadosExamen.length) {
      this.estadosExamen = ['Solicitado', 'Tomado', 'Pendiente resultado', 'Resultado disponible', 'Cancelado'];
    }
  }

  aplicarValoresInicialesFormulario(): void {
    if (!this.formulario.tipoExamen || !this.tiposExamen.includes(this.formulario.tipoExamen)) {
      this.formulario.tipoExamen = this.tiposExamen.includes('Laboratorio')
        ? 'Laboratorio'
        : this.tiposExamen[0] || '';
    }

    if (!this.formulario.prioridad || !this.prioridades.includes(this.formulario.prioridad)) {
      this.formulario.prioridad = this.prioridades.includes('Rutina')
        ? 'Rutina'
        : this.prioridades[0] || '';
    }

    if (!this.formulario.estado || !this.estadosExamen.includes(this.formulario.estado)) {
      this.formulario.estado = this.estadosExamen.includes('Solicitado')
        ? 'Solicitado'
        : this.estadosExamen[0] || '';
    }
  }

  irA(modulo: VistaDestinoExamenes): void {
    this.irModulo.emit(modulo);
  }

  get examenesFrecuentesFiltrados(): ExamenFrecuente[] {
    const texto = this.busquedaExamenFrecuente.trim().toLowerCase();

    if (!texto) {
      return this.examenesFrecuentes;
    }

    return this.examenesFrecuentes.filter((item) => {
      const tipo = item.tipoExamen.toLowerCase();
      const nombre = item.nombreExamen.toLowerCase();
      const grupo = item.grupo.toLowerCase();
      const indicacion = item.indicacionClinica.toLowerCase();

      return (
        tipo.includes(texto) ||
        nombre.includes(texto) ||
        grupo.includes(texto) ||
        indicacion.includes(texto)
      );
    });
  }

  crearFormularioVacio(atencionId: number): Examen {
    const tiposDisponibles = this.tiposExamen || [];
    const prioridadesDisponibles = this.prioridades || [];
    const estadosDisponibles = this.estadosExamen || [];

    return {
      atencionId,
      tipoExamen: tiposDisponibles.includes('Laboratorio') ? 'Laboratorio' : tiposDisponibles[0] || 'Laboratorio',
      nombreExamen: '',
      prioridad: prioridadesDisponibles.includes('Rutina') ? 'Rutina' : prioridadesDisponibles[0] || 'Rutina',
      indicacionClinica: '',
      observacion: null,
      requiereAyuno: false,
      esUrgente: false,
      estado: estadosDisponibles.includes('Solicitado') ? 'Solicitado' : estadosDisponibles[0] || 'Solicitado',
      resultadoResumen: null,
      fechaResultado: null
    };
  }

  cargarExamenes(): void {
    if (!this.atencionActual?.id) {
      this.examenes = [];
      this.formulario = this.crearFormularioVacio(0);
      this.aplicarValoresInicialesFormulario();
      return;
    }

    this.cargandoExamenes = true;
    this.formulario = this.crearFormularioVacio(this.atencionActual.id);
    this.aplicarValoresInicialesFormulario();

    this.examenService.obtenerPorAtencion(this.atencionActual.id).subscribe({
      next: (datos: Examen[]) => {
        this.examenes = datos || [];
        this.cargandoExamenes = false;
      },
      error: (error: any) => {
        console.error('Error al cargar exámenes:', error);

        this.examenes = [];
        this.cargandoExamenes = false;

        this.uiMessageService.error(
          'Error al cargar exámenes',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  seleccionarExamenFrecuente(item: ExamenFrecuente): void {
    this.formulario.tipoExamen = this.tiposExamen.includes(item.tipoExamen)
      ? item.tipoExamen
      : this.tiposExamen[0] || item.tipoExamen;

    this.formulario.nombreExamen = item.nombreExamen;

    this.formulario.prioridad = this.prioridades.includes(item.prioridad)
      ? item.prioridad
      : this.prioridades[0] || item.prioridad;

    this.formulario.indicacionClinica = item.indicacionClinica;
    this.formulario.observacion = item.observacion || null;
    this.formulario.requiereAyuno = item.requiereAyuno;
    this.formulario.esUrgente = item.esUrgente;

    this.formulario.estado = this.estadosExamen.includes('Solicitado')
      ? 'Solicitado'
      : this.estadosExamen[0] || 'Solicitado';
  }

  limpiarBusquedaExamen(): void {
    this.busquedaExamenFrecuente = '';
  }

  guardarExamen(): void {
    if (this.soloLectura) return;
    if (!this.atencionActual?.id) {
      this.uiMessageService.advertencia(
        'Atención requerida',
        'Primero debe abrir una atención activa para solicitar exámenes.'
      );
      return;
    }

    if (this.guardandoExamen) {
      return;
    }

    this.normalizarFormulario();

    if (!this.validarExamen()) {
      return;
    }

    const examenParaGuardar: Examen = {
      ...this.formulario,
      atencionId: this.atencionActual.id,
      tipoExamen: this.formulario.tipoExamen.trim(),
      nombreExamen: this.formulario.nombreExamen.trim(),
      prioridad: this.formulario.prioridad.trim(),
      indicacionClinica: this.formulario.indicacionClinica.trim(),
      observacion: this.limpiarTexto(this.formulario.observacion),
      requiereAyuno: this.formulario.requiereAyuno,
      esUrgente: this.formulario.esUrgente,
      estado: this.formulario.estado || 'Solicitado',
      resultadoResumen: this.limpiarTexto(this.formulario.resultadoResumen),
      fechaResultado: this.formulario.fechaResultado || null
    };

    this.guardandoExamen = true;

    this.examenService.guardarExamen(examenParaGuardar).subscribe({
      next: (examenGuardado: Examen) => {
        this.guardandoExamen = false;

        this.uiMessageService.exito(
          'Examen guardado',
          'La solicitud de examen fue registrada correctamente.'
        );

        this.examenGuardado.emit(examenGuardado);

        this.formulario = this.crearFormularioVacio(this.atencionActual?.id || 0);
        this.aplicarValoresInicialesFormulario();
        this.cargarExamenes();
      },
      error: (error: any) => {
        console.error('Error al guardar examen:', error);

        this.guardandoExamen = false;

        this.uiMessageService.error(
          'Error al guardar examen',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  normalizarFormulario(): void {
    this.formulario.tipoExamen = (this.formulario.tipoExamen || '').trim();
    this.formulario.nombreExamen = (this.formulario.nombreExamen || '').trim();
    this.formulario.prioridad = (this.formulario.prioridad || '').trim();
    this.formulario.indicacionClinica = (this.formulario.indicacionClinica || '').trim();
    this.formulario.observacion = this.limpiarTexto(this.formulario.observacion);
    this.formulario.resultadoResumen = this.limpiarTexto(this.formulario.resultadoResumen);
  }

  validarExamen(): boolean {
    if (!this.formulario.tipoExamen) {
      this.uiMessageService.advertencia(
        'Tipo requerido',
        'Debe seleccionar el tipo de examen.'
      );
      return false;
    }

    if (!this.formulario.nombreExamen || this.formulario.nombreExamen.length < 3) {
      this.uiMessageService.advertencia(
        'Examen requerido',
        'Debe registrar el nombre del examen solicitado.'
      );
      return false;
    }

    if (!this.formulario.prioridad) {
      this.uiMessageService.advertencia(
        'Prioridad requerida',
        'Debe seleccionar la prioridad del examen.'
      );
      return false;
    }

    if (!this.formulario.indicacionClinica || this.formulario.indicacionClinica.length < 8) {
      this.uiMessageService.advertencia(
        'Indicación clínica requerida',
        'Debe registrar una indicación clínica mínima para justificar el examen.'
      );
      return false;
    }

    if (this.existeExamenDuplicado()) {
      this.uiMessageService.advertencia(
        'Examen duplicado',
        'Ya existe una solicitud activa con el mismo examen. Puede editar la solicitud existente si necesita corregirla.'
      );
      return false;
    }

    return true;
  }

  existeExamenDuplicado(): boolean {
    const nombre = this.formulario.nombreExamen.trim().toLowerCase();
    const tipo = this.formulario.tipoExamen.trim().toLowerCase();

    return this.examenes.some((examen) => {
      const mismoRegistro =
        examen.id &&
        this.formulario.id &&
        examen.id === this.formulario.id;

      const mismoNombre =
        (examen.nombreExamen || '').trim().toLowerCase() === nombre;

      const mismoTipo =
        (examen.tipoExamen || '').trim().toLowerCase() === tipo;

      const activo = (examen.estado || 'Solicitado') !== 'Cancelado';

      return mismoNombre && mismoTipo && activo && !mismoRegistro;
    });
  }

  editarExamen(examen: Examen): void {
    this.formulario = {
      id: examen.id,
      atencionId: examen.atencionId,
      tipoExamen: examen.tipoExamen,
      nombreExamen: examen.nombreExamen,
      prioridad: examen.prioridad,
      indicacionClinica: examen.indicacionClinica,
      observacion: examen.observacion || null,
      requiereAyuno: examen.requiereAyuno,
      esUrgente: examen.esUrgente,
      estado: examen.estado || 'Solicitado',
      resultadoResumen: examen.resultadoResumen || null,
      fechaSolicitud: examen.fechaSolicitud,
      fechaResultado: examen.fechaResultado || null
    };

    this.aplicarValoresInicialesFormulario();

    this.uiMessageService.informacion(
      'Modo edición',
      `Está editando la solicitud de ${examen.nombreExamen}.`
    );
  }

  cancelarEdicion(): void {
    this.formulario = this.crearFormularioVacio(this.atencionActual?.id || 0);
    this.aplicarValoresInicialesFormulario();
  }

  eliminarExamen(examen: Examen): void {
    if (!examen.id) {
      return;
    }

    this.uiMessageService.confirmar(
      'Eliminar examen',
      `Se eliminará la solicitud de ${examen.nombreExamen}.`,
      () => {
        this.examenService.eliminarExamen(examen.id!).subscribe({
          next: () => {
            this.registroEliminado.emit();
            this.uiMessageService.exito(
              'Examen eliminado',
              'La solicitud de examen fue eliminada correctamente.'
            );

            if (this.formulario.id === examen.id) {
              this.cancelarEdicion();
            }

            this.cargarExamenes();
          },
          error: (error: any) => {
            console.error('Error al eliminar examen:', error);

            this.uiMessageService.error(
              'Error al eliminar examen',
              this.obtenerMensajeError(error)
            );
          }
        });
      },
      'Eliminar',
      'Cancelar'
    );
  }

  continuarEvoluciones(): void {
    if (this.examenes.length === 0) {
      this.uiMessageService.confirmar(
        'Continuar sin exámenes',
        'No se han solicitado exámenes en esta atención. ¿Desea continuar a evoluciones de todas formas?',
        () => {
          this.irA('evoluciones');
        },
        'Continuar',
        'Volver'
      );

      return;
    }

    this.irA('evoluciones');
  }

  limpiarFormularioExamen(): void {
    this.uiMessageService.confirmar(
      'Limpiar formulario',
      'Esta acción limpiará los datos ingresados en pantalla. No eliminará exámenes guardados.',
      () => {
        this.formulario = this.crearFormularioVacio(this.atencionActual?.id || 0);
        this.aplicarValoresInicialesFormulario();

        this.uiMessageService.informacion(
          'Formulario limpio',
          'El formulario de examen fue limpiado correctamente.'
        );
      },
      'Limpiar',
      'Cancelar'
    );
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

  obtenerTotalExamenes(): number {
    return this.examenes.length;
  }

  obtenerTotalUrgentes(): number {
    return this.examenes.filter((e) =>
      e.esUrgente ||
      e.prioridad === 'Urgente' ||
      e.prioridad === 'Emergente'
    ).length;
  }

  obtenerTotalPendientes(): number {
    return this.examenes.filter((e) =>
      (e.estado || 'Solicitado') !== 'Resultado disponible'
    ).length;
  }

  obtenerClaseExamen(examen: Examen): string {
    if (examen.prioridad === 'Emergente' || examen.esUrgente) {
      return 'exam-urgent';
    }

    if (examen.prioridad === 'Urgente') {
      return 'exam-warning';
    }

    return '';
  }

  obtenerClaseEstado(estado?: string | null): string {
    switch (estado) {
      case 'Resultado disponible':
        return 'badge-result';

      case 'Cancelado':
        return 'badge-cancelled';

      case 'Tomado':
      case 'Pendiente resultado':
        return 'badge-pending';

      default:
        return 'badge-requested';
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

  trackByExamen(index: number, examen: Examen): number {
    return examen.id || index;
  }

  trackByExamenFrecuente(index: number, examen: ExamenFrecuente): string {
    return `${examen.nombreExamen}-${index}`;
  }

  puedeEliminarExamen(examen: Examen): boolean {
  if (!examen?.id) {
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

  obtenerMensajeError(error: any): string {
    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.error?.title) {
      return error.error.title;
    }

    if (error?.message) {
      return error.message;
    }

    return 'No se pudo completar la operación.';
  }
}
