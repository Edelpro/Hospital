using Hcu008.Api.Data;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TriajesController : ControllerBase
{
  private readonly Hcu008DbContext _context;

  public TriajesController(Hcu008DbContext context)
  {
    _context = context;
  }

  [HttpGet("atencion/{atencionId:int}")]
  public async Task<ActionResult<Triaje>> GetTriajePorAtencion(int atencionId)
  {
    if (atencionId <= 0)
    {
      return BadRequest("Debe enviar una atención válida.");
    }

    var triaje = await _context.Triajes
        .AsNoTracking()
        .Include(t => t.Atencion)
        .ThenInclude(a => a!.Paciente)
        .FirstOrDefaultAsync(t => t.AtencionId == atencionId);

    if (triaje == null)
    {
      return NotFound("La atención todavía no tiene triaje registrado.");
    }

    return Ok(triaje);
  }

  [HttpPost("guardar")]
  public async Task<ActionResult<Triaje>> GuardarTriaje(Triaje triaje)
  {
    if (triaje.AtencionId <= 0)
    {
      return BadRequest("Debe enviar una atención válida.");
    }

    var atencion = await _context.Atenciones
        .FirstOrDefaultAsync(a => a.Id == triaje.AtencionId);

    if (atencion == null)
    {
      return BadRequest("La atención no existe.");
    }

    if (atencion.Estado == "Cerrada") return BadRequest("No se puede modificar el triaje de una atención cerrada.");

    NormalizarTriaje(triaje);

    var validacion = ValidarTriaje(triaje);

    if (!string.IsNullOrWhiteSpace(validacion))
    {
      return BadRequest(validacion);
    }

    CalcularDatosDerivados(triaje);

    var triajeExistente = await _context.Triajes
        .FirstOrDefaultAsync(t => t.AtencionId == triaje.AtencionId);

    if (triajeExistente == null)
    {
      triaje.Id = 0;
      triaje.FechaRegistro = DateTime.Now;
      triaje.Atencion = null;

      _context.Triajes.Add(triaje);
    }
    else
    {
      triajeExistente.Prioridad = triaje.Prioridad;

      triajeExistente.DiscriminadorClinico = triaje.DiscriminadorClinico;
      triajeExistente.DiscriminadorClinicoOtro = triaje.DiscriminadorClinicoOtro;

      triajeExistente.EscalaDolor = triaje.EscalaDolor;

      triajeExistente.FrecuenciaCardiaca = triaje.FrecuenciaCardiaca;
      triajeExistente.FrecuenciaRespiratoria = triaje.FrecuenciaRespiratoria;
      triajeExistente.Temperatura = triaje.Temperatura;
      triajeExistente.SaturacionOxigeno = triaje.SaturacionOxigeno;
      triajeExistente.GlicemiaCapilar = triaje.GlicemiaCapilar;

      triajeExistente.PresionSistolica = triaje.PresionSistolica;
      triajeExistente.PresionDiastolica = triaje.PresionDiastolica;
      triajeExistente.PresionArterialMedia = triaje.PresionArterialMedia;
      triajeExistente.PresionPulso = triaje.PresionPulso;

      triajeExistente.GlasgowOcular = triaje.GlasgowOcular;
      triajeExistente.GlasgowVerbal = triaje.GlasgowVerbal;
      triajeExistente.GlasgowMotora = triaje.GlasgowMotora;
      triajeExistente.Glasgow = triaje.Glasgow;

      triajeExistente.LlenadoCapilar = triaje.LlenadoCapilar;
      triajeExistente.Pupilas = triaje.Pupilas;

      triajeExistente.Peso = triaje.Peso;
      triajeExistente.Talla = triaje.Talla;
      triajeExistente.IndiceMasaCorporal = triaje.IndiceMasaCorporal;

      triajeExistente.OxigenoSuplementario = triaje.OxigenoSuplementario;
      triajeExistente.FlujoOxigeno = triaje.FlujoOxigeno;

      triajeExistente.AlergiaConocida = triaje.AlergiaConocida;
      triajeExistente.AlergiaDescripcion = triaje.AlergiaDescripcion;

      triajeExistente.RiesgoCaida = triaje.RiesgoCaida;

      triajeExistente.Aislamiento = triaje.Aislamiento;
      triajeExistente.TipoAislamiento = triaje.TipoAislamiento;

      triajeExistente.FechaRegistro = DateTime.Now;

      triaje = triajeExistente;
    }

    if (atencion.Estado != "Con egreso" && atencion.Estado != "Cerrada")
    {
      atencion.Estado = "En triaje";
    }

    await _context.SaveChangesAsync();

    triaje.Atencion = null;

    return Ok(triaje);
  }

  [HttpGet("tablero")]
  public async Task<ActionResult<IEnumerable<Atencion>>> GetTableroTriaje()
  {
    var atenciones = await _context.Atenciones
        .AsNoTracking()
        .Include(a => a.Paciente)
        .Include(a => a.Triaje)
        .Where(a => a.Estado != "Cerrada" && a.Estado != "Con egreso")
        .ToListAsync();

    var ordenadas = atenciones
        .OrderBy(a => ObtenerOrdenPrioridad(a.Triaje?.Prioridad))
        .ThenBy(a => a.FechaIngreso)
        .ToList();

    return Ok(ordenadas);
  }

  private static string ValidarTriaje(Triaje triaje)
  {
    if (string.IsNullOrWhiteSpace(triaje.Prioridad))
    {
      return "La prioridad de triaje es obligatoria.";
    }

    var prioridadesPermitidas = new[]
    {
            "Rojo",
            "Naranja",
            "Amarillo",
            "Verde",
            "Azul"
        };

    if (!prioridadesPermitidas.Contains(triaje.Prioridad))
    {
      return "La prioridad de triaje no es válida.";
    }

    if (triaje.DiscriminadorClinico == "Otro" &&
        string.IsNullOrWhiteSpace(triaje.DiscriminadorClinicoOtro))
    {
      return "Debe especificar el discriminador clínico.";
    }

    if (triaje.EscalaDolor.HasValue &&
        (triaje.EscalaDolor.Value < 0 || triaje.EscalaDolor.Value > 10))
    {
      return "La escala de dolor debe estar entre 0 y 10.";
    }

    if (triaje.FrecuenciaCardiaca.HasValue &&
        (triaje.FrecuenciaCardiaca.Value < 20 || triaje.FrecuenciaCardiaca.Value > 250))
    {
      return "La frecuencia cardíaca ingresada no es válida.";
    }

    if (triaje.FrecuenciaRespiratoria.HasValue &&
        (triaje.FrecuenciaRespiratoria.Value < 4 || triaje.FrecuenciaRespiratoria.Value > 80))
    {
      return "La frecuencia respiratoria ingresada no es válida.";
    }

    if (triaje.Temperatura.HasValue &&
        (triaje.Temperatura.Value < 30 || triaje.Temperatura.Value > 45))
    {
      return "La temperatura ingresada no es válida.";
    }

    if (triaje.SaturacionOxigeno.HasValue &&
        (triaje.SaturacionOxigeno.Value < 0 || triaje.SaturacionOxigeno.Value > 100))
    {
      return "La saturación de oxígeno debe estar entre 0 y 100.";
    }

    if (triaje.GlicemiaCapilar.HasValue &&
        (triaje.GlicemiaCapilar.Value < 20 || triaje.GlicemiaCapilar.Value > 800))
    {
      return "La glicemia capilar ingresada no es válida.";
    }

    if (triaje.PresionSistolica.HasValue &&
        (triaje.PresionSistolica.Value < 50 || triaje.PresionSistolica.Value > 280))
    {
      return "La presión sistólica ingresada no es válida.";
    }

    if (triaje.PresionDiastolica.HasValue &&
        (triaje.PresionDiastolica.Value < 30 || triaje.PresionDiastolica.Value > 180))
    {
      return "La presión diastólica ingresada no es válida.";
    }

    if (triaje.PresionSistolica.HasValue &&
        triaje.PresionDiastolica.HasValue &&
        triaje.PresionDiastolica.Value >= triaje.PresionSistolica.Value)
    {
      return "La presión diastólica no puede ser mayor o igual que la presión sistólica.";
    }

    if (triaje.GlasgowOcular.HasValue &&
        (triaje.GlasgowOcular.Value < 1 || triaje.GlasgowOcular.Value > 4))
    {
      return "La apertura ocular de Glasgow no es válida.";
    }

    if (triaje.GlasgowVerbal.HasValue &&
        (triaje.GlasgowVerbal.Value < 1 || triaje.GlasgowVerbal.Value > 5))
    {
      return "La respuesta verbal de Glasgow no es válida.";
    }

    if (triaje.GlasgowMotora.HasValue &&
        (triaje.GlasgowMotora.Value < 1 || triaje.GlasgowMotora.Value > 6))
    {
      return "La respuesta motora de Glasgow no es válida.";
    }

    if (triaje.Peso.HasValue &&
        (triaje.Peso.Value < 1 || triaje.Peso.Value > 300))
    {
      return "El peso ingresado no es válido.";
    }

    if (triaje.Talla.HasValue &&
        (triaje.Talla.Value < 30 || triaje.Talla.Value > 250))
    {
      return "La talla debe registrarse en centímetros.";
    }

    if (triaje.OxigenoSuplementario &&
        (!triaje.FlujoOxigeno.HasValue || triaje.FlujoOxigeno.Value <= 0))
    {
      return "Debe ingresar el flujo de oxígeno.";
    }

    if (triaje.FlujoOxigeno.HasValue &&
        (triaje.FlujoOxigeno.Value < 0 || triaje.FlujoOxigeno.Value > 60))
    {
      return "El flujo de oxígeno ingresado no es válido.";
    }

    if (triaje.AlergiaConocida &&
        string.IsNullOrWhiteSpace(triaje.AlergiaDescripcion))
    {
      return "Debe especificar la alergia conocida.";
    }

    if (triaje.Aislamiento &&
        string.IsNullOrWhiteSpace(triaje.TipoAislamiento))
    {
      return "Debe especificar el tipo de aislamiento.";
    }

    return string.Empty;
  }

  private static void NormalizarTriaje(Triaje triaje)
  {
    triaje.Prioridad = NormalizarTextoRequerido(triaje.Prioridad);

    triaje.DiscriminadorClinico = NormalizarTextoOpcional(triaje.DiscriminadorClinico);

    triaje.DiscriminadorClinicoOtro =
        triaje.DiscriminadorClinico == "Otro"
            ? NormalizarTextoOpcional(triaje.DiscriminadorClinicoOtro)
            : null;

    triaje.LlenadoCapilar = NormalizarTextoOpcional(triaje.LlenadoCapilar);
    triaje.Pupilas = NormalizarTextoOpcional(triaje.Pupilas);

    if (!triaje.OxigenoSuplementario)
    {
      triaje.FlujoOxigeno = null;
    }

    if (!triaje.AlergiaConocida)
    {
      triaje.AlergiaDescripcion = null;
    }
    else
    {
      triaje.AlergiaDescripcion = NormalizarTextoOpcional(triaje.AlergiaDescripcion);
    }

    if (!triaje.Aislamiento)
    {
      triaje.TipoAislamiento = null;
    }
    else
    {
      triaje.TipoAislamiento = NormalizarTextoOpcional(triaje.TipoAislamiento);
    }
  }

  private static void CalcularDatosDerivados(Triaje triaje)
  {
    if (
        triaje.PresionSistolica.HasValue &&
        triaje.PresionDiastolica.HasValue &&
        triaje.PresionSistolica.Value > 0 &&
        triaje.PresionDiastolica.Value > 0
    )
    {
      triaje.PresionArterialMedia =
          Math.Round(
              (triaje.PresionSistolica.Value + (2m * triaje.PresionDiastolica.Value)) / 3m,
              2
          );

      triaje.PresionPulso =
          triaje.PresionSistolica.Value - triaje.PresionDiastolica.Value;
    }
    else
    {
      triaje.PresionArterialMedia = null;
      triaje.PresionPulso = null;
    }

    if (
        triaje.Peso.HasValue &&
        triaje.Talla.HasValue &&
        triaje.Peso.Value > 0 &&
        triaje.Talla.Value > 0
    )
    {
      var talla = triaje.Talla.Value;
      var tallaMetros = talla > 3 ? talla / 100m : talla;

      triaje.IndiceMasaCorporal =
          Math.Round(triaje.Peso.Value / (tallaMetros * tallaMetros), 2);
    }
    else
    {
      triaje.IndiceMasaCorporal = null;
    }

    if (
        triaje.GlasgowOcular.HasValue &&
        triaje.GlasgowVerbal.HasValue &&
        triaje.GlasgowMotora.HasValue
    )
    {
      triaje.Glasgow =
          triaje.GlasgowOcular.Value +
          triaje.GlasgowVerbal.Value +
          triaje.GlasgowMotora.Value;
    }
    else
    {
      triaje.Glasgow = null;
    }
  }

  private static int ObtenerOrdenPrioridad(string? prioridad)
  {
    return prioridad switch
    {
      "Rojo" => 1,
      "Naranja" => 2,
      "Amarillo" => 3,
      "Verde" => 4,
      "Azul" => 5,
      _ => 6
    };
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
