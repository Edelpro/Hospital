export interface Diagnostico {
  id?: number;
  atencionId: number;

  codigoCie10: string;
  descripcionCie10: string;

  tipoDiagnostico: string;
  condicion: string;

  observacion?: string | null;
  fechaRegistro?: string | null;
}