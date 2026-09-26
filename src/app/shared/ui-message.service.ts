import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type TipoMensaje =
  | 'exito'
  | 'error'
  | 'advertencia'
  | 'informacion'
  | 'confirmacion';

export interface UiMessage {
  tipo: TipoMensaje;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  accionConfirmar?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class UiMessageService {
  private mensajeSubject = new BehaviorSubject<UiMessage | null>(null);

  mensaje$ = this.mensajeSubject.asObservable();

  exito(titulo: string, mensaje: string): void {
    this.mensajeSubject.next({
      tipo: 'exito',
      titulo,
      mensaje
    });
  }

  error(titulo: string, mensaje: string): void {
    this.mensajeSubject.next({
      tipo: 'error',
      titulo,
      mensaje
    });
  }

  advertencia(titulo: string, mensaje: string): void {
    this.mensajeSubject.next({
      tipo: 'advertencia',
      titulo,
      mensaje
    });
  }

  informacion(titulo: string, mensaje: string): void {
    this.mensajeSubject.next({
      tipo: 'informacion',
      titulo,
      mensaje
    });
  }

  confirmar(
    titulo: string,
    mensaje: string,
    accionConfirmar: () => void,
    textoConfirmar = 'Confirmar',
    textoCancelar = 'Cancelar'
  ): void {
    this.mensajeSubject.next({
      tipo: 'confirmacion',
      titulo,
      mensaje,
      accionConfirmar,
      textoConfirmar,
      textoCancelar
    });
  }

  cerrar(): void {
    this.mensajeSubject.next(null);
  }
}