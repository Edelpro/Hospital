namespace Hcu008.Api.Models;

public class SolicitudAcceso
{
  public int Id { get; set; }

  public string Nombres { get; set; } = string.Empty;
  public string Correo { get; set; } = string.Empty;
  public string RolSolicitado { get; set; } = "Doctor";

  public string Estado { get; set; } = "Pendiente";

  public DateTime FechaSolicitud { get; set; } = DateTime.Now;
  public DateTime? FechaRespuesta { get; set; }

  public string? ObservacionAdmin { get; set; }
}
