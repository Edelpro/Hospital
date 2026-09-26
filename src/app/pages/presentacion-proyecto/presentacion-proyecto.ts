import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-presentacion-proyecto',
  imports: [CommonModule],
  templateUrl: './presentacion-proyecto.html',
  styleUrl: './presentacion-proyecto.css'
})
export class PresentacionProyecto {
  @Input() instalacionDisponible = false;
  @Output() abrirSistema = new EventEmitter<void>();
  @Output() instalar = new EventEmitter<void>();

  readonly flujo = [
    'Paciente', 'Atención', 'Triaje', 'Evaluación', 'Diagnóstico',
    'Prescripción', 'Exámenes', 'Evolución', 'Egreso', 'Reporte'
  ];

  readonly alcances = [
    { icono: 'bx-user-plus', titulo: 'Registro sin duplicados', texto: 'Busca, registra y actualiza pacientes con una historia organizada.' },
    { icono: 'bx-pulse', titulo: 'Prioridad clínica', texto: 'Clasifica por triaje y muestra rápidamente casos rojos, naranjas y pendientes.' },
    { icono: 'bx-clipboard', titulo: 'Flujo clínico completo', texto: 'Reúne valoración, diagnóstico, tratamiento, exámenes y seguimiento.' },
    { icono: 'bx-shield-quarter', titulo: 'Control por roles', texto: 'Separa las funciones del Doctor y del Administrador para proteger la información.' },
    { icono: 'bx-history', titulo: 'Trazabilidad', texto: 'Conserva el estado de la atención y permite consultar el historial finalizado.' },
    { icono: 'bx-file', titulo: 'Reporte HCU 008', texto: 'Consolida la atención y genera un documento clínico listo para consultar.' }
  ];
}
