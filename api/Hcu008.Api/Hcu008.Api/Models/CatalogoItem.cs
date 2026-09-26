namespace Hcu008.Api.Models;

public class CatalogoItem
{
  public int Id { get; set; }

  public string Tipo { get; set; } = string.Empty;

  public string Codigo { get; set; } = string.Empty;

  public string Nombre { get; set; } = string.Empty;

  public string? Descripcion { get; set; }

  public int Orden { get; set; } = 0;

  public bool Activo { get; set; } = true;

  public bool EsSistema { get; set; } = false;

  public DateTime FechaCreacion { get; set; } = DateTime.Now;
}
