import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { CatalogoItem } from '../../models/catalogo-item.model';
import { CatalogoService } from '../../services/catalogo';
import { UiMessageService } from '../../shared/ui-message.service';

type VistaDestinoAdmin = 'inicio';

@Component({
  selector: 'app-admin-catalogos',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-catalogos.html',
  styleUrl: './admin-catalogos.css'
})
export class AdminCatalogos implements OnInit {
  @Output() irModulo = new EventEmitter<VistaDestinoAdmin>();

  catalogos: CatalogoItem[] = [];
  catalogosFiltrados: CatalogoItem[] = [];

  cargando = false;
  guardando = false;

  filtroTipo = 'Todos';
  busqueda = '';

  modoEdicion = false;

  tiposCatalogo = [
    'MotivoConsulta',
    'Procedencia',
    'CondicionLlegada',
    'PrioridadTriaje',
    'DiscriminadorTriaje',
    'TipoDiagnostico',
    'CondicionDiagnostico',
    'ViaAdministracion',
    'FrecuenciaMedicacion',
    'TipoExamen',
    'PrioridadExamen',
    'EstadoExamen',
    'TipoEvolucion',
    'CondicionPaciente',
    'TipoEgreso',
    'CondicionEgreso',
    'DestinoEgreso'
  ];

  formulario: CatalogoItem = this.obtenerFormularioVacio();

  constructor(
    private catalogoService: CatalogoService,
    private uiMessageService: UiMessageService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  irAInicio(): void {
    this.irModulo.emit('inicio');
  }

  cargarCatalogos(): void {
    this.cargando = true;

    this.catalogoService.obtenerTodos().subscribe({
      next: (datos: CatalogoItem[]) => {
        this.catalogos = datos || [];
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar catálogos:', error);
        this.cargando = false;

        this.uiMessageService.error(
          'Error al cargar catálogos',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  aplicarFiltros(): void {
    const texto = this.busqueda.trim().toLowerCase();

    this.catalogosFiltrados = this.catalogos.filter((item) => {
      const coincideTipo =
        this.filtroTipo === 'Todos' || item.tipo === this.filtroTipo;

      const coincideTexto =
        !texto ||
        item.tipo.toLowerCase().includes(texto) ||
        item.codigo.toLowerCase().includes(texto) ||
        item.nombre.toLowerCase().includes(texto) ||
        (item.descripcion || '').toLowerCase().includes(texto) ||
        this.obtenerNombreTipo(item.tipo).toLowerCase().includes(texto);

      return coincideTipo && coincideTexto;
    });
  }

  nuevoCatalogo(): void {
    this.modoEdicion = false;
    this.formulario = this.obtenerFormularioVacio();
  }

  editarCatalogo(item: CatalogoItem): void {
    this.modoEdicion = true;

    this.formulario = {
      id: item.id,
      tipo: item.tipo,
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      orden: item.orden || 0,
      activo: item.activo,
      esSistema: item.esSistema,
      fechaCreacion: item.fechaCreacion
    };

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  guardarCatalogo(): void {
    if (this.guardando) {
      return;
    }

    const validacion = this.validarFormulario();

    if (validacion) {
      this.uiMessageService.advertencia('Validación', validacion);
      return;
    }

    this.guardando = true;

    const item: CatalogoItem = {
      ...this.formulario,
      tipo: this.formulario.tipo.trim(),
      codigo: this.normalizarCodigo(this.formulario.codigo),
      nombre: this.formulario.nombre.trim(),
      descripcion: this.formulario.descripcion?.trim() || null,
      orden: Number(this.formulario.orden) || 0,
      activo: this.formulario.activo,
      esSistema: this.formulario.esSistema
    };

    let peticion: Observable<any>;

    if (this.modoEdicion) {
      peticion = this.catalogoService.actualizar(item);
    } else {
      peticion = this.catalogoService.crear(item);
    }

    peticion.subscribe({
      next: () => {
        this.guardando = false;

        this.uiMessageService.exito(
          this.modoEdicion ? 'Catálogo actualizado' : 'Catálogo creado',
          'El elemento del catálogo se guardó correctamente.'
        );

        this.nuevoCatalogo();
        this.cargarCatalogos();
      },
      error: (error: any) => {
        console.error('Error al guardar catálogo:', error);
        this.guardando = false;

        this.uiMessageService.error(
          'Error al guardar catálogo',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  cambiarEstado(item: CatalogoItem): void {
    if (!item.id) {
      return;
    }

    const accion: Observable<void> = item.activo
      ? this.catalogoService.desactivar(item.id)
      : this.catalogoService.activar(item.id);

    accion.subscribe({
      next: () => {
        this.uiMessageService.exito(
          item.activo ? 'Catálogo desactivado' : 'Catálogo activado',
          'El estado del elemento fue actualizado.'
        );

        this.cargarCatalogos();
      },
      error: (error: any) => {
        console.error('Error al cambiar estado:', error);

        this.uiMessageService.error(
          'Error al cambiar estado',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  eliminarCatalogo(item: CatalogoItem): void {
    if (!item.id) {
      return;
    }

    this.uiMessageService.confirmar(
      'Eliminar catálogo',
      `¿Seguro que desea eliminar o desactivar "${item.nombre}"?`,
      () => {
        this.catalogoService.eliminar(item.id!).subscribe({
          next: () => {
            this.uiMessageService.exito(
              'Catálogo eliminado',
              'El elemento fue eliminado o desactivado correctamente.'
            );

            this.cargarCatalogos();
          },
          error: (error: any) => {
            console.error('Error al eliminar catálogo:', error);

            this.uiMessageService.error(
              'Error al eliminar catálogo',
              this.obtenerMensajeError(error)
            );
          }
        });
      },
      'Sí, eliminar',
      'Cancelar'
    );
  }

  validarFormulario(): string {
    if (!this.formulario.tipo.trim()) {
      return 'Seleccione el tipo de catálogo.';
    }

    if (!this.formulario.codigo.trim()) {
      return 'Ingrese el código del catálogo.';
    }

    if (this.formulario.codigo.trim().length < 2) {
      return 'El código debe tener al menos 2 caracteres.';
    }

    if (!this.formulario.nombre.trim()) {
      return 'Ingrese el nombre visible.';
    }

    if (this.formulario.nombre.trim().length < 2) {
      return 'El nombre debe tener al menos 2 caracteres.';
    }

    if (this.formulario.orden < 0) {
      return 'El orden no puede ser negativo.';
    }

    const codigoNormalizado = this.normalizarCodigo(this.formulario.codigo);

    const existeDuplicado = this.catalogos.some((item) =>
      item.id !== this.formulario.id &&
      item.tipo === this.formulario.tipo &&
      item.codigo.toUpperCase() === codigoNormalizado
    );

    if (existeDuplicado) {
      return 'Ya existe un catálogo con el mismo tipo y código.';
    }

    return '';
  }

  obtenerFormularioVacio(): CatalogoItem {
    return {
      tipo: 'MotivoConsulta',
      codigo: '',
      nombre: '',
      descripcion: '',
      orden: 0,
      activo: true,
      esSistema: false
    };
  }

  normalizarCodigo(valor?: string | null): string {
    return (valor || '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/Ñ/g, 'N')
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  obtenerTotalActivos(): number {
    return this.catalogos.filter((item) => item.activo).length;
  }

  obtenerTotalInactivos(): number {
    return this.catalogos.filter((item) => !item.activo).length;
  }

  obtenerTiposUsados(): string[] {
    return [...new Set(this.catalogos.map((item) => item.tipo))].sort();
  }

  obtenerNombreTipo(tipo: string): string {
    const nombres: Record<string, string> = {
      MotivoConsulta: 'Motivos de consulta',
      Procedencia: 'Procedencias',
      CondicionLlegada: 'Condiciones de llegada',
      PrioridadTriaje: 'Prioridades de triaje',
      DiscriminadorTriaje: 'Discriminadores de triaje',
      TipoDiagnostico: 'Tipos de diagnóstico',
      CondicionDiagnostico: 'Condiciones de diagnóstico',
      ViaAdministracion: 'Vías de administración',
      FrecuenciaMedicacion: 'Frecuencias de medicación',
      TipoExamen: 'Tipos de examen',
      PrioridadExamen: 'Prioridades de examen',
      EstadoExamen: 'Estados de examen',
      TipoEvolucion: 'Tipos de evolución',
      CondicionPaciente: 'Condiciones del paciente',
      TipoEgreso: 'Tipos de egreso',
      CondicionEgreso: 'Condiciones de egreso',
      DestinoEgreso: 'Destinos de egreso'
    };

    return nombres[tipo] || tipo;
  }

  trackById(index: number, item: CatalogoItem): number {
    return item.id || index;
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
