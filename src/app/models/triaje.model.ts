export interface Triaje {
  id?: number;
  atencionId: number;

  prioridad: string;

  discriminadorClinico?: string | null;
  discriminadorClinicoOtro?: string | null;

  escalaDolor?: number | null;

  frecuenciaCardiaca?: number | null;
  frecuenciaRespiratoria?: number | null;
  temperatura?: number | null;
  saturacionOxigeno?: number | null;
  glicemiaCapilar?: number | null;

  presionSistolica?: number | null;
  presionDiastolica?: number | null;

  presionArterialMedia?: number | null;
  presionPulso?: number | null;

  glasgowOcular?: number | null;
  glasgowVerbal?: number | null;
  glasgowMotora?: number | null;
  glasgow?: number | null;

  llenadoCapilar?: string | null;
  pupilas?: string | null;

  peso?: number | null;
  talla?: number | null;
  indiceMasaCorporal?: number | null;

  oxigenoSuplementario: boolean;
  flujoOxigeno?: number | null;

  alergiaConocida: boolean;
  alergiaDescripcion?: string | null;

  riesgoCaida: boolean;

  aislamiento: boolean;
  tipoAislamiento?: string | null;
}