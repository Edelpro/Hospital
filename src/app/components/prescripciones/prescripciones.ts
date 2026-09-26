import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Atencion } from '../../models/atencion.model';
import { Prescripcion } from '../../models/prescripcion.model';
import { CatalogoItem } from '../../models/catalogo-item.model';
import { PrescripcionService } from '../../services/prescripcion';
import { CatalogoService } from '../../services/catalogo';
import { AuthService } from '../../services/auth';
import { UiMessageService } from '../../shared/ui-message.service';
import { cargarPlantillasLocales, guardarPlantillasLocales } from '../../shared/plantillas-locales';

type VistaDestinoPrescripciones = 'inicio' | 'pacientes' | 'examenes';

interface MedicamentoFrecuente {
  medicamento: string;
  presentacion: string;
  dosis: string;
  viaAdministracion: string;
  frecuencia: string;
  duracion: string;
  cantidad: string;
  indicaciones: string;
  grupo: string;
  clase: string;
}

@Component({
  selector: 'app-prescripciones',
  imports: [CommonModule, FormsModule],
  templateUrl: './prescripciones.html',
  styleUrl: './prescripciones.css'
})
export class Prescripciones implements OnInit, OnChanges {
  get soloLectura(): boolean { return this.atencionActual?.estado === 'Cerrada'; }

  @Input() atencionActual?: Atencion;

  @Output() prescripcionGuardada = new EventEmitter<Prescripcion>();
  @Output() registroEliminado = new EventEmitter<void>();
  @Output() irModulo = new EventEmitter<VistaDestinoPrescripciones>();

  prescripciones: Prescripcion[] = [];

  cargandoPrescripciones = false;
  guardandoPrescripcion = false;
  cargandoCatalogos = false;

  viasAdministracion: string[] = [
    'VO',
    'IV',
    'IM',
    'SC',
    'SL',
    'Inhalatoria',
    'Tópica',
    'Oftálmica',
    'Ótica',
    'Rectal',
    'Nebulización',
    'Otra'
  ];

  frecuencias: string[] = [
    'Dosis única',
    'Cada 4 horas',
    'Cada 6 horas',
    'Cada 8 horas',
    'Cada 12 horas',
    'Cada 24 horas',
    'STAT',
    'Según necesidad',
    'Infusión continua',
    'Otra'
  ];

  duraciones: string[] = [
    'Dosis única',
    '24 horas',
    '48 horas',
    '72 horas',
    '3 días',
    '5 días',
    '7 días',
    '10 días',
    '14 días',
    'Según evolución'
  ];

  formulario: Prescripcion = this.crearFormularioVacio(0);
  nombreNuevaPlantilla = '';

  medicamentosFrecuentes: MedicamentoFrecuente[] = [
    {
      medicamento: 'Paracetamol',
      presentacion: 'Tableta / ampolla',
      dosis: '1 g',
      viaAdministracion: 'VO',
      frecuencia: 'Cada 8 horas',
      duracion: 'Según evolución',
      cantidad: '',
      indicaciones: 'Administrar para dolor o fiebre según criterio clínico. Verificar edad, peso, función hepática y dosis máxima diaria.',
      grupo: 'Analgesia',
      clase: 'rx-green'
    },
    {
      medicamento: 'Ibuprofeno',
      presentacion: 'Tableta',
      dosis: '400 mg',
      viaAdministracion: 'VO',
      frecuencia: 'Cada 8 horas',
      duracion: '3 días',
      cantidad: '',
      indicaciones: 'Usar si no hay contraindicación. Valorar gastritis, enfermedad renal, sangrado, embarazo o riesgo cardiovascular.',
      grupo: 'Analgesia',
      clase: 'rx-yellow'
    },
    {
      medicamento: 'Metoclopramida',
      presentacion: 'Ampolla / tableta',
      dosis: '10 mg',
      viaAdministracion: 'IV',
      frecuencia: 'Cada 8 horas',
      duracion: 'Según evolución',
      cantidad: '',
      indicaciones: 'Administrar para náusea o vómito según criterio clínico. Vigilar efectos extrapiramidales.',
      grupo: 'Antiemético',
      clase: 'rx-blue'
    },
    {
      medicamento: 'Ondansetrón',
      presentacion: 'Ampolla / tableta',
      dosis: '4 mg',
      viaAdministracion: 'IV',
      frecuencia: 'Cada 8 horas',
      duracion: 'Según evolución',
      cantidad: '',
      indicaciones: 'Administrar para náusea o vómito según criterio clínico. Valorar QT prolongado y comorbilidades.',
      grupo: 'Antiemético',
      clase: 'rx-blue'
    },
    {
      medicamento: 'Omeprazol',
      presentacion: 'Ampolla / cápsula',
      dosis: '40 mg',
      viaAdministracion: 'IV',
      frecuencia: 'Cada 24 horas',
      duracion: 'Según evolución',
      cantidad: '',
      indicaciones: 'Gastroprotección o síntomas dispépticos según evaluación clínica.',
      grupo: 'Gastro',
      clase: 'rx-green'
    },
    {
      medicamento: 'Cloruro de sodio 0.9%',
      presentacion: 'Solución 1000 mL',
      dosis: '1000 mL',
      viaAdministracion: 'IV',
      frecuencia: 'Infusión continua',
      duracion: 'Según evolución',
      cantidad: '1 funda',
      indicaciones: 'Administrar según estado de hidratación, presión arterial, función renal y riesgo de sobrecarga.',
      grupo: 'Hidratación',
      clase: 'rx-blue'
    },
    {
      medicamento: 'Sales de rehidratación oral',
      presentacion: 'Sobre',
      dosis: 'Según tolerancia oral',
      viaAdministracion: 'VO',
      frecuencia: 'Según necesidad',
      duracion: 'Según evolución',
      cantidad: '',
      indicaciones: 'Usar en deshidratación leve o pérdidas gastrointestinales si el paciente tolera vía oral.',
      grupo: 'Hidratación',
      clase: 'rx-green'
    },
    {
      medicamento: 'Ceftriaxona',
      presentacion: 'Ampolla',
      dosis: '1 g',
      viaAdministracion: 'IV',
      frecuencia: 'Cada 24 horas',
      duracion: 'Según foco',
      cantidad: '',
      indicaciones: 'Antibiótico según sospecha clínica, foco infeccioso, alergias, guías institucionales y disponibilidad.',
      grupo: 'Antibiótico',
      clase: 'rx-red'
    },
    {
      medicamento: 'Cefuroxima',
      presentacion: 'Tableta',
      dosis: '500 mg',
      viaAdministracion: 'VO',
      frecuencia: 'Cada 12 horas',
      duracion: 'Según foco',
      cantidad: '',
      indicaciones: 'Antibiótico según sospecha clínica, alergias, foco infeccioso y criterio médico.',
      grupo: 'Antibiótico',
      clase: 'rx-red'
    },
    {
      medicamento: 'Salbutamol',
      presentacion: 'Inhalador / solución para nebulizar',
      dosis: 'Según protocolo',
      viaAdministracion: 'Nebulización',
      frecuencia: 'Según necesidad',
      duracion: 'Según evolución',
      cantidad: '',
      indicaciones: 'Usar si broncoespasmo o dificultad respiratoria. Vigilar frecuencia cardíaca, saturación y respuesta clínica.',
      grupo: 'Respiratorio',
      clase: 'rx-orange'
    },
    {
      medicamento: 'Loratadina',
      presentacion: 'Tableta / jarabe',
      dosis: '10 mg',
      viaAdministracion: 'VO',
      frecuencia: 'Cada 24 horas',
      duracion: 'Según evolución',
      cantidad: '',
      indicaciones: 'Usar en cuadro alérgico leve según criterio clínico.',
      grupo: 'Alergia',
      clase: 'rx-purple'
    },
    {
      medicamento: 'Dexametasona',
      presentacion: 'Ampolla',
      dosis: 'Según criterio',
      viaAdministracion: 'IV',
      frecuencia: 'Dosis única',
      duracion: 'Dosis única',
      cantidad: '',
      indicaciones: 'Usar según indicación clínica. Valorar comorbilidades, glicemia y riesgo infeccioso.',
      grupo: 'Alergia / inflamación',
      clase: 'rx-purple'
    }
  ];

  constructor(
    private prescripcionService: PrescripcionService,
    private catalogoService: CatalogoService,
    private authService: AuthService,
    private uiMessageService: UiMessageService
  ) {}

  ngOnInit(): void {
    this.medicamentosFrecuentes.push(...cargarPlantillasLocales<MedicamentoFrecuente>('hcu008-plantillas-prescripciones'));
    this.cargarCatalogosPrescripciones();
  }

  crearPlantillaPersonalizada(): void {
    if (!this.formulario.medicamento?.trim() || !this.formulario.dosis?.trim()) {
      this.uiMessageService.advertencia('Datos requeridos', 'Complete medicamento y dosis antes de crear la plantilla.'); return;
    }
    const grupo = this.nombreNuevaPlantilla.trim();
    if (!grupo) {
      this.uiMessageService.advertencia('Nombre requerido', 'Escriba un nombre para identificar la plantilla.');
      return;
    }
    const plantilla: MedicamentoFrecuente = { medicamento: this.formulario.medicamento.trim(), presentacion: this.formulario.presentacion || '', dosis: this.formulario.dosis.trim(), viaAdministracion: this.formulario.viaAdministracion, frecuencia: this.formulario.frecuencia, duracion: this.formulario.duracion, cantidad: this.formulario.cantidad || '', indicaciones: this.formulario.indicaciones || '', grupo, clase: 'rx-green' };
    const guardadas = cargarPlantillasLocales<MedicamentoFrecuente>('hcu008-plantillas-prescripciones'); guardadas.push(plantilla); guardarPlantillasLocales('hcu008-plantillas-prescripciones', guardadas); this.medicamentosFrecuentes.push(plantilla);
    this.nombreNuevaPlantilla = '';
    this.uiMessageService.exito('Plantilla creada', 'La prescripción quedó disponible en medicamentos frecuentes de este equipo.');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['atencionActual']) {
      const anterior = changes['atencionActual'].previousValue?.id || 0;
      const actual = changes['atencionActual'].currentValue?.id || 0;
      if (anterior === actual) return;
      this.cargarPrescripciones();
    }
  }

  cargarCatalogosPrescripciones(): void {
    this.cargandoCatalogos = true;

    this.catalogoService.obtenerActivos().subscribe({
      next: (catalogos: CatalogoItem[]) => {
        this.viasAdministracion = this.obtenerNombresPorTipo(catalogos, 'ViaAdministracion');
        this.frecuencias = this.obtenerNombresPorTipo(catalogos, 'FrecuenciaMedicacion');

        this.aplicarCatalogosRespaldoSiFaltan();
        this.aplicarValoresInicialesFormulario();

        this.cargandoCatalogos = false;
      },
      error: (error: any) => {
        console.error('Error al cargar catálogos de prescripciones:', error);

        this.aplicarCatalogosRespaldoSiFaltan();
        this.aplicarValoresInicialesFormulario();

        this.cargandoCatalogos = false;

        this.uiMessageService.advertencia(
          'Catálogos no disponibles',
          'No se pudieron cargar vías y frecuencias desde la base. Se usarán valores básicos.'
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
    if (!this.viasAdministracion.length) {
      this.viasAdministracion = [
        'VO',
        'IV',
        'IM',
        'SC',
        'SL',
        'Inhalatoria',
        'Tópica',
        'Oftálmica',
        'Ótica',
        'Rectal',
        'Nebulización',
        'Otra'
      ];
    }

    if (!this.frecuencias.length) {
      this.frecuencias = [
        'Dosis única',
        'Cada 4 horas',
        'Cada 6 horas',
        'Cada 8 horas',
        'Cada 12 horas',
        'Cada 24 horas',
        'STAT',
        'Según necesidad',
        'Infusión continua',
        'Otra'
      ];
    }
  }

  aplicarValoresInicialesFormulario(): void {
    if (!this.formulario.viaAdministracion || !this.viasAdministracion.includes(this.formulario.viaAdministracion)) {
      this.formulario.viaAdministracion = this.viasAdministracion.includes('VO')
        ? 'VO'
        : this.viasAdministracion[0] || '';
    }

    if (!this.formulario.frecuencia || !this.frecuencias.includes(this.formulario.frecuencia)) {
      this.formulario.frecuencia = this.frecuencias.includes('Cada 8 horas')
        ? 'Cada 8 horas'
        : this.frecuencias[0] || '';
    }
  }

  irA(modulo: VistaDestinoPrescripciones): void {
    this.irModulo.emit(modulo);
  }

  crearFormularioVacio(atencionId: number): Prescripcion {
    const viasDisponibles = this.viasAdministracion || [];
    const frecuenciasDisponibles = this.frecuencias || [];

    return {
      atencionId,
      medicamento: '',
      presentacion: null,
      dosis: '',
      viaAdministracion: viasDisponibles.includes('VO') ? 'VO' : viasDisponibles[0] || 'VO',
      frecuencia: frecuenciasDisponibles.includes('Cada 8 horas') ? 'Cada 8 horas' : frecuenciasDisponibles[0] || 'Cada 8 horas',
      duracion: 'Según evolución',
      cantidad: null,
      indicaciones: null,
      administrarAhora: false,
      esUrgente: false,
      estado: 'Activa'
    };
  }

  cargarPrescripciones(): void {
    if (!this.atencionActual?.id) {
      this.prescripciones = [];
      this.formulario = this.crearFormularioVacio(0);
      this.aplicarValoresInicialesFormulario();
      return;
    }

    this.cargandoPrescripciones = true;
    this.formulario = this.crearFormularioVacio(this.atencionActual.id);
    this.aplicarValoresInicialesFormulario();

    this.prescripcionService.obtenerPorAtencion(this.atencionActual.id).subscribe({
      next: (datos: Prescripcion[]) => {
        this.prescripciones = datos || [];
        this.cargandoPrescripciones = false;
      },
      error: (error: any) => {
        console.error('Error al cargar prescripciones:', error);

        this.prescripciones = [];
        this.cargandoPrescripciones = false;

        this.uiMessageService.error(
          'Error al cargar prescripciones',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  seleccionarMedicamentoFrecuente(item: MedicamentoFrecuente): void {
    this.formulario.medicamento = item.medicamento;
    this.formulario.presentacion = item.presentacion;
    this.formulario.dosis = item.dosis;

    this.formulario.viaAdministracion = this.viasAdministracion.includes(item.viaAdministracion)
      ? item.viaAdministracion
      : this.viasAdministracion[0] || item.viaAdministracion;

    this.formulario.frecuencia = this.frecuencias.includes(item.frecuencia)
      ? item.frecuencia
      : this.frecuencias[0] || item.frecuencia;

    this.formulario.duracion = item.duracion;
    this.formulario.cantidad = item.cantidad || null;
    this.formulario.indicaciones = item.indicaciones;
  }

  guardarPrescripcion(): void {
    if (this.soloLectura) return;
    if (!this.atencionActual?.id) {
      this.uiMessageService.advertencia(
        'Atención requerida',
        'Primero debe abrir una atención activa para registrar prescripciones.'
      );
      return;
    }

    if (this.guardandoPrescripcion) {
      return;
    }

    this.normalizarFormulario();

    if (!this.validarPrescripcion()) {
      return;
    }

    const prescripcionParaGuardar: Prescripcion = {
      ...this.formulario,
      atencionId: this.atencionActual.id,
      medicamento: this.formulario.medicamento.trim(),
      presentacion: this.limpiarTexto(this.formulario.presentacion),
      dosis: this.formulario.dosis.trim(),
      viaAdministracion: this.formulario.viaAdministracion.trim(),
      frecuencia: this.formulario.frecuencia.trim(),
      duracion: this.formulario.duracion.trim(),
      cantidad: this.limpiarTexto(this.formulario.cantidad),
      indicaciones: this.limpiarTexto(this.formulario.indicaciones),
      administrarAhora: !!this.formulario.administrarAhora,
      esUrgente: !!this.formulario.esUrgente,
      estado: this.formulario.estado || 'Activa'
    };

    this.guardandoPrescripcion = true;

    this.prescripcionService.guardarPrescripcion(prescripcionParaGuardar).subscribe({
      next: (prescripcionGuardada: Prescripcion) => {
        this.guardandoPrescripcion = false;

        this.uiMessageService.exito(
          'Prescripción guardada',
          'La prescripción fue registrada correctamente.'
        );

        this.prescripcionGuardada.emit(prescripcionGuardada);

        this.formulario = this.crearFormularioVacio(this.atencionActual?.id || 0);
        this.aplicarValoresInicialesFormulario();
        this.cargarPrescripciones();
      },
      error: (error: any) => {
        console.error('Error al guardar prescripción:', error);

        this.guardandoPrescripcion = false;

        this.uiMessageService.error(
          'Error al guardar prescripción',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  normalizarFormulario(): void {
    this.formulario.medicamento = (this.formulario.medicamento || '').trim();
    this.formulario.presentacion = this.limpiarTexto(this.formulario.presentacion);
    this.formulario.dosis = (this.formulario.dosis || '').trim();
    this.formulario.viaAdministracion = (this.formulario.viaAdministracion || '').trim();
    this.formulario.frecuencia = (this.formulario.frecuencia || '').trim();
    this.formulario.duracion = (this.formulario.duracion || '').trim();
    this.formulario.cantidad = this.limpiarTexto(this.formulario.cantidad);
    this.formulario.indicaciones = this.limpiarTexto(this.formulario.indicaciones);
    this.formulario.estado = this.formulario.estado || 'Activa';
  }

  validarPrescripcion(): boolean {
    if (!this.formulario.medicamento || this.formulario.medicamento.length < 3) {
      this.uiMessageService.advertencia(
        'Medicamento requerido',
        'Debe registrar el nombre del medicamento.'
      );
      return false;
    }

    if (!this.formulario.dosis) {
      this.uiMessageService.advertencia(
        'Dosis requerida',
        'Debe registrar la dosis de la prescripción.'
      );
      return false;
    }

    if (!this.formulario.viaAdministracion) {
      this.uiMessageService.advertencia(
        'Vía requerida',
        'Debe seleccionar la vía de administración.'
      );
      return false;
    }

    if (!this.formulario.frecuencia) {
      this.uiMessageService.advertencia(
        'Frecuencia requerida',
        'Debe registrar la frecuencia.'
      );
      return false;
    }

    if (!this.formulario.duracion) {
      this.uiMessageService.advertencia(
        'Duración requerida',
        'Debe registrar la duración del tratamiento.'
      );
      return false;
    }

    if (this.existePrescripcionDuplicada()) {
      this.uiMessageService.advertencia(
        'Prescripción duplicada',
        'Ya existe una prescripción activa con el mismo medicamento, vía y frecuencia. Puede editar la existente si necesita corregirla.'
      );
      return false;
    }

    return true;
  }

  existePrescripcionDuplicada(): boolean {
    const medicamento = this.formulario.medicamento.trim().toLowerCase();
    const via = this.formulario.viaAdministracion.trim().toLowerCase();
    const frecuencia = this.formulario.frecuencia.trim().toLowerCase();

    return this.prescripciones.some((prescripcion) => {
      const mismoRegistro =
        prescripcion.id &&
        this.formulario.id &&
        prescripcion.id === this.formulario.id;

      const mismoMedicamento =
        (prescripcion.medicamento || '').trim().toLowerCase() === medicamento;

      const mismaVia =
        (prescripcion.viaAdministracion || '').trim().toLowerCase() === via;

      const mismaFrecuencia =
        (prescripcion.frecuencia || '').trim().toLowerCase() === frecuencia;

      return mismoMedicamento && mismaVia && mismaFrecuencia && !mismoRegistro;
    });
  }

  editarPrescripcion(prescripcion: Prescripcion): void {
    this.formulario = {
      id: prescripcion.id,
      atencionId: prescripcion.atencionId,
      medicamento: prescripcion.medicamento,
      presentacion: prescripcion.presentacion || null,
      dosis: prescripcion.dosis,
      viaAdministracion: prescripcion.viaAdministracion,
      frecuencia: prescripcion.frecuencia,
      duracion: prescripcion.duracion,
      cantidad: prescripcion.cantidad || null,
      indicaciones: prescripcion.indicaciones || null,
      administrarAhora: !!prescripcion.administrarAhora,
      esUrgente: !!prescripcion.esUrgente,
      estado: prescripcion.estado || 'Activa',
      fechaRegistro: prescripcion.fechaRegistro || null
    };

    this.aplicarValoresInicialesFormulario();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.uiMessageService.informacion(
      'Modo edición',
      `Está editando la prescripción de ${prescripcion.medicamento}.`
    );
  }

  cancelarEdicion(): void {
    this.formulario = this.crearFormularioVacio(this.atencionActual?.id || 0);
    this.aplicarValoresInicialesFormulario();
  }

  eliminarPrescripcion(prescripcion: Prescripcion): void {
    if (!prescripcion.id) {
      return;
    }

    if (!this.puedeEliminarPrescripcion(prescripcion)) {
      this.uiMessageService.advertencia(
        'Acción restringida',
        'Solo un usuario administrador puede eliminar prescripciones.'
      );
      return;
    }

    this.uiMessageService.confirmar(
      'Eliminar prescripción',
      `Se eliminará la prescripción de ${prescripcion.medicamento}.`,
      () => {
        this.prescripcionService.eliminarPrescripcion(prescripcion.id!).subscribe({
          next: () => {
            this.registroEliminado.emit();
            this.uiMessageService.exito(
              'Prescripción eliminada',
              'La prescripción fue eliminada correctamente.'
            );

            if (this.formulario.id === prescripcion.id) {
              this.cancelarEdicion();
            }

            this.cargarPrescripciones();
          },
          error: (error: any) => {
            console.error('Error al eliminar prescripción:', error);

            this.uiMessageService.error(
              'Error al eliminar prescripción',
              this.obtenerMensajeError(error)
            );
          }
        });
      },
      'Eliminar',
      'Cancelar'
    );
  }

  puedeEliminarPrescripcion(prescripcion: Prescripcion): boolean {
    if (!prescripcion?.id) {
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

  continuarExamenes(): void {
    if (this.prescripciones.length === 0) {
      this.uiMessageService.confirmar(
        'Continuar sin prescripciones',
        'No se han registrado prescripciones en esta atención. ¿Desea continuar a exámenes de todas formas?',
        () => {
          this.irA('examenes');
        },
        'Continuar',
        'Volver'
      );

      return;
    }

    this.irA('examenes');
  }

  limpiarFormularioPrescripcion(): void {
    this.uiMessageService.confirmar(
      'Limpiar formulario',
      'Esta acción limpiará los datos ingresados en pantalla. No eliminará prescripciones guardadas.',
      () => {
        this.formulario = this.crearFormularioVacio(this.atencionActual?.id || 0);
        this.aplicarValoresInicialesFormulario();

        this.uiMessageService.informacion(
          'Formulario limpio',
          'El formulario de prescripción fue limpiado correctamente.'
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

  obtenerTotalPrescripciones(): number {
    return this.prescripciones.length;
  }

  obtenerTotalUrgentes(): number {
    return this.prescripciones.filter((p) => p.esUrgente).length;
  }

  obtenerTotalAdministrarAhora(): number {
    return this.prescripciones.filter((p) => p.administrarAhora).length;
  }

  obtenerClasePrescripcion(prescripcion: Prescripcion): string {
    if (prescripcion.esUrgente) {
      return 'prescription-urgent';
    }

    if (prescripcion.administrarAhora) {
      return 'prescription-now';
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

  trackByPrescripcion(index: number, prescripcion: Prescripcion): number {
    return prescripcion.id || index;
  }

  trackByMedicamentoFrecuente(index: number, medicamento: MedicamentoFrecuente): string {
    return `${medicamento.medicamento}-${index}`;
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
