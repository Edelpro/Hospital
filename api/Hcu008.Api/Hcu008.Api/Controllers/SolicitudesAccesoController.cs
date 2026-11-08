using Hcu008.Api.Data;
using Hcu008.Api.Helpers;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;

namespace Hcu008.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
public class SolicitudesAccesoController : ControllerBase
{
  private readonly Hcu008DbContext _context;

  public SolicitudesAccesoController(Hcu008DbContext context)
  {
    _context = context;
  }

  [HttpPost]
  [AllowAnonymous]
  [EnableRateLimiting("public-request")]
  public async Task<ActionResult> CrearSolicitud(SolicitudAccesoCrearRequest request)
  {
    request.Nombres = (request.Nombres ?? string.Empty).Trim();
    request.Correo = (request.Correo ?? string.Empty).Trim().ToLower();

    if (request.Nombres.Length < 3 || request.Nombres.Length > 120)
    {
      return BadRequest("Ingrese nombres y apellidos.");
    }

    if (!new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(request.Correo) || request.Correo.Length > 160)
    {
      return BadRequest("Ingrese un correo válido.");
    }

    var existeUsuario = await _context.UsuariosSistema
        .AnyAsync(u => u.Correo == request.Correo);

    if (existeUsuario)
    {
      return BadRequest("Ya existe un usuario registrado con ese correo.");
    }

    var existeSolicitudPendiente = await _context.SolicitudesAcceso
        .AnyAsync(s => s.Correo == request.Correo && s.Estado == "Pendiente");

    if (existeSolicitudPendiente)
    {
      return BadRequest("Ya existe una solicitud pendiente con ese correo.");
    }

    var solicitud = new SolicitudAcceso
    {
      Nombres = request.Nombres,
      Correo = request.Correo,
      RolSolicitado = "Doctor",
      Estado = "Pendiente",
      FechaSolicitud = DateTime.Now
    };

    _context.SolicitudesAcceso.Add(solicitud);
    await _context.SaveChangesAsync();

    return Ok(new
    {
      mensaje = "Solicitud registrada correctamente. El administrador deberá revisarla.",
      solicitud.Id,
      solicitud.Nombres,
      solicitud.Correo,
      solicitud.RolSolicitado,
      solicitud.Estado,
      solicitud.FechaSolicitud
    });
  }

  [HttpGet]
  [Authorize(Roles = "Admin")]
  public async Task<ActionResult<IEnumerable<SolicitudAcceso>>> ObtenerSolicitudes()
  {
    var solicitudes = await _context.SolicitudesAcceso
        .AsNoTracking()
        .OrderByDescending(s => s.FechaSolicitud)
        .ToListAsync();

    return Ok(solicitudes);
  }

  [HttpPost("{id:int}/aprobar")]
  [Authorize(Roles = "Admin")]
  public async Task<ActionResult> AprobarSolicitud(int id, SolicitudAccesoAprobarRequest request)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar una solicitud válida.");
    }

    request.Apellidos = (request.Apellidos ?? string.Empty).Trim();
    request.Rol = NormalizarRol(request.Rol);
    if (request.Rol != "Admin" && request.Rol != "Doctor")
    {
      return BadRequest("El rol seleccionado no es válido.");
    }
    request.ClaveInicial = (request.ClaveInicial ?? string.Empty).Trim();

    if (request.Apellidos.Length < 2 || request.Apellidos.Length > 120)
    {
      return BadRequest("Ingrese los apellidos del usuario.");
    }

    if (request.ClaveInicial.Length < 6)
    {
      return BadRequest("La clave inicial debe tener al menos 6 caracteres.");
    }

    var solicitud = await _context.SolicitudesAcceso
        .FirstOrDefaultAsync(s => s.Id == id);

    if (solicitud is null)
    {
      return NotFound("La solicitud no existe.");
    }

    if (solicitud.Estado != "Pendiente")
    {
      return BadRequest("La solicitud ya fue procesada.");
    }

    var existeUsuario = await _context.UsuariosSistema
        .AnyAsync(u => u.Correo == solicitud.Correo);

    if (existeUsuario)
    {
      return BadRequest("Ya existe un usuario registrado con ese correo.");
    }

    var usuario = new UsuarioSistema
    {
      Nombres = solicitud.Nombres,
      Apellidos = request.Apellidos,
      Correo = solicitud.Correo,
      Rol = request.Rol,
      Activo = true,
      ClaveHash = PasswordHelper.HashPassword(request.ClaveInicial),
      FechaCreacion = DateTime.Now
    };

    solicitud.Estado = "Aprobada";
    solicitud.FechaRespuesta = DateTime.Now;
    solicitud.ObservacionAdmin = "Usuario creado desde solicitud de acceso.";

    _context.UsuariosSistema.Add(usuario);
    await _context.SaveChangesAsync();

    return Ok(new
    {
      mensaje = "Solicitud aprobada y usuario creado correctamente.",
      usuario.Id,
      usuario.Nombres,
      usuario.Apellidos,
      usuario.Correo,
      usuario.Rol,
      usuario.Activo
    });
  }

  [HttpPost("{id:int}/rechazar")]
  [Authorize(Roles = "Admin")]
  public async Task<IActionResult> RechazarSolicitud(int id, [FromBody] string? observacion)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar una solicitud válida.");
    }

    var solicitud = await _context.SolicitudesAcceso
        .FirstOrDefaultAsync(s => s.Id == id);

    if (solicitud is null)
    {
      return NotFound("La solicitud no existe.");
    }

    if (solicitud.Estado != "Pendiente")
    {
      return BadRequest("La solicitud ya fue procesada.");
    }

    solicitud.Estado = "Rechazada";
    solicitud.FechaRespuesta = DateTime.Now;
    solicitud.ObservacionAdmin = string.IsNullOrWhiteSpace(observacion)
        ? "Solicitud rechazada por el administrador."
        : observacion.Trim();

    await _context.SaveChangesAsync();

    return NoContent();
  }

  private static string NormalizarRol(string? rol)
  {
    var texto = (rol ?? string.Empty).Trim();

    return texto.Equals("Admin", StringComparison.OrdinalIgnoreCase)
        ? "Admin"
        : texto.Equals("Doctor", StringComparison.OrdinalIgnoreCase) ? "Doctor" : texto;
  }
}
