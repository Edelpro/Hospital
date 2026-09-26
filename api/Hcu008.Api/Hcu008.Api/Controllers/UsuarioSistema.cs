namespace Hcu008.Api.Models;

public class UsuarioSistema
{
  public int Id { get; set; }

  public string Nombres { get; set; } = string.Empty;
  public string Apellidos { get; set; } = string.Empty;
  public string Correo { get; set; } = string.Empty;

  public string ClaveHash { get; set; } = string.Empty;
  public string Rol { get; set; } = "Doctor";

  public bool Activo { get; set; } = true;
  public DateTime FechaCreacion { get; set; } = DateTime.Now;
}
