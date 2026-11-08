import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth';
import { SolicitudAccesoService } from '../../services/solicitud-acceso';
import { UsuarioSesion } from '../../models/usuario-sesion.model';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  @Output() sesionIniciada = new EventEmitter<UsuarioSesion>();
  @Output() volverPresentacion = new EventEmitter<void>();

  modoRegistro = false;

  correo = '';
  clave = '';
  cargando = false;
  mensajeError = '';
  mostrarClave = false;

  registroNombres = '';
  registroCorreo = '';
  mensajeRegistro = '';
  enviandoSolicitud = false;

  constructor(
    private authService: AuthService,
    private solicitudAccesoService: SolicitudAccesoService
  ) {}

  iniciarSesion(): void {
    if (this.cargando) return;
    this.mensajeError = '';

    const correoLimpio = this.correo.trim();
    const claveLimpia = this.clave.trim();

    if (!correoLimpio) {
      this.mensajeError = 'Ingrese el correo electrónico.';
      return;
    }

    if (!claveLimpia) {
      this.mensajeError = 'Ingrese la contraseña.';
      return;
    }

    this.cargando = true;

    this.authService.iniciarSesion(correoLimpio, claveLimpia).subscribe({
      next: (loginCorrecto: boolean) => {
        this.cargando = false;

        if (!loginCorrecto) {
          this.mensajeError = 'Correo o contraseña incorrectos.';
          return;
        }

        const usuario = this.authService.obtenerUsuarioActual();

        if (usuario) {
          this.sesionIniciada.emit(usuario);
        }
      },
      error: (error: any) => {
        this.cargando = false;
        this.mensajeError = error?.status === 429
          ? 'Se realizaron demasiados intentos. Espere un minuto y vuelva a intentarlo.'
          : 'No se pudo iniciar sesión. Revise la conexión con la API.';
      }
    });
  }

  enviarSolicitudRegistro(): void {
    this.mensajeRegistro = '';

    const nombres = this.registroNombres.trim().replace(/\s+/g, ' ');
    const correo = this.registroCorreo.trim().toLowerCase();

    if (!nombres || nombres.length < 3) {
      this.mensajeRegistro = 'Ingrese nombres y apellidos.';
      return;
    }

    if (!correo || !correo.includes('@')) {
      this.mensajeRegistro = 'Ingrese un correo válido.';
      return;
    }

    if (this.enviandoSolicitud) {
      return;
    }

    this.enviandoSolicitud = true;

    this.solicitudAccesoService.crearSolicitud({
      nombres,
      correo,
      rolSolicitado: 'Doctor'
    }).subscribe({
      next: () => {
        this.enviandoSolicitud = false;

        this.mensajeRegistro = 'Solicitud enviada correctamente. El administrador deberá revisarla y aprobarla.';

        this.registroNombres = '';
        this.registroCorreo = '';
      },
      error: (error: any) => {
        this.enviandoSolicitud = false;
        this.mensajeRegistro = this.obtenerMensajeError(error);
      }
    });
  }

  activarRegistro(): void {
    this.modoRegistro = true;
    this.mensajeError = '';
    this.mensajeRegistro = '';
  }

  activarLogin(): void {
    this.modoRegistro = false;
    this.mensajeError = '';
    this.mensajeRegistro = '';
  }

  alternarClave(): void {
    this.mostrarClave = !this.mostrarClave;
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

    if (error?.message) {
      return error.message;
    }

    return 'No se pudo enviar la solicitud.';
  }
}
