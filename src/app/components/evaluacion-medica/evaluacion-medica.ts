import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Atencion } from '../../models/atencion.model';
import { EvaluacionMedica as EvaluacionMedicaModel } from '../../models/evaluacion-medica.model';
import { CatalogoItem } from '../../models/catalogo-item.model';
import { EvaluacionMedicaService } from '../../services/evaluacion-medica';
import { CatalogoService } from '../../services/catalogo';
import { UiMessageService } from '../../shared/ui-message.service';

type SistemaExamen =
  | 'cabezaCuello'
  | 'torax'
  | 'cardiopulmonar'
  | 'abdomen'
  | 'genitourinario'
  | 'extremidades'
  | 'neurologico'
  | 'pielFaneras';

type PlantillaRapida =
  | 'normal'
  | 'dolorToracico'
  | 'dolorAbdominal'
  | 'respiratorio'
  | 'trauma'
  | 'neurologico'
  | 'fiebreSepsis'
  | 'crisisHipertensiva'
  | 'ginecoObstetrico'
  | 'intoxicacion'
  | 'alergia'
  | 'riesgoQuirurgico';

type VistaDestinoEvaluacion = 'inicio' | 'pacientes';

interface PlantillaRapidaItem {
  id: PlantillaRapida;
  titulo: string;
  detalle: string;
  icono: string;
  clase: string;
}

@Component({
  selector: 'app-evaluacion-medica',
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluacion-medica.html',
  styleUrl: './evaluacion-medica.css'
})
export class EvaluacionMedica implements OnInit, OnChanges {
  get soloLectura(): boolean { return this.atencionActual?.estado === 'Cerrada'; }

  @Input() atencionActual?: Atencion;

  @Output() evaluacionGuardada = new EventEmitter<EvaluacionMedicaModel>();
  @Output() irModulo = new EventEmitter<VistaDestinoEvaluacion>();

  cargandoEvaluacion = false;
  guardandoEvaluacion = false;
  cargandoCatalogos = false;

  estadosGenerales: string[] = ['Bueno', 'Regular', 'Malo', 'Crítico'];
  estadosConciencia: string[] = ['Alerta', 'Somnoliento', 'Confuso', 'Estuporoso', 'Comatoso'];

  opcionesHidratacion: string[] = [
    'Hidratado',
    'Deshidratación leve',
    'Deshidratación moderada',
    'Deshidratación severa'
  ];

  opcionesColoracion: string[] = [
    'Normocoloreado',
    'Pálido',
    'Ictérico',
    'Cianótico',
    'Ruborizado'
  ];

  opcionesDolor: string[] = [
    'Sin dolor',
    'Dolor leve',
    'Dolor moderado',
    'Dolor severo'
  ];

  opcionesRiesgoClinico: string[] = [
    'Bajo',
    'Moderado',
    'Alto',
    'Crítico'
  ];

  opcionesConductaInicial: string[] = [
    'Observación en emergencia',
    'Manejo ambulatorio',
    'Hospitalización',
    'Interconsulta',
    'Referencia a mayor complejidad',
    'Alta médica'
  ];

  evaluacion: EvaluacionMedicaModel = this.crearEvaluacionVacia(0);

  antecedentesAbiertos = false;
  sistemaExamenActivo: SistemaExamen = 'cardiopulmonar';

  sistemasExamen: { id: SistemaExamen; etiqueta: string }[] = [
    { id: 'cabezaCuello', etiqueta: 'Cabeza y cuello' },
    { id: 'torax', etiqueta: 'Tórax' },
    { id: 'cardiopulmonar', etiqueta: 'Cardiopulmonar' },
    { id: 'abdomen', etiqueta: 'Abdomen' },
    { id: 'extremidades', etiqueta: 'Extremidades' },
    { id: 'neurologico', etiqueta: 'Neurológico' },
    { id: 'pielFaneras', etiqueta: 'Piel' },
    { id: 'genitourinario', etiqueta: 'Genitourinario' }
  ];

  plantillasRapidas: PlantillaRapidaItem[] = [
    {
      id: 'normal',
      titulo: 'Normal',
      detalle: 'Examen general base',
      icono: 'bx bx-check-circle',
      clase: 'tpl-normal'
    },
    {
      id: 'dolorToracico',
      titulo: 'Dolor torácico',
      detalle: 'Ruta cardio inicial',
      icono: 'bx bx-heart',
      clase: 'tpl-rojo'
    },
    {
      id: 'dolorAbdominal',
      titulo: 'Dolor abdominal',
      detalle: 'Valoración abdominal',
      icono: 'bx bx-body',
      clase: 'tpl-naranja'
    },
    {
      id: 'respiratorio',
      titulo: 'Respiratorio',
      detalle: 'Disnea / tos / SatO2',
      icono: 'bx bx-wind',
      clase: 'tpl-azul'
    },
    {
      id: 'trauma',
      titulo: 'Trauma',
      detalle: 'Lesiones y movilidad',
      icono: 'bx bx-band-aid',
      clase: 'tpl-amarillo'
    },
    {
      id: 'neurologico',
      titulo: 'Neurológico',
      detalle: 'Déficit / conciencia',
      icono: 'bx bx-brain',
      clase: 'tpl-verde'
    },
    {
      id: 'fiebreSepsis',
      titulo: 'Fiebre / sepsis',
      detalle: 'Foco infeccioso',
      icono: 'bx bxs-thermometer',
      clase: 'tpl-rojo'
    },
    {
      id: 'crisisHipertensiva',
      titulo: 'Crisis HTA',
      detalle: 'Presión alta / daño órgano',
      icono: 'bx bx-up-arrow-alt',
      clase: 'tpl-rojo'
    },
    {
      id: 'ginecoObstetrico',
      titulo: 'Gineco-obstétrico',
      detalle: 'Dolor / sangrado / embarazo',
      icono: 'bx bx-female',
      clase: 'tpl-morado'
    },
    {
      id: 'intoxicacion',
      titulo: 'Intoxicación',
      detalle: 'Tóxicos / medicamentos',
      icono: 'bx bx-vial',
      clase: 'tpl-gris'
    },
    {
      id: 'alergia',
      titulo: 'Alergia',
      detalle: 'Reacción / anafilaxia',
      icono: 'bx bx-error-circle',
      clase: 'tpl-azul'
    },
    {
      id: 'riesgoQuirurgico',
      titulo: 'Quirúrgico',
      detalle: 'Abdomen / trauma / sangrado',
      icono: 'bx bx-plus-medical',
      clase: 'tpl-naranja'
    }
  ];

  constructor(
    private evaluacionMedicaService: EvaluacionMedicaService,
    private catalogoService: CatalogoService,
    private uiMessageService: UiMessageService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogosEvaluacion();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['atencionActual']) {
      const anterior = changes['atencionActual'].previousValue?.id || 0;
      const actual = changes['atencionActual'].currentValue?.id || 0;
      if (anterior === actual) return;
      this.cargarEvaluacion();
    }
  }

  cargarCatalogosEvaluacion(): void {
    this.cargandoCatalogos = true;

    this.catalogoService.obtenerActivos().subscribe({
      next: (catalogos: CatalogoItem[]) => {
        this.estadosGenerales = this.obtenerNombresPorTipo(catalogos, 'EstadoGeneral');
        this.estadosConciencia = this.obtenerNombresPorTipo(catalogos, 'EstadoConciencia');
        this.opcionesHidratacion = this.obtenerNombresPorTipo(catalogos, 'Hidratacion');
        this.opcionesColoracion = this.obtenerNombresPorTipo(catalogos, 'Coloracion');
        this.opcionesDolor = this.obtenerNombresPorTipo(catalogos, 'DolorActual');
        this.opcionesRiesgoClinico = this.obtenerNombresPorTipo(catalogos, 'RiesgoClinico');
        this.opcionesConductaInicial = this.obtenerNombresPorTipo(catalogos, 'ConductaInicial');

        this.aplicarCatalogosRespaldoSiFaltan();
        this.aplicarValoresInicialesEvaluacion();

        this.cargandoCatalogos = false;
      },
      error: (error: any) => {
        console.error('Error al cargar catálogos de evaluación médica:', error);

        this.aplicarCatalogosRespaldoSiFaltan();
        this.aplicarValoresInicialesEvaluacion();

        this.cargandoCatalogos = false;

        this.uiMessageService.advertencia(
          'Catálogos no disponibles',
          'No se pudieron cargar catálogos de evaluación médica desde la base. Se usarán valores básicos.'
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
    if (!this.estadosGenerales.length) {
      this.estadosGenerales = ['Bueno', 'Regular', 'Malo', 'Crítico'];
    }

    if (!this.estadosConciencia.length) {
      this.estadosConciencia = ['Alerta', 'Somnoliento', 'Confuso', 'Estuporoso', 'Comatoso'];
    }

    if (!this.opcionesHidratacion.length) {
      this.opcionesHidratacion = [
        'Hidratado',
        'Deshidratación leve',
        'Deshidratación moderada',
        'Deshidratación severa'
      ];
    }

    if (!this.opcionesColoracion.length) {
      this.opcionesColoracion = [
        'Normocoloreado',
        'Pálido',
        'Ictérico',
        'Cianótico',
        'Ruborizado'
      ];
    }

    if (!this.opcionesDolor.length) {
      this.opcionesDolor = [
        'Sin dolor',
        'Dolor leve',
        'Dolor moderado',
        'Dolor severo'
      ];
    }

    if (!this.opcionesRiesgoClinico.length) {
      this.opcionesRiesgoClinico = [
        'Bajo',
        'Moderado',
        'Alto',
        'Crítico'
      ];
    }

    if (!this.opcionesConductaInicial.length) {
      this.opcionesConductaInicial = [
        'Observación en emergencia',
        'Manejo ambulatorio',
        'Hospitalización',
        'Interconsulta',
        'Referencia a mayor complejidad',
        'Alta médica'
      ];
    }
  }

  aplicarValoresInicialesEvaluacion(): void {
    if (!this.evaluacion.estadoGeneral || !this.estadosGenerales.includes(this.evaluacion.estadoGeneral)) {
      this.evaluacion.estadoGeneral = this.estadosGenerales.includes('Regular')
        ? 'Regular'
        : this.estadosGenerales[0] || null;
    }

    if (!this.evaluacion.estadoConciencia || !this.estadosConciencia.includes(this.evaluacion.estadoConciencia)) {
      this.evaluacion.estadoConciencia = this.estadosConciencia.includes('Alerta')
        ? 'Alerta'
        : this.estadosConciencia[0] || null;
    }

    if (!this.evaluacion.hidratacion || !this.opcionesHidratacion.includes(this.evaluacion.hidratacion)) {
      this.evaluacion.hidratacion = this.opcionesHidratacion.includes('Hidratado')
        ? 'Hidratado'
        : this.opcionesHidratacion[0] || null;
    }

    if (!this.evaluacion.coloracion || !this.opcionesColoracion.includes(this.evaluacion.coloracion)) {
      this.evaluacion.coloracion = this.opcionesColoracion.includes('Normocoloreado')
        ? 'Normocoloreado'
        : this.opcionesColoracion[0] || null;
    }

    if (!this.evaluacion.dolorActual || !this.opcionesDolor.includes(this.evaluacion.dolorActual)) {
      this.evaluacion.dolorActual = this.opcionesDolor.includes('Sin dolor')
        ? 'Sin dolor'
        : this.opcionesDolor[0] || null;
    }

    if (!this.evaluacion.riesgoClinico || !this.opcionesRiesgoClinico.includes(this.evaluacion.riesgoClinico)) {
      this.evaluacion.riesgoClinico = this.opcionesRiesgoClinico.includes('Moderado')
        ? 'Moderado'
        : this.opcionesRiesgoClinico[0] || null;
    }

    if (!this.evaluacion.conductaInicial || !this.opcionesConductaInicial.includes(this.evaluacion.conductaInicial)) {
      this.evaluacion.conductaInicial = this.opcionesConductaInicial.includes('Observación en emergencia')
        ? 'Observación en emergencia'
        : this.opcionesConductaInicial[0] || null;
    }
  }

  irA(modulo: VistaDestinoEvaluacion): void {
    this.irModulo.emit(modulo);
  }

  crearEvaluacionVacia(atencionId: number): EvaluacionMedicaModel {
    return {
      atencionId,

      enfermedadActualAmpliada: null,

      antecedentesPersonales: null,
      antecedentesQuirurgicos: null,
      antecedentesFamiliares: null,
      antecedentesGinecoObstetricos: null,
      alergias: null,

      estadoGeneral: this.estadosGenerales.includes('Regular') ? 'Regular' : this.estadosGenerales[0] || null,
      estadoConciencia: this.estadosConciencia.includes('Alerta') ? 'Alerta' : this.estadosConciencia[0] || null,
      hidratacion: this.opcionesHidratacion.includes('Hidratado') ? 'Hidratado' : this.opcionesHidratacion[0] || null,
      coloracion: this.opcionesColoracion.includes('Normocoloreado') ? 'Normocoloreado' : this.opcionesColoracion[0] || null,
      dolorActual: this.opcionesDolor.includes('Sin dolor') ? 'Sin dolor' : this.opcionesDolor[0] || null,

      dificultadRespiratoria: false,
      dolorToracico: false,
      deficitNeurologico: false,
      sangradoActivo: false,
      fiebre: false,
      trauma: false,
      sospechaSepsis: false,
      riesgoObstetrico: false,
      riesgoQuirurgico: false,
      requiereAislamiento: false,

      cabezaCuello: null,
      torax: null,
      cardiopulmonar: null,
      abdomen: null,
      genitourinario: null,
      extremidades: null,
      neurologico: null,
      pielFaneras: null,

      analisisClinico: null,
      problemasActivos: null,
      riesgoClinico: this.opcionesRiesgoClinico.includes('Moderado') ? 'Moderado' : this.opcionesRiesgoClinico[0] || null,
      conductaInicial: this.opcionesConductaInicial.includes('Observación en emergencia')
        ? 'Observación en emergencia'
        : this.opcionesConductaInicial[0] || null,
      planMedico: null
    };
  }

  cargarEvaluacion(): void {
    if (!this.atencionActual?.id) {
      this.evaluacion = this.crearEvaluacionVacia(0);
      this.aplicarValoresInicialesEvaluacion();
      return;
    }

    this.cargandoEvaluacion = true;

    this.evaluacionMedicaService.obtenerEvaluacionPorAtencion(this.atencionActual.id).subscribe({
      next: (datos: EvaluacionMedicaModel) => {
        this.evaluacion = {
          ...this.crearEvaluacionVacia(this.atencionActual?.id || 0),
          ...datos
        };

        this.aplicarValoresInicialesEvaluacion();
        this.cargandoEvaluacion = false;
      },
      error: () => {
        this.evaluacion = this.crearEvaluacionVacia(this.atencionActual?.id || 0);
        this.aplicarValoresInicialesEvaluacion();
        this.cargandoEvaluacion = false;
      }
    });
  }

  guardarEvaluacion(): void {
    if (this.soloLectura) return;
    if (this.guardandoEvaluacion) {
      return;
    }

    if (!this.atencionActual?.id) {
      this.uiMessageService.advertencia(
        'Atención requerida',
        'Primero debe abrir una atención activa para registrar la evaluación médica.'
      );
      return;
    }

    if (!this.validarEvaluacion()) {
      return;
    }

    const evaluacionParaGuardar: EvaluacionMedicaModel = {
      ...this.evaluacion,
      atencionId: this.atencionActual.id,

      enfermedadActualAmpliada: this.limpiarTexto(this.evaluacion.enfermedadActualAmpliada),

      antecedentesPersonales: this.limpiarTexto(this.evaluacion.antecedentesPersonales),
      antecedentesQuirurgicos: this.limpiarTexto(this.evaluacion.antecedentesQuirurgicos),
      antecedentesFamiliares: this.limpiarTexto(this.evaluacion.antecedentesFamiliares),
      antecedentesGinecoObstetricos: this.limpiarTexto(this.evaluacion.antecedentesGinecoObstetricos),
      alergias: this.limpiarTexto(this.evaluacion.alergias),

      cabezaCuello: this.limpiarTexto(this.evaluacion.cabezaCuello),
      torax: this.limpiarTexto(this.evaluacion.torax),
      cardiopulmonar: this.limpiarTexto(this.evaluacion.cardiopulmonar),
      abdomen: this.limpiarTexto(this.evaluacion.abdomen),
      genitourinario: this.limpiarTexto(this.evaluacion.genitourinario),
      extremidades: this.limpiarTexto(this.evaluacion.extremidades),
      neurologico: this.limpiarTexto(this.evaluacion.neurologico),
      pielFaneras: this.limpiarTexto(this.evaluacion.pielFaneras),

      analisisClinico: this.limpiarTexto(this.evaluacion.analisisClinico),
      problemasActivos: this.limpiarTexto(this.evaluacion.problemasActivos),
      planMedico: this.limpiarTexto(this.evaluacion.planMedico)
    };

    this.guardandoEvaluacion = true;

    this.evaluacionMedicaService.guardarEvaluacion(evaluacionParaGuardar).subscribe({
      next: (evaluacionGuardada: EvaluacionMedicaModel) => {
        this.evaluacion = {
          ...this.crearEvaluacionVacia(this.atencionActual?.id || 0),
          ...evaluacionGuardada
        };

        this.aplicarValoresInicialesEvaluacion();

        this.guardandoEvaluacion = false;
        this.evaluacionGuardada.emit(evaluacionGuardada);

        this.uiMessageService.exito(
          'Evaluación médica guardada',
          'La valoración médica fue registrada correctamente. Continuamos con diagnósticos.'
        );
      },
      error: (error: any) => {
        console.error('Error al guardar evaluación médica:', error);

        this.guardandoEvaluacion = false;

        this.uiMessageService.error(
          'Error al guardar evaluación médica',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  validarEvaluacion(): boolean {
    if (!this.validarTextoMinimo(this.evaluacion.enfermedadActualAmpliada, 8)) {
      this.uiMessageService.advertencia(
        'Enfermedad actual requerida',
        'Debe registrar la enfermedad actual o valoración inicial con información suficiente.'
      );
      return false;
    }

    if (!this.evaluacion.estadoGeneral) {
      this.uiMessageService.advertencia(
        'Estado general requerido',
        'Debe seleccionar el estado general del paciente.'
      );
      return false;
    }

    if (!this.evaluacion.estadoConciencia) {
      this.uiMessageService.advertencia(
        'Estado de conciencia requerido',
        'Debe seleccionar el estado de conciencia.'
      );
      return false;
    }

    if (!this.evaluacion.hidratacion) {
      this.uiMessageService.advertencia(
        'Hidratación requerida',
        'Debe seleccionar el estado de hidratación.'
      );
      return false;
    }

    if (!this.evaluacion.coloracion) {
      this.uiMessageService.advertencia(
        'Coloración requerida',
        'Debe seleccionar la coloración clínica del paciente.'
      );
      return false;
    }

    if (!this.validarTextoMinimo(this.evaluacion.analisisClinico, 8)) {
      this.uiMessageService.advertencia(
        'Análisis clínico requerido',
        'Debe registrar el análisis clínico o impresión médica inicial.'
      );
      return false;
    }

    if (!this.validarTextoMinimo(this.evaluacion.planMedico, 8)) {
      this.uiMessageService.advertencia(
        'Plan médico requerido',
        'Debe registrar el plan médico inicial.'
      );
      return false;
    }

    if (
      (this.evaluacion.riesgoClinico === 'Alto' || this.evaluacion.riesgoClinico === 'Crítico') &&
      this.evaluacion.conductaInicial === 'Alta médica'
    ) {
      this.uiMessageService.advertencia(
        'Conducta no coherente',
        'Un paciente con riesgo alto o crítico no debería quedar marcado directamente como alta médica sin justificar conducta.'
      );
      return false;
    }

    return true;
  }

  limpiarDatosEvaluacion(): void {
    if (!this.atencionActual?.id) {
      this.uiMessageService.advertencia(
        'Atención requerida',
        'No existe una atención activa para limpiar.'
      );
      return;
    }

    this.uiMessageService.confirmar(
      'Limpiar evaluación médica',
      'Esta acción limpiará los datos del formulario en pantalla. No eliminará automáticamente la evaluación guardada en la base de datos.',
      () => {
        this.evaluacion = this.crearEvaluacionVacia(this.atencionActual!.id!);
        this.aplicarValoresInicialesEvaluacion();
        this.antecedentesAbiertos = false;
        this.sistemaExamenActivo = 'cardiopulmonar';

        this.uiMessageService.informacion(
          'Formulario limpio',
          'Los datos de la evaluación médica fueron limpiados.'
        );
      },
      'Limpiar datos',
      'Cancelar'
    );
  }

  aplicarPlantillaRapida(id: PlantillaRapida): void {
    const sistemasPorPlantilla: Partial<Record<PlantillaRapida, SistemaExamen>> = {
      dolorToracico: 'cardiopulmonar',
      dolorAbdominal: 'abdomen',
      respiratorio: 'torax',
      trauma: 'extremidades',
      neurologico: 'neurologico',
      crisisHipertensiva: 'cardiopulmonar',
      ginecoObstetrico: 'genitourinario',
      riesgoQuirurgico: 'abdomen'
    };

    const sistemaRelacionado = sistemasPorPlantilla[id];
    if (sistemaRelacionado) this.seleccionarSistemaExamen(sistemaRelacionado);

    switch (id) {
      case 'normal':
        this.aplicarPlantillaNormal();
        break;

      case 'dolorToracico':
        this.aplicarPlantillaDolorToracico();
        break;

      case 'dolorAbdominal':
        this.aplicarPlantillaDolorAbdominal();
        break;

      case 'respiratorio':
        this.aplicarPlantillaRespiratoria();
        break;

      case 'trauma':
        this.aplicarPlantillaTrauma();
        break;

      case 'neurologico':
        this.aplicarPlantillaNeurologica();
        break;

      case 'fiebreSepsis':
        this.aplicarPlantillaFiebreSepsis();
        break;

      case 'crisisHipertensiva':
        this.aplicarPlantillaCrisisHipertensiva();
        break;

      case 'ginecoObstetrico':
        this.aplicarPlantillaGinecoObstetrica();
        break;

      case 'intoxicacion':
        this.aplicarPlantillaIntoxicacion();
        break;

      case 'alergia':
        this.aplicarPlantillaAlergia();
        break;

      case 'riesgoQuirurgico':
        this.aplicarPlantillaRiesgoQuirurgico();
        break;
    }

    this.uiMessageService.informacion(
      'Plantilla aplicada',
      'Se agregaron datos clínicos base. Puede editar el texto antes de guardar.'
    );
  }

  aplicarPlantillaNormal(): void {
    this.evaluacion.estadoGeneral = 'Bueno';
    this.evaluacion.estadoConciencia = 'Alerta';
    this.evaluacion.hidratacion = 'Hidratado';
    this.evaluacion.coloracion = 'Normocoloreado';
    this.evaluacion.dolorActual = 'Sin dolor';
    this.evaluacion.riesgoClinico = 'Bajo';
    this.evaluacion.conductaInicial = 'Manejo ambulatorio';

    this.evaluacion.enfermedadActualAmpliada = this.combinarTexto(
      this.evaluacion.enfermedadActualAmpliada,
      'Paciente valorado en emergencia, al momento consciente, orientado, hemodinámicamente estable, sin signos de dificultad respiratoria ni datos clínicos de alarma evidentes.'
    );

    this.evaluacion.cardiopulmonar = this.combinarTexto(
      this.evaluacion.cardiopulmonar,
      'Ruidos cardíacos rítmicos, sin soplos audibles. Murmullo vesicular conservado bilateralmente, sin ruidos agregados.'
    );

    this.evaluacion.abdomen = this.combinarTexto(
      this.evaluacion.abdomen,
      'Abdomen blando, depresible, no doloroso a la palpación, sin signos de irritación peritoneal.'
    );

    this.evaluacion.analisisClinico = this.combinarTexto(
      this.evaluacion.analisisClinico,
      'Paciente clínicamente estable, sin datos actuales de compromiso vital evidente.'
    );

    this.evaluacion.problemasActivos = this.combinarTexto(
      this.evaluacion.problemasActivos,
      '- Valoración clínica inicial sin signos de alarma evidentes.'
    );

    this.evaluacion.planMedico = this.combinarTexto(
      this.evaluacion.planMedico,
      'Manejo según evolución clínica, educación en signos de alarma, reevaluación y conducta según respuesta.'
    );
  }

  aplicarPlantillaDolorToracico(): void {
    this.evaluacion.dolorToracico = true;
    this.evaluacion.dolorActual = 'Dolor moderado';
    this.evaluacion.riesgoClinico = 'Alto';
    this.evaluacion.conductaInicial = 'Observación en emergencia';

    this.evaluacion.enfermedadActualAmpliada = this.combinarTexto(
      this.evaluacion.enfermedadActualAmpliada,
      'Paciente consulta por dolor torácico. Valorar inicio, duración, irradiación, intensidad, factores desencadenantes, síntomas acompañantes como disnea, diaforesis, náuseas, síncope o palpitaciones.'
    );

    this.evaluacion.cardiopulmonar = this.combinarTexto(
      this.evaluacion.cardiopulmonar,
      'Evaluar ruidos cardíacos, ritmo, presencia de soplos, signos de congestión, trabajo respiratorio, saturación de oxígeno y murmullo vesicular.'
    );

    this.evaluacion.analisisClinico = this.combinarTexto(
      this.evaluacion.analisisClinico,
      'Dolor torácico en evaluación. Considerar origen cardiovascular, respiratorio, digestivo o musculoesquelético según clínica, factores de riesgo y hallazgos.'
    );

    this.evaluacion.problemasActivos = this.combinarTexto(
      this.evaluacion.problemasActivos,
      '- Dolor torácico activo.\n- Riesgo cardiovascular por descartar.'
    );

    this.evaluacion.planMedico = this.combinarTexto(
      this.evaluacion.planMedico,
      'Solicitar electrocardiograma de 12 derivaciones, enzimas cardíacas según disponibilidad, monitorización clínica, control de signos vitales, analgesia según evaluación y reevaluación periódica.'
    );
  }

  aplicarPlantillaDolorAbdominal(): void {
    this.evaluacion.dolorActual = 'Dolor moderado';
    this.evaluacion.riesgoClinico = 'Moderado';
    this.evaluacion.conductaInicial = 'Observación en emergencia';

    this.evaluacion.enfermedadActualAmpliada = this.combinarTexto(
      this.evaluacion.enfermedadActualAmpliada,
      'Paciente consulta por dolor abdominal. Precisar localización, inicio, irradiación, intensidad, relación con alimentos, vómitos, diarrea, fiebre, síntomas urinarios, ginecoobstétricos o signos de alarma.'
    );

    this.evaluacion.abdomen = this.combinarTexto(
      this.evaluacion.abdomen,
      'Abdomen a valorar por inspección, auscultación y palpación. Registrar dolor localizado o difuso, defensa, rebote, masas, distensión, ruidos hidroaéreos y signos de irritación peritoneal.'
    );

    this.evaluacion.analisisClinico = this.combinarTexto(
      this.evaluacion.analisisClinico,
      'Dolor abdominal en estudio. Considerar etiología gastrointestinal, hepatobiliar, urinaria, ginecoobstétrica o quirúrgica según hallazgos clínicos.'
    );

    this.evaluacion.problemasActivos = this.combinarTexto(
      this.evaluacion.problemasActivos,
      '- Dolor abdominal.\n- Etiología abdominal por determinar.'
    );

    this.evaluacion.planMedico = this.combinarTexto(
      this.evaluacion.planMedico,
      'Control de signos vitales, analgesia y antiemético si corresponde, hidratación según estado clínico, exámenes de laboratorio y ecografía o imagen según sospecha diagnóstica.'
    );
  }

  aplicarPlantillaRespiratoria(): void {
    this.evaluacion.dificultadRespiratoria = true;
    this.evaluacion.riesgoClinico = 'Alto';
    this.evaluacion.conductaInicial = 'Observación en emergencia';

    this.evaluacion.enfermedadActualAmpliada = this.combinarTexto(
      this.evaluacion.enfermedadActualAmpliada,
      'Paciente con síntomas respiratorios. Precisar disnea, tos, expectoración, fiebre, dolor torácico pleurítico, sibilancias, exposición infecciosa, comorbilidades y saturación de oxígeno.'
    );

    this.evaluacion.torax = this.combinarTexto(
      this.evaluacion.torax,
      'Tórax simétrico o describir alteraciones. Valorar tiraje, uso de musculatura accesoria, expansibilidad y dolor a la palpación.'
    );

    this.evaluacion.cardiopulmonar = this.combinarTexto(
      this.evaluacion.cardiopulmonar,
      'Evaluar murmullo vesicular, sibilancias, roncus, crépitos, asimetría ventilatoria, frecuencia respiratoria, saturación y respuesta a oxígeno si aplica.'
    );

    this.evaluacion.analisisClinico = this.combinarTexto(
      this.evaluacion.analisisClinico,
      'Cuadro respiratorio en evaluación. Considerar infección respiratoria, broncoespasmo, neumonía, insuficiencia respiratoria u otra causa según clínica.'
    );

    this.evaluacion.problemasActivos = this.combinarTexto(
      this.evaluacion.problemasActivos,
      '- Síntomas respiratorios.\n- Vigilar saturación y trabajo respiratorio.'
    );

    this.evaluacion.planMedico = this.combinarTexto(
      this.evaluacion.planMedico,
      'Control de saturación, oxígeno suplementario si requiere, broncodilatador si broncoespasmo, exámenes e imagen según sospecha, reevaluación clínica periódica.'
    );
  }

  aplicarPlantillaTrauma(): void {
    this.evaluacion.trauma = true;
    this.evaluacion.riesgoClinico = 'Moderado';
    this.evaluacion.conductaInicial = 'Observación en emergencia';

    this.evaluacion.enfermedadActualAmpliada = this.combinarTexto(
      this.evaluacion.enfermedadActualAmpliada,
      'Paciente con antecedente de trauma. Precisar mecanismo, hora del evento, región afectada, pérdida de conciencia, dolor, limitación funcional, heridas, sangrado y signos neurológicos.'
    );

    this.evaluacion.extremidades = this.combinarTexto(
      this.evaluacion.extremidades,
      'Valorar deformidad, edema, dolor a la palpación, movilidad, pulsos distales, llenado capilar, sensibilidad y fuerza.'
    );

    this.evaluacion.neurologico = this.combinarTexto(
      this.evaluacion.neurologico,
      'Valorar estado de conciencia, pupilas, fuerza, sensibilidad, signos focales y evolución neurológica.'
    );

    this.evaluacion.analisisClinico = this.combinarTexto(
      this.evaluacion.analisisClinico,
      'Trauma en evaluación. Determinar gravedad, compromiso neurovascular, necesidad de imágenes, analgesia, curación, inmovilización o referencia.'
    );

    this.evaluacion.problemasActivos = this.combinarTexto(
      this.evaluacion.problemasActivos,
      '- Trauma.\n- Dolor o lesión por caracterizar.'
    );

    this.evaluacion.planMedico = this.combinarTexto(
      this.evaluacion.planMedico,
      'Analgesia, limpieza y curación si hay heridas, inmovilización si corresponde, imágenes según región afectada, control neurovascular y reevaluación.'
    );
  }

  aplicarPlantillaNeurologica(): void {
    this.evaluacion.deficitNeurologico = true;
    this.evaluacion.riesgoClinico = 'Alto';
    this.evaluacion.conductaInicial = 'Observación en emergencia';

    this.evaluacion.enfermedadActualAmpliada = this.combinarTexto(
      this.evaluacion.enfermedadActualAmpliada,
      'Paciente con síntomas neurológicos. Precisar inicio exacto, progresión, cefalea, convulsiones, alteración del lenguaje, fuerza, sensibilidad, marcha, visión y antecedentes relevantes.'
    );

    this.evaluacion.neurologico = this.combinarTexto(
      this.evaluacion.neurologico,
      'Evaluar Glasgow, orientación, pares craneales, fuerza, sensibilidad, coordinación, marcha, signos meníngeos, pupilas y focalidad neurológica.'
    );

    this.evaluacion.analisisClinico = this.combinarTexto(
      this.evaluacion.analisisClinico,
      'Síntomas neurológicos en evaluación. Considerar evento cerebrovascular, crisis convulsiva, infección, alteración metabólica, trauma u otra causa según contexto.'
    );

    this.evaluacion.problemasActivos = this.combinarTexto(
      this.evaluacion.problemasActivos,
      '- Alteración neurológica por caracterizar.\n- Riesgo neurológico.'
    );

    this.evaluacion.planMedico = this.combinarTexto(
      this.evaluacion.planMedico,
      'Control neurológico seriado, glicemia capilar, signos vitales, exámenes según disponibilidad, imagen si amerita, interconsulta o referencia según evolución.'
    );
  }

  aplicarPlantillaFiebreSepsis(): void {
    this.evaluacion.fiebre = true;
    this.evaluacion.sospechaSepsis = true;
    this.evaluacion.riesgoClinico = 'Alto';
    this.evaluacion.conductaInicial = 'Observación en emergencia';

    this.evaluacion.enfermedadActualAmpliada = this.combinarTexto(
      this.evaluacion.enfermedadActualAmpliada,
      'Paciente con fiebre o sospecha infecciosa. Precisar tiempo de evolución, foco probable, escalofríos, síntomas respiratorios, urinarios, abdominales, cutáneos, neurológicos y comorbilidades.'
    );

    this.evaluacion.analisisClinico = this.combinarTexto(
      this.evaluacion.analisisClinico,
      'Síndrome febril o infeccioso en evaluación. Valorar criterios de sepsis, estado hemodinámico, perfusión, foco infeccioso probable y necesidad de antibiótico.'
    );

    this.evaluacion.problemasActivos = this.combinarTexto(
      this.evaluacion.problemasActivos,
      '- Fiebre o sospecha infecciosa.\n- Descartar sepsis según evolución clínica.'
    );

    this.evaluacion.planMedico = this.combinarTexto(
      this.evaluacion.planMedico,
      'Control de signos vitales, hidratación según estado clínico, hemograma y reactantes según disponibilidad, búsqueda de foco, antibiótico si criterios clínicos, reevaluación estrecha.'
    );
  }

  aplicarPlantillaCrisisHipertensiva(): void {
    this.evaluacion.riesgoClinico = 'Alto';
    this.evaluacion.conductaInicial = 'Observación en emergencia';

    this.evaluacion.enfermedadActualAmpliada = this.combinarTexto(
      this.evaluacion.enfermedadActualAmpliada,
      'Paciente con cifras tensionales elevadas o sospecha de crisis hipertensiva. Precisar cefalea, dolor torácico, disnea, déficit neurológico, alteraciones visuales, epistaxis, adherencia y tratamiento habitual.'
    );

    this.evaluacion.cardiopulmonar = this.combinarTexto(
      this.evaluacion.cardiopulmonar,
      'Valorar signos de congestión, dolor torácico, ritmo cardíaco, soplos, edema periférico y compromiso respiratorio.'
    );

    this.evaluacion.neurologico = this.combinarTexto(
      this.evaluacion.neurologico,
      'Valorar estado de conciencia, focalidad neurológica, cefalea intensa, alteraciones visuales y signos de alarma.'
    );

    this.evaluacion.analisisClinico = this.combinarTexto(
      this.evaluacion.analisisClinico,
      'Cifras tensionales elevadas en evaluación. Diferenciar urgencia hipertensiva de emergencia hipertensiva según daño agudo de órgano blanco.'
    );

    this.evaluacion.problemasActivos = this.combinarTexto(
      this.evaluacion.problemasActivos,
      '- Hipertensión arterial no controlada.\n- Descartar daño agudo de órgano blanco.'
    );

    this.evaluacion.planMedico = this.combinarTexto(
      this.evaluacion.planMedico,
      'Control seriado de presión arterial, electrocardiograma si dolor torácico o riesgo, exámenes según disponibilidad, manejo antihipertensivo según contexto y reevaluación.'
    );
  }

  aplicarPlantillaGinecoObstetrica(): void {
    this.evaluacion.riesgoObstetrico = true;
    this.evaluacion.riesgoClinico = 'Moderado';
    this.evaluacion.conductaInicial = 'Interconsulta';

    this.evaluacion.enfermedadActualAmpliada = this.combinarTexto(
      this.evaluacion.enfermedadActualAmpliada,
      'Paciente con motivo ginecoobstétrico. Precisar fecha de última menstruación, edad gestacional si aplica, dolor pélvico, sangrado, flujo, fiebre, síntomas urinarios, movimientos fetales y antecedentes obstétricos.'
    );

    this.evaluacion.genitourinario = this.combinarTexto(
      this.evaluacion.genitourinario,
      'Registrar dolor pélvico, sangrado genital, flujo, síntomas urinarios, puño percusión lumbar y hallazgos relevantes según valoración.'
    );

    this.evaluacion.analisisClinico = this.combinarTexto(
      this.evaluacion.analisisClinico,
      'Cuadro ginecoobstétrico en evaluación. Valorar riesgo obstétrico, sangrado, infección, dolor pélvico y necesidad de valoración por Ginecología.'
    );

    this.evaluacion.problemasActivos = this.combinarTexto(
      this.evaluacion.problemasActivos,
      '- Riesgo ginecoobstétrico por caracterizar.'
    );

    this.evaluacion.planMedico = this.combinarTexto(
      this.evaluacion.planMedico,
      'Prueba de embarazo si aplica, control de signos vitales, valoración de sangrado o dolor, exámenes según disponibilidad, ecografía o interconsulta según criterio clínico.'
    );
  }

  aplicarPlantillaIntoxicacion(): void {
    this.evaluacion.riesgoClinico = 'Alto';
    this.evaluacion.conductaInicial = 'Observación en emergencia';

    this.evaluacion.enfermedadActualAmpliada = this.combinarTexto(
      this.evaluacion.enfermedadActualAmpliada,
      'Paciente con sospecha de intoxicación. Precisar sustancia, cantidad, vía, hora de exposición, intención, síntomas, vómitos, convulsiones, estado de conciencia y tratamiento recibido.'
    );

    this.evaluacion.neurologico = this.combinarTexto(
      this.evaluacion.neurologico,
      'Valorar Glasgow, pupilas, convulsiones, agitación, somnolencia, focalidad neurológica y evolución del estado de conciencia.'
    );

    this.evaluacion.analisisClinico = this.combinarTexto(
      this.evaluacion.analisisClinico,
      'Sospecha de intoxicación en evaluación. Determinar toxíndrome, riesgo respiratorio, neurológico, cardiovascular y necesidad de observación o referencia.'
    );

    this.evaluacion.problemasActivos = this.combinarTexto(
      this.evaluacion.problemasActivos,
      '- Sospecha de intoxicación.\n- Riesgo clínico según sustancia y evolución.'
    );

    this.evaluacion.planMedico = this.combinarTexto(
      this.evaluacion.planMedico,
      'Monitorización, control de signos vitales, glicemia capilar, electrocardiograma si corresponde, medidas de soporte, manejo específico según tóxico y referencia si amerita.'
    );
  }

  aplicarPlantillaAlergia(): void {
    this.evaluacion.riesgoClinico = 'Moderado';
    this.evaluacion.conductaInicial = 'Observación en emergencia';

    this.evaluacion.enfermedadActualAmpliada = this.combinarTexto(
      this.evaluacion.enfermedadActualAmpliada,
      'Paciente con reacción alérgica. Precisar desencadenante, tiempo de inicio, urticaria, angioedema, disnea, sibilancias, vómitos, hipotensión, medicamentos recibidos y antecedentes de alergias.'
    );

    this.evaluacion.cardiopulmonar = this.combinarTexto(
      this.evaluacion.cardiopulmonar,
      'Valorar vía aérea, edema facial o laríngeo, sibilancias, trabajo respiratorio, saturación y estabilidad hemodinámica.'
    );

    this.evaluacion.pielFaneras = this.combinarTexto(
      this.evaluacion.pielFaneras,
      'Valorar urticaria, rash, prurito, edema, lesiones cutáneas y extensión.'
    );

    this.evaluacion.analisisClinico = this.combinarTexto(
      this.evaluacion.analisisClinico,
      'Reacción alérgica en evaluación. Descartar anafilaxia según compromiso respiratorio, cardiovascular, gastrointestinal o cutáneo generalizado.'
    );

    this.evaluacion.problemasActivos = this.combinarTexto(
      this.evaluacion.problemasActivos,
      '- Reacción alérgica.\n- Descartar anafilaxia.'
    );

    this.evaluacion.planMedico = this.combinarTexto(
      this.evaluacion.planMedico,
      'Vigilancia clínica, manejo antihistamínico/corticoide según criterio, adrenalina si criterios de anafilaxia, control respiratorio y reevaluación.'
    );
  }

  aplicarPlantillaRiesgoQuirurgico(): void {
    this.evaluacion.riesgoQuirurgico = true;
    this.evaluacion.riesgoClinico = 'Alto';
    this.evaluacion.conductaInicial = 'Interconsulta';

    this.evaluacion.enfermedadActualAmpliada = this.combinarTexto(
      this.evaluacion.enfermedadActualAmpliada,
      'Paciente con posible patología quirúrgica. Precisar dolor, evolución, fiebre, vómitos, sangrado, trauma, signos de irritación peritoneal, distensión o deterioro clínico.'
    );

    this.evaluacion.abdomen = this.combinarTexto(
      this.evaluacion.abdomen,
      'Valorar defensa, rebote, dolor localizado, distensión, masas, ruidos hidroaéreos y signos de irritación peritoneal.'
    );

    this.evaluacion.analisisClinico = this.combinarTexto(
      this.evaluacion.analisisClinico,
      'Cuadro con riesgo quirúrgico. Requiere correlación clínica, laboratorio, imagen e interconsulta según disponibilidad y evolución.'
    );

    this.evaluacion.problemasActivos = this.combinarTexto(
      this.evaluacion.problemasActivos,
      '- Riesgo quirúrgico.\n- Patología aguda por descartar.'
    );

    this.evaluacion.planMedico = this.combinarTexto(
      this.evaluacion.planMedico,
      'Ayuno si amerita, analgesia, hidratación, exámenes, imagen según sospecha, interconsulta quirúrgica y vigilancia de signos de alarma.'
    );
  }

  seleccionarSistemaExamen(sistema: SistemaExamen): void {
    this.sistemaExamenActivo = sistema;
  }

  alternarAntecedentes(): void {
    this.antecedentesAbiertos = !this.antecedentesAbiertos;
  }

  obtenerEtiquetaSistemaActivo(): string {
    return this.sistemasExamen.find((sistema) => sistema.id === this.sistemaExamenActivo)?.etiqueta || 'Examen físico';
  }

  obtenerTextoSistemaActivo(): string {
    switch (this.sistemaExamenActivo) {
      case 'cabezaCuello':
        return this.evaluacion.cabezaCuello || '';

      case 'torax':
        return this.evaluacion.torax || '';

      case 'cardiopulmonar':
        return this.evaluacion.cardiopulmonar || '';

      case 'abdomen':
        return this.evaluacion.abdomen || '';

      case 'genitourinario':
        return this.evaluacion.genitourinario || '';

      case 'extremidades':
        return this.evaluacion.extremidades || '';

      case 'neurologico':
        return this.evaluacion.neurologico || '';

      case 'pielFaneras':
        return this.evaluacion.pielFaneras || '';

      default:
        return '';
    }
  }

  actualizarTextoSistemaActivo(valor: string): void {
    switch (this.sistemaExamenActivo) {
      case 'cabezaCuello':
        this.evaluacion.cabezaCuello = valor;
        break;

      case 'torax':
        this.evaluacion.torax = valor;
        break;

      case 'cardiopulmonar':
        this.evaluacion.cardiopulmonar = valor;
        break;

      case 'abdomen':
        this.evaluacion.abdomen = valor;
        break;

      case 'genitourinario':
        this.evaluacion.genitourinario = valor;
        break;

      case 'extremidades':
        this.evaluacion.extremidades = valor;
        break;

      case 'neurologico':
        this.evaluacion.neurologico = valor;
        break;

      case 'pielFaneras':
        this.evaluacion.pielFaneras = valor;
        break;
    }
  }

  limpiarTexto(valor?: string | null): string | null {
    const texto = (valor || '').trim();
    return texto || null;
  }

  validarTextoMinimo(valor: string | null | undefined, minimo: number): boolean {
    return (valor || '').trim().length >= minimo;
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

  obtenerPrioridadTriaje(): string {
    return this.atencionActual?.triaje?.prioridad || 'Sin triaje';
  }

  obtenerSignosVitalesResumen(): string {
    const triaje = this.atencionActual?.triaje;

    if (!triaje) {
      return 'Sin signos vitales registrados';
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
      partes.push(`SatO2 ${triaje.saturacionOxigeno}%`);
    }

    if (triaje.temperatura) {
      partes.push(`T ${triaje.temperatura}°C`);
    }

    return partes.length ? partes.join(' · ') : 'Sin signos vitales registrados';
  }

  obtenerClaseRiesgo(): string {
    switch (this.evaluacion.riesgoClinico) {
      case 'Bajo':
        return 'riesgo-bajo';

      case 'Moderado':
        return 'riesgo-moderado';

      case 'Alto':
        return 'riesgo-alto';

      case 'Crítico':
        return 'riesgo-critico';

      default:
        return 'riesgo-moderado';
    }
  }

  obtenerClasePrioridad(): string {
    switch (this.obtenerPrioridadTriaje()) {
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

  obtenerTotalAlertas(): number {
    const alertas = [
      this.evaluacion.dificultadRespiratoria,
      this.evaluacion.dolorToracico,
      this.evaluacion.deficitNeurologico,
      this.evaluacion.sangradoActivo,
      this.evaluacion.fiebre,
      this.evaluacion.trauma,
      this.evaluacion.sospechaSepsis,
      this.evaluacion.riesgoObstetrico,
      this.evaluacion.riesgoQuirurgico,
      this.evaluacion.requiereAislamiento
    ];

    return alertas.filter(Boolean).length;
  }

  obtenerAlertasActivas(): { titulo: string; detalle: string; clase: string; icono: string }[] {
    const alertas: { titulo: string; detalle: string; clase: string; icono: string }[] = [];

    if (this.evaluacion.dolorToracico) {
      alertas.push({
        titulo: 'Dolor torácico activo',
        detalle: 'Síntoma de alta prioridad',
        clase: 'alerta-roja',
        icono: 'bx bx-heart'
      });
    }

    if (this.evaluacion.dificultadRespiratoria) {
      alertas.push({
        titulo: 'Dificultad respiratoria',
        detalle: 'Vigilar saturación y trabajo respiratorio',
        clase: 'alerta-roja',
        icono: 'bx bx-wind'
      });
    }

    if (this.evaluacion.deficitNeurologico) {
      alertas.push({
        titulo: 'Déficit neurológico',
        detalle: 'Requiere vigilancia neurológica',
        clase: 'alerta-roja',
        icono: 'bx bx-brain'
      });
    }

    if (this.evaluacion.sangradoActivo) {
      alertas.push({
        titulo: 'Sangrado activo',
        detalle: 'Control hemodinámico y fuente de sangrado',
        clase: 'alerta-roja',
        icono: 'bx bx-error-circle'
      });
    }

    if (this.evaluacion.sospechaSepsis) {
      alertas.push({
        titulo: 'Sospecha de sepsis',
        detalle: 'Activar vigilancia infecciosa',
        clase: 'alerta-naranja',
        icono: 'bx bxs-thermometer'
      });
    }

    if (this.evaluacion.riesgoObstetrico) {
      alertas.push({
        titulo: 'Riesgo obstétrico',
        detalle: 'Valorar condición ginecoobstétrica',
        clase: 'alerta-naranja',
        icono: 'bx bx-female'
      });
    }

    if (this.evaluacion.riesgoQuirurgico) {
      alertas.push({
        titulo: 'Riesgo quirúrgico',
        detalle: 'Valorar interconsulta o imagen',
        clase: 'alerta-naranja',
        icono: 'bx bx-plus-medical'
      });
    }

    if (this.evaluacion.requiereAislamiento) {
      alertas.push({
        titulo: 'Aislamiento',
        detalle: 'Aplicar medidas de bioseguridad',
        clase: 'alerta-amarilla',
        icono: 'bx bx-shield-quarter'
      });
    }

    if (this.evaluacion.riesgoClinico === 'Moderado' || this.evaluacion.riesgoClinico === 'Alto') {
      alertas.push({
        titulo: `Riesgo clínico ${this.evaluacion.riesgoClinico.toLowerCase()}`,
        detalle: 'Requiere vigilancia estrecha',
        clase: 'alerta-amarilla',
        icono: 'bx bx-error'
      });
    }

    if (this.evaluacion.riesgoClinico === 'Crítico') {
      alertas.push({
        titulo: 'Riesgo clínico crítico',
        detalle: 'Requiere intervención inmediata',
        clase: 'alerta-roja',
        icono: 'bx bx-error-circle'
      });
    }

    return alertas.slice(0, 5);
  }

  obtenerConductasSugeridas(): string[] {
    const conductas = new Set<string>();

    if (this.evaluacion.dolorToracico) {
      conductas.add('EKG 12 derivaciones');
      conductas.add('Troponina I si está disponible');
      conductas.add('Monitorización continua');
    }

    if (this.evaluacion.dificultadRespiratoria) {
      conductas.add('Oxígeno según saturación');
      conductas.add('Reevaluar patrón respiratorio');
    }

    if (this.evaluacion.sospechaSepsis || this.evaluacion.fiebre) {
      conductas.add('Hemograma y reactantes');
      conductas.add('Valorar antibiótico según foco');
    }

    if (this.evaluacion.trauma) {
      conductas.add('Valorar imágenes según mecanismo');
      conductas.add('Control neurovascular si extremidad afectada');
    }

    if (this.evaluacion.deficitNeurologico) {
      conductas.add('Control neurológico seriado');
      conductas.add('Glicemia capilar');
    }

    if (this.evaluacion.riesgoObstetrico) {
      conductas.add('Valorar embarazo y sangrado');
      conductas.add('Interconsulta ginecoobstétrica si amerita');
    }

    if (this.evaluacion.riesgoQuirurgico) {
      conductas.add('Ayuno si sospecha quirúrgica');
      conductas.add('Interconsulta quirúrgica si amerita');
    }

    if (this.evaluacion.requiereAislamiento) {
      conductas.add('Aplicar aislamiento y bioseguridad');
    }

    if (conductas.size === 0) {
      conductas.add('Reevaluación clínica periódica');
      conductas.add('Plan según evolución');
    }

    return Array.from(conductas);
  }

  trackByPlantillaRapida(index: number, plantilla: PlantillaRapidaItem): string {
    return plantilla.id || String(index);
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
