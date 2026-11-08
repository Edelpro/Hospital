namespace Hcu008.Api.Models;

public class Paciente
{
  public int Id { get; set; }

  public string Cedula { get; set; } = string.Empty;

  public string Nombres { get; set; } = string.Empty;
  public string Apellidos { get; set; } = string.Empty;

  public DateTime? FechaNacimiento { get; set; }

  public string Sexo { get; set; } = string.Empty;

  public string? Telefono { get; set; }
  public string? Direccion { get; set; }

  public string? Provincia { get; set; }
  public string? Canton { get; set; }
  public string? Parroquia { get; set; }

  public int? RegistradoPorUsuarioId { get; set; }

  public ICollection<Atencion> Atenciones { get; set; } = new List<Atencion>();
}
