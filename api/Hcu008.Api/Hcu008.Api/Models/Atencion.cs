namespace Hcu008.Api.Models;

public class Atencion
{
  public int Id { get; set; }

  public int PacienteId { get; set; }
  public Paciente? Paciente { get; set; }

  public DateTime FechaIngreso { get; set; } = DateTime.Now;

  public string MotivoConsulta { get; set; } = string.Empty;
  public string? MotivoConsultaOtro { get; set; }

  public string EnfermedadActualBreve { get; set; } = string.Empty;

  public string Procedencia { get; set; } = string.Empty;
  public string CondicionLlegada { get; set; } = string.Empty;

  public bool TieneAcompanante { get; set; } = false;
  public string? NombreAcompanante { get; set; }
  public string? ParentescoAcompanante { get; set; }
  public string? TelefonoAcompanante { get; set; }

  public string Estado { get; set; } = "Abierta";

  public Triaje? Triaje { get; set; }
  public Egreso? Egreso { get; set; }
  public EvaluacionMedica? EvaluacionMedica { get; set; }

  public ICollection<Diagnostico> Diagnosticos { get; set; } = new List<Diagnostico>();
  public ICollection<Prescripcion> Prescripciones { get; set; } = new List<Prescripcion>();
  public ICollection<Evolucion> Evoluciones { get; set; } = new List<Evolucion>();
  public ICollection<Examen> Examenes { get; set; } = new List<Examen>();
}
