export interface SolicitudAcceso {
  id?: number;
  nombres: string;
  correo: string;
  rolSolicitado: string;
  estado: string;
  fechaSolicitud?: string;
  fechaRespuesta?: string | null;
  observacionAdmin?: string | null;
}

export interface SolicitudAccesoCrearRequest {
  nombres: string;
  correo: string;
  rolSolicitado: string;
}

export interface SolicitudAccesoAprobarRequest {
  apellidos: string;
  rol: string;
  claveInicial: string;
}