using Hcu008.Api.Data;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DiagnosticosController : ControllerBase
{
  private readonly Hcu008DbContext _context;

  public DiagnosticosController(Hcu008DbContext context)
  {
    _context = context;
  }

  [HttpGet("atencion/{atencionId:int}")]
  public async Task<ActionResult<List<Diagnostico>>> ObtenerPorAtencion(int atencionId)
  {
    if (atencionId <= 0)
    {
      return BadRequest("Debe enviar una atención válida.");
    }

    var existeAtencion = await _context.Atenciones
        .AnyAsync(a => a.Id == atencionId);

    if (!existeAtencion)
    {
      return NotFound("No se encontró la atención indicada.");
    }

    var diagnosticos = await _context.Diagnosticos
        .AsNoTracking()
        .Where(d => d.AtencionId == atencionId)
        .OrderBy(d => d.Condicion == "Principal" ? 0 : 1)
        .ThenBy(d => d.TipoDiagnostico == "Definitivo" ? 0 : 1)
        .ThenBy(d => d.FechaRegistro)
        .ToListAsync();

    return Ok(diagnosticos);
  }

  [HttpPost("guardar")]
  public async Task<ActionResult<Diagnostico>> Guardar(Diagnostico solicitud)
  {
    if (solicitud.AtencionId <= 0)
    {
      return BadRequest("Debe enviar una atención válida.");
    }

    var atencion = await _context.Atenciones
        .FirstOrDefaultAsync(a => a.Id == solicitud.AtencionId);

    if (atencion == null)
    {
      return NotFound("No se encontró la atención indicada.");
    }

    if (atencion.Estado == "Cerrada")
    {
      return BadRequest("No se puede modificar una atención cerrada.");
    }

    var codigo = LimpiarTexto(solicitud.CodigoCie10)?.ToUpperInvariant();
    var descripcion = LimpiarTexto(solicitud.DescripcionCie10);
    var tipo = LimpiarTexto(solicitud.TipoDiagnostico);
    var condicion = LimpiarTexto(solicitud.Condicion);

    if (string.IsNullOrWhiteSpace(codigo))
    {
      return BadRequest("El código CIE-10 es obligatorio.");
    }

    if (string.IsNullOrWhiteSpace(descripcion))
    {
      return BadRequest("La descripción del diagnóstico es obligatoria.");
    }

    if (tipo != "Presuntivo" && tipo != "Definitivo")
    {
      return BadRequest("El tipo de diagnóstico debe ser Presuntivo o Definitivo.");
    }

    if (condicion != "Principal" && condicion != "Secundario")
    {
      return BadRequest("La condición del diagnóstico debe ser Principal o Secundario.");
    }

    var existeMismoCodigo = await _context.Diagnosticos.AnyAsync(d =>
        d.AtencionId == solicitud.AtencionId &&
        d.Id != solicitud.Id &&
        d.CodigoCie10 == codigo
    );

    if (existeMismoCodigo)
    {
      return BadRequest("Ya existe un diagnóstico registrado con el mismo código CIE-10 en esta atención.");
    }

    if (condicion == "Principal")
    {
      var existePrincipal = await _context.Diagnosticos.AnyAsync(d =>
          d.AtencionId == solicitud.AtencionId &&
          d.Id != solicitud.Id &&
          d.Condicion == "Principal"
      );

      if (existePrincipal)
      {
        return BadRequest("Esta atención ya tiene un diagnóstico principal registrado.");
      }
    }

    Diagnostico? diagnostico;

    if (solicitud.Id > 0)
    {
      diagnostico = await _context.Diagnosticos
          .FirstOrDefaultAsync(d => d.Id == solicitud.Id && d.AtencionId == solicitud.AtencionId);

      if (diagnostico == null)
      {
        return NotFound("No se encontró el diagnóstico indicado.");
      }
    }
    else
    {
      diagnostico = new Diagnostico
      {
        AtencionId = solicitud.AtencionId,
        FechaRegistro = DateTime.Now
      };

      _context.Diagnosticos.Add(diagnostico);
    }

    diagnostico.CodigoCie10 = codigo;
    diagnostico.DescripcionCie10 = descripcion;
    diagnostico.TipoDiagnostico = tipo;
    diagnostico.Condicion = condicion;
    diagnostico.Observacion = LimpiarTexto(solicitud.Observacion);
    diagnostico.FechaRegistro = DateTime.Now;

    if (atencion.Estado != "Con egreso" && atencion.Estado != "Cerrada")
    {
      atencion.Estado = "Con diagnóstico";
    }

    await _context.SaveChangesAsync();

    diagnostico.Atencion = null;

    return Ok(diagnostico);
  }

  [HttpDelete("{id:int}")]
  [Authorize(Roles = "Admin")]
  public async Task<IActionResult> Eliminar(int id)
  {
    var diagnostico = await _context.Diagnosticos
        .FirstOrDefaultAsync(d => d.Id == id);

    if (diagnostico == null)
    {
      return NotFound("No se encontró el diagnóstico indicado.");
    }

    var atencion = await _context.Atenciones
        .FirstOrDefaultAsync(a => a.Id == diagnostico.AtencionId);

    if (atencion?.Estado == "Cerrada")
    {
      return BadRequest("No se puede eliminar un diagnóstico de una atención cerrada.");
    }

    _context.Diagnosticos.Remove(diagnostico);
    await _context.SaveChangesAsync();

    return NoContent();
  }

  private static string? LimpiarTexto(string? valor)
  {
    if (string.IsNullOrWhiteSpace(valor))
    {
      return null;
    }

    return valor.Trim();
  }
}
