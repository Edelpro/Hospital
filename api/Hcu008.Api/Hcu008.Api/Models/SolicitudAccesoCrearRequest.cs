namespace Hcu008.Api.Models;

public class SolicitudAccesoCrearRequest
{
  public string Nombres { get; set; } = string.Empty;
  public string Correo { get; set; } = string.Empty;
  public string RolSolicitado { get; set; } = "Doctor";
}
