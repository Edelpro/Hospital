export interface Egreso {
  id?: number;

  atencionId: number;

  tipoEgreso: string;
  condicionEgreso: string;
  destino: string;

  diagnosticoEgreso?: string | null;
  resumenClinico: string;
  indicaciones: string;
  signosAlarma: string;

  tratamientoDomiciliario?: string | null;
  recomendaciones?: string | null;
  observacion?: string | null;

  requiereControl: boolean;
  requiereReferencia: boolean;

  nombreAcompanante?: string | null;
  parentescoAcompanante?: string | null;

  estado?: string | null;
  fechaEgreso?: string | null;
}