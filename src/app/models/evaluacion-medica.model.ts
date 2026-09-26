export interface EvaluacionMedica {
  id?: number;
  atencionId: number;

  fechaRegistro?: string | null;

  enfermedadActualAmpliada?: string | null;

  antecedentesPersonales?: string | null;
  antecedentesQuirurgicos?: string | null;
  antecedentesFamiliares?: string | null;
  antecedentesGinecoObstetricos?: string | null;
  alergias?: string | null;

  estadoGeneral?: string | null;
  estadoConciencia?: string | null;
  hidratacion?: string | null;
  coloracion?: string | null;
  dolorActual?: string | null;

  dificultadRespiratoria: boolean;
  dolorToracico: boolean;
  deficitNeurologico: boolean;
  sangradoActivo: boolean;
  fiebre: boolean;
  trauma: boolean;
  sospechaSepsis: boolean;
  riesgoObstetrico: boolean;
  riesgoQuirurgico: boolean;
  requiereAislamiento: boolean;

  cabezaCuello?: string | null;
  torax?: string | null;
  cardiopulmonar?: string | null;
  abdomen?: string | null;
  genitourinario?: string | null;
  extremidades?: string | null;
  neurologico?: string | null;
  pielFaneras?: string | null;

  analisisClinico?: string | null;
  problemasActivos?: string | null;
  riesgoClinico?: string | null;
  conductaInicial?: string | null;
  planMedico?: string | null;
}