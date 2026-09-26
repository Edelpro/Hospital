import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Atencion } from '../../models/atencion.model';
import { Triaje as TriajeModel } from '../../models/triaje.model';
import { CatalogoItem } from '../../models/catalogo-item.model';
import { TriajeService } from '../../services/triaje.service';
import { CatalogoService } from '../../services/catalogo';
import { UiMessageService } from '../../shared/ui-message.service';

type VistaDestinoTriaje = 'inicio' | 'pacientes' | 'evaluacion';

@Component({
  selector: 'app-triaje',
  imports: [CommonModule, FormsModule],
  templateUrl: './triaje.html',
  styleUrl: './triaje.css'
})
export class Triaje implements OnInit, OnChanges {
  get soloLectura(): boolean { return this.atencionActual?.estado === 'Cerrada'; }

  @Input() atencionActual?: Atencion;

  @Output() irModulo = new EventEmitter<VistaDestinoTriaje>();
  @Output() triajeGuardado = new EventEmitter<TriajeModel>();

  readonly prioridadesPermitidas: string[] = [
    'Rojo',
    'Naranja',
    'Amarillo',
    'Verde',
    'Azul'
  ];

  prioridadesTriaje: string[] = [
    'Rojo',
    'Naranja',
    'Amarillo',
    'Verde',
    'Azul'
  ];

  discriminadoresTriaje: string[] = [];

  triaje: TriajeModel = this.crearTriajeVacio(0);

  guardandoTriaje = false;
  cargandoCatalogos = false;

  constructor(
    private triajeService: TriajeService,
    private catalogoService: CatalogoService,
    private uiMessageService: UiMessageService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogosTriaje();
    this.cargarDatosTriaje();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['atencionActual']) {
      const anterior = changes['atencionActual'].previousValue?.id || 0;
      const actual = changes['atencionActual'].currentValue?.id || 0;
      if (anterior === actual) return;
      this.cargarDatosTriaje();
    }
  }

  cargarCatalogosTriaje(): void {
    this.cargandoCatalogos = true;

    this.catalogoService.obtenerActivos().subscribe({
      next: (catalogos: CatalogoItem[]) => {
        const prioridadesDesdeBase = this.obtenerNombresPorTipo(catalogos, 'PrioridadTriaje');

        this.prioridadesTriaje = this.filtrarPrioridadesValidas(prioridadesDesdeBase);

        this.discriminadoresTriaje = [
          ...this.obtenerNombresPorTipo(catalogos, 'DiscriminadorTriaje'),
          ...this.obtenerNombresPorTipo(catalogos, 'DiscriminadorClinico')
        ];

        this.discriminadoresTriaje = this.normalizarListaSinDuplicados(this.discriminadoresTriaje);

        this.aplicarCatalogosRespaldoSiFaltan();
        this.aplicarPrioridadInicialSiHaceFalta();

        this.cargandoCatalogos = false;
      },
      error: (error: any) => {
        console.error('Error al cargar catálogos de triaje:', error);

        this.cargarCatalogosRespaldo();
        this.aplicarPrioridadInicialSiHaceFalta();

        this.cargandoCatalogos = false;

        this.uiMessageService.advertencia(
          'Catálogos no disponibles',
          'No se pudieron cargar prioridades o discriminadores desde la base. Se usarán valores básicos de respaldo.'
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

  filtrarPrioridadesValidas(valores: string[]): string[] {
    const prioridades = this.normalizarListaSinDuplicados(valores);

    const prioridadesValidas = prioridades.filter((valor) =>
      this.prioridadesPermitidas.includes(valor)
    );

    return prioridadesValidas.length
      ? prioridadesValidas
      : [...this.prioridadesPermitidas];
  }

  normalizarListaSinDuplicados(valores: string[]): string[] {
    const mapa = new Map<string, string>();

    valores
      .map((valor) => (valor || '').trim())
      .filter((valor) => !!valor)
      .forEach((valor) => {
        const clave = valor.toLowerCase();
        mapa.set(clave, valor);
      });

    return Array.from(mapa.values());
  }

  cargarCatalogosRespaldo(): void {
    this.prioridadesTriaje = [
      'Rojo',
      'Naranja',
      'Amarillo',
      'Verde',
      'Azul'
    ];

    this.discriminadoresTriaje = [
      'Compromiso de vía aérea',
      'Dificultad respiratoria',
      'Dolor abdominal',
      'Dolor torácico',
      'Dolor intenso',
      'Alteración del estado de conciencia',
      'Convulsión activa',
      'Sangrado activo',
      'Trauma mayor',
      'Trauma menor',
      'Fiebre',
      'Sepsis sospechada',
      'Déficit neurológico agudo',
      'Crisis hipertensiva',
      'Hipoglicemia',
      'Hiperglicemia',
      'Reacción alérgica',
      'Intoxicación',
      'Embarazo con dolor o sangrado',
      'Otro'
    ];
  }

  aplicarCatalogosRespaldoSiFaltan(): void {
    this.prioridadesTriaje = this.filtrarPrioridadesValidas(this.prioridadesTriaje);

    if (!this.discriminadoresTriaje.length) {
      this.discriminadoresTriaje = [
        'Compromiso de vía aérea',
        'Dificultad respiratoria',
        'Dolor abdominal',
        'Dolor torácico',
        'Dolor intenso',
        'Alteración del estado de conciencia',
        'Convulsión activa',
        'Sangrado activo',
        'Trauma mayor',
        'Trauma menor',
        'Fiebre',
        'Sepsis sospechada',
        'Déficit neurológico agudo',
        'Crisis hipertensiva',
        'Hipoglicemia',
        'Hiperglicemia',
        'Reacción alérgica',
        'Intoxicación',
        'Embarazo con dolor o sangrado',
        'Otro'
      ];
    }
  }

  aplicarPrioridadInicialSiHaceFalta(): void {
    this.prioridadesTriaje = this.filtrarPrioridadesValidas(this.prioridadesTriaje);

    if (!this.triaje.prioridad) {
      this.triaje.prioridad = 'Verde';
      return;
    }

    if (!this.prioridadesPermitidas.includes(this.triaje.prioridad)) {
      this.triaje.prioridad = 'Verde';
    }
  }

  irA(modulo: VistaDestinoTriaje): void {
    this.irModulo.emit(modulo);
  }

  cargarDatosTriaje(): void {
    if (!this.atencionActual?.id) {
      this.triaje = this.crearTriajeVacio(0);
      return;
    }

    if (this.atencionActual.triaje) {
      this.triaje = {
        ...this.crearTriajeVacio(this.atencionActual.id),
        ...this.atencionActual.triaje
      };

      this.normalizarDolor();
      this.aplicarPrioridadInicialSiHaceFalta();
      return;
    }

    this.triaje = this.crearTriajeVacio(this.atencionActual.id);
    this.aplicarPrioridadInicialSiHaceFalta();
  }

  crearTriajeVacio(atencionId: number): TriajeModel {
    return {
      atencionId,
      prioridad: 'Verde',

      discriminadorClinico: null,
      discriminadorClinicoOtro: null,
      escalaDolor: 0,

      frecuenciaCardiaca: null,
      frecuenciaRespiratoria: null,
      temperatura: null,
      saturacionOxigeno: null,
      glicemiaCapilar: null,

      presionSistolica: null,
      presionDiastolica: null,
      presionArterialMedia: null,
      presionPulso: null,

      glasgowOcular: null,
      glasgowVerbal: null,
      glasgowMotora: null,
      glasgow: null,

      llenadoCapilar: null,
      pupilas: null,

      peso: null,
      talla: null,
      indiceMasaCorporal: null,

      oxigenoSuplementario: false,
      flujoOxigeno: null,

      alergiaConocida: false,
      alergiaDescripcion: null,

      riesgoCaida: false,

      aislamiento: false,
      tipoAislamiento: null
    };
  }

  seleccionarPrioridad(prioridad: string): void {
    if (!this.prioridadesPermitidas.includes(prioridad)) {
      this.uiMessageService.advertencia(
        'Prioridad no válida',
        'La prioridad de triaje solo puede ser Rojo, Naranja, Amarillo, Verde o Azul.'
      );

      return;
    }

    this.triaje.prioridad = prioridad;
  }

  obtenerClasePrioridadBoton(prioridad: string): string {
    const prioridadNormalizada = prioridad
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (prioridadNormalizada === 'rojo') return 'rojo';
    if (prioridadNormalizada === 'naranja') return 'naranja';
    if (prioridadNormalizada === 'amarillo') return 'amarillo';
    if (prioridadNormalizada === 'verde') return 'verde';
    if (prioridadNormalizada === 'azul') return 'azul';

    return 'verde';
  }

  actualizarDiscriminadorClinico(): void {
    if (this.triaje.discriminadorClinico !== 'Otro') {
      this.triaje.discriminadorClinicoOtro = null;
    }
  }

  actualizarDolor(valor: any): void {
    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      this.triaje.escalaDolor = 0;
      return;
    }

    this.triaje.escalaDolor = numero;
    this.normalizarDolor();
  }

  normalizarDolor(): void {
    if (this.triaje.escalaDolor === null || this.triaje.escalaDolor === undefined) {
      this.triaje.escalaDolor = 0;
      return;
    }

    const numero = Number(this.triaje.escalaDolor);

    if (Number.isNaN(numero)) {
      this.triaje.escalaDolor = 0;
      return;
    }

    if (numero < 0) {
      this.triaje.escalaDolor = 0;
      return;
    }

    if (numero > 10) {
      this.triaje.escalaDolor = 10;
      return;
    }

    this.triaje.escalaDolor = numero;
  }

  obtenerFondoDolor(): string {
    const dolor = Number(this.triaje.escalaDolor ?? 0);
    const valor = Math.max(0, Math.min(10, dolor));
    const porcentaje = valor * 10;

    let color = '#16a34a';

    if (valor >= 7) {
      color = '#dc2626';
    } else if (valor >= 4) {
      color = '#f97316';
    } else if (valor >= 1) {
      color = '#eab308';
    }

    return `linear-gradient(90deg, ${color} 0%, ${color} ${porcentaje}%, #e5e7eb ${porcentaje}%, #e5e7eb 100%)`;
  }

  guardarTriaje(): void {
    if (this.soloLectura) return;
    if (this.guardandoTriaje) {
      return;
    }

    if (!this.atencionActual?.id) {
      this.uiMessageService.advertencia(
        'Atención requerida',
        'No existe una atención activa para registrar el triaje.'
      );
      return;
    }

    this.normalizarDolor();
    this.aplicarPrioridadInicialSiHaceFalta();

    if (!this.validarFormularioTriaje()) {
      return;
    }

    this.guardandoTriaje = true;

    const triajeParaGuardar: TriajeModel = {
      ...this.triaje,
      atencionId: this.atencionActual.id,

      prioridad: this.triaje.prioridad,

      discriminadorClinico: this.triaje.discriminadorClinico || null,

      discriminadorClinicoOtro:
        this.triaje.discriminadorClinico === 'Otro'
          ? (this.triaje.discriminadorClinicoOtro || '').trim()
          : null,

      llenadoCapilar: this.triaje.llenadoCapilar || null,
      pupilas: this.triaje.pupilas || null,

      glasgow: this.calcularGlasgow(),
      presionArterialMedia: this.calcularPresionArterialMedia(),
      presionPulso: this.calcularPresionPulso(),
      indiceMasaCorporal: this.calcularIndiceMasaCorporal(),

      flujoOxigeno: this.triaje.oxigenoSuplementario
        ? this.triaje.flujoOxigeno
        : null,

      alergiaDescripcion: this.triaje.alergiaConocida
        ? (this.triaje.alergiaDescripcion || '').trim()
        : null,

      tipoAislamiento: this.triaje.aislamiento
        ? (this.triaje.tipoAislamiento || '').trim()
        : null
    };

    this.triajeService.guardarTriaje(triajeParaGuardar).subscribe({
      next: (triajeGuardado: TriajeModel) => {
        this.guardandoTriaje = false;

        this.triaje = {
          ...this.crearTriajeVacio(this.atencionActual?.id || 0),
          ...triajeGuardado
        };

        this.normalizarDolor();

        this.uiMessageService.exito(
          'Triaje guardado',
          'El triaje fue registrado correctamente. Continuamos con evaluación médica.'
        );

        this.triajeGuardado.emit(triajeGuardado);
        this.irA('evaluacion');
      },
      error: (error: any) => {
        console.error('Error al guardar triaje:', error);

        this.guardandoTriaje = false;

        this.uiMessageService.error(
          'Error al guardar triaje',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  validarFormularioTriaje(): boolean {
    if (!this.triaje.prioridad) {
      this.uiMessageService.advertencia(
        'Prioridad requerida',
        'Debe seleccionar una prioridad de triaje.'
      );
      return false;
    }

    if (!this.prioridadesPermitidas.includes(this.triaje.prioridad)) {
      this.uiMessageService.advertencia(
        'Prioridad no válida',
        'La prioridad debe ser Rojo, Naranja, Amarillo, Verde o Azul.'
      );
      return false;
    }

    if (
      this.triaje.discriminadorClinico === 'Otro' &&
      !this.triaje.discriminadorClinicoOtro?.trim()
    ) {
      this.uiMessageService.advertencia(
        'Discriminador requerido',
        'Debe especificar el discriminador clínico.'
      );
      return false;
    }

    if (!this.validarRango(this.triaje.escalaDolor, 0, 10)) {
      this.uiMessageService.advertencia(
        'Dolor no válido',
        'La escala de dolor debe estar entre 0 y 10.'
      );
      return false;
    }

    if (
      this.tieneValor(this.triaje.frecuenciaCardiaca) &&
      !this.validarRango(this.triaje.frecuenciaCardiaca, 1, 300)
    ) {
      this.uiMessageService.advertencia(
        'Frecuencia cardíaca no válida',
        'La frecuencia cardíaca debe estar entre 1 y 300 latidos por minuto.'
      );
      return false;
    }

    if (
      this.tieneValor(this.triaje.frecuenciaRespiratoria) &&
      !this.validarRango(this.triaje.frecuenciaRespiratoria, 1, 100)
    ) {
      this.uiMessageService.advertencia(
        'Frecuencia respiratoria no válida',
        'La frecuencia respiratoria debe estar entre 1 y 100 respiraciones por minuto.'
      );
      return false;
    }

    if (
      this.tieneValor(this.triaje.temperatura) &&
      !this.validarRango(this.triaje.temperatura, 25, 45)
    ) {
      this.uiMessageService.advertencia(
        'Temperatura no válida',
        'La temperatura debe estar entre 25 y 45 grados Celsius.'
      );
      return false;
    }

    if (
      this.tieneValor(this.triaje.saturacionOxigeno) &&
      !this.validarRango(this.triaje.saturacionOxigeno, 1, 100)
    ) {
      this.uiMessageService.advertencia(
        'Saturación no válida',
        'La saturación de oxígeno debe estar entre 1 y 100 por ciento.'
      );
      return false;
    }

    if (
      this.tieneValor(this.triaje.glicemiaCapilar) &&
      !this.validarRango(this.triaje.glicemiaCapilar, 1, 1000)
    ) {
      this.uiMessageService.advertencia(
        'Glicemia no válida',
        'La glicemia capilar debe estar entre 1 y 1000 miligramos por decilitro.'
      );
      return false;
    }

    if (
      this.tieneValor(this.triaje.presionSistolica) &&
      !this.validarRango(this.triaje.presionSistolica, 30, 300)
    ) {
      this.uiMessageService.advertencia(
        'Presión sistólica no válida',
        'La presión sistólica debe estar entre 30 y 300 milímetros de mercurio.'
      );
      return false;
    }

    if (
      this.tieneValor(this.triaje.presionDiastolica) &&
      !this.validarRango(this.triaje.presionDiastolica, 20, 200)
    ) {
      this.uiMessageService.advertencia(
        'Presión diastólica no válida',
        'La presión diastólica debe estar entre 20 y 200 milímetros de mercurio.'
      );
      return false;
    }

    if (
      this.tieneValor(this.triaje.presionSistolica) &&
      this.tieneValor(this.triaje.presionDiastolica) &&
      Number(this.triaje.presionSistolica) < Number(this.triaje.presionDiastolica)
    ) {
      this.uiMessageService.advertencia(
        'Presión arterial no válida',
        'La presión sistólica no puede ser menor que la presión diastólica.'
      );
      return false;
    }

    if (
      this.tieneValor(this.triaje.glasgowOcular) &&
      !this.validarRango(this.triaje.glasgowOcular, 1, 4)
    ) {
      this.uiMessageService.advertencia(
        'Glasgow ocular no válido',
        'La apertura ocular debe estar entre 1 y 4.'
      );
      return false;
    }

    if (
      this.tieneValor(this.triaje.glasgowVerbal) &&
      !this.validarRango(this.triaje.glasgowVerbal, 1, 5)
    ) {
      this.uiMessageService.advertencia(
        'Glasgow verbal no válido',
        'La respuesta verbal debe estar entre 1 y 5.'
      );
      return false;
    }

    if (
      this.tieneValor(this.triaje.glasgowMotora) &&
      !this.validarRango(this.triaje.glasgowMotora, 1, 6)
    ) {
      this.uiMessageService.advertencia(
        'Glasgow motor no válido',
        'La respuesta motora debe estar entre 1 y 6.'
      );
      return false;
    }

    if (
      this.tieneValor(this.triaje.peso) &&
      !this.validarRango(this.triaje.peso, 1, 400)
    ) {
      this.uiMessageService.advertencia(
        'Peso no válido',
        'El peso debe estar entre 1 y 400 kilogramos.'
      );
      return false;
    }

    if (
      this.tieneValor(this.triaje.talla) &&
      !this.validarRango(this.triaje.talla, 30, 250)
    ) {
      this.uiMessageService.advertencia(
        'Talla no válida',
        'La talla debe registrarse en centímetros. Ejemplo: 106 para 1,06 metros o 170 para 1,70 metros.'
      );
      return false;
    }

    if (
      this.triaje.oxigenoSuplementario &&
      !this.tieneValor(this.triaje.flujoOxigeno)
    ) {
      this.uiMessageService.advertencia(
        'Flujo de oxígeno requerido',
        'Debe ingresar el flujo de oxígeno suplementario.'
      );
      return false;
    }

    if (
      this.triaje.oxigenoSuplementario &&
      !this.validarRango(this.triaje.flujoOxigeno, 0.5, 60)
    ) {
      this.uiMessageService.advertencia(
        'Flujo de oxígeno no válido',
        'El flujo de oxígeno debe estar entre 0,5 y 60 litros por minuto.'
      );
      return false;
    }

    if (
      this.triaje.alergiaConocida &&
      !this.triaje.alergiaDescripcion?.trim()
    ) {
      this.uiMessageService.advertencia(
        'Alergia requerida',
        'Debe especificar la alergia conocida.'
      );
      return false;
    }

    if (
      this.triaje.aislamiento &&
      !this.triaje.tipoAislamiento?.trim()
    ) {
      this.uiMessageService.advertencia(
        'Aislamiento requerido',
        'Debe especificar el tipo de aislamiento.'
      );
      return false;
    }

    return true;
  }

  limpiarDatosTriaje(): void {
    if (!this.atencionActual?.id) {
      this.uiMessageService.advertencia(
        'Atención requerida',
        'No existe una atención activa para limpiar.'
      );
      return;
    }

    this.uiMessageService.confirmar(
      'Limpiar datos del triaje',
      'Esta acción limpiará los datos del formulario en pantalla. No eliminará automáticamente el triaje guardado en la base de datos.',
      () => {
        this.triaje = this.crearTriajeVacio(this.atencionActual!.id!);

        this.uiMessageService.informacion(
          'Formulario limpio',
          'Los datos del formulario de triaje fueron limpiados.'
        );
      },
      'Limpiar datos',
      'Cancelar'
    );
  }

  tieneValor(valor: any): boolean {
    return valor !== null && valor !== undefined && valor !== '';
  }

  validarRango(valor: any, minimo: number, maximo: number): boolean {
    if (!this.tieneValor(valor)) {
      return true;
    }

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return false;
    }

    return numero >= minimo && numero <= maximo;
  }

  calcularGlasgow(): number | null {
    const ocular = this.triaje.glasgowOcular;
    const verbal = this.triaje.glasgowVerbal;
    const motora = this.triaje.glasgowMotora;

    if (ocular === null || ocular === undefined) return null;
    if (verbal === null || verbal === undefined) return null;
    if (motora === null || motora === undefined) return null;

    return Number(ocular) + Number(verbal) + Number(motora);
  }

  calcularPresionArterialMedia(): number | null {
    const sistolica = this.triaje.presionSistolica;
    const diastolica = this.triaje.presionDiastolica;

    if (
      sistolica === null ||
      sistolica === undefined ||
      diastolica === null ||
      diastolica === undefined
    ) {
      return null;
    }

    const sistolicaNumero = Number(sistolica);
    const diastolicaNumero = Number(diastolica);

    if (
      Number.isNaN(sistolicaNumero) ||
      Number.isNaN(diastolicaNumero) ||
      sistolicaNumero <= 0 ||
      diastolicaNumero <= 0
    ) {
      return null;
    }

    const resultado = diastolicaNumero + ((sistolicaNumero - diastolicaNumero) / 3);

    return Math.round(resultado * 10) / 10;
  }

  calcularPresionPulso(): number | null {
    const sistolica = this.triaje.presionSistolica;
    const diastolica = this.triaje.presionDiastolica;

    if (
      sistolica === null ||
      sistolica === undefined ||
      diastolica === null ||
      diastolica === undefined
    ) {
      return null;
    }

    const sistolicaNumero = Number(sistolica);
    const diastolicaNumero = Number(diastolica);

    if (
      Number.isNaN(sistolicaNumero) ||
      Number.isNaN(diastolicaNumero) ||
      sistolicaNumero <= 0 ||
      diastolicaNumero <= 0
    ) {
      return null;
    }

    return Math.round((sistolicaNumero - diastolicaNumero) * 10) / 10;
  }

  calcularIndiceMasaCorporal(): number | null {
    const peso = this.triaje.peso;
    const talla = this.triaje.talla;

    if (
      peso === null ||
      peso === undefined ||
      talla === null ||
      talla === undefined
    ) {
      return null;
    }

    const pesoNumero = Number(peso);
    const tallaNumero = Number(talla);

    if (
      Number.isNaN(pesoNumero) ||
      Number.isNaN(tallaNumero) ||
      pesoNumero <= 0 ||
      tallaNumero <= 0
    ) {
      return null;
    }

    if (tallaNumero < 30 || tallaNumero > 250) {
      return null;
    }

    const tallaEnMetros = tallaNumero / 100;
    const resultado = pesoNumero / (tallaEnMetros * tallaEnMetros);

    return Math.round(resultado * 10) / 10;
  }

  obtenerEstadoPresionArterial(): string {
    const sistolica = this.triaje.presionSistolica;
    const diastolica = this.triaje.presionDiastolica;

    if (
      sistolica === null ||
      sistolica === undefined ||
      diastolica === null ||
      diastolica === undefined
    ) {
      return 'No registrada';
    }

    const sistolicaNumero = Number(sistolica);
    const diastolicaNumero = Number(diastolica);

    if (
      Number.isNaN(sistolicaNumero) ||
      Number.isNaN(diastolicaNumero) ||
      sistolicaNumero <= 0 ||
      diastolicaNumero <= 0
    ) {
      return 'No registrada';
    }

    if (sistolicaNumero >= 180 || diastolicaNumero >= 120) {
      return 'Crítica';
    }

    if (sistolicaNumero >= 140 || diastolicaNumero >= 90) {
      return 'Alta';
    }

    return 'Normal';
  }

  obtenerEstadoFrecuenciaCardiaca(): string {
    const frecuencia = this.triaje.frecuenciaCardiaca;

    if (
      frecuencia === null ||
      frecuencia === undefined ||
      Number(frecuencia) <= 0
    ) {
      return 'No registrada';
    }

    const valor = Number(frecuencia);

    if (valor < 50) return 'Baja';
    if (valor > 120) return 'Muy alta';
    if (valor > 100) return 'Alta';

    return 'Normal';
  }

  obtenerEstadoFrecuenciaRespiratoria(): string {
    const frecuencia = this.triaje.frecuenciaRespiratoria;

    if (
      frecuencia === null ||
      frecuencia === undefined ||
      Number(frecuencia) <= 0
    ) {
      return 'No registrada';
    }

    const valor = Number(frecuencia);

    if (valor < 10) return 'Baja';
    if (valor > 30) return 'Muy alta';
    if (valor > 20) return 'Alta';

    return 'Normal';
  }

  obtenerEstadoTemperatura(): string {
    const temperatura = this.triaje.temperatura;

    if (
      temperatura === null ||
      temperatura === undefined ||
      Number(temperatura) <= 0
    ) {
      return 'No registrada';
    }

    const valor = Number(temperatura);

    if (valor < 35) return 'Hipotermia';
    if (valor >= 39) return 'Fiebre alta';
    if (valor >= 38) return 'Fiebre';

    return 'Normal';
  }

  obtenerEstadoSaturacion(): string {
    const saturacion = this.triaje.saturacionOxigeno;

    if (
      saturacion === null ||
      saturacion === undefined ||
      Number(saturacion) <= 0
    ) {
      return 'No registrada';
    }

    const valor = Number(saturacion);

    if (valor < 90) return 'Crítica';
    if (valor < 94) return 'Baja';

    return 'Normal';
  }

  obtenerEstadoGlasgow(): string {
    const glasgow = this.calcularGlasgow();

    if (glasgow === null) return 'No registrado';
    if (glasgow < 8) return 'Grave';
    if (glasgow < 15) return 'Alterado';

    return 'Normal';
  }

  obtenerClaseAlerta(valor: string): string {
    switch (valor) {
      case 'Crítica':
      case 'Muy alta':
      case 'Grave':
      case 'Alterado':
      case 'Baja':
      case 'Alta':
      case 'Hipotermia':
      case 'Fiebre alta':
      case 'Fiebre':
        return 'dato-alerta';

      case 'No registrada':
      case 'No registrado':
        return 'dato-pendiente';

      default:
        return 'dato-normal';
    }
  }

  obtenerClaseRiesgoPrioridad(): string {
    switch (this.triaje.prioridad) {
      case 'Rojo':
        return 'risk-rojo';

      case 'Naranja':
        return 'risk-naranja';

      case 'Amarillo':
        return 'risk-amarillo';

      case 'Verde':
        return 'risk-verde';

      case 'Azul':
        return 'risk-azul';

      default:
        return 'risk-verde';
    }
  }

  obtenerResumenRiesgo(): string {
    if (this.triaje.prioridad === 'Rojo') {
      return 'Riesgo vital o atención inmediata';
    }

    if (this.triaje.prioridad === 'Naranja') {
      return 'Riesgo alto';
    }

    if (this.triaje.prioridad === 'Amarillo') {
      return 'Riesgo moderado';
    }

    if (this.triaje.prioridad === 'Verde') {
      return 'Riesgo bajo';
    }

    if (this.triaje.prioridad === 'Azul') {
      return 'Riesgo mínimo';
    }

    return 'Sin prioridad definida';
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
