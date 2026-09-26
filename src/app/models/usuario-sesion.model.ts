export type RolUsuario =
  | 'Admin'
  | 'Doctor'
  | 'Administrador'
  | 'Médico'
  | 'Medico'
  | string;

export interface UsuarioSesion {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: RolUsuario;
  iniciales: string;

  token?: string;
  expiraEn?: string;
}