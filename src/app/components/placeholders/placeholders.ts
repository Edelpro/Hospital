import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-placeholders',
  imports: [CommonModule],
  templateUrl: './placeholders.html',
  styleUrl: './placeholders.css'
})
export class Placeholders {
  @Input() vista = '';

  obtenerTitulo(): string {
    switch (this.vista) {
      case 'evaluacion':
        return 'Evaluación médica';
      case 'diagnosticos':
        return 'Diagnósticos';
      case 'prescripciones':
        return 'Prescripciones';
      case 'examenes':
        return 'Exámenes';
      case 'evoluciones':
        return 'Evoluciones';
      case 'egreso':
        return 'Egreso';
      case 'reportes':
        return 'Reportes';
      default:
        return 'Módulo';
    }
  }

  obtenerDescripcion(): string {
    switch (this.vista) {
      case 'evaluacion':
        return 'Este módulo registrará enfermedad actual, antecedentes, examen físico, impresión clínica y plan inicial.';
      case 'diagnosticos':
        return 'Este módulo registrará diagnóstico principal, secundario, presuntivo o definitivo con CIE 10.';
      case 'prescripciones':
        return 'Este módulo registrará medicamento, dosis, vía, frecuencia, duración e indicaciones.';
      case 'examenes':
        return 'Este módulo registrará laboratorios, imágenes, resultados e interpretación.';
      case 'evoluciones':
        return 'Este módulo registrará evoluciones clínicas durante la atención.';
      case 'egreso':
        return 'Este módulo registrará diagnóstico final, condición de egreso, recomendaciones y cierre de atención.';
      case 'reportes':
        return 'Este módulo mostrará producción diaria, pacientes por prioridad y tiempos de espera.';
      default:
        return 'Módulo pendiente de construcción.';
    }
  }
}