export interface UsuarioSistema {
  id?: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
  activo: boolean;
  fechaCreacion?: string;
}

export interface UsuarioCrearRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  clave: string;
  rol: string;
}

export interface UsuarioActualizarRequest {
  nombres: string;
  apellidos: string;
  rol: string;
  activo: boolean;
}