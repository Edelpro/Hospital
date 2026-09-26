import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Atencion } from '../../models/atencion.model';
import { UiMessageService } from '../../shared/ui-message.service';
import { AtencionService } from '../../services/atencion.service';

@Component({
  selector: 'app-mensajeria',
  imports: [CommonModule, FormsModule],
  templateUrl: './mensajeria.html',
  styleUrl: './mensajeria.css'
})
export class Mensajeria implements OnChanges {
  @Input() atencionActual?: Atencion;

  destinatario = 'Laboratorio / diagnóstico';
  correo = '';
  telefono = '';
  asunto = 'Solicitud clínica HCU 008';
  mensaje = '';
  private atencionDetalle?: Atencion;

  constructor(private uiMessageService: UiMessageService, private atencionService: AtencionService) {}

  ngOnChanges(): void {
    this.atencionDetalle = this.atencionActual;
    this.prepararResumen();
    if (this.atencionActual?.id) {
      this.atencionService.obtenerAtencion(this.atencionActual.id).subscribe({
        next: atencion => { this.atencionDetalle = atencion; this.prepararResumen(); },
        error: () => this.uiMessageService.advertencia('Resumen parcial', 'No fue posible cargar todo el detalle clínico. Puede completar el mensaje manualmente.')
      });
    }
  }

  prepararResumen(): void {
    const atencion = this.atencionDetalle || this.atencionActual;
    if (!atencion) return;
    const paciente = `${atencion.paciente?.nombres || ''} ${atencion.paciente?.apellidos || ''}`.trim();
    const diagnosticos = (atencion.diagnosticos || []).map(d => `${d.codigoCie10} ${d.descripcionCie10}`).join('; ') || 'Sin diagnóstico registrado';
    const examenes = (atencion.examenes || []).map(e => `${e.nombreExamen} (${e.prioridad})`).join('; ') || 'Sin exámenes solicitados';
    const prescripciones = (atencion.prescripciones || []).map(p => `${p.medicamento} ${p.dosis} ${p.viaAdministracion}`).join('; ') || 'Sin prescripciones';
    const evolucion = [...(atencion.evoluciones || [])].sort((a, b) => String(b.fechaRegistro || '').localeCompare(String(a.fechaRegistro || '')))[0];

    this.asunto = `HCU 008 · Atención AT-${atencion.id} · ${paciente}`;
    this.mensaje = [
      `SOLICITUD CLÍNICA — ${this.destinatario}`,
      `Paciente: ${paciente} · Cédula: ${atencion.paciente?.cedula || 'No disponible'}`,
      `Atención: AT-${atencion.id} · Motivo: ${atencion.motivoConsulta}`,
      `Diagnósticos: ${diagnosticos}`,
      `Exámenes solicitados: ${examenes}`,
      `Tratamiento actual: ${prescripciones}`,
      evolucion ? `Última evolución: ${evolucion.analisis}. Plan: ${evolucion.plan}` : 'Última evolución: No registrada',
      '',
      'Por favor confirmar recepción y comunicar resultados por el canal institucional.'
    ].join('\n');
  }

  enviarCorreo(): void {
    if (!this.correo.trim() || !this.correo.includes('@')) {
      this.uiMessageService.advertencia('Correo requerido', 'Ingrese el correo institucional del destinatario.');
      return;
    }
    window.location.href = `mailto:${this.correo.trim()}?subject=${encodeURIComponent(this.asunto)}&body=${encodeURIComponent(this.mensaje)}`;
  }

  enviarWhatsApp(): void {
    const numero = this.telefono.replace(/\D/g, '');
    if (numero.length < 8) {
      this.uiMessageService.advertencia('Número requerido', 'Ingrese el número con código de país, por ejemplo 593999999999.');
      return;
    }
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(`${this.asunto}\n\n${this.mensaje}`)}`, '_blank', 'noopener,noreferrer');
  }

  copiarMensaje(): void {
    navigator.clipboard?.writeText(`${this.asunto}\n\n${this.mensaje}`).then(() =>
      this.uiMessageService.exito('Mensaje copiado', 'El resumen clínico fue copiado al portapapeles.')
    );
  }
}
