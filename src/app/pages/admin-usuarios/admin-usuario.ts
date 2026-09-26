import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  UsuarioSistema,
  UsuarioCrearRequest,
  UsuarioActualizarRequest
} from '../../models/usuario-sistema.model';

import {
  SolicitudAcceso,
  SolicitudAccesoAprobarRequest
} from '../../models/solicitud-acceso.model';

import { UsuarioService } from '../../services/usuario';
import { SolicitudAccesoService } from '../../services/solicitud-acceso';
import { UiMessageService } from '../../shared/ui-message.service';

type VistaDestinoAdminUsuarios = 'inicio' | 'admin-catalogos';

interface DatosAprobacionSolicitud {
  apellidos: string;
  rol: string;
  claveInicial: string;
  observacion: string;
}

@Component({
  selector: 'app-admin-usuarios',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-usuarios.html',
  styleUrl: './admin-usuarios.css'
})
export class AdminUsuarios implements OnInit {
  @Output() irModulo = new EventEmitter<VistaDestinoAdminUsuarios>();

  usuarios: UsuarioSistema[] = [];
  usuariosFiltrados: UsuarioSistema[] = [];

  solicitudes: SolicitudAcceso[] = [];
  solicitudesPendientes: SolicitudAcceso[] = [];

  cargando = false;
  cargandoSolicitudes = false;
  guardando = false;
  procesandoSolicitud = false;

  textoBusqueda = '';
  modoEdicion = false;
  usuarioEditandoId?: number;

  roles: string[] = ['Doctor', 'Admin'];

  formulario: UsuarioCrearRequest = this.crearFormularioVacio();

  clavesPorUsuario: Record<number, string> = {};
  datosAprobacion: Record<number, DatosAprobacionSolicitud> = {};

  constructor(
    private usuarioService: UsuarioService,
    private solicitudAccesoService: SolicitudAccesoService,
    private uiMessageService: UiMessageService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarSolicitudes();
  }

  crearFormularioVacio(): UsuarioCrearRequest {
    return {
      nombres: '',
      apellidos: '',
      correo: '',
      clave: '',
      rol: 'Doctor'
    };
  }

  cargarUsuarios(): void {
    this.cargando = true;

    this.usuarioService.obtenerUsuarios().subscribe({
      next: (datos: UsuarioSistema[]) => {
        this.usuarios = datos || [];
        this.aplicarFiltro();
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar usuarios:', error);
        this.cargando = false;

        this.uiMessageService.error(
          'Error al cargar usuarios',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  cargarSolicitudes(): void {
    this.cargandoSolicitudes = true;

    this.solicitudAccesoService.obtenerSolicitudes().subscribe({
      next: (datos: SolicitudAcceso[]) => {
        this.solicitudes = datos || [];

        this.solicitudesPendientes = this.solicitudes.filter(
          (s) => (s.estado || '').trim().toLowerCase() === 'pendiente'
        );

        this.inicializarDatosAprobacion();

        this.cargandoSolicitudes = false;
      },
      error: (error: any) => {
        console.error('Error al cargar solicitudes:', error);
        this.cargandoSolicitudes = false;

        this.uiMessageService.error(
          'Error al cargar solicitudes',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  inicializarDatosAprobacion(): void {
    this.solicitudesPendientes.forEach((solicitud) => {
      const id = solicitud.id || 0;

      if (!id) {
        return;
      }

      if (!this.datosAprobacion[id]) {
        this.datosAprobacion[id] = {
          apellidos: this.obtenerApellidoSugerido(solicitud.nombres),
          rol: 'Doctor',
          claveInicial: '',
          observacion: ''
        };
      }
    });
  }

  obtenerApellidoSugerido(nombresCompletos: string): string {
    const partes = (nombresCompletos || '').trim().split(' ').filter(Boolean);

    if (partes.length >= 2) {
      return partes.slice(-1).join(' ');
    }

    return '';
  }

  aplicarFiltro(): void {
    const texto = this.textoBusqueda.trim().toLowerCase();

    if (!texto) {
      this.usuariosFiltrados = [...this.usuarios];
      return;
    }

    this.usuariosFiltrados = this.usuarios.filter((usuario) => {
      const nombres = (usuario.nombres || '').toLowerCase();
      const apellidos = (usuario.apellidos || '').toLowerCase();
      const correo = (usuario.correo || '').toLowerCase();
      const rol = (usuario.rol || '').toLowerCase();

      return (
        nombres.includes(texto) ||
        apellidos.includes(texto) ||
        correo.includes(texto) ||
        rol.includes(texto)
      );
    });
  }

  guardarUsuario(): void {
    this.normalizarFormulario();

    if (!this.validarFormulario()) {
      return;
    }

    if (this.guardando) {
      return;
    }

    this.guardando = true;

    if (this.modoEdicion && this.usuarioEditandoId) {
      const usuarioActual = this.usuarios.find(u => u.id === this.usuarioEditandoId);

      const request: UsuarioActualizarRequest = {
        nombres: this.formulario.nombres,
        apellidos: this.formulario.apellidos,
        rol: this.formulario.rol,
        activo: usuarioActual?.activo ?? true
      };

      this.usuarioService.actualizarUsuario(this.usuarioEditandoId, request).subscribe({
        next: () => {
          this.guardando = false;

          this.uiMessageService.exito(
            'Usuario actualizado',
            'Los datos del usuario fueron actualizados correctamente.'
          );

          this.limpiarFormularioDirecto();
          this.cargarUsuarios();
        },
        error: (error: any) => {
          console.error('Error al actualizar usuario:', error);
          this.guardando = false;

          this.uiMessageService.error(
            'Error al actualizar usuario',
            this.obtenerMensajeError(error)
          );
        }
      });

      return;
    }

    this.usuarioService.crearUsuario(this.formulario).subscribe({
      next: () => {
        this.guardando = false;

        this.uiMessageService.exito(
          'Usuario creado',
          'El usuario fue creado correctamente y queda activo para iniciar sesión.'
        );

        this.limpiarFormularioDirecto();
        this.cargarUsuarios();
      },
      error: (error: any) => {
        console.error('Error al crear usuario:', error);
        this.guardando = false;

        this.uiMessageService.error(
          'Error al crear usuario',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  aprobarSolicitud(solicitud: SolicitudAcceso): void {
    if (this.procesandoSolicitud) return;
    const id = solicitud.id || 0;

    if (!id) {
      return;
    }

    const datos = this.datosAprobacion[id];

    if (!datos) {
      this.uiMessageService.advertencia(
        'Datos requeridos',
        'Complete los datos para aprobar la solicitud.'
      );
      return;
    }

    datos.apellidos = (datos.apellidos || '').trim();
    datos.rol = (datos.rol || 'Doctor').trim();
    datos.claveInicial = (datos.claveInicial || '').trim();

    if (!datos.apellidos || datos.apellidos.length < 2) {
      this.uiMessageService.advertencia(
        'Apellidos requeridos',
        'Ingrese los apellidos del usuario antes de aprobar.'
      );
      return;
    }

    if (!datos.claveInicial || datos.claveInicial.length < 6) {
      this.uiMessageService.advertencia(
        'Clave requerida',
        'La clave inicial debe tener al menos 6 caracteres.'
      );
      return;
    }

    const request: SolicitudAccesoAprobarRequest = {
      apellidos: datos.apellidos,
      rol: datos.rol,
      claveInicial: datos.claveInicial
    };

    this.procesandoSolicitud = true;

    this.solicitudAccesoService.aprobarSolicitud(id, request).subscribe({
      next: () => {
        this.procesandoSolicitud = false;

        this.uiMessageService.exito(
          'Solicitud aprobada',
          'El usuario fue creado y activado correctamente.'
        );

        delete this.datosAprobacion[id];

        this.cargarSolicitudes();
        this.cargarUsuarios();
      },
      error: (error: any) => {
        console.error('Error al aprobar solicitud:', error);
        this.procesandoSolicitud = false;

        this.uiMessageService.error(
          'Error al aprobar solicitud',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  rechazarSolicitud(solicitud: SolicitudAcceso): void {
    const id = solicitud.id || 0;

    if (!id) {
      return;
    }

    const datos = this.datosAprobacion[id];

    const observacion = (datos?.observacion || 'Solicitud rechazada por el administrador.').trim();

    this.uiMessageService.confirmar(
      'Rechazar solicitud',
      `Se rechazará la solicitud de ${solicitud.nombres}.`,
      () => {
        this.procesandoSolicitud = true;

        this.solicitudAccesoService.rechazarSolicitud(id, observacion).subscribe({
          next: () => {
            this.procesandoSolicitud = false;

            this.uiMessageService.exito(
              'Solicitud rechazada',
              'La solicitud fue rechazada correctamente.'
            );

            delete this.datosAprobacion[id];

            this.cargarSolicitudes();
          },
          error: (error: any) => {
            console.error('Error al rechazar solicitud:', error);
            this.procesandoSolicitud = false;

            this.uiMessageService.error(
              'Error al rechazar solicitud',
              this.obtenerMensajeError(error)
            );
          }
        });
      },
      'Rechazar',
      'Cancelar'
    );
  }

  editarUsuario(usuario: UsuarioSistema): void {
    if (!usuario.id) {
      return;
    }

    this.modoEdicion = true;
    this.usuarioEditandoId = usuario.id;

    this.formulario = {
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      clave: '',
      rol: usuario.rol
    };

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  activarUsuario(usuario: UsuarioSistema): void {
    if (!usuario.id) {
      return;
    }

    this.usuarioService.activarUsuario(usuario.id).subscribe({
      next: () => {
        this.uiMessageService.exito(
          'Usuario activado',
          'El usuario ya puede iniciar sesión.'
        );

        this.cargarUsuarios();
      },
      error: (error: any) => {
        this.uiMessageService.error(
          'Error al activar usuario',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  desactivarUsuario(usuario: UsuarioSistema): void {
    if (!usuario.id) {
      return;
    }

    this.uiMessageService.confirmar(
      'Desactivar usuario',
      `El usuario ${usuario.nombres} ${usuario.apellidos} no podrá iniciar sesión.`,
      () => {
        this.usuarioService.desactivarUsuario(usuario.id!).subscribe({
          next: () => {
            this.uiMessageService.exito(
              'Usuario desactivado',
              'El usuario fue desactivado correctamente.'
            );

            this.cargarUsuarios();
          },
          error: (error: any) => {
            this.uiMessageService.error(
              'Error al desactivar usuario',
              this.obtenerMensajeError(error)
            );
          }
        });
      },
      'Desactivar',
      'Cancelar'
    );
  }

  cambiarClaveUsuario(usuario: UsuarioSistema): void {
    if (!usuario.id) {
      return;
    }

    const clave = (this.clavesPorUsuario[usuario.id] || '').trim();

    if (!clave || clave.length < 6) {
      this.uiMessageService.advertencia(
        'Contraseña no válida',
        'La nueva contraseña debe tener al menos 6 caracteres.'
      );
      return;
    }

    this.usuarioService.cambiarClave(usuario.id, clave).subscribe({
      next: () => {
        this.clavesPorUsuario[usuario.id!] = '';

        this.uiMessageService.exito(
          'Contraseña actualizada',
          'La contraseña del usuario fue actualizada correctamente.'
        );
      },
      error: (error: any) => {
        this.uiMessageService.error(
          'Error al cambiar contraseña',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  limpiarFormulario(): void {
    this.uiMessageService.confirmar(
      'Limpiar formulario',
      'Se limpiarán los datos ingresados en pantalla.',
      () => {
        this.limpiarFormularioDirecto();
      },
      'Limpiar',
      'Cancelar'
    );
  }

  limpiarFormularioDirecto(): void {
    this.formulario = this.crearFormularioVacio();
    this.modoEdicion = false;
    this.usuarioEditandoId = undefined;
  }

  recargarTodo(): void {
    this.cargarUsuarios();
    this.cargarSolicitudes();
  }

  normalizarFormulario(): void {
    this.formulario.nombres = (this.formulario.nombres || '').trim().replace(/\s+/g, ' ');
    this.formulario.apellidos = (this.formulario.apellidos || '').trim().replace(/\s+/g, ' ');
    const sufijoApellido = ` ${this.formulario.apellidos.toLocaleLowerCase()}`;
    if (this.formulario.apellidos && this.formulario.nombres.toLocaleLowerCase().endsWith(sufijoApellido)) {
      this.formulario.nombres = this.formulario.nombres.slice(0, -sufijoApellido.length).trim();
    }
    this.formulario.correo = (this.formulario.correo || '').trim().toLowerCase();
    this.formulario.clave = (this.formulario.clave || '').trim();
    this.formulario.rol = (this.formulario.rol || 'Doctor').trim();
  }

  validarFormulario(): boolean {
    if (!this.formulario.nombres || this.formulario.nombres.length < 2) {
      this.uiMessageService.advertencia(
        'Nombres requeridos',
        'Ingrese los nombres del usuario.'
      );
      return false;
    }

    if (!this.formulario.apellidos || this.formulario.apellidos.length < 2) {
      this.uiMessageService.advertencia(
        'Apellidos requeridos',
        'Ingrese los apellidos del usuario.'
      );
      return false;
    }

    if (!this.formulario.correo || !this.formulario.correo.includes('@')) {
      this.uiMessageService.advertencia(
        'Correo requerido',
        'Ingrese un correo válido para el usuario.'
      );
      return false;
    }

    if (!this.modoEdicion && (!this.formulario.clave || this.formulario.clave.length < 6)) {
      this.uiMessageService.advertencia(
        'Contraseña requerida',
        'La contraseña debe tener al menos 6 caracteres.'
      );
      return false;
    }

    if (!this.roles.includes(this.formulario.rol)) {
      this.uiMessageService.advertencia(
        'Rol requerido',
        'Seleccione un rol válido.'
      );
      return false;
    }

    return true;
  }

  irAInicio(): void {
    this.irModulo.emit('inicio');
  }

  irACatalogos(): void {
    this.irModulo.emit('admin-catalogos');
  }

  obtenerTotalActivos(): number {
    return this.usuarios.filter(u => u.activo).length;
  }

  obtenerTotalInactivos(): number {
    return this.usuarios.filter(u => !u.activo).length;
  }

  obtenerTotalPendientes(): number {
    return this.solicitudesPendientes.length;
  }

  obtenerNombreCompleto(usuario: UsuarioSistema): string {
    const nombres = (usuario.nombres || '').trim().replace(/\s+/g, ' ');
    const apellidos = (usuario.apellidos || '').trim().replace(/\s+/g, ' ');
    if (!nombres) return apellidos;
    if (!apellidos || nombres.toLocaleLowerCase().endsWith(` ${apellidos.toLocaleLowerCase()}`)) return nombres;
    return `${nombres} ${apellidos}`;
  }

  trackByUsuario(index: number, usuario: UsuarioSistema): number | string {
    return usuario.id || usuario.correo || index;
  }

  trackBySolicitud(index: number, solicitud: SolicitudAcceso): number | string {
    return solicitud.id || solicitud.correo || index;
  }

  obtenerMensajeError(error: any): string {
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
      return 'No autorizado. Inicie sesión nuevamente como administrador.';
    }

    if (error?.status === 403) {
      return 'Acceso denegado. Solo el administrador puede gestionar usuarios.';
    }

    if (error?.message) {
      return error.message;
    }

    return 'No se pudo completar la operación.';
  }
}
