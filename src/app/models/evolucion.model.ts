export interface Evolucion {
  id?: number;

  atencionId: number;

  tipoEvolucion: string;
  condicionPaciente: string;

  subjetivo?: string | null;
  objetivo: string;
  analisis: string;
  plan: string;

  signosVitalesResumen?: string | null;
  respuestaTratamiento?: string | null;

  requiereReevaluacion: boolean;
  esCritica: boolean;

  estado?: string | null;
  fechaRegistro?: string | null;
}