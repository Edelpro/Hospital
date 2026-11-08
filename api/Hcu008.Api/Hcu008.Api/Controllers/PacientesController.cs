using Hcu008.Api.Data;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Hcu008.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PacientesController : ControllerBase
{
  private readonly Hcu008DbContext _context;

  public PacientesController(Hcu008DbContext context)
  {
    _context = context;
  }

  [HttpGet]
  public async Task<ActionResult<IEnumerable<Paciente>>> GetPacientes()
  {
    var pacientes = await _context.Pacientes
        .AsNoTracking()
        .OrderBy(p => p.Apellidos)
        .ThenBy(p => p.Nombres)
        .ToListAsync();

    return Ok(pacientes);
  }

  [HttpGet("{id:int}")]
  public async Task<ActionResult<Paciente>> GetPaciente(int id)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar un identificador válido.");
    }

    var paciente = await _context.Pacientes
        .AsNoTracking()
        .Include(p => p.Atenciones)
        .ThenInclude(a => a.Triaje)
        .FirstOrDefaultAsync(p => p.Id == id);

    if (paciente == null)
    {
      return NotFound("No se encontró el paciente.");
    }

    return Ok(paciente);
  }

  [HttpPost]
  public async Task<ActionResult<Paciente>> CrearPaciente(Paciente paciente)
  {
    NormalizarPaciente(paciente);

    var validacion = ValidarPaciente(paciente);

    if (!string.IsNullOrWhiteSpace(validacion))
    {
      return BadRequest(validacion);
    }

    if (!ValidarIdentificacionFlexible(paciente.Cedula))
    {
      return BadRequest("La identificación debe tener 10 dígitos y no puede estar formada por un mismo número repetido.");
    }

    var existeCedula = await _context.Pacientes
        .AnyAsync(p => p.Cedula == paciente.Cedula);

    if (existeCedula)
    {
      return BadRequest("Ya existe un paciente registrado con esa cédula.");
    }

    paciente.Id = 0;
    paciente.RegistradoPorUsuarioId = ObtenerUsuarioActualId();
    paciente.Atenciones = new List<Atencion>();

    _context.Pacientes.Add(paciente);
    await _context.SaveChangesAsync();

    return CreatedAtAction(nameof(GetPaciente), new { id = paciente.Id }, paciente);
  }

  [HttpPut("{id:int}")]
  public async Task<ActionResult<Paciente>> ActualizarPaciente(int id, Paciente paciente)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar un identificador válido.");
    }

    if (id != paciente.Id)
    {
      return BadRequest("El identificador del paciente no coincide.");
    }

    NormalizarPaciente(paciente);

    var validacion = ValidarPaciente(paciente);

    if (!string.IsNullOrWhiteSpace(validacion))
    {
      return BadRequest(validacion);
    }

    if (!ValidarIdentificacionFlexible(paciente.Cedula))
    {
      return BadRequest("La identificación debe tener 10 dígitos y no puede estar formada por un mismo número repetido.");
    }

    var pacienteExistente = await _context.Pacientes.FindAsync(id);

    if (pacienteExistente == null)
    {
      return NotFound("No se encontró el paciente.");
    }

    var existeCedulaOtroPaciente = await _context.Pacientes
        .AnyAsync(p => p.Cedula == paciente.Cedula && p.Id != id);

    if (existeCedulaOtroPaciente)
    {
      return BadRequest("Ya existe otro paciente registrado con esa cédula.");
    }

    pacienteExistente.Cedula = paciente.Cedula;
    pacienteExistente.Nombres = paciente.Nombres;
    pacienteExistente.Apellidos = paciente.Apellidos;
    pacienteExistente.FechaNacimiento = paciente.FechaNacimiento;
    pacienteExistente.Sexo = paciente.Sexo;
    pacienteExistente.Telefono = paciente.Telefono;
    pacienteExistente.Direccion = paciente.Direccion;
    pacienteExistente.Provincia = paciente.Provincia;
    pacienteExistente.Canton = paciente.Canton;
    pacienteExistente.Parroquia = paciente.Parroquia;

    await _context.SaveChangesAsync();

    return Ok(pacienteExistente);
  }

  [HttpDelete("{id:int}")]
  [Authorize(Roles = "Admin")]
  public async Task<IActionResult> EliminarPaciente(int id)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar un identificador válido.");
    }

    var paciente = await _context.Pacientes
        .Include(p => p.Atenciones)
        .FirstOrDefaultAsync(p => p.Id == id);

    if (paciente == null)
    {
      return NotFound("No se encontró el paciente.");
    }

    if (paciente.Atenciones.Any())
    {
      return BadRequest("No se puede eliminar este paciente porque tiene atenciones registradas. Primero revise o elimine las atenciones creadas por error.");
    }

    _context.Pacientes.Remove(paciente);
    await _context.SaveChangesAsync();

    return NoContent();
  }

  private static void NormalizarPaciente(Paciente paciente)
  {
    paciente.Cedula = SoloNumeros(paciente.Cedula);
    paciente.Nombres = NormalizarTextoRequerido(paciente.Nombres);
    paciente.Apellidos = NormalizarTextoRequerido(paciente.Apellidos);
    paciente.Sexo = NormalizarTextoRequerido(paciente.Sexo);

    paciente.Telefono = NormalizarTextoOpcional(paciente.Telefono);
    paciente.Direccion = NormalizarTextoOpcional(paciente.Direccion);
    paciente.Provincia = NormalizarTextoOpcional(paciente.Provincia);
    paciente.Canton = NormalizarTextoOpcional(paciente.Canton);
    paciente.Parroquia = NormalizarTextoOpcional(paciente.Parroquia);
  }

  private static string ValidarPaciente(Paciente paciente)
  {
    if (string.IsNullOrWhiteSpace(paciente.Cedula))
    {
      return "La cédula es obligatoria.";
    }

    if (paciente.Cedula.Length != 10)
    {
      return "La cédula debe tener 10 dígitos.";
    }

    if (!paciente.Cedula.All(char.IsDigit))
    {
      return "La cédula solo debe contener números.";
    }

    if (string.IsNullOrWhiteSpace(paciente.Nombres))
    {
      return "Los nombres son obligatorios.";
    }

    if (paciente.Nombres.Length < 2)
    {
      return "Los nombres deben tener al menos 2 caracteres.";
    }

    if (string.IsNullOrWhiteSpace(paciente.Apellidos))
    {
      return "Los apellidos son obligatorios.";
    }

    if (paciente.Apellidos.Length < 2)
    {
      return "Los apellidos deben tener al menos 2 caracteres.";
    }

    if (string.IsNullOrWhiteSpace(paciente.Sexo))
    {
      return "El sexo es obligatorio.";
    }

    var sexosPermitidos = new[]
    {
            "Masculino",
            "Femenino",
            "No especificado"
        };

    if (!sexosPermitidos.Contains(paciente.Sexo))
    {
      return "El sexo seleccionado no es válido.";
    }

    if (paciente.FechaNacimiento.HasValue)
    {
      var fechaNacimiento = paciente.FechaNacimiento.Value.Date;
      var hoy = DateTime.Today;

      if (fechaNacimiento > hoy)
      {
        return "La fecha de nacimiento no puede ser futura.";
      }

      var edad = CalcularEdad(fechaNacimiento, hoy);

      if (edad > 130)
      {
        return "La fecha de nacimiento no es clínicamente probable. Revise el dato.";
      }
    }

    if (!string.IsNullOrWhiteSpace(paciente.Telefono))
    {
      var telefono = SoloNumeros(paciente.Telefono);

      if (telefono.Length < 7 || telefono.Length > 10)
      {
        return "El teléfono debe tener entre 7 y 10 dígitos.";
      }

      paciente.Telefono = telefono;
    }

    if (!string.IsNullOrWhiteSpace(paciente.Provincia) && paciente.Provincia.Length > 80)
    {
      return "La provincia no debe superar 80 caracteres.";
    }

    if (!string.IsNullOrWhiteSpace(paciente.Canton) && paciente.Canton.Length > 80)
    {
      return "El cantón no debe superar 80 caracteres.";
    }

    if (!string.IsNullOrWhiteSpace(paciente.Parroquia) && paciente.Parroquia.Length > 80)
    {
      return "La parroquia no debe superar 80 caracteres.";
    }

    if (!string.IsNullOrWhiteSpace(paciente.Direccion) && paciente.Direccion.Length > 250)
    {
      return "La dirección no debe superar 250 caracteres.";
    }

    return string.Empty;
  }

  private static bool ValidarIdentificacionFlexible(string cedula)
  {
    if (string.IsNullOrWhiteSpace(cedula))
    {
      return false;
    }

    cedula = SoloNumeros(cedula);

    if (cedula.Length != 10)
    {
      return false;
    }

    if (!cedula.All(char.IsDigit))
    {
      return false;
    }

    if (cedula.Distinct().Count() == 1)
    {
      return false;
    }

    return true;
  }

  private static int CalcularEdad(DateTime fechaNacimiento, DateTime fechaActual)
  {
    var edad = fechaActual.Year - fechaNacimiento.Year;

    if (fechaNacimiento.Date > fechaActual.AddYears(-edad))
    {
      edad--;
    }

    return edad;
  }

  private static string SoloNumeros(string? valor)
  {
    if (string.IsNullOrWhiteSpace(valor))
    {
      return string.Empty;
    }

    return new string(valor.Where(char.IsDigit).ToArray());
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

  private int ObtenerUsuarioActualId()
  {
    return int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
  }
}
