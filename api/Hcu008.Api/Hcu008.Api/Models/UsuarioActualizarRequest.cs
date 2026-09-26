namespace Hcu008.Api.Models;

public class UsuarioActualizarRequest
{
  public string Nombres { get; set; } = string.Empty;
  public string Apellidos { get; set; } = string.Empty;
  public string Rol { get; set; } = "Doctor";
  public bool Activo { get; set; } = true;
}
