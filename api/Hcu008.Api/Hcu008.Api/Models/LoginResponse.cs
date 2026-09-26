namespace Hcu008.Api.Models;

public class LoginResponse
{
  public int Id { get; set; }
  public string Nombres { get; set; } = string.Empty;
  public string Apellidos { get; set; } = string.Empty;
  public string Correo { get; set; } = string.Empty;
  public string Rol { get; set; } = string.Empty;
  public string Iniciales { get; set; } = string.Empty;
  public string Token { get; set; } = string.Empty;
  public DateTime ExpiraEn { get; set; }
}
