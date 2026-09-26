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
  public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
  {
    var correo = (request.Correo ?? string.Empty).Trim().ToLower();
    var clave = (request.Clave ?? string.Empty).Trim();

    if (string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(clave))
    {
      return BadRequest("Ingrese correo y contraseña.");
    }

     var usuario = await _context.UsuariosSistema
        .AsNoTracking()
        .FirstOrDefaultAsync(u => u.Correo == correo);

    if (usuario is null)
    {
      return Unauthorized("Correo o contraseña incorrectos.");
    }

    if (!usuario.Activo)
    {
      return Unauthorized("El usuario se encuentra inactivo. Solicite activación al administrador.");
    }

    var claveCorrecta = PasswordHelper.VerifyPassword(clave, usuario.ClaveHash);

    if (!claveCorrecta)
    {
      return Unauthorized("Correo o contraseña incorrectos.");
    }

    var expiraEn = DateTime.UtcNow.AddMinutes(ObtenerMinutosExpiracion());
    var token = GenerarToken(usuario, expiraEn);

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
}
