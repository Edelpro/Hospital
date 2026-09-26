import { inject } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Atencion } from '../../models/atencion.model';
import { Diagnostico } from '../../models/diagnostico.model';
import { CatalogoItem } from '../../models/catalogo-item.model';
import { DiagnosticoService } from '../../services/diagnostico';
import { CatalogoService } from '../../services/catalogo';
import { UiMessageService } from '../../shared/ui-message.service';
import { cargarPlantillasLocales, guardarPlantillasLocales } from '../../shared/plantillas-locales';

type VistaDestinoDiagnosticos = 'inicio' | 'pacientes' | 'prescripciones' | 'mensajeria';

interface DiagnosticoFrecuente {
  codigo: string;
  descripcion: string;
  grupo: string;
  clase: string;
}

@Component({
  selector: 'app-diagnosticos',
  imports: [CommonModule, FormsModule],
  templateUrl: './diagnosticos.html',
  styleUrl: './diagnosticos.css'
})
export class Diagnosticos implements OnInit, OnChanges {
  get soloLectura(): boolean { return this.atencionActual?.estado === 'Cerrada'; }

  auth = inject(AuthService);

  @Input() atencionActual?: Atencion;

  @Output() diagnosticoGuardado = new EventEmitter<Diagnostico>();
  @Output() registroEliminado = new EventEmitter<void>();
  @Output() irModulo = new EventEmitter<VistaDestinoDiagnosticos>();

  diagnosticos: Diagnostico[] = [];

  cargandoDiagnosticos = false;
  guardandoDiagnostico = false;
  cargandoCatalogos = false;

  tiposDiagnostico: string[] = ['Presuntivo', 'Definitivo'];
  condicionesDiagnostico: string[] = ['Principal', 'Secundario'];

  formulario: Diagnostico = this.crearFormularioVacio(0);
  nombreNuevaPlantilla = '';

  diagnosticosFrecuentes: DiagnosticoFrecuente[] = [
    { codigo: 'R10.0', descripcion: 'Abdomen agudo', grupo: 'Abdomen', clase: 'dx-orange' },
    { codigo: 'R10.4', descripcion: 'Otros dolores abdominales y los no especificados', grupo: 'Abdomen', clase: 'dx-orange' },
    { codigo: 'R07.4', descripcion: 'Dolor en el pecho, no especificado', grupo: 'Cardio', clase: 'dx-red' },
    { codigo: 'R50.9', descripcion: 'Fiebre, no especificada', grupo: 'Infeccioso', clase: 'dx-red' },
    { codigo: 'J06.9', descripcion: 'Infección aguda de las vías respiratorias superiores, no especificada', grupo: 'Respiratorio', clase: 'dx-blue' },
    { codigo: 'J18.9', descripcion: 'Neumonía, no especificada', grupo: 'Respiratorio', clase: 'dx-blue' },
    { codigo: 'N39.0', descripcion: 'Infección de vías urinarias, sitio no especificado', grupo: 'Urinario', clase: 'dx-green' },
    { codigo: 'T14.9', descripcion: 'Traumatismo, no especificado', grupo: 'Trauma', clase: 'dx-yellow' },
    { codigo: 'S82.9', descripcion: 'Fractura de la pierna, parte no especificada', grupo: 'Trauma', clase: 'dx-yellow' },
    { codigo: 'S72.9', descripcion: 'Fractura del fémur, parte no especificada', grupo: 'Trauma', clase: 'dx-yellow' },
    { codigo: 'I10', descripcion: 'Hipertensión esencial primaria', grupo: 'Crónico', clase: 'dx-green' },
    { codigo: 'E11.9', descripcion: 'Diabetes mellitus no insulinodependiente, sin complicaciones', grupo: 'Crónico', clase: 'dx-green' },
    { codigo: 'K35.9', descripcion: 'Apendicitis aguda, no especificada', grupo: 'Quirúrgico', clase: 'dx-red' },
    { codigo: 'K80.2', descripcion: 'Cálculo de la vesícula biliar sin colecistitis', grupo: 'Quirúrgico', clase: 'dx-orange' },
    { codigo: 'A09', descripcion: 'Diarrea y gastroenteritis de presunto origen infeccioso', grupo: 'Digestivo', clase: 'dx-blue' }
  ];

  constructor(
    private diagnosticoService: DiagnosticoService,
    private catalogoService: CatalogoService,
    private uiMessageService: UiMessageService
  ) {}

  ngOnInit(): void {
    this.diagnosticosFrecuentes.push(...cargarPlantillasLocales<DiagnosticoFrecuente>('hcu008-plantillas-diagnosticos'));
    this.cargarCatalogosDiagnosticos();
  }

  crearPlantillaPersonalizada(): void {
    this.normalizarFormulario();
    if (!this.formulario.codigoCie10 || !this.formulario.descripcionCie10) {
      this.uiMessageService.advertencia('Datos requeridos', 'Complete código y descripción antes de crear la plantilla.');
      return;
    }
    const nombre = this.nombreNuevaPlantilla.trim();
    if (!nombre) {
      this.uiMessageService.advertencia('Nombre requerido', 'Escriba un nombre para identificar la plantilla.');
      return;
    }
    const plantilla: DiagnosticoFrecuente = { codigo: this.formulario.codigoCie10, descripcion: this.formulario.descripcionCie10, grupo: nombre, clase: 'dx-green' };
    const guardadas = cargarPlantillasLocales<DiagnosticoFrecuente>('hcu008-plantillas-diagnosticos');
    guardadas.push(plantilla); guardarPlantillasLocales('hcu008-plantillas-diagnosticos', guardadas); this.diagnosticosFrecuentes.push(plantilla);
    this.nombreNuevaPlantilla = '';
    this.uiMessageService.exito('Plantilla creada', 'El diagnóstico quedó disponible en opciones rápidas de este equipo.');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['atencionActual']) {
      const anterior = changes['atencionActual'].previousValue?.id || 0;
      const actual = changes['atencionActual'].currentValue?.id || 0;
      if (anterior === actual) return;
      this.cargarDiagnosticos();
    }
  }

  cargarCatalogosDiagnosticos(): void {
    this.cargandoCatalogos = true;

    this.catalogoService.obtenerActivos().subscribe({
      next: (catalogos: CatalogoItem[]) => {
        this.tiposDiagnostico = this.obtenerNombresPorTipo(catalogos, 'TipoDiagnostico');
        this.condicionesDiagnostico = this.obtenerNombresPorTipo(catalogos, 'CondicionDiagnostico');

        this.aplicarCatalogosRespaldoSiFaltan();
        this.aplicarValoresInicialesFormulario();

        this.cargandoCatalogos = false;
      },
      error: (error: any) => {
        console.error('Error al cargar catálogos de diagnósticos:', error);

        this.aplicarCatalogosRespaldoSiFaltan();
        this.aplicarValoresInicialesFormulario();

        this.cargandoCatalogos = false;

        this.uiMessageService.advertencia(
          'Catálogos no disponibles',
          'No se pudieron cargar tipo y condición diagnóstica desde la base. Se usarán valores básicos.'
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
    if (!this.tiposDiagnostico.length) {
      this.tiposDiagnostico = ['Presuntivo', 'Definitivo'];
    }

    if (!this.condicionesDiagnostico.length) {
      this.condicionesDiagnostico = ['Principal', 'Secundario'];
    }
  }

  aplicarValoresInicialesFormulario(): void {
    if (!this.formulario.tipoDiagnostico || !this.tiposDiagnostico.includes(this.formulario.tipoDiagnostico)) {
      this.formulario.tipoDiagnostico = this.tiposDiagnostico.includes('Presuntivo')
        ? 'Presuntivo'
        : this.tiposDiagnostico[0] || 'Presuntivo';
    }

    if (!this.formulario.condicion || !this.condicionesDiagnostico.includes(this.formulario.condicion)) {
      this.formulario.condicion = this.condicionesDiagnostico.includes('Principal')
        ? 'Principal'
        : this.condicionesDiagnostico[0] || 'Principal';
    }
  }

  irA(modulo: VistaDestinoDiagnosticos): void {
    this.irModulo.emit(modulo);
  }

  crearFormularioVacio(atencionId: number): Diagnostico {
    return {
      atencionId,
      codigoCie10: '',
      descripcionCie10: '',
      tipoDiagnostico: 'Presuntivo',
      condicion: 'Principal',
      observacion: null
    };
  }

  cargarDiagnosticos(): void {
    if (!this.atencionActual?.id) {
      this.diagnosticos = [];
      this.formulario = this.crearFormularioVacio(0);
      this.aplicarValoresInicialesFormulario();
      return;
    }

    this.cargandoDiagnosticos = true;
    this.formulario = this.crearFormularioVacio(this.atencionActual.id);
    this.aplicarValoresInicialesFormulario();

    this.diagnosticoService.obtenerPorAtencion(this.atencionActual.id).subscribe({
      next: (datos: Diagnostico[]) => {
        this.diagnosticos = datos || [];
        this.cargandoDiagnosticos = false;

        if (this.obtenerTotalPrincipales() > 0 && this.condicionesDiagnostico.includes('Secundario')) {
          this.formulario.condicion = 'Secundario';
        }
      },
      error: (error: any) => {
        console.error('Error al cargar diagnósticos:', error);

        this.diagnosticos = [];
        this.cargandoDiagnosticos = false;

        this.uiMessageService.error(
          'Error al cargar diagnósticos',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  seleccionarDiagnosticoFrecuente(item: DiagnosticoFrecuente): void {
    this.formulario.codigoCie10 = item.codigo;
    this.formulario.descripcionCie10 = item.descripcion;

    if (this.obtenerTotalPrincipales() > 0 && this.condicionesDiagnostico.includes('Secundario')) {
      this.formulario.condicion = 'Secundario';
    } else {
      this.formulario.condicion = 'Principal';
    }

    this.formulario.tipoDiagnostico = 'Presuntivo';

    this.formulario.observacion = this.combinarTexto(
      this.formulario.observacion,
      `Diagnóstico seleccionado desde frecuente (${item.grupo}). Correlacionar con clínica, examen físico y evolución.`
    );
  }

  guardarDiagnostico(): void {
    if (this.soloLectura) return;
    if (this.guardandoDiagnostico) {
      return;
    }

    if (!this.atencionActual?.id) {
      this.uiMessageService.advertencia(
        'Atención requerida',
        'Primero debe abrir una atención activa para registrar diagnósticos.'
      );
      return;
    }

    this.normalizarFormulario();

    if (!this.validarDiagnostico()) {
      return;
    }

    this.guardandoDiagnostico = true;

    const diagnosticoParaGuardar: Diagnostico = {
      ...this.formulario,
      atencionId: this.atencionActual.id,
      codigoCie10: this.formulario.codigoCie10.trim().toUpperCase(),
      descripcionCie10: this.formulario.descripcionCie10.trim(),
      tipoDiagnostico: this.formulario.tipoDiagnostico,
      condicion: this.formulario.condicion,
      observacion: this.limpiarTexto(this.formulario.observacion)
    };

    this.diagnosticoService.guardarDiagnostico(diagnosticoParaGuardar).subscribe({
      next: (diagnosticoGuardado: Diagnostico) => {
        this.guardandoDiagnostico = false;

        this.uiMessageService.exito(
          'Diagnóstico guardado',
          'El diagnóstico fue registrado correctamente.'
        );

        this.diagnosticoGuardado.emit(diagnosticoGuardado);

        this.formulario = this.crearFormularioVacio(this.atencionActual?.id || 0);

        if (this.condicionesDiagnostico.includes('Secundario')) {
          this.formulario.condicion = 'Secundario';
        }

        this.cargarDiagnosticos();
      },
      error: (error: any) => {
        console.error('Error al guardar diagnóstico:', error);

        this.guardandoDiagnostico = false;

        this.uiMessageService.error(
          'Error al guardar diagnóstico',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  normalizarFormulario(): void {
    this.formulario.codigoCie10 = (this.formulario.codigoCie10 || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');

    this.formulario.descripcionCie10 = (this.formulario.descripcionCie10 || '').trim();
    this.formulario.tipoDiagnostico = (this.formulario.tipoDiagnostico || '').trim();
    this.formulario.condicion = (this.formulario.condicion || '').trim();
    this.formulario.observacion = this.limpiarTexto(this.formulario.observacion);
  }

  validarDiagnostico(): boolean {
    const codigo = this.formulario.codigoCie10.trim().toUpperCase();
    const descripcion = this.formulario.descripcionCie10.trim();

    if (!codigo) {
      this.uiMessageService.advertencia(
        'Código CIE-10 requerido',
        'Debe registrar el código CIE-10 del diagnóstico.'
      );
      return false;
    }

    if (!this.validarFormatoCie10(codigo)) {
      this.uiMessageService.advertencia(
        'Código CIE-10 no válido',
        'Ingrese un código con formato CIE-10 válido. Ejemplos: R10.0, J18.9, I10, E11.9.'
      );
      return false;
    }

    if (!descripcion || descripcion.length < 4) {
      this.uiMessageService.advertencia(
        'Descripción requerida',
        'Debe registrar una descripción diagnóstica suficiente.'
      );
      return false;
    }

    if (!this.formulario.tipoDiagnostico) {
      this.uiMessageService.advertencia(
        'Tipo requerido',
        'Debe seleccionar si el diagnóstico es presuntivo o definitivo.'
      );
      return false;
    }

    if (!this.formulario.condicion) {
      this.uiMessageService.advertencia(
        'Condición requerida',
        'Debe seleccionar si el diagnóstico es principal o secundario.'
      );
      return false;
    }

    if (this.existeCodigoDuplicado(codigo)) {
      this.uiMessageService.advertencia(
        'Diagnóstico duplicado',
        `El código ${codigo} ya está registrado en esta atención. Puede editar el diagnóstico existente si necesita corregirlo.`
      );
      return false;
    }

    if (this.diagnosticos.length === 0 && this.formulario.condicion !== 'Principal') {
      this.uiMessageService.advertencia(
        'Diagnóstico principal requerido',
        'El primer diagnóstico de la atención debe quedar como Principal.'
      );
      return false;
    }

    if (this.formulario.condicion === 'Principal' && this.existeOtroPrincipal()) {
      this.uiMessageService.advertencia(
        'Ya existe diagnóstico principal',
        'Esta atención ya tiene un diagnóstico principal. Edite el principal existente o registre este diagnóstico como secundario.'
      );
      return false;
    }

    return true;
  }

  validarFormatoCie10(codigo: string): boolean {
    const patronCie10 = /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/;
    return patronCie10.test(codigo);
  }

  existeCodigoDuplicado(codigo: string): boolean {
    return this.diagnosticos.some((diagnostico) => {
      const mismoCodigo = diagnostico.codigoCie10?.trim().toUpperCase() === codigo;
      const mismoRegistro = diagnostico.id && this.formulario.id && diagnostico.id === this.formulario.id;

      return mismoCodigo && !mismoRegistro;
    });
  }

  existeOtroPrincipal(): boolean {
    return this.diagnosticos.some((diagnostico) => {
      const esPrincipal = diagnostico.condicion === 'Principal';
      const mismoRegistro = diagnostico.id && this.formulario.id && diagnostico.id === this.formulario.id;

      return esPrincipal && !mismoRegistro;
    });
  }

  continuarPrescripciones(): void {
    if (!this.puedeContinuarPrescripciones()) {
      this.uiMessageService.advertencia(
        'Diagnóstico principal requerido',
        'Debe registrar al menos un diagnóstico principal antes de continuar a prescripciones.'
      );
      return;
    }

    this.irA('prescripciones');
  }

  puedeContinuarPrescripciones(): boolean {
    return this.obtenerTotalPrincipales() > 0;
  }

  editarDiagnostico(diagnostico: Diagnostico): void {
    this.formulario = {
      id: diagnostico.id,
      atencionId: diagnostico.atencionId,
      codigoCie10: diagnostico.codigoCie10,
      descripcionCie10: diagnostico.descripcionCie10,
      tipoDiagnostico: diagnostico.tipoDiagnostico,
      condicion: diagnostico.condicion,
      observacion: diagnostico.observacion || null,
      fechaRegistro: diagnostico.fechaRegistro || null
    };

    this.aplicarValoresInicialesFormulario();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.uiMessageService.informacion(
      'Modo edición',
      `Está editando el diagnóstico ${diagnostico.codigoCie10}.`
    );
  }

  cancelarEdicion(): void {
    this.formulario = this.crearFormularioVacio(this.atencionActual?.id || 0);

    if (this.obtenerTotalPrincipales() > 0 && this.condicionesDiagnostico.includes('Secundario')) {
      this.formulario.condicion = 'Secundario';
    }

    this.aplicarValoresInicialesFormulario();
  }

  eliminarDiagnostico(diagnostico: Diagnostico): void {
    if (!this.auth.esAdmin()) return;
    if (!diagnostico.id) {
      return;
    }

    const esUnicoPrincipal =
      diagnostico.condicion === 'Principal' &&
      this.obtenerTotalPrincipales() === 1;

    const mensaje = esUnicoPrincipal
      ? `Se eliminará el único diagnóstico principal: ${diagnostico.codigoCie10} - ${diagnostico.descripcionCie10}. Luego deberá registrar otro diagnóstico principal para continuar el flujo clínico.`
      : `Se eliminará el diagnóstico ${diagnostico.codigoCie10} - ${diagnostico.descripcionCie10}.`;

    this.uiMessageService.confirmar(
      'Eliminar diagnóstico',
      mensaje,
      () => {
        this.diagnosticoService.eliminarDiagnostico(diagnostico.id!).subscribe({
          next: () => {
            this.registroEliminado.emit();
            this.uiMessageService.exito(
              'Diagnóstico eliminado',
              'El diagnóstico fue eliminado correctamente.'
            );

            if (this.formulario.id === diagnostico.id) {
              this.cancelarEdicion();
            }

            this.cargarDiagnosticos();
          },
          error: (error: any) => {
            console.error('Error al eliminar diagnóstico:', error);

            this.uiMessageService.error(
              'Error al eliminar diagnóstico',
              this.obtenerMensajeError(error)
            );
          }
        });
      },
      'Eliminar',
      'Cancelar'
    );
  }

  limpiarTexto(valor?: string | null): string | null {
    const texto = (valor || '').trim();
    return texto || null;
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

  obtenerTotalDiagnosticos(): number {
    return this.diagnosticos.length;
  }

  obtenerTotalPrincipales(): number {
    return this.diagnosticos.filter((d) => d.condicion === 'Principal').length;
  }

  obtenerTotalDefinitivos(): number {
    return this.diagnosticos.filter((d) => d.tipoDiagnostico === 'Definitivo').length;
  }

  obtenerClaseTipo(tipo: string): string {
    return tipo === 'Definitivo' ? 'tipo-definitivo' : 'tipo-presuntivo';
  }

  obtenerClaseCondicion(condicion: string): string {
    return condicion === 'Principal' ? 'condicion-principal' : 'condicion-secundario';
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

  trackByDiagnostico(index: number, diagnostico: Diagnostico): number {
    return diagnostico.id || index;
  }

  trackByDiagnosticoFrecuente(index: number, diagnostico: DiagnosticoFrecuente): string {
    return diagnostico.codigo || String(index);
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
