using System.ComponentModel.DataAnnotations;
namespace Hcu008.Api.Models;
public class RegistroAuditoria
{
  public long Id { get; set; }
  public DateTime FechaUtc { get; set; }
  public int UsuarioId { get; set; }
  [MaxLength(250)] public string Usuario { get; set; } = "";
  [MaxLength(40)] public string Rol { get; set; } = "";
  [MaxLength(80)] public string Entidad { get; set; } = "";
  public int RegistroId { get; set; }
  public int? AtencionId { get; set; }
  [MaxLength(20)] public string Operacion { get; set; } = "";
  [MaxLength(2000)] public string Campos { get; set; } = "";
}
