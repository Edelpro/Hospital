namespace Hcu008.Api.Models;

public class PlantillaClinica
{
  public int Id { get; set; }
  public string Modulo { get; set; } = string.Empty;
  public string Nombre { get; set; } = string.Empty;
  public string ContenidoJson { get; set; } = "{}";
  public string ClaseColor { get; set; } = string.Empty;
  public bool Activo { get; set; } = true;
  public int CreadoPorUsuarioId { get; set; }
  public DateTime FechaCreacion { get; set; } = DateTime.Now;
}
