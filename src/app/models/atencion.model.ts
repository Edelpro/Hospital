import { Paciente } from './paciente.model';
import { Triaje } from './triaje.model';
import { Diagnostico } from './diagnostico.model';
import { EvaluacionMedica } from './evaluacion-medica.model';
import { Prescripcion } from './prescripcion.model';
import { Examen } from './examen.model';
import { Evolucion } from './evolucion.model';
import { Egreso } from './egreso.model';

export interface Atencion {
  id?: number;

  pacienteId: number;
  paciente?: Paciente | null;

  fechaIngreso?: string | null;

  motivoConsulta: string;
  motivoConsultaOtro?: string | null;

  enfermedadActualBreve: string;

  procedencia: string;
  condicionLlegada: string;

  tieneAcompanante: boolean;
  nombreAcompanante?: string | null;
  parentescoAcompanante?: string | null;
  telefonoAcompanante?: string | null;

  estado: string;

  triaje?: Triaje | null;
  evaluacionMedica?: EvaluacionMedica | null;
  diagnosticos?: Diagnostico[] | null;
  prescripciones?: Prescripcion[] | null;
  examenes?: Examen[] | null;
  evoluciones?: Evolucion[] | null;
  egreso?: Egreso | null;
}