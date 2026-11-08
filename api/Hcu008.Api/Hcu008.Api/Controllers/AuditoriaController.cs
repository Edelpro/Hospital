using Hcu008.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AuditoriaController : ControllerBase
{
  private readonly Hcu008DbContext context;

  public AuditoriaController(Hcu008DbContext context)
  {
    this.context = context;
  }

  [HttpGet("accesos")]
  public async Task<IActionResult> ObtenerAccesos(
      [FromQuery] int pagina = 1,
      [FromQuery] int tamano = 50,
      [FromQuery] int? usuarioId = null,
      [FromQuery] DateTime? desdeUtc = null,
      [FromQuery] DateTime? hastaUtc = null)
  {
    (pagina, tamano) = NormalizarPaginacion(pagina, tamano);
    var consulta = context.RegistrosAcceso.AsNoTracking().AsQueryable();

    if (usuarioId.HasValue) consulta = consulta.Where(r => r.UsuarioId == usuarioId);
    if (desdeUtc.HasValue) consulta = consulta.Where(r => r.FechaUtc >= desdeUtc.Value);
    if (hastaUtc.HasValue) consulta = consulta.Where(r => r.FechaUtc <= hastaUtc.Value);

    var total = await consulta.CountAsync();
    var datos = await consulta
        .OrderByDescending(r => r.FechaUtc)
        .Skip((pagina - 1) * tamano)
        .Take(tamano)
        .ToListAsync();

    return Ok(new { pagina, tamano, total, datos });
  }

  [HttpGet("cambios")]
  public async Task<IActionResult> ObtenerCambios(
      [FromQuery] int pagina = 1,
      [FromQuery] int tamano = 50,
      [FromQuery] int? atencionId = null,
      [FromQuery] int? usuarioId = null)
  {
    (pagina, tamano) = NormalizarPaginacion(pagina, tamano);
    var consulta = context.RegistrosAuditoria.AsNoTracking().AsQueryable();

    if (atencionId.HasValue) consulta = consulta.Where(r => r.AtencionId == atencionId);
    if (usuarioId.HasValue) consulta = consulta.Where(r => r.UsuarioId == usuarioId);

    var total = await consulta.CountAsync();
    var datos = await consulta
        .OrderByDescending(r => r.FechaUtc)
        .Skip((pagina - 1) * tamano)
        .Take(tamano)
        .ToListAsync();

    return Ok(new { pagina, tamano, total, datos });
  }

  [HttpGet("resumen")]
  public async Task<IActionResult> ObtenerResumen([FromQuery] int horas = 24)
  {
    horas = Math.Clamp(horas, 1, 24 * 31);
    var desde = DateTime.UtcNow.AddHours(-horas);

    var totalAccesos = await context.RegistrosAcceso.CountAsync(r => r.FechaUtc >= desde);
    var accesosFallidos = await context.RegistrosAcceso.CountAsync(r => r.FechaUtc >= desde && !r.Exitoso);
    var totalCambios = await context.RegistrosAuditoria.CountAsync(r => r.FechaUtc >= desde);

    return Ok(new { desdeUtc = desde, horas, totalAccesos, accesosFallidos, totalCambios });
  }

  private static (int pagina, int tamano) NormalizarPaginacion(int pagina, int tamano)
  {
    return (Math.Max(1, pagina), Math.Clamp(tamano, 1, 200));
  }
}
