using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Hcu008.Api.Data;
using Hcu008.Api.Helpers;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.RateLimiting;

namespace Hcu008.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
  private readonly Hcu008DbContext _context;
  private readonly IConfiguration _configuration;

  public AuthController(
      Hcu008DbContext context,
      IConfiguration configuration
  )
  {
    _context = context;
    _configuration = configuration;
  }

  [HttpPost("login")]
  [AllowAnonymous]
  [EnableRateLimiting("login")]
  public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
  {
    var correo = (request.Correo ?? string.Empty).Trim().ToLower();
    var clave = (request.Clave ?? string.Empty).Trim();

    if (string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(clave))
    {
      await RegistrarLoginAsync(correo, null, StatusCodes.Status400BadRequest, false, "Datos incompletos");
      return BadRequest("Ingrese correo y contraseña.");
    }

     var usuario = await _context.UsuariosSistema
        .AsNoTracking()
        .FirstOrDefaultAsync(u => u.Correo == correo);

    if (usuario is null)
    {
      await RegistrarLoginAsync(correo, null, StatusCodes.Status401Unauthorized, false, "Credenciales incorrectas");
      return Unauthorized("Correo o contraseña incorrectos.");
    }

    if (!usuario.Activo)
    {
      await RegistrarLoginAsync(correo, usuario, StatusCodes.Status401Unauthorized, false, "Usuario inactivo");
      return Unauthorized("El usuario se encuentra inactivo. Solicite activación al administrador.");
    }

    var claveCorrecta = PasswordHelper.VerifyPassword(clave, usuario.ClaveHash);

    if (!claveCorrecta)
    {
      await RegistrarLoginAsync(correo, usuario, StatusCodes.Status401Unauthorized, false, "Credenciales incorrectas");
      return Unauthorized("Correo o contraseña incorrectos.");
    }

    var expiraEn = DateTime.UtcNow.AddMinutes(ObtenerMinutosExpiracion());
    var token = GenerarToken(usuario, expiraEn);
    await RegistrarLoginAsync(correo, usuario, StatusCodes.Status200OK, true, "Inicio de sesión correcto");

    return Ok(new LoginResponse
    {
      Id = usuario.Id,
      Nombres = usuario.Nombres,
      Apellidos = usuario.Apellidos,
      Correo = usuario.Correo,
      Rol = usuario.Rol,
      Iniciales = ObtenerIniciales(usuario.Nombres, usuario.Apellidos),
      Token = token,
      ExpiraEn = expiraEn
    });
  }

  private string GenerarToken(UsuarioSistema usuario, DateTime expiraEn)
  {
    var jwtKey = _configuration["Jwt:Key"];

    if (string.IsNullOrWhiteSpace(jwtKey))
    {
      throw new InvalidOperationException("No se configuró Jwt:Key.");
    }

    var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
    var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

    var claims = new[]
    {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Correo),
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, $"{usuario.Nombres} {usuario.Apellidos}".Trim()),
            new Claim(ClaimTypes.Email, usuario.Correo),
            new Claim(ClaimTypes.Role, usuario.Rol),
            new Claim("session_stamp", PasswordHelper.SessionStamp(usuario.ClaveHash, jwtKey))
        };

    var token = new JwtSecurityToken(
        issuer: _configuration["Jwt:Issuer"],
        audience: _configuration["Jwt:Audience"],
        claims: claims,
        expires: expiraEn,
        signingCredentials: credentials
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
  }

  private int ObtenerMinutosExpiracion()
  {
    var valor = _configuration["Jwt:ExpiresMinutes"];

    if (int.TryParse(valor, out var minutos) && minutos > 0)
    {
      return minutos;
    }

    return 480;
  }

  private static string ObtenerIniciales(string nombres, string apellidos)
  {
    var inicialNombre = (nombres ?? string.Empty).Trim().FirstOrDefault();
    var inicialApellido = (apellidos ?? string.Empty).Trim().FirstOrDefault();

    var iniciales = $"{inicialNombre}{inicialApellido}".ToUpper();

    return string.IsNullOrWhiteSpace(iniciales) ? "US" : iniciales;
  }

  private async Task RegistrarLoginAsync(
      string correo,
      UsuarioSistema? usuario,
      int codigoEstado,
      bool exitoso,
      string resultado)
  {
    try
    {
      _context.RegistrosAcceso.Add(new RegistroAcceso
      {
        FechaUtc = DateTime.UtcNow,
        UsuarioId = usuario?.Id,
        Usuario = usuario is null
            ? (string.IsNullOrWhiteSpace(correo) ? "No identificado" : correo)
            : $"{usuario.Nombres} {usuario.Apellidos}".Trim(),
        Rol = usuario?.Rol ?? "",
        Metodo = "POST",
        Ruta = "/api/Auth/login",
        DireccionIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
        Evento = "Inicio de sesión",
        Resultado = resultado,
        CorrelacionId = HttpContext.TraceIdentifier,
        CodigoEstado = codigoEstado,
        DuracionMs = 0,
        Exitoso = exitoso
      });
      await _context.SaveChangesAsync(HttpContext.RequestAborted);
    }
    catch (Exception)
    {
      // La auditoría nunca debe cambiar la respuesta de autenticación.
    }
  }
}
