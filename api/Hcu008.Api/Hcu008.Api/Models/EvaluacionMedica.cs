namespace Hcu008.Api.Models;

public class EvaluacionMedica
{
  public int Id { get; set; }

  public int AtencionId { get; set; }
  public Atencion? Atencion { get; set; }

  public DateTime FechaRegistro { get; set; } = DateTime.Now;

  public string? EnfermedadActualAmpliada { get; set; }

  public string? AntecedentesPersonales { get; set; }
  public string? AntecedentesQuirurgicos { get; set; }
  public string? AntecedentesFamiliares { get; set; }
  public string? AntecedentesGinecoObstetricos { get; set; }
  public string? Alergias { get; set; }

  public string? EstadoGeneral { get; set; }
  public string? EstadoConciencia { get; set; }
  public string? Hidratacion { get; set; }
  public string? Coloracion { get; set; }
  public string? DolorActual { get; set; }

  public bool DificultadRespiratoria { get; set; }
  public bool DolorToracico { get; set; }
  public bool DeficitNeurologico { get; set; }
  public bool SangradoActivo { get; set; }
  public bool Fiebre { get; set; }
  public bool Trauma { get; set; }
  public bool SospechaSepsis { get; set; }
  public bool RiesgoObstetrico { get; set; }
  public bool RiesgoQuirurgico { get; set; }
  public bool RequiereAislamiento { get; set; }

  public string? CabezaCuello { get; set; }
  public string? Torax { get; set; }
  public string? Cardiopulmonar { get; set; }
  public string? Abdomen { get; set; }
  public string? Genitourinario { get; set; }
  public string? Extremidades { get; set; }
  public string? Neurologico { get; set; }
  public string? PielFaneras { get; set; }

  public string? AnalisisClinico { get; set; }
  public string? ProblemasActivos { get; set; }
  public string? RiesgoClinico { get; set; }
  public string? ConductaInicial { get; set; }
  public string? PlanMedico { get; set; }
}
