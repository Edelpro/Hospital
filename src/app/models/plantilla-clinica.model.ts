export interface PlantillaClinica {
  id?: number;
  modulo: 'Diagnosticos' | 'Prescripciones' | 'Examenes' | 'Evoluciones';
  nombre: string;
  contenidoJson: string;
  claseColor: string;
  activo: boolean;
  creadoPorUsuarioId?: number;
  fechaCreacion?: string;
}
