using System.Security.Claims;
using System.Text.Json;
using Hcu008.Api.Data;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PlantillasClinicasController : ControllerBase
{
  private static readonly string[] ModulosPermitidos = ["Diagnosticos", "Prescripciones", "Examenes", "Evoluciones"];
  private readonly Hcu008DbContext _context;

  public PlantillasClinicasController(Hcu008DbContext context) => _context = context;

  [HttpGet]
  public async Task<ActionResult<IEnumerable<PlantillaClinica>>> ObtenerActivas([FromQuery] string? modulo = null)
  {
    var consulta = _context.PlantillasClinicas.AsNoTracking().Where(p => p.Activo);
    if (!string.IsNullOrWhiteSpace(modulo)) consulta = consulta.Where(p => p.Modulo == modulo.Trim());
    return Ok(await consulta.OrderBy(p => p.Modulo).ThenBy(p => p.Nombre).ToListAsync());
  }

  [HttpGet("todos")]
  [Authorize(Roles = "Admin")]
  public async Task<ActionResult<IEnumerable<PlantillaClinica>>> ObtenerTodas() =>
      Ok(await _context.PlantillasClinicas.AsNoTracking().OrderBy(p => p.Modulo).ThenBy(p => p.Nombre).ToListAsync());

  [HttpPost]
  [Authorize(Roles = "Admin")]
  public async Task<ActionResult<PlantillaClinica>> Crear(PlantillaClinica plantilla)
  {
    var error = Validar(plantilla);
    if (error is not null) return BadRequest(error);

    plantilla.Id = 0;
    plantilla.Modulo = plantilla.Modulo.Trim();
    plantilla.Nombre = plantilla.Nombre.Trim();
    plantilla.ClaseColor = (plantilla.ClaseColor ?? string.Empty).Trim();
    plantilla.CreadoPorUsuarioId = ObtenerUsuarioId();
    plantilla.FechaCreacion = DateTime.Now;
    plantilla.Activo = true;

    if (await _context.PlantillasClinicas.AnyAsync(p => p.Modulo == plantilla.Modulo && p.Nombre == plantilla.Nombre))
      return BadRequest("Ya existe una plantilla con ese nombre en el módulo.");

    _context.PlantillasClinicas.Add(plantilla);
    await _context.SaveChangesAsync();
    return CreatedAtAction(nameof(ObtenerActivas), new { modulo = plantilla.Modulo }, plantilla);
  }

  [HttpPut("{id:int}/estado")]
  [Authorize(Roles = "Admin")]
  public async Task<IActionResult> CambiarEstado(int id, [FromQuery] bool activo)
  {
    var plantilla = await _context.PlantillasClinicas.FindAsync(id);
    if (plantilla is null) return NotFound("No se encontró la plantilla.");
    plantilla.Activo = activo;
    await _context.SaveChangesAsync();
    return NoContent();
  }

  [HttpDelete("{id:int}")]
  [Authorize(Roles = "Admin")]
  public async Task<IActionResult> Eliminar(int id)
  {
    var plantilla = await _context.PlantillasClinicas.FindAsync(id);
    if (plantilla is null) return NotFound("No se encontró la plantilla.");
    _context.PlantillasClinicas.Remove(plantilla);
    await _context.SaveChangesAsync();
    return NoContent();
  }

  private int ObtenerUsuarioId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;

  private static string? Validar(PlantillaClinica plantilla)
  {
    if (!ModulosPermitidos.Contains((plantilla.Modulo ?? string.Empty).Trim())) return "El módulo de la plantilla no es válido.";
    if (string.IsNullOrWhiteSpace(plantilla.Nombre) || plantilla.Nombre.Trim().Length < 3) return "El nombre de la plantilla debe tener al menos 3 caracteres.";
    if (plantilla.Nombre.Trim().Length > 80) return "El nombre de la plantilla no debe superar 80 caracteres.";
    if (string.IsNullOrWhiteSpace(plantilla.ContenidoJson) || plantilla.ContenidoJson.Length > 12000) return "El contenido de la plantilla no es válido.";
    try { JsonDocument.Parse(plantilla.ContenidoJson); }
    catch (JsonException) { return "El contenido de la plantilla no tiene un formato válido."; }
    return null;
  }
}
