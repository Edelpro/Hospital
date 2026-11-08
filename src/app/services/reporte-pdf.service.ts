import { Injectable } from '@angular/core';
import type { jsPDF } from 'jspdf';

import { ReporteAtencion } from './reporte';
import { AuthService } from './auth';

export interface ArchivoReportePdf {
  blob: Blob;
  archivo: File;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class ReportePdfService {
  constructor(private authService: AuthService) {}

  async generar(reporte: ReporteAtencion): Promise<ArchivoReportePdf> {
    const { jsPDF: JsPdf } = await import('jspdf');
    const pdf = new JsPdf({ unit: 'mm', format: 'a4', compress: true });
    const atencion = reporte.atencion;
    const paciente = atencion.paciente;
    const triaje = atencion.triaje;
    const evaluacion = atencion.evaluacionMedica;
    const egreso = atencion.egreso;
    const margen = 12;
    const anchoPagina = 210;
    const anchoUtil = anchoPagina - margen * 2;
    const verde = [14, 91, 66] as const;
    const verdeSuave = [237, 248, 243] as const;
    const borde = [184, 211, 200] as const;
    const textoOscuro = [25, 39, 34] as const;
    const textoSecundario = [78, 99, 91] as const;

    const texto = (valor: unknown, reemplazo = 'No registrado'): string => {
      const limpio = String(valor ?? '')
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return limpio || reemplazo;
    };

    const fecha = (valor?: string | null, incluirHora = true): string => {
      if (!valor) return 'Sin fecha';
      const convertida = new Date(valor);
      if (Number.isNaN(convertida.getTime())) return 'Fecha no válida';
      return convertida.toLocaleString('es-EC', incluirHora
        ? { dateStyle: 'short', timeStyle: 'short' }
        : { dateStyle: 'short' });
    };

    const lineasLimitadas = (contenido: unknown, ancho: number, maximo: number): string[] => {
      const lineas = pdf.splitTextToSize(texto(contenido), ancho) as string[];
      if (lineas.length <= maximo) return lineas;
      const visibles = lineas.slice(0, maximo);
      visibles[maximo - 1] = `${visibles[maximo - 1].replace(/[. ]+$/g, '')}...`;
      return visibles;
    };

    const tarjeta = (x: number, y: number, ancho: number, alto: number, titulo: string): void => {
      pdf.setFillColor(...verdeSuave);
      pdf.setDrawColor(...borde);
      pdf.roundedRect(x, y, ancho, alto, 2, 2, 'FD');
      pdf.setTextColor(...verde);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text(titulo.toUpperCase(), x + 4, y + 6);
      pdf.setTextColor(...textoOscuro);
    };

    const linea = (
      etiqueta: string,
      valor: unknown,
      x: number,
      y: number,
      ancho: number,
      maximo = 1,
      tamano = 7.7
    ): number => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(tamano);
      pdf.setTextColor(...textoSecundario);
      pdf.text(`${etiqueta}:`, x, y);
      const desplazamiento = Math.min(pdf.getTextWidth(`${etiqueta}: `), ancho * 0.38);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textoOscuro);
      const disponibles = Math.max(ancho - desplazamiento, ancho * 0.55);
      const lineas = lineasLimitadas(valor, disponibles, maximo);
      pdf.text(lineas, x + desplazamiento, y);
      return y + Math.max(4, lineas.length * 3.6);
    };

    const listaCompacta = (
      items: string[],
      x: number,
      y: number,
      ancho: number,
      maximoItems: number,
      maximoLineas: number
    ): void => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.4);
      pdf.setTextColor(...textoOscuro);
      const seleccionados = items.slice(0, maximoItems);
      const lineas: string[] = [];
      seleccionados.forEach((item, indice) => {
        lineas.push(...lineasLimitadas(`${indice + 1}. ${item}`, ancho, 2));
      });
      if (items.length > maximoItems) {
        lineas.push(`+ ${items.length - maximoItems} registro(s) adicional(es) en el sistema.`);
      }
      pdf.text(lineas.slice(0, maximoLineas), x, y);
    };

    pdf.setFillColor(...verde);
    pdf.roundedRect(margen, 9, anchoUtil, 23, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text('HCU 008 - REPORTE DE EMERGENCIA', margen + 5, 18);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(`Atención AT-${atencion.id ?? '---'}  |  Generado: ${fecha(reporte.fechaGeneracion)}`, margen + 5, 25);
    pdf.text('Historia clínica única - Resumen asistencial', margen + 5, 29);

    tarjeta(margen, 36, anchoUtil, 24, 'Paciente y atención');
    let yIzquierda = 47;
    let yDerecha = 47;
    const columna = 87;
    const separacion = 8;
    const xDerecha = margen + 4 + columna + separacion;
    yIzquierda = linea('Paciente', `${texto(paciente?.nombres, '')} ${texto(paciente?.apellidos, '')}`.trim(), margen + 4, yIzquierda, columna);
    yIzquierda = linea('Cédula', paciente?.cedula, margen + 4, yIzquierda, columna);
    linea('Nacimiento / sexo', `${fecha(paciente?.fechaNacimiento, false)} / ${texto(paciente?.sexo)}`, margen + 4, yIzquierda, columna);
    yDerecha = linea('Ingreso', fecha(atencion.fechaIngreso), xDerecha, yDerecha, columna);
    yDerecha = linea('Estado', atencion.estado, xDerecha, yDerecha, columna);
    linea('Motivo', atencion.motivoConsulta === 'Otro' ? atencion.motivoConsultaOtro : atencion.motivoConsulta, xDerecha, yDerecha, columna);

    tarjeta(margen, 64, anchoUtil, 27, 'Resumen inicial y triaje');
    linea('Enfermedad actual', atencion.enfermedadActualBreve, margen + 4, 75, anchoUtil - 8, 2);
    const signosVitales = [
      triaje?.presionSistolica && triaje?.presionDiastolica ? `TA ${triaje.presionSistolica}/${triaje.presionDiastolica}` : '',
      triaje?.frecuenciaCardiaca ? `FC ${triaje.frecuenciaCardiaca}` : '',
      triaje?.frecuenciaRespiratoria ? `FR ${triaje.frecuenciaRespiratoria}` : '',
      triaje?.temperatura ? `T ${triaje.temperatura} °C` : '',
      triaje?.saturacionOxigeno ? `SatO2 ${triaje.saturacionOxigeno}%` : '',
      triaje?.glicemiaCapilar ? `Glucosa ${triaje.glicemiaCapilar} mg/dL` : '',
      triaje?.glasgow ? `Glasgow ${triaje.glasgow}/15` : ''
    ].filter(Boolean).join(' | ');
    linea('Prioridad / dolor', `${texto(triaje?.prioridad)} / ${texto(triaje?.escalaDolor, 'Sin escala')}${triaje?.escalaDolor !== null && triaje?.escalaDolor !== undefined ? '/10' : ''}`, margen + 4, 84, 64);
    linea('Signos vitales', signosVitales || 'No registrados', margen + 70, 84, 112);
    pdf.setTextColor(triaje?.alergiaConocida ? 183 : 67, triaje?.alergiaConocida ? 59 : 97, triaje?.alergiaConocida ? 48 : 85);
    pdf.setFont('helvetica', triaje?.alergiaConocida ? 'bold' : 'normal');
    pdf.setFontSize(7.5);
    pdf.text(
      triaje?.alergiaConocida
        ? `ALERGIA: ${texto(triaje.alergiaDescripcion, 'Conocida sin detalle')}`
        : `Alergias: ${texto(evaluacion?.alergias, 'Sin alergias conocidas registradas')}`,
      margen + 4,
      89
    );

    tarjeta(margen, 95, anchoUtil, 38, 'Hallazgos y diagnósticos');
    const hallazgos = [
      evaluacion?.estadoGeneral,
      evaluacion?.estadoConciencia,
      evaluacion?.analisisClinico
    ].filter(Boolean).join(' | ');
    linea('Evaluación', hallazgos, margen + 4, 106, anchoUtil - 8, 2);
    const diagnosticos = (atencion.diagnosticos ?? []).map((d) =>
      `${texto(d.codigoCie10, 'Sin CIE-10')} - ${texto(d.descripcionCie10)} (${texto(d.condicion)})`
    );
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.7);
    pdf.setTextColor(...textoSecundario);
    pdf.text('Diagnósticos:', margen + 4, 116);
    listaCompacta(diagnosticos.length ? diagnosticos : ['Sin diagnósticos registrados'], margen + 28, 116, 150, 4, 4);

    const mitad = (anchoUtil - 5) / 2;
    tarjeta(margen, 137, mitad, 47, 'Tratamiento indicado');
    const prescripciones = (atencion.prescripciones ?? []).map((p) =>
      [p.medicamento, p.dosis, p.viaAdministracion, p.frecuencia, p.duracion]
        .filter(Boolean)
        .map((valor) => texto(valor))
        .join(' - ')
    );
    listaCompacta(prescripciones.length ? prescripciones : ['Sin prescripciones registradas'], margen + 4, 148, mitad - 8, 4, 8);

    tarjeta(margen + mitad + 5, 137, mitad, 47, 'Exámenes y resultados');
    const examenes = (atencion.examenes ?? []).map((e) =>
      `${texto(e.nombreExamen)} - ${texto(e.prioridad)} - ${texto(e.resultadoResumen || e.estado)}`
    );
    listaCompacta(examenes.length ? examenes : ['Sin exámenes registrados'], margen + mitad + 9, 148, mitad - 8, 4, 8);

    tarjeta(margen, 188, anchoUtil, 55, 'Resumen clínico y egreso');
    const ultimaEvolucion = atencion.evoluciones?.length
      ? atencion.evoluciones[atencion.evoluciones.length - 1]
      : undefined;
    let yResumen = 199;
    yResumen = linea('Diagnóstico de egreso', egreso?.diagnosticoEgreso || diagnosticos.join('; '), margen + 4, yResumen, anchoUtil - 8, 2);
    yResumen = linea('Resumen', egreso?.resumenClinico || ultimaEvolucion?.analisis || evaluacion?.analisisClinico, margen + 4, yResumen + 1, anchoUtil - 8, 2);
    yResumen = linea('Indicaciones', egreso?.indicaciones || ultimaEvolucion?.plan || evaluacion?.planMedico, margen + 4, yResumen + 1, anchoUtil - 8, 2);
    linea('Signos de alarma', egreso?.signosAlarma, margen + 4, yResumen + 1, anchoUtil - 8, 2);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...textoSecundario);
    pdf.text(`Egreso: ${texto(egreso?.tipoEgreso, 'Pendiente')}  |  Condición: ${texto(egreso?.condicionEgreso, 'Pendiente')}  |  Fecha: ${fecha(egreso?.fechaEgreso)}`, margen + 4, 239);

    tarjeta(margen, 247, anchoUtil, 34, 'Validación profesional');
    const profesional = this.authService.obtenerNombreCompleto() || 'Profesional responsable';
    const rol = this.authService.obtenerRolActual() || 'Personal clínico';
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...textoOscuro);
    pdf.text(`Nombre: ${texto(profesional)}`, margen + 5, 260);
    pdf.text(`Cargo: ${texto(rol)}`, margen + 5, 266);
    pdf.text(`Fecha: ${fecha(reporte.fechaGeneracion)}`, margen + 5, 272);
    pdf.setDrawColor(...textoSecundario);
    pdf.line(124, 269, 190, 269);
    pdf.setFontSize(7.5);
    pdf.setTextColor(...textoSecundario);
    pdf.text('Firma y sello', 157, 274, { align: 'center' });

    pdf.setDrawColor(...borde);
    pdf.line(margen, 287, 198, 287);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(...textoSecundario);
    pdf.text('Documento clínico generado por HCU 008 Emergencia. El detalle completo permanece en el sistema.', margen, 291);
    pdf.text('Página 1 de 1', 198, 291, { align: 'right' });

    const blob = pdf.output('blob');
    const nombrePaciente = `${paciente?.apellidos || ''}_${paciente?.nombres || ''}`
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
    const nombre = `HCU008_AT-${atencion.id ?? 'sin-id'}_${nombrePaciente || 'Paciente'}.pdf`;
    const archivo = new File([blob], nombre, { type: 'application/pdf', lastModified: Date.now() });

    return { blob, archivo, nombre };
  }

  descargar(archivo: Blob, nombre: string): void {
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.rel = 'noopener';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
