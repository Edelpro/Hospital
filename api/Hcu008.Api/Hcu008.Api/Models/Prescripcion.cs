namespace Hcu008.Api.Models;

public class Prescripcion
{
  public int Id { get; set; }

  public int AtencionId { get; set; }
  public Atencion? Atencion { get; set; }

  public string Medicamento { get; set; } = string.Empty;
  public string? Presentacion { get; set; }
  public string Dosis { get; set; } = string.Empty;
  public string ViaAdministracion { get; set; } = string.Empty;
  public string Frecuencia { get; set; } = string.Empty;
  public string Duracion { get; set; } = string.Empty;
  public string? Cantidad { get; set; }
  public string? Indicaciones { get; set; }

  public bool AdministrarAhora { get; set; }
  public bool EsUrgente { get; set; }

  public string Estado { get; set; } = "Activa";

  public DateTime FechaRegistro { get; set; } = DateTime.Now;
}
