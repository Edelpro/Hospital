using Hcu008.Api.Data;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class EgresosController : ControllerBase
{
  private readonly Hcu008DbContext _context;

  public EgresosController(Hcu008DbContext context)
  {
    _context = context;
  }

  [HttpGet("atencion/{atencionId:int}")]
  public async Task<ActionResult<Egreso?>> ObtenerPorAtencion(int atencionId)
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

    var egreso = await _context.Egresos
        .AsNoTracking()
        .FirstOrDefaultAsync(e => e.AtencionId == atencionId);

    return Ok(egreso);
  }

  [HttpPost]
  public async Task<ActionResult<Egreso>> GuardarEgreso(Egreso egreso)
  {
    NormalizarEgreso(egreso);

    var validacion = ValidarEgreso(egreso);

    if (!string.IsNullOrWhiteSpace(validacion))
    {
      return BadRequest(validacion);
    }

    var atencion = await _context.Atenciones
        .FirstOrDefaultAsync(a => a.Id == egreso.AtencionId);

    if (atencion is null)
    {
      return NotFound("La atención no existe.");
    }

    if (atencion.Estado == "Cerrada")
    {
      return BadRequest("No se puede registrar o modificar el egreso de una atención cerrada.");
    }

    if (egreso.FechaEgreso == default)
    {
      egreso.FechaEgreso = DateTime.Now;
    }

    if (egreso.FechaEgreso > DateTime.Now.AddMinutes(5))
    {
      return BadRequest("La fecha de egreso no puede ser futura.");
    }

    if (egreso.FechaEgreso < atencion.FechaIngreso)
      return BadRequest("El egreso no puede ser anterior al ingreso.");
    if (egreso.Estado == "Anulado")
      return BadRequest("Para retirar un egreso registrado, solicite su eliminación al administrador.");

    if (egreso.Id > 0)
    {
      var egresoExistente = await _context.Egresos
          .FirstOrDefaultAsync(e => e.Id == egreso.Id && e.AtencionId == egreso.AtencionId);

      if (egresoExistente is null)
      {
        return NotFound("El egreso no existe.");
      }

      egresoExistente.TipoEgreso = egreso.TipoEgreso;
      egresoExistente.CondicionEgreso = egreso.CondicionEgreso;
      egresoExistente.Destino = egreso.Destino;
      egresoExistente.DiagnosticoEgreso = egreso.DiagnosticoEgreso;
      egresoExistente.ResumenClinico = egreso.ResumenClinico;
      egresoExistente.Indicaciones = egreso.Indicaciones;
      egresoExistente.SignosAlarma = egreso.SignosAlarma;
      egresoExistente.TratamientoDomiciliario = egreso.TratamientoDomiciliario;
      egresoExistente.Recomendaciones = egreso.Recomendaciones;
      egresoExistente.Observacion = egreso.Observacion;
      egresoExistente.RequiereControl = egreso.RequiereControl;
      egresoExistente.RequiereReferencia = egreso.RequiereReferencia;
      egresoExistente.NombreAcompanante = egreso.NombreAcompanante;
      egresoExistente.ParentescoAcompanante = egreso.ParentescoAcompanante;
      egresoExistente.Estado = egreso.Estado;
      egresoExistente.FechaEgreso = egreso.FechaEgreso;

      atencion.Estado = "Con egreso";

      await _context.SaveChangesAsync();

      egresoExistente.Atencion = null;

      return Ok(egresoExistente);
    }

    var existeEgreso = await _context.Egresos
        .AnyAsync(e => e.AtencionId == egreso.AtencionId);

    if (existeEgreso)
    {
      return BadRequest("Esta atención ya tiene un egreso registrado.");
    }

    egreso.Id = 0;
    egreso.Atencion = null;

    _context.Egresos.Add(egreso);

    atencion.Estado = "Con egreso";

    await _context.SaveChangesAsync();

    egreso.Atencion = null;

    return Ok(egreso);
  }

  [Authorize(Roles = "Admin")]
  [HttpDelete("{id:int}")]
  public async Task<IActionResult> EliminarEgreso(int id)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar un identificador válido.");
    }

    var egreso = await _context.Egresos
        .FirstOrDefaultAsync(e => e.Id == id);

    if (egreso is null)
    {
      return NotFound("El egreso no existe.");
    }

    var atencion = await _context.Atenciones
        .FirstOrDefaultAsync(a => a.Id == egreso.AtencionId);

    if (atencion is not null && atencion.Estado == "Cerrada")
    {
      return BadRequest("No se puede eliminar el egreso de una atención cerrada.");
    }

    if (atencion is not null && await _context.Atenciones.AnyAsync(a => a.PacienteId == atencion.PacienteId && a.Id != atencion.Id && a.Estado != "Cerrada" && a.Estado != "Con egreso"))
      return Conflict("El paciente tiene otra atención activa. No se puede reabrir esta atención eliminando su egreso.");
    _context.Egresos.Remove(egreso);

    if (atencion is not null)
    {
      atencion.Estado = "Con evolución";
    }

    await _context.SaveChangesAsync();

    return NoContent();
  }

  private static string ValidarEgreso(Egreso egreso)
  {
    if (egreso.AtencionId <= 0)
    {
      return "La atención es requerida.";
    }

    if (string.IsNullOrWhiteSpace(egreso.TipoEgreso))
    {
      return "El tipo de egreso es requerido.";
    }

    if (string.IsNullOrWhiteSpace(egreso.CondicionEgreso))
    {
      return "La condición de egreso es requerida.";
    }

    if (string.IsNullOrWhiteSpace(egreso.Destino))
    {
      return "El destino es requerido.";
    }

    if (string.IsNullOrWhiteSpace(egreso.ResumenClinico))
    {
      return "El resumen clínico es requerido.";
    }

    if (egreso.ResumenClinico.Length < 10)
    {
      return "El resumen clínico debe tener una descripción mínima.";
    }

    if (string.IsNullOrWhiteSpace(egreso.Indicaciones))
    {
      return "Las indicaciones son requeridas.";
    }

    if (egreso.Indicaciones.Length < 8)
    {
      return "Las indicaciones deben tener una descripción mínima.";
    }

    if (string.IsNullOrWhiteSpace(egreso.SignosAlarma))
    {
      return "Los signos de alarma son requeridos.";
    }

    if (egreso.SignosAlarma.Length < 5)
    {
      return "Los signos de alarma deben tener una descripción mínima.";
    }

    var tiposPermitidos = new[]
    {
            "Alta médica",
            "Alta con indicaciones",
            "Referencia",
            "Transferencia",
            "Alta voluntaria",
            "Fuga / abandono",
            "Observación externa",
            "Fallecimiento",

            // Compatibilidad con valores antiguos
            "Retiro voluntario",
            "Fuga",
            "Observación finalizada"
        };

    if (!tiposPermitidos.Contains(egreso.TipoEgreso))
    {
      return "El tipo de egreso seleccionado no es válido.";
    }

    var condicionesPermitidas = new[]
    {
            "Estable",
            "Mejorado",
            "Sin cambios",
            "Delicado",
            "Crítico",
            "Fallecido"
        };

    if (!condicionesPermitidas.Contains(egreso.CondicionEgreso))
    {
      return "La condición de egreso seleccionada no es válida.";
    }

    var destinosPermitidos = new[]
    {
            "Domicilio",
            "Consulta externa",
            "Otra unidad de salud",
            "Hospitalización",
            "UCI",
            "Quirófano",
            "Morgue",
            "Otro"
        };

    if (!destinosPermitidos.Contains(egreso.Destino))
    {
      return "El destino de egreso seleccionado no es válido.";
    }

    var estadosPermitidos = new[]
    {
            "Registrado",
            "Corregido",
            "Anulado"
        };

    if (!estadosPermitidos.Contains(egreso.Estado))
    {
      return "El estado del egreso no es válido.";
    }

    if (egreso.TipoEgreso == "Referencia" && !egreso.RequiereReferencia)
    {
      return "Si el tipo de egreso es Referencia, debe marcar requiere referencia.";
    }

    if (
        egreso.TipoEgreso == "Fallecimiento" &&
        egreso.CondicionEgreso != "Fallecido"
    )
    {
      return "Si el tipo de egreso es Fallecimiento, la condición debe ser Fallecido.";
    }

    if (
        egreso.TipoEgreso == "Fallecimiento" &&
        egreso.Destino != "Morgue"
    )
    {
      return "Si el tipo de egreso es Fallecimiento, el destino debe ser Morgue.";
    }

    if (
        egreso.RequiereReferencia &&
        egreso.Destino == "Domicilio"
    )
    {
      return "Si requiere referencia, el destino no debería ser Domicilio.";
    }

    return string.Empty;
  }

  private static void NormalizarEgreso(Egreso egreso)
  {
    egreso.TipoEgreso = NormalizarTextoRequerido(egreso.TipoEgreso);
    egreso.CondicionEgreso = NormalizarTextoRequerido(egreso.CondicionEgreso);
    egreso.Destino = NormalizarTextoRequerido(egreso.Destino);
    egreso.DiagnosticoEgreso = NormalizarTextoOpcional(egreso.DiagnosticoEgreso);
    egreso.ResumenClinico = NormalizarTextoRequerido(egreso.ResumenClinico);
    egreso.Indicaciones = NormalizarTextoRequerido(egreso.Indicaciones);
    egreso.SignosAlarma = NormalizarTextoRequerido(egreso.SignosAlarma);
    egreso.TratamientoDomiciliario = NormalizarTextoOpcional(egreso.TratamientoDomiciliario);
    egreso.Recomendaciones = NormalizarTextoOpcional(egreso.Recomendaciones);
    egreso.Observacion = NormalizarTextoOpcional(egreso.Observacion);
    egreso.NombreAcompanante = NormalizarTextoOpcional(egreso.NombreAcompanante);
    egreso.ParentescoAcompanante = NormalizarTextoOpcional(egreso.ParentescoAcompanante);

    egreso.Estado = string.IsNullOrWhiteSpace(egreso.Estado)
        ? "Registrado"
        : NormalizarTextoRequerido(egreso.Estado);
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
