import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Atencion } from '../../models/atencion.model';
import { Egreso as EgresoModel } from '../../models/egreso.model';
import { CatalogoItem } from '../../models/catalogo-item.model';
import { EgresoService } from '../../services/egreso';
import { CatalogoService } from '../../services/catalogo';
import { AuthService } from '../../services/auth';
import { UiMessageService } from '../../shared/ui-message.service';

type VistaDestinoEgreso = 'inicio' | 'pacientes' | 'reportes';

interface PlantillaEgreso {
  id: string;
  titulo: string;
  detalle: string;
  tipoEgreso: string;
  condicionEgreso: string;
  destino: string;
  resumenClinico: string;
  indicaciones: string;
  signosAlarma: string;
  tratamientoDomiciliario: string;
  recomendaciones: string;
  requiereControl: boolean;
  requiereReferencia: boolean;
  clase: string;
}

@Component({
  selector: 'app-egreso',
  imports: [CommonModule, FormsModule],
  templateUrl: './egreso.html',
  styleUrl: './egreso.css'
})
export class Egreso implements OnInit, OnChanges {
  get soloLectura(): boolean { return this.atencionActual?.estado === 'Cerrada'; }

  @Input() atencionActual?: Atencion;

  @Output() egresoGuardado = new EventEmitter<EgresoModel>();
  @Output() registroEliminado = new EventEmitter<void>();
  @Output() irModulo = new EventEmitter<VistaDestinoEgreso>();

  cargandoEgreso = false;
  guardandoEgreso = false;
  cargandoCatalogos = false;

  egresoActual?: EgresoModel | null;

  get diagnosticosDisponibles(): string[] {
    return (this.atencionActual?.diagnosticos || [])
      .map(diagnostico => `${diagnostico.codigoCie10 || ''} ${diagnostico.descripcionCie10 || ''}`.trim())
      .filter((diagnostico, indice, lista) => diagnostico.length > 0 && lista.indexOf(diagnostico) === indice);
  }

  tiposEgreso: string[] = [
    'Alta médica',
    'Alta con indicaciones',
    'Referencia',
    'Transferencia',
    'Alta voluntaria',
    'Fuga / abandono',
    'Observación externa',
    'Fallecimiento'
  ];

  condicionesEgreso: string[] = [
    'Estable',
    'Mejorado',
    'Sin cambios',
    'Delicado',
    'Crítico',
    'Fallecido'
  ];

  destinos: string[] = [
    'Domicilio',
    'Consulta externa',
    'Otra unidad de salud',
    'Hospitalización',
    'UCI',
    'Quirófano',
    'Morgue',
    'Otro'
  ];

  formulario: EgresoModel = this.crearFormularioVacio(0);

  plantillas: PlantillaEgreso[] = [
    {
      id: 'alta-estable',
      titulo: 'Alta estable',
      detalle: 'Domicilio con indicaciones',
      tipoEgreso: 'Alta médica',
      condicionEgreso: 'Estable',
      destino: 'Domicilio',
      resumenClinico: 'Paciente valorado en emergencia, con evolución clínica favorable, hemodinámicamente estable al momento del egreso.',
      indicaciones: 'Cumplir tratamiento indicado. Mantener reposo relativo según condición clínica. Acudir a control por consulta externa si persisten síntomas.',
      signosAlarma: 'Retornar inmediatamente si presenta dificultad respiratoria, dolor intenso persistente, fiebre persistente, vómitos incoercibles, alteración del estado de conciencia, sangrado, convulsiones o deterioro clínico.',
      tratamientoDomiciliario: '',
      recomendaciones: 'Explicar signos de alarma al paciente y/o familiar. Se entrega indicaciones verbales y escritas según disponibilidad.',
      requiereControl: true,
      requiereReferencia: false,
      clase: 'tpl-green'
    },
    {
      id: 'alta-dolor',
      titulo: 'Alta post analgesia',
      detalle: 'Dolor controlado',
      tipoEgreso: 'Alta con indicaciones',
      condicionEgreso: 'Mejorado',
      destino: 'Domicilio',
      resumenClinico: 'Paciente con cuadro doloroso manejado en emergencia, con mejoría clínica posterior a tratamiento instaurado.',
      indicaciones: 'Continuar analgesia según prescripción. Evitar automedicación. Mantener hidratación y reposo según tolerancia.',
      signosAlarma: 'Retornar si presenta aumento del dolor, fiebre, vómitos persistentes, dificultad respiratoria, debilidad progresiva, sangrado o cualquier signo de deterioro.',
      tratamientoDomiciliario: '',
      recomendaciones: 'Control por consulta externa o unidad de salud según evolución clínica.',
      requiereControl: true,
      requiereReferencia: false,
      clase: 'tpl-blue'
    },
    {
      id: 'referencia',
      titulo: 'Referencia',
      detalle: 'Mayor capacidad resolutiva',
      tipoEgreso: 'Referencia',
      condicionEgreso: 'Delicado',
      destino: 'Otra unidad de salud',
      resumenClinico: 'Paciente valorado en emergencia que requiere referencia a unidad de mayor capacidad resolutiva por condición clínica y/o necesidad de especialidad.',
      indicaciones: 'Mantener vigilancia clínica, soporte inicial y medidas terapéuticas indicadas durante el traslado según condición del paciente.',
      signosAlarma: 'Vigilar deterioro neurológico, dificultad respiratoria, inestabilidad hemodinámica, dolor progresivo, sangrado o signos de shock.',
      tratamientoDomiciliario: '',
      recomendaciones: 'Coordinar referencia mediante red pública integral de salud y entregar documentación clínica correspondiente.',
      requiereControl: false,
      requiereReferencia: true,
      clase: 'tpl-orange'
    },
    {
      id: 'alta-voluntaria',
      titulo: 'Alta voluntaria',
      detalle: 'Paciente/familiar solicita salida',
      tipoEgreso: 'Alta voluntaria',
      condicionEgreso: 'Sin cambios',
      destino: 'Domicilio',
      resumenClinico: 'Paciente/familiar solicita retiro voluntario luego de explicación de riesgos, beneficios y posibles complicaciones.',
      indicaciones: 'Se explican signos de alarma y necesidad de retorno inmediato ante deterioro clínico.',
      signosAlarma: 'Retornar inmediatamente si presenta empeoramiento de síntomas, dificultad respiratoria, alteración neurológica, dolor intenso, sangrado, fiebre persistente o cualquier complicación.',
      tratamientoDomiciliario: '',
      recomendaciones: 'Registrar constancia de alta voluntaria según normativa institucional.',
      requiereControl: true,
      requiereReferencia: false,
      clase: 'tpl-yellow'
    },
    {
      id: 'fallecimiento',
      titulo: 'Fallecimiento',
      detalle: 'Cierre por defunción',
      tipoEgreso: 'Fallecimiento',
      condicionEgreso: 'Fallecido',
      destino: 'Morgue',
      resumenClinico: 'Paciente sin signos vitales o con evolución tórpida que culmina en fallecimiento, según valoración clínica.',
      indicaciones: 'Proceder según protocolo institucional para fallecimiento, notificación correspondiente y documentación legal pertinente.',
      signosAlarma: 'No aplica.',
      tratamientoDomiciliario: '',
      recomendaciones: 'Registrar hora, condición clínica, maniobras realizadas si corresponde y comunicación a familiares/autoridad pertinente.',
      requiereControl: false,
      requiereReferencia: false,
      clase: 'tpl-red'
    }
  ];

  constructor(
    private egresoService: EgresoService,
    private catalogoService: CatalogoService,
    private authService: AuthService,
    private uiMessageService: UiMessageService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogosEgreso();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['atencionActual']) {
      const anterior = changes['atencionActual'].previousValue?.id || 0;
      const actual = changes['atencionActual'].currentValue?.id || 0;
      if (anterior === actual) return;
      this.cargarEgreso();
    }
  }

  cargarCatalogosEgreso(): void {
    this.cargandoCatalogos = true;

    this.catalogoService.obtenerActivos().subscribe({
      next: (catalogos: CatalogoItem[]) => {
        this.tiposEgreso = this.obtenerNombresPorTipo(catalogos, 'TipoEgreso');
        this.condicionesEgreso = this.obtenerNombresPorTipo(catalogos, 'CondicionEgreso');
        this.destinos = this.obtenerNombresPorTipo(catalogos, 'DestinoEgreso');

        this.aplicarCatalogosRespaldoSiFaltan();
        this.aplicarValoresInicialesFormulario();

        this.cargandoCatalogos = false;
      },
      error: (error: any) => {
        console.error('Error al cargar catálogos de egreso:', error);

        this.aplicarCatalogosRespaldoSiFaltan();
        this.aplicarValoresInicialesFormulario();

        this.cargandoCatalogos = false;

        this.uiMessageService.advertencia(
          'Catálogos no disponibles',
          'No se pudieron cargar tipo, condición y destino de egreso desde la base. Se usarán valores básicos.'
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
    if (!this.tiposEgreso.length) {
      this.tiposEgreso = [
        'Alta médica',
        'Alta con indicaciones',
        'Referencia',
        'Transferencia',
        'Alta voluntaria',
        'Fuga / abandono',
        'Observación externa',
        'Fallecimiento'
      ];
    }

    if (!this.condicionesEgreso.length) {
      this.condicionesEgreso = [
        'Estable',
        'Mejorado',
        'Sin cambios',
        'Delicado',
        'Crítico',
        'Fallecido'
      ];
    }

    if (!this.destinos.length) {
      this.destinos = [
        'Domicilio',
        'Consulta externa',
        'Otra unidad de salud',
        'Hospitalización',
        'UCI',
        'Quirófano',
        'Morgue',
        'Otro'
      ];
    }
  }

  aplicarValoresInicialesFormulario(): void {
    if (!this.formulario.tipoEgreso || !this.tiposEgreso.includes(this.formulario.tipoEgreso)) {
      this.formulario.tipoEgreso = this.tiposEgreso.includes('Alta médica')
        ? 'Alta médica'
        : this.tiposEgreso[0] || '';
    }

    if (!this.formulario.condicionEgreso || !this.condicionesEgreso.includes(this.formulario.condicionEgreso)) {
      this.formulario.condicionEgreso = this.condicionesEgreso.includes('Estable')
        ? 'Estable'
        : this.condicionesEgreso[0] || '';
    }

    if (!this.formulario.destino || !this.destinos.includes(this.formulario.destino)) {
      this.formulario.destino = this.destinos.includes('Domicilio')
        ? 'Domicilio'
        : this.destinos[0] || '';
    }
  }

  irA(modulo: VistaDestinoEgreso): void {
    this.irModulo.emit(modulo);
  }

  crearFormularioVacio(atencionId: number): EgresoModel {
    const tiposDisponibles = this.tiposEgreso || [];
    const condicionesDisponibles = this.condicionesEgreso || [];
    const destinosDisponibles = this.destinos || [];

    return {
      atencionId,
      tipoEgreso: tiposDisponibles.includes('Alta médica') ? 'Alta médica' : tiposDisponibles[0] || 'Alta médica',
      condicionEgreso: condicionesDisponibles.includes('Estable') ? 'Estable' : condicionesDisponibles[0] || 'Estable',
      destino: destinosDisponibles.includes('Domicilio') ? 'Domicilio' : destinosDisponibles[0] || 'Domicilio',
      diagnosticoEgreso: null,
      resumenClinico: '',
      indicaciones: '',
      signosAlarma: '',
      tratamientoDomiciliario: null,
      recomendaciones: null,
      observacion: null,
      requiereControl: true,
      requiereReferencia: false,
      nombreAcompanante: null,
      parentescoAcompanante: null,
      estado: 'Registrado',
      fechaEgreso: null
    };
  }

  cargarEgreso(): void {
    if (!this.atencionActual?.id) {
      this.egresoActual = null;
      this.formulario = this.crearFormularioVacio(0);
      this.aplicarValoresInicialesFormulario();
      return;
    }

    this.cargandoEgreso = true;
    this.formulario = this.crearFormularioVacio(this.atencionActual.id);
    this.aplicarValoresInicialesFormulario();
    this.completarDatosBase();

    this.egresoService.obtenerPorAtencion(this.atencionActual.id).subscribe({
      next: (dato: EgresoModel | null) => {
        this.egresoActual = dato;
        this.cargandoEgreso = false;

        if (dato) {
          this.formulario = {
            ...dato,
            fechaEgreso: this.convertirFechaParaInput(dato.fechaEgreso)
          };

          this.aplicarValoresInicialesFormulario();
        }
      },
      error: (error: any) => {
        console.error('Error al cargar egreso:', error);

        this.egresoActual = null;
        this.cargandoEgreso = false;

        this.uiMessageService.error(
          'Error al cargar egreso',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  completarDatosBase(): void {
    const diagnosticos = this.diagnosticosDisponibles.join('; ');
    if (diagnosticos) this.formulario.diagnosticoEgreso = diagnosticos.slice(0, 250);

    const ultimaEvolucion = [...(this.atencionActual?.evoluciones || [])]
      .sort((a, b) => String(b.fechaRegistro || '').localeCompare(String(a.fechaRegistro || '')))[0];
    const resultados = (this.atencionActual?.examenes || [])
      .filter(examen => !!examen.resultadoResumen)
      .map(examen => `${examen.nombreExamen}: ${examen.resultadoResumen}`)
      .join('. ');
    const tratamiento = (this.atencionActual?.prescripciones || [])
      .filter(prescripcion => (prescripcion.estado || 'Activa') !== 'Cancelada')
      .map(prescripcion => `${prescripcion.medicamento} ${prescripcion.dosis}, ${prescripcion.viaAdministracion}, ${prescripcion.frecuencia}`)
      .join('\n');

    if (ultimaEvolucion) {
      this.formulario.resumenClinico = this.combinarTexto(
        this.formulario.resumenClinico,
        [ultimaEvolucion.objetivo, ultimaEvolucion.analisis, resultados].filter(Boolean).join(' ')
      ).slice(0, 1200);
      this.formulario.indicaciones = this.combinarTexto(this.formulario.indicaciones, ultimaEvolucion.plan).slice(0, 1200);
    } else if (resultados) {
      this.formulario.resumenClinico = this.combinarTexto(this.formulario.resumenClinico, resultados).slice(0, 1200);
    }

    if (tratamiento) this.formulario.tratamientoDomiciliario = tratamiento.slice(0, 1000);

    if (this.atencionActual?.nombreAcompanante) {
      this.formulario.nombreAcompanante = this.atencionActual.nombreAcompanante;
    }

    if (this.atencionActual?.parentescoAcompanante) {
      this.formulario.parentescoAcompanante = this.atencionActual.parentescoAcompanante;
    }
  }

  actualizarDesdeHistoriaClinica(): void {
    this.completarDatosBase();
    this.uiMessageService.exito(
      'Historia clínica cargada',
      'Se incorporaron diagnósticos, resultados, tratamiento y la última evolución disponibles.'
    );
  }

  aplicarPlantilla(plantilla: PlantillaEgreso): void {
    this.formulario.tipoEgreso = this.tiposEgreso.includes(plantilla.tipoEgreso)
      ? plantilla.tipoEgreso
      : this.tiposEgreso[0] || plantilla.tipoEgreso;

    this.formulario.condicionEgreso = this.condicionesEgreso.includes(plantilla.condicionEgreso)
      ? plantilla.condicionEgreso
      : this.condicionesEgreso[0] || plantilla.condicionEgreso;

    this.formulario.destino = this.destinos.includes(plantilla.destino)
      ? plantilla.destino
      : this.destinos[0] || plantilla.destino;

    this.formulario.resumenClinico = this.combinarTexto(this.formulario.resumenClinico, plantilla.resumenClinico);
    this.formulario.indicaciones = this.combinarTexto(this.formulario.indicaciones, plantilla.indicaciones);
    this.formulario.signosAlarma = this.combinarTexto(this.formulario.signosAlarma, plantilla.signosAlarma);
    this.formulario.tratamientoDomiciliario = this.combinarTexto(this.formulario.tratamientoDomiciliario, plantilla.tratamientoDomiciliario);
    this.formulario.recomendaciones = this.combinarTexto(this.formulario.recomendaciones, plantilla.recomendaciones);
    this.formulario.requiereControl = plantilla.requiereControl;
    this.formulario.requiereReferencia = plantilla.requiereReferencia;

    this.uiMessageService.informacion(
      'Plantilla aplicada',
      'Se cargaron datos base. Revise y ajuste antes de guardar el egreso.'
    );
  }

  guardarEgreso(): void {
    if (this.soloLectura) return;
    if (!this.atencionActual?.id) {
      this.uiMessageService.advertencia(
        'Atención requerida',
        'Primero debe abrir una atención activa para registrar el egreso.'
      );
      return;
    }

    if (this.guardandoEgreso) {
      return;
    }

    this.normalizarFormulario();

    if (!this.validarEgreso()) {
      return;
    }

    const egresoParaGuardar: EgresoModel = {
      ...this.formulario,
      atencionId: this.atencionActual.id,
      tipoEgreso: this.formulario.tipoEgreso.trim(),
      condicionEgreso: this.formulario.condicionEgreso.trim(),
      destino: this.formulario.destino.trim(),
      diagnosticoEgreso: this.limpiarTexto(this.formulario.diagnosticoEgreso),
      resumenClinico: this.formulario.resumenClinico.trim(),
      indicaciones: this.formulario.indicaciones.trim(),
      signosAlarma: this.formulario.signosAlarma.trim(),
      tratamientoDomiciliario: this.limpiarTexto(this.formulario.tratamientoDomiciliario),
      recomendaciones: this.limpiarTexto(this.formulario.recomendaciones),
      observacion: this.limpiarTexto(this.formulario.observacion),
      requiereControl: !!this.formulario.requiereControl,
      requiereReferencia: !!this.formulario.requiereReferencia,
      nombreAcompanante: this.limpiarTexto(this.formulario.nombreAcompanante),
      parentescoAcompanante: this.limpiarTexto(this.formulario.parentescoAcompanante),
      estado: this.formulario.estado || 'Registrado',
      fechaEgreso: this.formulario.fechaEgreso || null
    };

    this.guardandoEgreso = true;

    this.egresoService.guardarEgreso(egresoParaGuardar).subscribe({
      next: (egresoGuardado: EgresoModel) => {
        this.guardandoEgreso = false;
        this.egresoActual = egresoGuardado;

        this.uiMessageService.exito(
          'Egreso guardado',
          'El egreso fue registrado correctamente.'
        );

        this.egresoGuardado.emit(egresoGuardado);

        this.formulario = {
          ...egresoGuardado,
          fechaEgreso: this.convertirFechaParaInput(egresoGuardado.fechaEgreso)
        };

        this.aplicarValoresInicialesFormulario();
      },
      error: (error: any) => {
        console.error('Error al guardar egreso:', error);

        this.guardandoEgreso = false;

        this.uiMessageService.error(
          'Error al guardar egreso',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  finalizarYReporte(): void {
    if (!this.egresoActual?.id && !this.formulario.id) {
      this.uiMessageService.advertencia(
        'Egreso requerido',
        'Debe guardar el egreso antes de generar el reporte final.'
      );
      return;
    }

    this.irA('reportes');
  }

  limpiarFormulario(): void {
    this.uiMessageService.confirmar(
      'Limpiar egreso',
      'Se limpiará el formulario actual. No se eliminará el egreso ya guardado.',
      () => {
        this.formulario = this.crearFormularioVacio(this.atencionActual?.id || 0);
        this.aplicarValoresInicialesFormulario();
        this.completarDatosBase();

        this.uiMessageService.informacion(
          'Formulario limpio',
          'El formulario de egreso fue limpiado correctamente.'
        );
      },
      'Limpiar',
      'Cancelar'
    );
  }

  eliminarEgreso(): void {
    if (!this.egresoActual?.id) {
      return;
    }

    if (!this.puedeEliminarEgreso()) {
      this.uiMessageService.advertencia(
        'Acción restringida',
        'Solo un usuario administrador puede eliminar el egreso.'
      );
      return;
    }

    this.uiMessageService.confirmar(
      'Eliminar egreso',
      'Se eliminará el egreso registrado para esta atención.',
      () => {
        this.egresoService.eliminarEgreso(this.egresoActual!.id!).subscribe({
          next: () => {
            this.registroEliminado.emit();
            this.uiMessageService.exito(
              'Egreso eliminado',
              'El egreso fue eliminado correctamente.'
            );

            this.egresoActual = null;
            this.formulario = this.crearFormularioVacio(this.atencionActual?.id || 0);
            this.aplicarValoresInicialesFormulario();
            this.completarDatosBase();
          },
          error: (error: any) => {
            this.uiMessageService.error(
              'Error al eliminar egreso',
              this.obtenerMensajeError(error)
            );
          }
        });
      },
      'Eliminar',
      'Cancelar'
    );
  }

  puedeEliminarEgreso(): boolean {
    if (!this.egresoActual?.id) {
      return false;
    }

    return this.esAdministrador();
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

  normalizarFormulario(): void {
    this.formulario.tipoEgreso = (this.formulario.tipoEgreso || '').trim();
    this.formulario.condicionEgreso = (this.formulario.condicionEgreso || '').trim();
    this.formulario.destino = (this.formulario.destino || '').trim();
    this.formulario.diagnosticoEgreso = this.limpiarTexto(this.formulario.diagnosticoEgreso);
    this.formulario.resumenClinico = (this.formulario.resumenClinico || '').trim();
    this.formulario.indicaciones = (this.formulario.indicaciones || '').trim();
    this.formulario.signosAlarma = (this.formulario.signosAlarma || '').trim();
    this.formulario.tratamientoDomiciliario = this.limpiarTexto(this.formulario.tratamientoDomiciliario);
    this.formulario.recomendaciones = this.limpiarTexto(this.formulario.recomendaciones);
    this.formulario.observacion = this.limpiarTexto(this.formulario.observacion);
    this.formulario.nombreAcompanante = this.limpiarTexto(this.formulario.nombreAcompanante);
    this.formulario.parentescoAcompanante = this.limpiarTexto(this.formulario.parentescoAcompanante);
    this.formulario.estado = this.formulario.estado || 'Registrado';
  }

  validarEgreso(): boolean {
    if (!this.formulario.tipoEgreso) {
      this.uiMessageService.advertencia('Tipo requerido', 'Debe seleccionar el tipo de egreso.');
      return false;
    }

    if (!this.formulario.condicionEgreso) {
      this.uiMessageService.advertencia('Condición requerida', 'Debe seleccionar la condición de egreso.');
      return false;
    }

    if (!this.formulario.destino) {
      this.uiMessageService.advertencia('Destino requerido', 'Debe seleccionar el destino del paciente.');
      return false;
    }

    if (!this.formulario.resumenClinico || this.formulario.resumenClinico.length < 10) {
      this.uiMessageService.advertencia(
        'Resumen requerido',
        'Debe registrar un resumen clínico mínimo para el egreso.'
      );
      return false;
    }

    if (!this.formulario.indicaciones || this.formulario.indicaciones.length < 8) {
      this.uiMessageService.advertencia(
        'Indicaciones requeridas',
        'Debe registrar indicaciones de egreso.'
      );
      return false;
    }

    if (!this.formulario.signosAlarma || this.formulario.signosAlarma.length < 5) {
      this.uiMessageService.advertencia(
        'Signos de alarma requeridos',
        'Debe registrar signos de alarma o colocar “No aplica”.'
      );
      return false;
    }

    if (
      this.formulario.tipoEgreso === 'Fallecimiento' &&
      this.formulario.condicionEgreso !== 'Fallecido'
    ) {
      this.uiMessageService.advertencia(
        'Condición no coherente',
        'Si el tipo de egreso es fallecimiento, la condición debe ser Fallecido.'
      );
      return false;
    }

    if (
      this.formulario.tipoEgreso === 'Fallecimiento' &&
      this.formulario.destino !== 'Morgue'
    ) {
      this.uiMessageService.advertencia(
        'Destino no coherente',
        'Si el tipo de egreso es fallecimiento, el destino debe ser Morgue.'
      );
      return false;
    }

    if (
      this.formulario.tipoEgreso === 'Referencia' &&
      !this.formulario.requiereReferencia
    ) {
      this.uiMessageService.advertencia(
        'Referencia requerida',
        'Si el tipo de egreso es Referencia, debe marcar requiere referencia.'
      );
      return false;
    }

    if (
      this.formulario.requiereReferencia &&
      this.formulario.destino === 'Domicilio'
    ) {
      this.uiMessageService.advertencia(
        'Destino no coherente',
        'Si requiere referencia, el destino no debería ser domicilio.'
      );
      return false;
    }

    return true;
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

  obtenerEstadoTexto(): string {
    return this.egresoActual?.id ? 'Egreso registrado' : 'Pendiente de egreso';
  }

  combinarTexto(actual: string | null | undefined, nuevo: string): string {
    const textoActual = (actual || '').trim();
    const textoNuevo = (nuevo || '').trim();

    if (!textoNuevo) {
      return textoActual;
    }

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

  convertirFechaParaInput(fecha?: string | null): string | null {
    if (!fecha) {
      return null;
    }

    const date = new Date(fecha);

    if (isNaN(date.getTime())) {
      return null;
    }

    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);

    return local.toISOString().slice(0, 16);
  }

  trackByPlantilla(index: number, plantilla: PlantillaEgreso): string {
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
