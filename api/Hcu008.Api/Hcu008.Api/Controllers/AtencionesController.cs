using Hcu008.Api.Data;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Hcu008.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AtencionesController : ControllerBase
{
  private readonly Hcu008DbContext _context;

  public AtencionesController(Hcu008DbContext context)
  {
    _context = context;
  }

  [HttpGet]
  public async Task<ActionResult<IEnumerable<Atencion>>> GetAtenciones([FromQuery] int? pacienteId = null)
  {
    var atenciones = await _context.Atenciones
        .AsNoTracking()
        .Include(a => a.Paciente)
        .Include(a => a.Triaje)
        .Where(a => !pacienteId.HasValue || a.PacienteId == pacienteId.Value)
        .OrderByDescending(a => a.FechaIngreso)
        .ToListAsync();

    return Ok(atenciones);
  }

  [HttpGet("activas")]
  public async Task<ActionResult<IEnumerable<Atencion>>> GetAtencionesActivas()
  {
    var atenciones = await _context.Atenciones
        .AsNoTracking()
        .Include(a => a.Paciente)
        .Include(a => a.Triaje)
        .Where(a => a.Estado != "Cerrada" && a.Estado != "Con egreso")
        .OrderBy(a => a.FechaIngreso)
        .ToListAsync();

    return Ok(atenciones);
  }

  [HttpGet("{id:int}")]
  public async Task<ActionResult<Atencion>> GetAtencion(int id)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar un identificador válido.");
    }

    var atencion = await _context.Atenciones
        .AsNoTracking()
        .Include(a => a.Paciente)
        .Include(a => a.Triaje)
        .Include(a => a.EvaluacionMedica)
        .Include(a => a.Diagnosticos)
        .Include(a => a.Prescripciones)
        .Include(a => a.Examenes)
        .Include(a => a.Evoluciones)
        .Include(a => a.Egreso)
        .FirstOrDefaultAsync(a => a.Id == id);

    if (atencion == null)
    {
      return NotFound("No se encontró la atención solicitada.");
    }

    return Ok(atencion);
  }

  [HttpPost]
  public async Task<ActionResult<Atencion>> CrearAtencion(Atencion atencion)
  {
    var validacion = ValidarAtencion(atencion);

    if (!string.IsNullOrWhiteSpace(validacion))
    {
      return BadRequest(validacion);
    }

    var pacienteExiste = await _context.Pacientes
        .AnyAsync(p => p.Id == atencion.PacienteId);

    if (!pacienteExiste)
    {
      return BadRequest("El paciente indicado no existe.");
    }

    var existeAtencionActiva = await _context.Atenciones
        .AnyAsync(a =>
            a.PacienteId == atencion.PacienteId &&
            a.Estado != "Cerrada" &&
            a.Estado != "Con egreso"
        );

    if (existeAtencionActiva)
    {
      return BadRequest("El paciente ya tiene una atención activa. Abra la atención existente desde el tablero.");
    }

    NormalizarAtencion(atencion);

    atencion.Id = 0;
    atencion.ResponsableUsuarioId = ObtenerUsuarioActualId();
    atencion.FechaIngreso = DateTime.Now;
    atencion.Estado = "Abierta";

    atencion.Paciente = null;
    atencion.Triaje = null;
    atencion.EvaluacionMedica = null;
    atencion.Egreso = null;

    atencion.Diagnosticos = new List<Diagnostico>();
    atencion.Prescripciones = new List<Prescripcion>();
    atencion.Examenes = new List<Examen>();
    atencion.Evoluciones = new List<Evolucion>();

    _context.Atenciones.Add(atencion);
    await _context.SaveChangesAsync();

    var atencionCreada = await _context.Atenciones
        .AsNoTracking()
        .Include(a => a.Paciente)
        .Include(a => a.Triaje)
        .FirstOrDefaultAsync(a => a.Id == atencion.Id);

    return CreatedAtAction(nameof(GetAtencion), new { id = atencion.Id }, atencionCreada);
  }

  [HttpPut("{id:int}")]
  public async Task<ActionResult<Atencion>> ActualizarAtencion(int id, Atencion atencion)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar un identificador válido.");
    }

    if (id != atencion.Id)
    {
      return BadRequest("El identificador de la atención no coincide.");
    }

    var validacion = ValidarAtencion(atencion);

    if (!string.IsNullOrWhiteSpace(validacion))
    {
      return BadRequest(validacion);
    }

    var atencionExistente = await _context.Atenciones
        .FirstOrDefaultAsync(a => a.Id == id);

    if (atencionExistente == null)
    {
      return NotFound("No se encontró la atención.");
    }

    if (atencionExistente.Estado == "Cerrada")
    {
      return BadRequest("No se puede editar una atención cerrada.");
    }

    NormalizarAtencion(atencion);

    atencionExistente.MotivoConsulta = atencion.MotivoConsulta;
    atencionExistente.MotivoConsultaOtro = atencion.MotivoConsultaOtro;
    atencionExistente.EnfermedadActualBreve = atencion.EnfermedadActualBreve;
    atencionExistente.Procedencia = atencion.Procedencia;
    atencionExistente.CondicionLlegada = atencion.CondicionLlegada;
    atencionExistente.TieneAcompanante = atencion.TieneAcompanante;
    atencionExistente.NombreAcompanante = atencion.NombreAcompanante;
    atencionExistente.ParentescoAcompanante = atencion.ParentescoAcompanante;
    atencionExistente.TelefonoAcompanante = atencion.TelefonoAcompanante;

    await _context.SaveChangesAsync();

    var atencionActualizada = await _context.Atenciones
        .AsNoTracking()
        .Include(a => a.Paciente)
        .Include(a => a.Triaje)
        .FirstOrDefaultAsync(a => a.Id == id);

    return Ok(atencionActualizada);
  }

  [HttpPut("{id:int}/cerrar")]
  public async Task<IActionResult> CerrarAtencion(int id)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar un identificador válido.");
    }

    var atencion = await _context.Atenciones.FindAsync(id);

    if (atencion == null)
    {
      return NotFound("No se encontró la atención.");
    }

    if (atencion.Estado == "Cerrada")
    {
      return NoContent();
    }

    if (!await _context.Egresos.AnyAsync(e => e.AtencionId == id))
      return BadRequest("Debe registrar el egreso antes de cerrar la atención.");
    atencion.Estado = "Cerrada";

    await _context.SaveChangesAsync();

    return NoContent();
  }

  [HttpDelete("{id:int}")]
  [Authorize(Roles = "Admin")]
  public async Task<IActionResult> EliminarAtencion(int id)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar una atención válida.");
    }

    var atencion = await _context.Atenciones
        .Include(a => a.Triaje)
        .Include(a => a.EvaluacionMedica)
        .Include(a => a.Diagnosticos)
        .Include(a => a.Prescripciones)
        .Include(a => a.Examenes)
        .Include(a => a.Evoluciones)
        .Include(a => a.Egreso)
        .FirstOrDefaultAsync(a => a.Id == id);

    if (atencion == null)
    {
      return NotFound("No se encontró la atención.");
    }

    if (atencion.Estado == "Cerrada")
    {
      return BadRequest("No se puede eliminar una atención cerrada.");
    }

    if (atencion.Egreso != null)
    {
      _context.Egresos.Remove(atencion.Egreso);
    }

    if (atencion.Evoluciones?.Any() == true)
    {
      _context.Evoluciones.RemoveRange(atencion.Evoluciones);
    }

    if (atencion.Examenes?.Any() == true)
    {
      _context.Examenes.RemoveRange(atencion.Examenes);
    }

    if (atencion.Prescripciones?.Any() == true)
    {
      _context.Prescripciones.RemoveRange(atencion.Prescripciones);
    }

    if (atencion.Diagnosticos?.Any() == true)
    {
      _context.Diagnosticos.RemoveRange(atencion.Diagnosticos);
    }

    if (atencion.EvaluacionMedica != null)
    {
      _context.EvaluacionesMedicas.Remove(atencion.EvaluacionMedica);
    }

    if (atencion.Triaje != null)
    {
      _context.Triajes.Remove(atencion.Triaje);
    }

    _context.Atenciones.Remove(atencion);

    await _context.SaveChangesAsync();

    return NoContent();
  }

  private static string ValidarAtencion(Atencion atencion)
  {
    if (atencion.PacienteId <= 0)
    {
      return "Debe seleccionar un paciente válido.";
    }

    if (string.IsNullOrWhiteSpace(atencion.MotivoConsulta))
    {
      return "El motivo de consulta es obligatorio.";
    }

    if (atencion.MotivoConsulta.Trim() == "Otro" &&
        string.IsNullOrWhiteSpace(atencion.MotivoConsultaOtro))
    {
      return "Debe especificar el motivo de consulta.";
    }

    if (string.IsNullOrWhiteSpace(atencion.EnfermedadActualBreve))
    {
      return "La enfermedad actual breve es obligatoria.";
    }

    if (atencion.EnfermedadActualBreve.Trim().Length < 5)
    {
      return "La enfermedad actual breve debe tener una descripción mínima.";
    }

    if (string.IsNullOrWhiteSpace(atencion.Procedencia))
    {
      return "La procedencia es obligatoria.";
    }

    if (string.IsNullOrWhiteSpace(atencion.CondicionLlegada))
    {
      return "La condición de llegada es obligatoria.";
    }

    if (atencion.TieneAcompanante &&
        string.IsNullOrWhiteSpace(atencion.NombreAcompanante))
    {
      return "Debe ingresar el nombre del acompañante.";
    }

    if (!string.IsNullOrWhiteSpace(atencion.TelefonoAcompanante))
    {
      var telefono = SoloNumeros(atencion.TelefonoAcompanante);

      if (telefono == null || telefono.Length < 7 || telefono.Length > 10)
      {
        return "El teléfono del acompañante debe tener entre 7 y 10 dígitos.";
      }
    }

    return string.Empty;
  }

  private static void NormalizarAtencion(Atencion atencion)
  {
    atencion.MotivoConsulta = NormalizarTextoRequerido(atencion.MotivoConsulta);

    atencion.MotivoConsultaOtro = atencion.MotivoConsulta == "Otro"
        ? NormalizarTextoOpcional(atencion.MotivoConsultaOtro)
        : null;

    atencion.EnfermedadActualBreve = NormalizarTextoRequerido(atencion.EnfermedadActualBreve);
    atencion.Procedencia = NormalizarTextoRequerido(atencion.Procedencia);
    atencion.CondicionLlegada = NormalizarTextoRequerido(atencion.CondicionLlegada);

    if (!atencion.TieneAcompanante)
    {
      atencion.NombreAcompanante = null;
      atencion.ParentescoAcompanante = null;
      atencion.TelefonoAcompanante = null;
      return;
    }

    atencion.NombreAcompanante = NormalizarTextoOpcional(atencion.NombreAcompanante);
    atencion.ParentescoAcompanante = NormalizarTextoOpcional(atencion.ParentescoAcompanante);
    atencion.TelefonoAcompanante = SoloNumeros(atencion.TelefonoAcompanante);
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

  private static string? SoloNumeros(string? valor)
  {
    if (string.IsNullOrWhiteSpace(valor))
    {
      return null;
    }

    var numeros = new string(valor.Where(char.IsDigit).ToArray());

    return string.IsNullOrWhiteSpace(numeros) ? null : numeros;
  }

  private int ObtenerUsuarioActualId()
  {
    return int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
  }
}
