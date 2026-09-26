export interface Paciente {
  id?: number;

  cedula: string;
  nombres: string;
  apellidos: string;

  fechaNacimiento?: string | null;

  sexo: string;

  telefono?: string | null;
  direccion?: string | null;

  provincia?: string | null;
  canton?: string | null;
  parroquia?: string | null;
}