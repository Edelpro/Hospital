import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Atencion } from '../../models/atencion.model';
import { AtencionService } from '../../services/atencion.service';
import { ReportePdfService } from '../../services/reporte-pdf.service';
import { UiMessageService } from '../../shared/ui-message.service';

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
  preparandoPdf = false;
  compartiendoPdf = false;
  archivoPdf?: File;
  private atencionDetalle?: Atencion;
  private versionCarga = 0;

  constructor(
    private uiMessageService: UiMessageService,
    private atencionService: AtencionService,
    private reportePdfService: ReportePdfService
  ) {}

  ngOnChanges(): void {
    const version = ++this.versionCarga;
    this.atencionDetalle = this.atencionActual;
    this.archivoPdf = undefined;
    this.prepararResumen();

    if (!this.atencionActual?.id) return;

    this.preparandoPdf = true;
    this.atencionService.obtenerAtencion(this.atencionActual.id).subscribe({
      next: (atencion) => {
        if (version !== this.versionCarga) return;
        this.atencionDetalle = atencion;
        this.prepararResumen();
        void this.prepararPdf(atencion, version);
      },
      error: () => {
        if (version !== this.versionCarga) return;
        this.uiMessageService.advertencia('Resumen parcial', 'No fue posible cargar todo el detalle clínico. El PDF se preparará con los datos disponibles.');
        void this.prepararPdf(this.atencionActual!, version);
      }
    });
  }

  prepararResumen(): void {
    const atencion = this.atencionDetalle || this.atencionActual;
    if (!atencion) return;
    const paciente = `${atencion.paciente?.nombres || ''} ${atencion.paciente?.apellidos || ''}`.trim();
    const edad = this.calcularEdad(atencion.paciente?.fechaNacimiento);
    const datosPaciente = [
      atencion.paciente?.cedula ? `Cédula ${atencion.paciente.cedula}` : '',
      edad !== undefined ? `${edad} años` : '',
      atencion.paciente?.sexo || ''
    ].filter(Boolean).join(' · ');

    const diagnosticos = atencion.diagnosticos || [];
    const diagnosticoPrincipal = diagnosticos.find(d => this.normalizar(d.condicion).includes('principal')) || diagnosticos[0];
    const otrosDiagnosticos = diagnosticos.filter(d => d !== diagnosticoPrincipal);
    const textoDiagnostico = diagnosticoPrincipal
      ? `${diagnosticoPrincipal.codigoCie10} ${diagnosticoPrincipal.descripcionCie10} (${diagnosticoPrincipal.tipoDiagnostico})`
      : 'Sin diagnóstico principal registrado';
    const textoOtrosDiagnosticos = this.resumir(
      otrosDiagnosticos.map(d => `${d.codigoCie10} ${d.descripcionCie10}`),
      2,
      'Sin diagnósticos adicionales'
    );

    const examenes = this.resumir(
      (atencion.examenes || []).map(e => {
        const resultado = e.resultadoResumen ? `: ${this.limitar(e.resultadoResumen, 110)}` : '';
        return `${e.nombreExamen} · ${e.prioridad} · ${e.estado || 'Solicitado'}${resultado}`;
      }),
      3,
      'Sin exámenes solicitados'
    );
    const prescripciones = this.resumir(
      (atencion.prescripciones || []).map(p =>
        [p.medicamento, p.dosis, p.viaAdministracion, p.frecuencia, p.duracion].filter(Boolean).join(' · ')
      ),
      3,
      'Sin prescripciones'
    );
    const evolucion = [...(atencion.evoluciones || [])].sort((a, b) => String(b.fechaRegistro || '').localeCompare(String(a.fechaRegistro || '')))[0];
    const triaje = atencion.triaje;
    const signosVitales = this.construirSignosVitales(atencion);
    const prioridad = triaje?.prioridad || 'No clasificada';
    const dolor = triaje?.escalaDolor !== null && triaje?.escalaDolor !== undefined ? `${triaje.escalaDolor}/10` : 'No registrado';
    const alergias = triaje?.alergiaConocida
      ? triaje.alergiaDescripcion || 'Alergia conocida sin detalle'
      : atencion.evaluacionMedica?.alergias || 'Sin alergias conocidas registradas';
    const motivo = atencion.motivoConsulta === 'Otro'
      ? atencion.motivoConsultaOtro || 'Otro motivo'
      : atencion.motivoConsulta;
    const fechaIngreso = this.formatearFecha(atencion.fechaIngreso);
    const evaluacion = atencion.evaluacionMedica;
    const estadoClinico = [evaluacion?.estadoGeneral, evaluacion?.estadoConciencia, evaluacion?.riesgoClinico]
      .filter(Boolean).join(' · ') || 'Evaluación clínica pendiente';
    const egreso = atencion.egreso;

    this.asunto = `HCU 008 · Atención AT-${atencion.id} · ${paciente}`;
    this.mensaje = [
      `RESUMEN CLÍNICO — ${this.destinatario}`,
      `Paciente: ${paciente || 'No disponible'} · ${datosPaciente || 'Identificación no disponible'}`,
      `Atención: AT-${atencion.id ?? '---'} · Ingreso: ${fechaIngreso} · Estado: ${atencion.estado || 'No registrado'}`,
      `Motivo: ${motivo || 'No registrado'}`,
      `Triaje: ${prioridad} · Dolor: ${dolor}`,
      `Signos vitales: ${signosVitales}`,
      `Alergias: ${alergias}`,
      `Condición clínica: ${estadoClinico}`,
      `Diagnóstico principal: ${textoDiagnostico}`,
      `Otros diagnósticos: ${textoOtrosDiagnosticos}`,
      `Tratamiento: ${prescripciones}`,
      `Exámenes: ${examenes}`,
      evolucion
        ? `Última evolución: ${evolucion.condicionPaciente} · ${this.limitar(evolucion.analisis, 190)} · Plan: ${this.limitar(evolucion.plan, 160)}`
        : 'Última evolución: No registrada',
      egreso
        ? `Egreso: ${egreso.tipoEgreso} · ${egreso.condicionEgreso} · Destino: ${egreso.destino}`
        : 'Egreso: Pendiente',
      egreso?.signosAlarma ? `Signos de alarma: ${this.limitar(egreso.signosAlarma, 260)}` : '',
      '',
      'Se adjunta el reporte clínico PDF de una página con el detalle y la firma. Confirmar recepción por el canal institucional.'
    ].filter(linea => linea !== '').join('\n');
  }

  private construirSignosVitales(atencion: Atencion): string {
    const triaje = atencion.triaje;
    if (!triaje) return 'No registrados';
    const valores = [
      triaje.presionSistolica !== null && triaje.presionSistolica !== undefined &&
      triaje.presionDiastolica !== null && triaje.presionDiastolica !== undefined
        ? `TA ${triaje.presionSistolica}/${triaje.presionDiastolica} mmHg`
        : '',
      triaje.frecuenciaCardiaca !== null && triaje.frecuenciaCardiaca !== undefined ? `FC ${triaje.frecuenciaCardiaca} lpm` : '',
      triaje.frecuenciaRespiratoria !== null && triaje.frecuenciaRespiratoria !== undefined ? `FR ${triaje.frecuenciaRespiratoria} rpm` : '',
      triaje.temperatura !== null && triaje.temperatura !== undefined ? `T ${triaje.temperatura} °C` : '',
      triaje.saturacionOxigeno !== null && triaje.saturacionOxigeno !== undefined ? `SatO₂ ${triaje.saturacionOxigeno}%` : '',
      triaje.glicemiaCapilar !== null && triaje.glicemiaCapilar !== undefined ? `Glicemia ${triaje.glicemiaCapilar} mg/dL` : '',
      triaje.glasgow !== null && triaje.glasgow !== undefined ? `Glasgow ${triaje.glasgow}/15` : ''
    ].filter(Boolean);
    return valores.length ? valores.join(' · ') : 'No registrados';
  }

  private resumir(items: string[], maximo: number, vacio: string): string {
    const disponibles = items.map(item => this.limitar(item, 170)).filter(Boolean);
    if (!disponibles.length) return vacio;
    const visibles = disponibles.slice(0, maximo).join('; ');
    return disponibles.length > maximo ? `${visibles}; +${disponibles.length - maximo} más` : visibles;
  }

  private limitar(valor: string | null | undefined, maximo: number): string {
    const texto = String(valor || '').replace(/\s+/g, ' ').trim();
    if (texto.length <= maximo) return texto;
    return `${texto.slice(0, Math.max(0, maximo - 1)).trim()}…`;
  }

  private normalizar(valor: string | null | undefined): string {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  private calcularEdad(fechaNacimiento: string | null | undefined): number | undefined {
    if (!fechaNacimiento) return undefined;
    const nacimiento = new Date(`${fechaNacimiento.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(nacimiento.getTime())) return undefined;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad >= 0 ? edad : undefined;
  }

  private formatearFecha(valor: string | null | undefined): string {
    if (!valor) return 'No registrada';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return valor;
    return new Intl.DateTimeFormat('es-EC', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(fecha);
  }

  async prepararPdf(atencion: Atencion, version = this.versionCarga): Promise<void> {
    this.preparandoPdf = true;
    this.archivoPdf = undefined;
    try {
      const resultado = await this.reportePdfService.generar({
        fechaGeneracion: new Date().toISOString(),
        atencion
      });
      if (version === this.versionCarga) this.archivoPdf = resultado.archivo;
    } catch (error) {
      console.error('Error al preparar PDF:', error);
      if (version === this.versionCarga) {
        this.uiMessageService.error('No se pudo preparar el PDF', 'Recargue la atención e inténtelo nuevamente.');
      }
    } finally {
      if (version === this.versionCarga) this.preparandoPdf = false;
    }
  }

  enviarCorreo(): void {
    if (!this.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo.trim())) {
      this.uiMessageService.advertencia('Correo requerido', 'Ingrese un correo institucional válido.');
      return;
    }
    window.location.href = `mailto:${this.correo.trim()}?subject=${encodeURIComponent(this.asunto)}&body=${encodeURIComponent(this.mensaje)}`;
  }

  enviarWhatsApp(): void {
    const numero = this.obtenerNumeroWhatsApp();
    if (!numero) return;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(`${this.asunto}\n\n${this.mensaje}`)}`, '_blank', 'noopener,noreferrer');
  }

  async compartirPdfWhatsApp(): Promise<void> {
    if (this.preparandoPdf || this.compartiendoPdf) return;
    if (!this.archivoPdf) {
      this.uiMessageService.advertencia('PDF no disponible', 'Espere a que el reporte termine de prepararse o vuelva a abrir la atención.');
      return;
    }

    const archivo = this.archivoPdf;
    const datosCompartir: ShareData = {
      title: this.asunto,
      text: `${this.asunto}\n\n${this.mensaje}`,
      files: [archivo]
    };

    if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [archivo] })) {
      this.compartiendoPdf = true;
      try {
        await navigator.share(datosCompartir);
        this.uiMessageService.exito('Reporte compartido', 'El sistema entregó el PDF a la aplicación seleccionada.');
      } catch (error) {
        if ((error as DOMException)?.name !== 'AbortError') {
          console.error('Error al compartir PDF:', error);
          this.uiMessageService.error('No se pudo compartir', 'Descargue el PDF y adjúntelo manualmente en WhatsApp.');
        }
      } finally {
        this.compartiendoPdf = false;
      }
      return;
    }

    const numero = this.obtenerNumeroWhatsApp();
    if (!numero) return;
    this.reportePdfService.descargar(archivo, archivo.name);
    const aviso = `${this.asunto}\n\n${this.mensaje}\n\nArchivo descargado: ${archivo.name}. Adjunte este PDF antes de enviar.`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(aviso)}`, '_blank', 'noopener,noreferrer');
    this.uiMessageService.informacion('PDF listo para adjuntar', `Se descargó ${archivo.name} y se abrió WhatsApp. Adjunte el archivo descargado antes de confirmar el envío.`);
  }

  descargarPdf(): void {
    if (!this.archivoPdf) {
      this.uiMessageService.advertencia('PDF no disponible', 'Espere a que termine de prepararse.');
      return;
    }
    this.reportePdfService.descargar(this.archivoPdf, this.archivoPdf.name);
    this.uiMessageService.exito('PDF descargado', `Se guardó ${this.archivoPdf.name}.`);
  }

  async copiarMensaje(): Promise<void> {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API no disponible');
      await navigator.clipboard.writeText(`${this.asunto}\n\n${this.mensaje}`);
      this.uiMessageService.exito('Mensaje copiado', 'El resumen clínico fue copiado al portapapeles.');
    } catch {
      this.uiMessageService.error('No se pudo copiar', 'Seleccione el texto del mensaje y cópielo manualmente.');
    }
  }

  private obtenerNumeroWhatsApp(): string | undefined {
    const numero = this.telefono.replace(/\D/g, '');
    if (numero.length < 10 || numero.length > 15) {
      this.uiMessageService.advertencia('Número no válido', 'Ingrese entre 10 y 15 dígitos con código de país, por ejemplo 593999999999.');
      return undefined;
    }
    return numero;
  }
}
