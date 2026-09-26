export interface Prescripcion {
  id?: number;

  atencionId: number;

  medicamento: string;
  presentacion?: string | null;
  dosis: string;
  viaAdministracion: string;
  frecuencia: string;
  duracion: string;
  cantidad?: string | null;
  indicaciones?: string | null;

  administrarAhora: boolean;
  esUrgente: boolean;

  estado?: string | null;
  fechaRegistro?: string | null;
}