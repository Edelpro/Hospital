using Hcu008.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ReportesController : ControllerBase
{
  private readonly Hcu008DbContext _context;

  public ReportesController(Hcu008DbContext context)
  {
    _context = context;
  }

  [HttpGet("atencion/{atencionId:int}")]
  public async Task<IActionResult> ObtenerReporteAtencion(int atencionId)
  {
    if (atencionId <= 0)
    {
      return BadRequest("Debe enviar una atención válida.");
    }

    var atencion = await _context.Atenciones
        .AsNoTracking()
        .AsSplitQuery()
        .Include(a => a.Paciente)
        .Include(a => a.Triaje)
        .Include(a => a.EvaluacionMedica)
        .Include(a => a.Diagnosticos)
        .Include(a => a.Prescripciones)
        .Include(a => a.Examenes)
        .Include(a => a.Evoluciones)
        .Include(a => a.Egreso)
        .FirstOrDefaultAsync(a => a.Id == atencionId);

    if (atencion is null)
    {
      return NotFound("La atención no existe.");
    }

    atencion.Diagnosticos = atencion.Diagnosticos
        .OrderBy(d => d.Condicion == "Principal" ? 0 : 1)
        .ThenBy(d => d.TipoDiagnostico == "Definitivo" ? 0 : 1)
        .ThenBy(d => d.FechaRegistro)
        .ToList();

    atencion.Prescripciones = atencion.Prescripciones
        .OrderByDescending(p => p.EsUrgente)
        .ThenByDescending(p => p.AdministrarAhora)
        .ThenByDescending(p => p.FechaRegistro)
        .ToList();

    atencion.Examenes = atencion.Examenes
        .OrderByDescending(e => e.EsUrgente)
        .ThenByDescending(e => e.Prioridad == "Emergente")
        .ThenByDescending(e => e.Prioridad == "Urgente")
        .ThenByDescending(e => e.FechaSolicitud)
        .ToList();

    atencion.Evoluciones = atencion.Evoluciones
        .OrderByDescending(e => e.EsCritica)
        .ThenByDescending(e => e.FechaRegistro)
        .ToList();

    var respuesta = new
    {
      fechaGeneracion = DateTime.Now,
      atencion
    };

    return Ok(respuesta);
  }
}
