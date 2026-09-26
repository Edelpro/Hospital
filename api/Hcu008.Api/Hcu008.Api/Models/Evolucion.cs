namespace Hcu008.Api.Models;

public class Evolucion
{
  public int Id { get; set; }

  public int AtencionId { get; set; }
  public Atencion? Atencion { get; set; }

  public string TipoEvolucion { get; set; } = string.Empty;
  public string CondicionPaciente { get; set; } = string.Empty;

  public string? Subjetivo { get; set; }
  public string Objetivo { get; set; } = string.Empty;
  public string Analisis { get; set; } = string.Empty;
  public string Plan { get; set; } = string.Empty;

  public string? SignosVitalesResumen { get; set; }
  public string? RespuestaTratamiento { get; set; }

  public bool RequiereReevaluacion { get; set; }
  public bool EsCritica { get; set; }

  public string Estado { get; set; } = "Activa";

  public DateTime FechaRegistro { get; set; } = DateTime.Now;
}
