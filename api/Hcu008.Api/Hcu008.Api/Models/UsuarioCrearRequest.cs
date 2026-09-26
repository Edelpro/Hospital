namespace Hcu008.Api.Models;

public class UsuarioCrearRequest
{
  public string Nombres { get; set; } = string.Empty;
  public string Apellidos { get; set; } = string.Empty;
  public string Correo { get; set; } = string.Empty;
  public string Clave { get; set; } = string.Empty;
  public string Rol { get; set; } = "Doctor";
}
