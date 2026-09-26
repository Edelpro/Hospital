namespace Hcu008.Api.Models;

public class Egreso
{
  public int Id { get; set; }

  public int AtencionId { get; set; }
  public Atencion? Atencion { get; set; }

  public string TipoEgreso { get; set; } = string.Empty;
  public string CondicionEgreso { get; set; } = string.Empty;
  public string Destino { get; set; } = string.Empty;

  public string? DiagnosticoEgreso { get; set; }

  public string ResumenClinico { get; set; } = string.Empty;
  public string Indicaciones { get; set; } = string.Empty;
  public string SignosAlarma { get; set; } = string.Empty;

  public string? TratamientoDomiciliario { get; set; }
  public string? Recomendaciones { get; set; }
  public string? Observacion { get; set; }

  public bool RequiereControl { get; set; }
  public bool RequiereReferencia { get; set; }

  public string? NombreAcompanante { get; set; }
  public string? ParentescoAcompanante { get; set; }

  public string Estado { get; set; } = "Registrado";

  public DateTime FechaEgreso { get; set; } = DateTime.Now;
}
