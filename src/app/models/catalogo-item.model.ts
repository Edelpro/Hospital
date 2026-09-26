export interface CatalogoItem {
  id?: number;
  tipo: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  orden: number;
  activo: boolean;
  esSistema: boolean;
  fechaCreacion?: string;
}