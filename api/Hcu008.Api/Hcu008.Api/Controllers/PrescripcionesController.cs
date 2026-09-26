using Hcu008.Api.Data;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class PrescripcionesController : ControllerBase
{
  private readonly Hcu008DbContext _context;

  public PrescripcionesController(Hcu008DbContext context)
  {
    _context = context;
  }

  [HttpGet("atencion/{atencionId:int}")]
  public async Task<ActionResult<List<Prescripcion>>> ObtenerPorAtencion(int atencionId)
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

    var prescripciones = await _context.Prescripciones
        .AsNoTracking()
        .Where(p => p.AtencionId == atencionId)
        .OrderByDescending(p => p.EsUrgente)
        .ThenByDescending(p => p.AdministrarAhora)
        .ThenByDescending(p => p.FechaRegistro)
        .ToListAsync();

    return Ok(prescripciones);
  }

  [HttpPost]
  public async Task<ActionResult<Prescripcion>> GuardarPrescripcion(Prescripcion prescripcion)
  {
    NormalizarPrescripcion(prescripcion);

    var validacion = ValidarPrescripcion(prescripcion);

    if (!string.IsNullOrWhiteSpace(validacion))
    {
      return BadRequest(validacion);
    }

    var atencion = await _context.Atenciones
        .FirstOrDefaultAsync(a => a.Id == prescripcion.AtencionId);

    if (atencion is null)
    {
      return NotFound("La atención no existe.");
    }

    if (atencion.Estado == "Cerrada" || atencion.Estado == "Con egreso")
    {
      return BadRequest("No se puede registrar o modificar prescripciones en una atención cerrada o con egreso.");
    }

    var existeDuplicado = await _context.Prescripciones.AnyAsync(p =>
        p.AtencionId == prescripcion.AtencionId &&
        p.Id != prescripcion.Id &&
        p.Medicamento.ToLower() == prescripcion.Medicamento.ToLower() &&
        p.ViaAdministracion.ToLower() == prescripcion.ViaAdministracion.ToLower() &&
        p.Frecuencia.ToLower() == prescripcion.Frecuencia.ToLower() &&
        p.Estado == "Activa"
    );

    if (existeDuplicado)
    {
      return BadRequest("Ya existe una prescripción activa con el mismo medicamento, vía y frecuencia.");
    }

    if (prescripcion.Id > 0)
    {
      var prescripcionExistente = await _context.Prescripciones
          .FirstOrDefaultAsync(p => p.Id == prescripcion.Id && p.AtencionId == prescripcion.AtencionId);

      if (prescripcionExistente is null)
      {
        return NotFound("La prescripción no existe.");
      }

      prescripcionExistente.Medicamento = prescripcion.Medicamento;
      prescripcionExistente.Presentacion = prescripcion.Presentacion;
      prescripcionExistente.Dosis = prescripcion.Dosis;
      prescripcionExistente.ViaAdministracion = prescripcion.ViaAdministracion;
      prescripcionExistente.Frecuencia = prescripcion.Frecuencia;
      prescripcionExistente.Duracion = prescripcion.Duracion;
      prescripcionExistente.Cantidad = prescripcion.Cantidad;
      prescripcionExistente.Indicaciones = prescripcion.Indicaciones;
      prescripcionExistente.AdministrarAhora = prescripcion.AdministrarAhora;
      prescripcionExistente.EsUrgente = prescripcion.EsUrgente;
      prescripcionExistente.Estado = prescripcion.Estado;
      prescripcionExistente.FechaRegistro = DateTime.Now;

      if (atencion.Estado != "Con egreso" && atencion.Estado != "Cerrada")
      {
        atencion.Estado = "Con prescripción";
      }

      await _context.SaveChangesAsync();

      prescripcionExistente.Atencion = null;

      return Ok(prescripcionExistente);
    }

    prescripcion.Id = 0;
    prescripcion.FechaRegistro = DateTime.Now;
    prescripcion.Atencion = null;

    _context.Prescripciones.Add(prescripcion);

    if (atencion.Estado != "Con egreso" && atencion.Estado != "Cerrada")
    {
      atencion.Estado = "Con prescripción";
    }

    await _context.SaveChangesAsync();

    prescripcion.Atencion = null;

    return Ok(prescripcion);
  }

  [Authorize(Roles = "Admin")]
  [HttpDelete("{id:int}")]
  public async Task<IActionResult> EliminarPrescripcion(int id)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar un identificador válido.");
    }

    var prescripcion = await _context.Prescripciones
        .FirstOrDefaultAsync(p => p.Id == id);

    if (prescripcion is null)
    {
      return NotFound("La prescripción no existe.");
    }

    var atencion = await _context.Atenciones
        .FirstOrDefaultAsync(a => a.Id == prescripcion.AtencionId);

    if (atencion is not null &&
        (atencion.Estado == "Cerrada" || atencion.Estado == "Con egreso"))
    {
      return BadRequest("No se puede eliminar prescripciones de una atención cerrada o con egreso.");
    }

    _context.Prescripciones.Remove(prescripcion);

    await _context.SaveChangesAsync();

    return NoContent();
  }

  private static string ValidarPrescripcion(Prescripcion prescripcion)
  {
    if (prescripcion.AtencionId <= 0)
    {
      return "La atención es requerida.";
    }

    if (string.IsNullOrWhiteSpace(prescripcion.Medicamento))
    {
      return "El medicamento es requerido.";
    }

    if (prescripcion.Medicamento.Length < 3)
    {
      return "El medicamento debe tener al menos 3 caracteres.";
    }

    if (string.IsNullOrWhiteSpace(prescripcion.Dosis))
    {
      return "La dosis es requerida.";
    }

    if (string.IsNullOrWhiteSpace(prescripcion.ViaAdministracion))
    {
      return "La vía de administración es requerida.";
    }

    if (string.IsNullOrWhiteSpace(prescripcion.Frecuencia))
    {
      return "La frecuencia es requerida.";
    }

    if (string.IsNullOrWhiteSpace(prescripcion.Duracion))
    {
      return "La duración es requerida.";
    }

    var estadosPermitidos = new[]
    {
            "Activa",
            "Suspendida",
            "Completada",
            "Cancelada"
        };

    if (!estadosPermitidos.Contains(prescripcion.Estado))
    {
      return "El estado de la prescripción no es válido.";
    }

    return string.Empty;
  }

  private static void NormalizarPrescripcion(Prescripcion prescripcion)
  {
    prescripcion.Medicamento = NormalizarTextoRequerido(prescripcion.Medicamento);
    prescripcion.Presentacion = NormalizarTextoOpcional(prescripcion.Presentacion);
    prescripcion.Dosis = NormalizarTextoRequerido(prescripcion.Dosis);
    prescripcion.ViaAdministracion = NormalizarTextoRequerido(prescripcion.ViaAdministracion);
    prescripcion.Frecuencia = NormalizarTextoRequerido(prescripcion.Frecuencia);
    prescripcion.Duracion = NormalizarTextoRequerido(prescripcion.Duracion);
    prescripcion.Cantidad = NormalizarTextoOpcional(prescripcion.Cantidad);
    prescripcion.Indicaciones = NormalizarTextoOpcional(prescripcion.Indicaciones);

    prescripcion.Estado = string.IsNullOrWhiteSpace(prescripcion.Estado)
        ? "Activa"
        : NormalizarTextoRequerido(prescripcion.Estado);
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
