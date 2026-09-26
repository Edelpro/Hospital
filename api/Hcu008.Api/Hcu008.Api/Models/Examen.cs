namespace Hcu008.Api.Models;

public class Examen
{
  public int Id { get; set; }

  public int AtencionId { get; set; }
  public Atencion? Atencion { get; set; }

  public string TipoExamen { get; set; } = string.Empty;
  public string NombreExamen { get; set; } = string.Empty;
  public string Prioridad { get; set; } = "Rutina";

  public string IndicacionClinica { get; set; } = string.Empty;
  public string? Observacion { get; set; }

  public bool RequiereAyuno { get; set; }
  public bool EsUrgente { get; set; }

  public string Estado { get; set; } = "Solicitado";

  public string? ResultadoResumen { get; set; }

  public DateTime FechaSolicitud { get; set; } = DateTime.Now;
  public DateTime? FechaResultado { get; set; }
}
