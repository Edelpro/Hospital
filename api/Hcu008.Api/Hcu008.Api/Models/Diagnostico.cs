namespace Hcu008.Api.Models;

public class Diagnostico
{
  public int Id { get; set; }

  public int AtencionId { get; set; }
  public Atencion? Atencion { get; set; }

  public string CodigoCie10 { get; set; } = string.Empty;
  public string DescripcionCie10 { get; set; } = string.Empty;

  public string TipoDiagnostico { get; set; } = "Presuntivo";
  public string Condicion { get; set; } = "Principal";

  public string? Observacion { get; set; }

  public DateTime FechaRegistro { get; set; } = DateTime.Now;
}
