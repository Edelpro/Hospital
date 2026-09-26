using Hcu008.Api.Data;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class EvolucionesController : ControllerBase
{
  private readonly Hcu008DbContext _context;

  public EvolucionesController(Hcu008DbContext context)
  {
    _context = context;
  }

  [HttpGet("atencion/{atencionId:int}")]
  public async Task<ActionResult<List<Evolucion>>> ObtenerPorAtencion(int atencionId)
  {
    if (atencionId <= 0)
    {
      return BadRequest("Debe enviar una atención válida.");
    }

    var existeAtencion = await _context.Atenciones
        .AnyAsync(a => a.Id == atencionId);

    if (!existeAtencion)
    {
      return NotFound("La atención no existe.");
    }

    var evoluciones = await _context.Evoluciones
        .AsNoTracking()
        .Where(e => e.AtencionId == atencionId)
        .OrderByDescending(e => e.EsCritica)
        .ThenByDescending(e => e.FechaRegistro)
        .ToListAsync();

    return Ok(evoluciones);
  }

  [HttpPost]
  public async Task<ActionResult<Evolucion>> GuardarEvolucion(Evolucion evolucion)
  {
    NormalizarEvolucion(evolucion);

    var validacion = ValidarEvolucion(evolucion);

    if (!string.IsNullOrWhiteSpace(validacion))
    {
      return BadRequest(validacion);
    }

    var atencion = await _context.Atenciones
        .FirstOrDefaultAsync(a => a.Id == evolucion.AtencionId);

    if (atencion is null)
    {
      return NotFound("La atención no existe.");
    }

    if (atencion.Estado == "Cerrada" || atencion.Estado == "Con egreso")
    {
      return BadRequest("No se puede registrar o modificar evoluciones en una atención cerrada o con egreso.");
    }

    if (evolucion.Id > 0)
    {
      var evolucionExistente = await _context.Evoluciones
          .FirstOrDefaultAsync(e => e.Id == evolucion.Id && e.AtencionId == evolucion.AtencionId);

      if (evolucionExistente is null)
      {
        return NotFound("La evolución no existe.");
      }

      evolucionExistente.TipoEvolucion = evolucion.TipoEvolucion;
      evolucionExistente.CondicionPaciente = evolucion.CondicionPaciente;
      evolucionExistente.Subjetivo = evolucion.Subjetivo;
      evolucionExistente.Objetivo = evolucion.Objetivo;
      evolucionExistente.Analisis = evolucion.Analisis;
      evolucionExistente.Plan = evolucion.Plan;
      evolucionExistente.SignosVitalesResumen = evolucion.SignosVitalesResumen;
      evolucionExistente.RespuestaTratamiento = evolucion.RespuestaTratamiento;
      evolucionExistente.RequiereReevaluacion = evolucion.RequiereReevaluacion;
      evolucionExistente.EsCritica = evolucion.EsCritica;
      evolucionExistente.Estado = evolucion.Estado;

      await _context.SaveChangesAsync();

      evolucionExistente.Atencion = null;

      return Ok(evolucionExistente);
    }

    evolucion.Id = 0;
    evolucion.FechaRegistro = DateTime.Now;
    evolucion.Atencion = null;

    _context.Evoluciones.Add(evolucion);

    if (atencion.Estado != "Con egreso" && atencion.Estado != "Cerrada")
    {
      atencion.Estado = "Con evolución";
    }

    await _context.SaveChangesAsync();

    evolucion.Atencion = null;

    return Ok(evolucion);
  }
  [Authorize(Roles = "Admin")]
  [HttpDelete("{id:int}")]
  public async Task<IActionResult> EliminarEvolucion(int id)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar un identificador válido.");
    }

    var evolucion = await _context.Evoluciones
        .FirstOrDefaultAsync(e => e.Id == id);

    if (evolucion is null)
    {
      return NotFound("La evolución no existe.");
    }

    var atencion = await _context.Atenciones
        .FirstOrDefaultAsync(a => a.Id == evolucion.AtencionId);

    if (atencion is not null &&
        (atencion.Estado == "Cerrada" || atencion.Estado == "Con egreso"))
    {
      return BadRequest("No se puede eliminar evoluciones de una atención cerrada o con egreso.");
    }

    _context.Evoluciones.Remove(evolucion);

    await _context.SaveChangesAsync();

    return NoContent();
  }

  private static string ValidarEvolucion(Evolucion evolucion)
  {
    if (evolucion.AtencionId <= 0)
    {
      return "La atención es requerida.";
    }

    if (string.IsNullOrWhiteSpace(evolucion.TipoEvolucion))
    {
      return "El tipo de evolución es requerido.";
    }

    if (string.IsNullOrWhiteSpace(evolucion.CondicionPaciente))
    {
      return "La condición del paciente es requerida.";
    }

    if (string.IsNullOrWhiteSpace(evolucion.Objetivo))
    {
      return "El objetivo es requerido.";
    }

    if (evolucion.Objetivo.Length < 8)
    {
      return "El objetivo debe tener una descripción mínima.";
    }

    if (string.IsNullOrWhiteSpace(evolucion.Analisis))
    {
      return "El análisis es requerido.";
    }

    if (evolucion.Analisis.Length < 8)
    {
      return "El análisis debe tener una descripción mínima.";
    }

    if (string.IsNullOrWhiteSpace(evolucion.Plan))
    {
      return "El plan es requerido.";
    }

    if (evolucion.Plan.Length < 8)
    {
      return "El plan debe tener una descripción mínima.";
    }

    var estadosPermitidos = new[]
    {
            "Activa",
            "Corregida",
            "Anulada"
        };

    if (!estadosPermitidos.Contains(evolucion.Estado))
    {
      return "El estado de la evolución no es válido.";
    }

    if (evolucion.EsCritica &&
        evolucion.CondicionPaciente != "Crítico" &&
        evolucion.CondicionPaciente != "Deteriorado")
    {
      return "Una evolución marcada como crítica debe tener condición Crítico o Deteriorado.";
    }

    return string.Empty;
  }

  private static void NormalizarEvolucion(Evolucion evolucion)
  {
    evolucion.TipoEvolucion = NormalizarTextoRequerido(evolucion.TipoEvolucion);
    evolucion.CondicionPaciente = NormalizarTextoRequerido(evolucion.CondicionPaciente);
    evolucion.Subjetivo = NormalizarTextoOpcional(evolucion.Subjetivo);
    evolucion.Objetivo = NormalizarTextoRequerido(evolucion.Objetivo);
    evolucion.Analisis = NormalizarTextoRequerido(evolucion.Analisis);
    evolucion.Plan = NormalizarTextoRequerido(evolucion.Plan);
    evolucion.SignosVitalesResumen = NormalizarTextoOpcional(evolucion.SignosVitalesResumen);
    evolucion.RespuestaTratamiento = NormalizarTextoOpcional(evolucion.RespuestaTratamiento);

    evolucion.Estado = string.IsNullOrWhiteSpace(evolucion.Estado)
        ? "Activa"
        : NormalizarTextoRequerido(evolucion.Estado);
  }

  private static string NormalizarTextoRequerido(string? valor)
  {
    return (valor ?? string.Empty).Trim();
  }

  private static string? NormalizarTextoOpcional(string? valor)
  {
    var texto = (valor ?? string.Empty).Trim();

    return string.IsNullOrWhiteSpace(texto) ? null : texto;
  }
}
