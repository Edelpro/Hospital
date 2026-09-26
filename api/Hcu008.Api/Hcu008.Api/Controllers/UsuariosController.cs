using Hcu008.Api.Data;
using Hcu008.Api.Helpers;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsuariosController : ControllerBase
{
  private readonly Hcu008DbContext _context;

  public UsuariosController(Hcu008DbContext context)
  {
    _context = context;
  }

  [HttpGet]
  public async Task<ActionResult<IEnumerable<object>>> ObtenerUsuarios()
  {
    var usuarios = await _context.UsuariosSistema
        .AsNoTracking()
        .OrderBy(u => u.Apellidos)
        .ThenBy(u => u.Nombres)
        .Select(u => new
        {
          u.Id,
          u.Nombres,
          u.Apellidos,
          u.Correo,
          u.Rol,
          u.Activo,
          u.FechaCreacion
        })
        .ToListAsync();

    return Ok(usuarios);
  }

  [HttpPost]
  public async Task<ActionResult> CrearUsuario(UsuarioCrearRequest request)
  {
    NormalizarCrear(request);

    var validacion = ValidarCrear(request);

    if (!string.IsNullOrWhiteSpace(validacion))
    {
      return BadRequest(validacion);
    }

    var existe = await _context.UsuariosSistema
        .AnyAsync(u => u.Correo == request.Correo);

    if (existe)
    {
      return BadRequest("Ya existe un usuario registrado con ese correo.");
    }

    var usuario = new UsuarioSistema
    {
      Nombres = request.Nombres,
      Apellidos = request.Apellidos,
      Correo = request.Correo,
      Rol = request.Rol,
      Activo = true,
      ClaveHash = PasswordHelper.HashPassword(request.Clave),
      FechaCreacion = DateTime.Now
    };

    _context.UsuariosSistema.Add(usuario);
    await _context.SaveChangesAsync();

    return Ok(new
    {
      usuario.Id,
      usuario.Nombres,
      usuario.Apellidos,
      usuario.Correo,
      usuario.Rol,
      usuario.Activo,
      usuario.FechaCreacion
    });
  }

  [HttpPut("{id:int}")]
  public async Task<IActionResult> ActualizarUsuario(int id, UsuarioActualizarRequest request)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar un identificador válido.");
    }

    NormalizarActualizar(request);

    var validacion = ValidarActualizar(request);

    if (!string.IsNullOrWhiteSpace(validacion))
    {
      return BadRequest(validacion);
    }

    var usuario = await _context.UsuariosSistema
        .FirstOrDefaultAsync(u => u.Id == id);

    if (usuario is null)
    {
      return NotFound("El usuario no existe.");
    }

    if (usuario.Rol == "Admin" && (!request.Activo || request.Rol != "Admin") &&
        !await _context.UsuariosSistema.AnyAsync(u => u.Id != id && u.Rol == "Admin" && u.Activo))
      return Conflict("No puede desactivar ni cambiar el rol del último administrador activo.");
    usuario.Nombres = request.Nombres;
    usuario.Apellidos = request.Apellidos;
    usuario.Rol = request.Rol;
    usuario.Activo = request.Activo;

    await _context.SaveChangesAsync();

    return NoContent();
  }

  [HttpPut("{id:int}/activar")]
  public async Task<IActionResult> ActivarUsuario(int id)
  {
    var usuario = await _context.UsuariosSistema.FindAsync(id);

    if (usuario is null)
    {
      return NotFound("El usuario no existe.");
    }

    usuario.Activo = true;
    await _context.SaveChangesAsync();

    return NoContent();
  }

  [HttpPut("{id:int}/desactivar")]
  public async Task<IActionResult> DesactivarUsuario(int id)
  {
    var usuario = await _context.UsuariosSistema.FindAsync(id);

    if (usuario is null)
    {
      return NotFound("El usuario no existe.");
    }

    if (usuario.Rol == "Admin" && !await _context.UsuariosSistema.AnyAsync(u => u.Id != id && u.Rol == "Admin" && u.Activo))
      return Conflict("No puede desactivar el último administrador activo.");
    usuario.Activo = false;
    await _context.SaveChangesAsync();

    return NoContent();
  }

  [HttpPut("{id:int}/cambiar-clave")]
  public async Task<IActionResult> CambiarClave(int id, [FromBody] string nuevaClave)
  {
    if (string.IsNullOrWhiteSpace(nuevaClave) || nuevaClave.Trim().Length < 6)
    {
      return BadRequest("La nueva contraseña debe tener al menos 6 caracteres.");
    }

    var usuario = await _context.UsuariosSistema.FindAsync(id);

    if (usuario is null)
    {
      return NotFound("El usuario no existe.");
    }

    usuario.ClaveHash = PasswordHelper.HashPassword(nuevaClave.Trim());

    await _context.SaveChangesAsync();

    return NoContent();
  }

  private static void NormalizarCrear(UsuarioCrearRequest request)
  {
    request.Nombres = NormalizarTexto(request.Nombres);
    request.Apellidos = NormalizarTexto(request.Apellidos);
    request.Nombres = QuitarApellidoDuplicado(request.Nombres, request.Apellidos);
    request.Correo = NormalizarTexto(request.Correo).ToLower();
    request.Clave = (request.Clave ?? string.Empty).Trim();
    request.Rol = NormalizarRol(request.Rol);
  }

  private static void NormalizarActualizar(UsuarioActualizarRequest request)
  {
    request.Nombres = NormalizarTexto(request.Nombres);
    request.Apellidos = NormalizarTexto(request.Apellidos);
    request.Nombres = QuitarApellidoDuplicado(request.Nombres, request.Apellidos);
    request.Rol = NormalizarRol(request.Rol);
  }

  private static string ValidarCrear(UsuarioCrearRequest request)
  {
    if (request.Nombres.Length < 2 || request.Nombres.Length > 120)
    {
      return "Los nombres son obligatorios.";
    }

    if (request.Apellidos.Length < 2 || request.Apellidos.Length > 120)
    {
      return "Los apellidos son obligatorios.";
    }

    if (!new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(request.Correo) || request.Correo.Length > 160)
    {
      return "Ingrese un correo válido.";
    }

    if (request.Clave.Length < 6)
    {
      return "La contraseña debe tener al menos 6 caracteres.";
    }

    if (!RolValido(request.Rol))
    {
      return "El rol seleccionado no es válido.";
    }

    return string.Empty;
  }

  private static string ValidarActualizar(UsuarioActualizarRequest request)
  {
    if (request.Nombres.Length < 2 || request.Nombres.Length > 120)
    {
      return "Los nombres son obligatorios.";
    }

    if (request.Apellidos.Length < 2 || request.Apellidos.Length > 120)
    {
      return "Los apellidos son obligatorios.";
    }

    if (!RolValido(request.Rol))
    {
      return "El rol seleccionado no es válido.";
    }

    return string.Empty;
  }

  private static bool RolValido(string rol)
  {
    return rol == "Admin" || rol == "Doctor";
  }

  private static string NormalizarRol(string? rol)
  {
    var texto = NormalizarTexto(rol);

    return texto.Equals("Admin", StringComparison.OrdinalIgnoreCase)
        ? "Admin"
        : texto.Equals("Doctor", StringComparison.OrdinalIgnoreCase) ? "Doctor" : texto;
  }

  private static string NormalizarTexto(string? valor)
  {
    return (valor ?? string.Empty).Trim();
  }

  private static string QuitarApellidoDuplicado(string nombres, string apellidos)
  {
    if (string.IsNullOrWhiteSpace(apellidos)) return nombres;

    var sufijo = $" {apellidos}";
    return nombres.EndsWith(sufijo, StringComparison.OrdinalIgnoreCase)
        ? nombres[..^sufijo.Length].Trim()
        : nombres;
  }
}
