using System.ComponentModel.DataAnnotations;

namespace Hcu008.Api.Models;

public class RegistroAcceso
{
  public long Id { get; set; }
  public DateTime FechaUtc { get; set; }
  public int? UsuarioId { get; set; }

  [MaxLength(250)]
  public string Usuario { get; set; } = "";

  [MaxLength(40)]
  public string Rol { get; set; } = "";

  [MaxLength(12)]
  public string Metodo { get; set; } = "";

  [MaxLength(300)]
  public string Ruta { get; set; } = "";

  [MaxLength(45)]
  public string DireccionIp { get; set; } = "";

  [MaxLength(40)]
  public string Evento { get; set; } = "";

  [MaxLength(120)]
  public string Resultado { get; set; } = "";

  [MaxLength(80)]
  public string CorrelacionId { get; set; } = "";

  public int CodigoEstado { get; set; }
  public long DuracionMs { get; set; }
  public bool Exitoso { get; set; }
}
