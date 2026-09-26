export interface Examen {
  id?: number;
  atencionId: number;

  tipoExamen: string;
  nombreExamen: string;
  prioridad: string;
  indicacionClinica: string;

  observacion?: string | null;
  requiereAyuno: boolean;
  esUrgente: boolean;

  estado?: string | null;
  resultadoResumen?: string | null;
  fechaSolicitud?: string | null;
  fechaResultado?: string | null;
}