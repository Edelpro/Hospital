using Hcu008.Api.Data;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class EvaluacionesMedicasController : ControllerBase
{
  private readonly Hcu008DbContext _context;

  public EvaluacionesMedicasController(Hcu008DbContext context)
  {
    _context = context;
  }

  [HttpGet("atencion/{atencionId:int}")]
  public async Task<ActionResult<EvaluacionMedica>> ObtenerPorAtencion(int atencionId)
  {
    if (atencionId <= 0)
    {
      return BadRequest("Debe enviar una atención válida.");
    }

    var evaluacion = await _context.EvaluacionesMedicas
        .AsNoTracking()
        .FirstOrDefaultAsync(e => e.AtencionId == atencionId);

    if (evaluacion == null)
    {
      return NotFound("No existe evaluación médica registrada para esta atención.");
    }

    return Ok(evaluacion);
  }

  [HttpPost("guardar")]
  public async Task<ActionResult<EvaluacionMedica>> Guardar(EvaluacionMedica solicitud)
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

    NormalizarSolicitud(solicitud);

    var validacion = ValidarEvaluacion(solicitud);

    if (!string.IsNullOrWhiteSpace(validacion))
    {
      return BadRequest(validacion);
    }

    var evaluacionExistente = await _context.EvaluacionesMedicas
        .FirstOrDefaultAsync(e => e.AtencionId == solicitud.AtencionId);

    if (evaluacionExistente == null)
    {
      evaluacionExistente = new EvaluacionMedica
      {
        AtencionId = solicitud.AtencionId,
        FechaRegistro = DateTime.Now
      };

      _context.EvaluacionesMedicas.Add(evaluacionExistente);
    }

    evaluacionExistente.FechaRegistro = DateTime.Now;

    evaluacionExistente.EnfermedadActualAmpliada = solicitud.EnfermedadActualAmpliada;

    evaluacionExistente.AntecedentesPersonales = solicitud.AntecedentesPersonales;
    evaluacionExistente.AntecedentesQuirurgicos = solicitud.AntecedentesQuirurgicos;
    evaluacionExistente.AntecedentesFamiliares = solicitud.AntecedentesFamiliares;
    evaluacionExistente.AntecedentesGinecoObstetricos = solicitud.AntecedentesGinecoObstetricos;
    evaluacionExistente.Alergias = solicitud.Alergias;

    evaluacionExistente.EstadoGeneral = solicitud.EstadoGeneral;
    evaluacionExistente.EstadoConciencia = solicitud.EstadoConciencia;
    evaluacionExistente.Hidratacion = solicitud.Hidratacion;
    evaluacionExistente.Coloracion = solicitud.Coloracion;
    evaluacionExistente.DolorActual = solicitud.DolorActual;

    evaluacionExistente.DificultadRespiratoria = solicitud.DificultadRespiratoria;
    evaluacionExistente.DolorToracico = solicitud.DolorToracico;
    evaluacionExistente.DeficitNeurologico = solicitud.DeficitNeurologico;
    evaluacionExistente.SangradoActivo = solicitud.SangradoActivo;
    evaluacionExistente.Fiebre = solicitud.Fiebre;
    evaluacionExistente.Trauma = solicitud.Trauma;
    evaluacionExistente.SospechaSepsis = solicitud.SospechaSepsis;
    evaluacionExistente.RiesgoObstetrico = solicitud.RiesgoObstetrico;
    evaluacionExistente.RiesgoQuirurgico = solicitud.RiesgoQuirurgico;
    evaluacionExistente.RequiereAislamiento = solicitud.RequiereAislamiento;

    evaluacionExistente.CabezaCuello = solicitud.CabezaCuello;
    evaluacionExistente.Torax = solicitud.Torax;
    evaluacionExistente.Cardiopulmonar = solicitud.Cardiopulmonar;
    evaluacionExistente.Abdomen = solicitud.Abdomen;
    evaluacionExistente.Genitourinario = solicitud.Genitourinario;
    evaluacionExistente.Extremidades = solicitud.Extremidades;
    evaluacionExistente.Neurologico = solicitud.Neurologico;
    evaluacionExistente.PielFaneras = solicitud.PielFaneras;

    evaluacionExistente.AnalisisClinico = solicitud.AnalisisClinico;
    evaluacionExistente.ProblemasActivos = solicitud.ProblemasActivos;
    evaluacionExistente.RiesgoClinico = solicitud.RiesgoClinico;
    evaluacionExistente.ConductaInicial = solicitud.ConductaInicial;
    evaluacionExistente.PlanMedico = solicitud.PlanMedico;

    if (atencion.Estado != "Con egreso")
    {
      atencion.Estado = "Con evaluación";
    }

    await _context.SaveChangesAsync();

    evaluacionExistente.Atencion = null;

    return Ok(evaluacionExistente);
  }

  private static string ValidarEvaluacion(EvaluacionMedica evaluacion)
  {
    if (string.IsNullOrWhiteSpace(evaluacion.EnfermedadActualAmpliada))
    {
      return "La enfermedad actual ampliada es obligatoria.";
    }

    if (evaluacion.EnfermedadActualAmpliada.Length < 8)
    {
      return "La enfermedad actual ampliada debe tener una descripción mínima.";
    }

    if (string.IsNullOrWhiteSpace(evaluacion.EstadoGeneral))
    {
      return "El estado general es obligatorio.";
    }

    if (string.IsNullOrWhiteSpace(evaluacion.EstadoConciencia))
    {
      return "El estado de conciencia es obligatorio.";
    }

    if (string.IsNullOrWhiteSpace(evaluacion.Hidratacion))
    {
      return "La hidratación es obligatoria.";
    }

    if (string.IsNullOrWhiteSpace(evaluacion.Coloracion))
    {
      return "La coloración es obligatoria.";
    }

    if (string.IsNullOrWhiteSpace(evaluacion.DolorActual))
    {
      return "El dolor actual es obligatorio.";
    }

    if (string.IsNullOrWhiteSpace(evaluacion.AnalisisClinico))
    {
      return "El análisis clínico es obligatorio.";
    }

    if (evaluacion.AnalisisClinico.Length < 8)
    {
      return "El análisis clínico debe tener una descripción mínima.";
    }

    if (string.IsNullOrWhiteSpace(evaluacion.RiesgoClinico))
    {
      return "El riesgo clínico es obligatorio.";
    }

    if (string.IsNullOrWhiteSpace(evaluacion.ConductaInicial))
    {
      return "La conducta inicial es obligatoria.";
    }

    if (string.IsNullOrWhiteSpace(evaluacion.PlanMedico))
    {
      return "El plan médico es obligatorio.";
    }

    if (evaluacion.PlanMedico.Length < 8)
    {
      return "El plan médico debe tener una descripción mínima.";
    }

    if (
        (evaluacion.RiesgoClinico == "Alto" || evaluacion.RiesgoClinico == "Crítico") &&
        evaluacion.ConductaInicial == "Alta médica"
    )
    {
      return "Un paciente con riesgo alto o crítico no debe marcarse directamente como alta médica.";
    }

    return string.Empty;
  }

  private static void NormalizarSolicitud(EvaluacionMedica evaluacion)
  {
    evaluacion.EnfermedadActualAmpliada = NormalizarTextoOpcional(evaluacion.EnfermedadActualAmpliada);

    evaluacion.AntecedentesPersonales = NormalizarTextoOpcional(evaluacion.AntecedentesPersonales);
    evaluacion.AntecedentesQuirurgicos = NormalizarTextoOpcional(evaluacion.AntecedentesQuirurgicos);
    evaluacion.AntecedentesFamiliares = NormalizarTextoOpcional(evaluacion.AntecedentesFamiliares);
    evaluacion.AntecedentesGinecoObstetricos = NormalizarTextoOpcional(evaluacion.AntecedentesGinecoObstetricos);
    evaluacion.Alergias = NormalizarTextoOpcional(evaluacion.Alergias);

    evaluacion.EstadoGeneral = NormalizarTextoOpcional(evaluacion.EstadoGeneral);
    evaluacion.EstadoConciencia = NormalizarTextoOpcional(evaluacion.EstadoConciencia);
    evaluacion.Hidratacion = NormalizarTextoOpcional(evaluacion.Hidratacion);
    evaluacion.Coloracion = NormalizarTextoOpcional(evaluacion.Coloracion);
    evaluacion.DolorActual = NormalizarTextoOpcional(evaluacion.DolorActual);

    evaluacion.CabezaCuello = NormalizarTextoOpcional(evaluacion.CabezaCuello);
    evaluacion.Torax = NormalizarTextoOpcional(evaluacion.Torax);
    evaluacion.Cardiopulmonar = NormalizarTextoOpcional(evaluacion.Cardiopulmonar);
    evaluacion.Abdomen = NormalizarTextoOpcional(evaluacion.Abdomen);
    evaluacion.Genitourinario = NormalizarTextoOpcional(evaluacion.Genitourinario);
    evaluacion.Extremidades = NormalizarTextoOpcional(evaluacion.Extremidades);
    evaluacion.Neurologico = NormalizarTextoOpcional(evaluacion.Neurologico);
    evaluacion.PielFaneras = NormalizarTextoOpcional(evaluacion.PielFaneras);

    evaluacion.AnalisisClinico = NormalizarTextoOpcional(evaluacion.AnalisisClinico);
    evaluacion.ProblemasActivos = NormalizarTextoOpcional(evaluacion.ProblemasActivos);
    evaluacion.RiesgoClinico = NormalizarTextoOpcional(evaluacion.RiesgoClinico);
    evaluacion.ConductaInicial = NormalizarTextoOpcional(evaluacion.ConductaInicial);
    evaluacion.PlanMedico = NormalizarTextoOpcional(evaluacion.PlanMedico);
  }

  private static string? NormalizarTextoOpcional(string? valor)
  {
    var texto = (valor ?? string.Empty).Trim();

    return string.IsNullOrWhiteSpace(texto) ? null : texto;
  }
}
