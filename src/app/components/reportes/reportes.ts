import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Atencion } from '../../models/atencion.model';
import { ReporteAtencion, ReporteService } from '../../services/reporte';
import { ReportePdfService } from '../../services/reporte-pdf.service';
import { UiMessageService } from '../../shared/ui-message.service';

type VistaDestinoReportes = 'inicio' | 'pacientes' | 'egreso' | 'mensajeria';

@Component({
  selector: 'app-reportes',
  imports: [CommonModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes implements OnChanges {
  @Input() atencionActual?: Atencion;

  @Output() irModulo = new EventEmitter<VistaDestinoReportes>();

  reporte?: ReporteAtencion;
  cargandoReporte = false;
  generandoPdf = false;

  constructor(
    private reporteService: ReporteService,
    private reportePdfService: ReportePdfService,
    private uiMessageService: UiMessageService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['atencionActual']) {
      this.cargarReporte();
    }
  }

  irA(modulo: VistaDestinoReportes): void {
    this.irModulo.emit(modulo);
  }

  cargarReporte(): void {
    if (!this.atencionActual?.id) {
      this.reporte = undefined;
      return;
    }

    this.reporte = undefined;
    this.cargandoReporte = true;

    this.reporteService.obtenerReporteAtencion(this.atencionActual.id).subscribe({
      next: (datos) => {
        this.reporte = datos;
        this.cargandoReporte = false;
      },
      error: (error) => {
        console.error('Error al cargar reporte:', error);
        this.cargandoReporte = false;

        this.uiMessageService.error(
          'Error al cargar reporte',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  imprimirReporte(): void {
    if (!this.reporte || this.cargandoReporte) return;
    setTimeout(() => {
      window.print();
    }, 150);
  }

  async descargarReportePdf(): Promise<void> {
    if (!this.reporte || this.cargandoReporte || this.generandoPdf) return;

    this.generandoPdf = true;
    try {
      const resultado = await this.reportePdfService.generar(this.reporte);
      this.reportePdfService.descargar(resultado.archivo, resultado.nombre);
      this.uiMessageService.exito('PDF generado', `Se descargó ${resultado.nombre}.`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.uiMessageService.error('No se pudo generar el PDF', 'Recargue el reporte e inténtelo nuevamente.');
    } finally {
      this.generandoPdf = false;
    }
  }

  obtenerAtencion(): any {
    return this.reporte?.atencion || this.atencionActual || {};
  }

  obtenerPaciente(): any {
    return this.obtenerAtencion()?.paciente || {};
  }

  obtenerTriaje(): any {
    return this.obtenerAtencion()?.triaje || {};
  }

  obtenerEvaluacion(): any {
    return this.obtenerAtencion()?.evaluacionMedica || {};
  }

  obtenerEgreso(): any {
    return this.obtenerAtencion()?.egreso || {};
  }

  obtenerDiagnosticos(): any[] {
    return this.obtenerAtencion()?.diagnosticos || [];
  }

  obtenerPrescripciones(): any[] {
    return this.obtenerAtencion()?.prescripciones || [];
  }

  obtenerExamenes(): any[] {
    return this.obtenerAtencion()?.examenes || [];
  }

  obtenerEvoluciones(): any[] {
    return this.obtenerAtencion()?.evoluciones || [];
  }

  obtenerDiagnosticoPrincipal(): string {
    const principal = this.obtenerDiagnosticos().find(
      (d) => d.condicion === 'Principal'
    );

    if (!principal) {
      return 'Sin diagnóstico principal registrado';
    }

    return `${principal.codigoCie10 || ''} - ${principal.descripcionCie10 || ''}`.trim();
  }

  obtenerNombrePaciente(): string {
    const paciente = this.obtenerPaciente();
    const nombres = paciente?.nombres || '';
    const apellidos = paciente?.apellidos || '';

    return `${nombres} ${apellidos}`.trim() || 'Paciente sin nombre';
  }

  obtenerCedulaPaciente(): string {
    return this.obtenerPaciente()?.cedula || 'Sin cédula';
  }

  obtenerSexoPaciente(): string {
    return this.obtenerPaciente()?.sexo || 'No registrado';
  }

  obtenerResidenciaPaciente(): string {
    const paciente = this.obtenerPaciente();

    const partes = [
      paciente?.provincia,
      paciente?.canton,
      paciente?.parroquia
    ].filter(Boolean);

    return partes.length ? partes.join(' / ') : 'No registrada';
  }

  obtenerMotivoConsulta(): string {
    const atencion = this.obtenerAtencion();

    if (!atencion?.motivoConsulta) {
      return 'No registrado';
    }

    if (atencion.motivoConsulta === 'Otro' && atencion.motivoConsultaOtro) {
      return atencion.motivoConsultaOtro;
    }

    return atencion.motivoConsulta;
  }

  obtenerAcompananteTexto(): string {
    const atencion = this.obtenerAtencion();

    if (!atencion?.tieneAcompanante) {
      return 'No registrado';
    }

    const partes = [
      atencion?.nombreAcompanante,
      atencion?.parentescoAcompanante,
      atencion?.telefonoAcompanante
    ].filter(Boolean);

    return partes.length ? partes.join(' / ') : 'No registrado';
  }

  obtenerDiscriminadorTriaje(): string {
    const triaje = this.obtenerTriaje();

    if (!triaje?.discriminadorClinico) {
      return 'No registrado';
    }

    if (triaje.discriminadorClinico === 'Otro' && triaje.discriminadorClinicoOtro) {
      return triaje.discriminadorClinicoOtro;
    }

    return triaje.discriminadorClinico;
  }

  obtenerEdadTexto(): string {
    const fechaNacimiento = this.obtenerPaciente()?.fechaNacimiento;

    if (!fechaNacimiento) {
      return 'Edad no registrada';
    }

    const nacimiento = new Date(fechaNacimiento);

    if (isNaN(nacimiento.getTime())) {
      return 'Edad no registrada';
    }

    const hoy = new Date();

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    if (edad < 0) {
      return 'Edad no registrada';
    }

    return `${edad} años`;
  }

  obtenerFechaGeneracion(): string {
    return this.formatearFecha(this.reporte?.fechaGeneracion || new Date().toISOString());
  }

  obtenerSignosVitalesResumen(): string {
    const t = this.obtenerTriaje();

    const partes: string[] = [];

    if (t.presionSistolica && t.presionDiastolica) {
      partes.push(`TA ${t.presionSistolica}/${t.presionDiastolica} mmHg`);
    }

    if (t.frecuenciaCardiaca) {
      partes.push(`FC ${t.frecuenciaCardiaca} lpm`);
    }

    if (t.frecuenciaRespiratoria) {
      partes.push(`FR ${t.frecuenciaRespiratoria} rpm`);
    }

    if (t.temperatura) {
      partes.push(`T ${t.temperatura} °C`);
    }

    if (t.saturacionOxigeno) {
      partes.push(`SatO₂ ${t.saturacionOxigeno}%`);
    }

    if (t.glicemiaCapilar) {
      partes.push(`Glicemia ${t.glicemiaCapilar} mg/dL`);
    }

    if (t.glasgow) {
      partes.push(`Glasgow ${t.glasgow}/15`);
    }

    if (t.presionArterialMedia) {
      partes.push(`PAM ${t.presionArterialMedia} mmHg`);
    }

    if (t.presionPulso) {
      partes.push(`PP ${t.presionPulso} mmHg`);
    }

    if (t.indiceMasaCorporal) {
      partes.push(`IMC ${t.indiceMasaCorporal}`);
    }

    return partes.length ? partes.join(' · ') : 'Sin signos vitales registrados';
  }

  obtenerExamenFisicoResumen(): string {
    const ev = this.obtenerEvaluacion();

    const partes: string[] = [];

    if (ev?.estadoGeneral) {
      partes.push(`Estado general: ${ev.estadoGeneral}`);
    }

    if (ev?.estadoConciencia) {
      partes.push(`Conciencia: ${ev.estadoConciencia}`);
    }

    if (ev?.hidratacion) {
      partes.push(`Hidratación: ${ev.hidratacion}`);
    }

    if (ev?.coloracion) {
      partes.push(`Coloración: ${ev.coloracion}`);
    }

    if (ev?.dolorActual) {
      partes.push(`Dolor: ${ev.dolorActual}`);
    }

    if (ev?.cabezaCuello) {
      partes.push(`Cabeza/cuello: ${ev.cabezaCuello}`);
    }

    if (ev?.torax) {
      partes.push(`Tórax: ${ev.torax}`);
    }

    if (ev?.cardiopulmonar) {
      partes.push(`Cardiopulmonar: ${ev.cardiopulmonar}`);
    }

    if (ev?.abdomen) {
      partes.push(`Abdomen: ${ev.abdomen}`);
    }

    if (ev?.genitourinario) {
      partes.push(`Genitourinario: ${ev.genitourinario}`);
    }

    if (ev?.extremidades) {
      partes.push(`Extremidades: ${ev.extremidades}`);
    }

    if (ev?.neurologico) {
      partes.push(`Neurológico: ${ev.neurologico}`);
    }

    if (ev?.pielFaneras) {
      partes.push(`Piel y faneras: ${ev.pielFaneras}`);
    }

    return partes.length ? partes.join(' | ') : 'No registrado';
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

  trackById(index: number, item: any): number {
    return item?.id || index;
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
