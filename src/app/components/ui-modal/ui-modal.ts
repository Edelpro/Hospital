import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiMessage, UiMessageService } from '../../shared/ui-message.service';

@Component({
  selector: 'app-ui-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-modal.html',
  styleUrl: './ui-modal.css'
})
export class UiModal {
  private dialog?: HTMLDialogElement;
  @ViewChild('dialog') set dialogRef(ref: ElementRef<HTMLDialogElement> | undefined) {
    this.dialog=ref?.nativeElement;
    const dialog=this.dialog;
    if (dialog) queueMicrotask(()=>{ if(dialog.isConnected && !dialog.open && typeof dialog.showModal==='function') dialog.showModal(); });
  }
  private uiMessageService = inject(UiMessageService);

  mensaje$ = this.uiMessageService.mensaje$;

  cerrar(): void {
    this.dialog?.close();
    this.uiMessageService.cerrar();
  }

  confirmar(mensaje: UiMessage): void {
    this.uiMessageService.cerrar();

    if (mensaje.accionConfirmar) {
      mensaje.accionConfirmar();
    }
  }

  obtenerIcono(tipo: string): string {
    switch (tipo) {
      case 'exito':
        return '✅';
      case 'error':
        return '⛔';
      case 'advertencia':
        return '⚠️';
      case 'confirmacion':
        return '❓';
      default:
        return 'ℹ️';
    }
  }
}