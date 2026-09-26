namespace Hcu008.Api.Models;

public class SolicitudAccesoAprobarRequest
{
  public string Apellidos { get; set; } = string.Empty;
  public string Rol { get; set; } = "Doctor";
  public string ClaveInicial { get; set; } = string.Empty;
}
