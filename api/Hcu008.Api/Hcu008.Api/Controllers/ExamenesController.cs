using Hcu008.Api.Data;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ExamenesController : ControllerBase
{
  private readonly Hcu008DbContext _context;

  public ExamenesController(Hcu008DbContext context)
  {
    _context = context;
  }

  [HttpGet("atencion/{atencionId:int}")]
  public async Task<ActionResult<List<Examen>>> ObtenerPorAtencion(int atencionId)
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

    var examenes = await _context.Examenes
        .AsNoTracking()
        .Where(e => e.AtencionId == atencionId)
        .OrderByDescending(e => e.EsUrgente)
        .ThenByDescending(e => e.Prioridad == "Emergente")
        .ThenByDescending(e => e.Prioridad == "Urgente")
        .ThenByDescending(e => e.FechaSolicitud)
        .ToListAsync();

    return Ok(examenes);
  }

  [HttpPost]
  public async Task<ActionResult<Examen>> GuardarExamen(Examen examen)
  {
    NormalizarExamen(examen);

    var validacion = ValidarExamen(examen);

    if (!string.IsNullOrWhiteSpace(validacion))
    {
      return BadRequest(validacion);
    }

    var atencion = await _context.Atenciones
        .FirstOrDefaultAsync(a => a.Id == examen.AtencionId);

    if (atencion is null)
    {
      return NotFound("La atención no existe.");
    }

    if (atencion.Estado == "Cerrada" || atencion.Estado == "Con egreso")
    {
      return BadRequest("No se puede registrar o modificar exámenes en una atención cerrada o con egreso.");
    }

    if (examen.Estado == "Resultado disponible" && examen.FechaResultado is null)
    {
      examen.FechaResultado = DateTime.Now;
    }

    if (examen.Estado != "Resultado disponible")
    {
      examen.FechaResultado = null;
    }

    var existeDuplicado = await _context.Examenes.AnyAsync(e =>
        e.AtencionId == examen.AtencionId &&
        e.Id != examen.Id &&
        e.TipoExamen.ToLower() == examen.TipoExamen.ToLower() &&
        e.NombreExamen.ToLower() == examen.NombreExamen.ToLower() &&
        e.Estado != "Cancelado"
    );

    if (existeDuplicado)
    {
      return BadRequest("Ya existe una solicitud activa con el mismo examen.");
    }

    if (examen.Id > 0)
    {
      var examenExistente = await _context.Examenes
          .FirstOrDefaultAsync(e => e.Id == examen.Id && e.AtencionId == examen.AtencionId);

      if (examenExistente is null)
      {
        return NotFound("El examen no existe.");
      }

      examenExistente.TipoExamen = examen.TipoExamen;
      examenExistente.NombreExamen = examen.NombreExamen;
      examenExistente.Prioridad = examen.Prioridad;
      examenExistente.IndicacionClinica = examen.IndicacionClinica;
      examenExistente.Observacion = examen.Observacion;
      examenExistente.RequiereAyuno = examen.RequiereAyuno;
      examenExistente.EsUrgente = examen.EsUrgente;
      examenExistente.Estado = examen.Estado;
      examenExistente.ResultadoResumen = examen.ResultadoResumen;
      examenExistente.FechaResultado = examen.FechaResultado;

      await _context.SaveChangesAsync();

      examenExistente.Atencion = null;

      return Ok(examenExistente);
    }

    examen.Id = 0;
    examen.FechaSolicitud = DateTime.Now;
    examen.Atencion = null;

    _context.Examenes.Add(examen);

    if (atencion.Estado != "Con egreso" && atencion.Estado != "Cerrada")
    {
      atencion.Estado = "Con exámenes";
    }

    await _context.SaveChangesAsync();

    examen.Atencion = null;

    return Ok(examen);
  }
  [Authorize(Roles = "Admin")]
  [HttpDelete("{id:int}")]
  public async Task<IActionResult> EliminarExamen(int id)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar un identificador válido.");
    }

    var examen = await _context.Examenes
        .FirstOrDefaultAsync(e => e.Id == id);

    if (examen is null)
    {
      return NotFound("El examen no existe.");
    }

    var atencion = await _context.Atenciones
        .FirstOrDefaultAsync(a => a.Id == examen.AtencionId);

    if (atencion is not null &&
        (atencion.Estado == "Cerrada" || atencion.Estado == "Con egreso"))
    {
      return BadRequest("No se puede eliminar exámenes de una atención cerrada o con egreso.");
    }

    _context.Examenes.Remove(examen);

    await _context.SaveChangesAsync();

    return NoContent();
  }

  private static string ValidarExamen(Examen examen)
  {
    if (examen.AtencionId <= 0)
    {
      return "La atención es requerida.";
    }

    if (string.IsNullOrWhiteSpace(examen.TipoExamen))
    {
      return "El tipo de examen es requerido.";
    }

    if (string.IsNullOrWhiteSpace(examen.NombreExamen))
    {
      return "El nombre del examen es requerido.";
    }

    if (examen.NombreExamen.Length < 3)
    {
      return "El nombre del examen debe tener al menos 3 caracteres.";
    }

    if (string.IsNullOrWhiteSpace(examen.Prioridad))
    {
      return "La prioridad es requerida.";
    }

    if (string.IsNullOrWhiteSpace(examen.IndicacionClinica))
    {
      return "La indicación clínica es requerida.";
    }

    if (examen.IndicacionClinica.Length < 8)
    {
      return "La indicación clínica debe tener una descripción mínima.";
    }

    var prioridadesPermitidas = new[]
    {
            "Rutina",
            "Urgente",
            "Emergente"
        };

    if (!prioridadesPermitidas.Contains(examen.Prioridad))
    {
      return "La prioridad del examen no es válida.";
    }

    var estadosPermitidos = new[]
    {
            "Solicitado",
            "Tomado",
            "Pendiente resultado",
            "En proceso",
            "Resultado disponible",
            "Cancelado"
        };

    if (!estadosPermitidos.Contains(examen.Estado))
    {
      return "El estado del examen no es válido.";
    }

    if (examen.Estado == "Resultado disponible" &&
        string.IsNullOrWhiteSpace(examen.ResultadoResumen))
    {
      return "Debe ingresar un resumen del resultado cuando el examen está disponible.";
    }

    return string.Empty;
  }

  private static void NormalizarExamen(Examen examen)
  {
    examen.TipoExamen = NormalizarTextoRequerido(examen.TipoExamen);
    examen.NombreExamen = NormalizarTextoRequerido(examen.NombreExamen);
    examen.Prioridad = NormalizarTextoRequerido(examen.Prioridad);
    examen.IndicacionClinica = NormalizarTextoRequerido(examen.IndicacionClinica);
    examen.Observacion = NormalizarTextoOpcional(examen.Observacion);
    examen.ResultadoResumen = NormalizarTextoOpcional(examen.ResultadoResumen);

    examen.Estado = string.IsNullOrWhiteSpace(examen.Estado)
        ? "Solicitado"
        : NormalizarTextoRequerido(examen.Estado);
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
