using System.Diagnostics;
using System.Security.Claims;
using Hcu008.Api.Data;
using Hcu008.Api.Models;

namespace Hcu008.Api.Helpers;

public class RegistroAccesoMiddleware
{
  private readonly RequestDelegate next;
  private readonly IServiceScopeFactory scopeFactory;
  private readonly ILogger<RegistroAccesoMiddleware> logger;

  public RegistroAccesoMiddleware(
      RequestDelegate next,
      IServiceScopeFactory scopeFactory,
      ILogger<RegistroAccesoMiddleware> logger)
  {
    this.next = next;
    this.scopeFactory = scopeFactory;
    this.logger = logger;
  }

  public async Task InvokeAsync(HttpContext context)
  {
    var auditar = context.Request.Path.StartsWithSegments("/api") &&
                  !context.Request.Path.StartsWithSegments("/api/Auth/login");

    if (!auditar)
    {
      await next(context);
      return;
    }

    var reloj = Stopwatch.StartNew();
    Exception? error = null;

    try
    {
      await next(context);
    }
    catch (Exception ex)
    {
      error = ex;
      throw;
    }
    finally
    {
      reloj.Stop();
      await GuardarAccesoAsync(context, reloj.ElapsedMilliseconds, error);
    }
  }

  private async Task GuardarAccesoAsync(HttpContext context, long duracionMs, Exception? error)
  {
    try
    {
      var usuarioId = int.TryParse(
          context.User.FindFirstValue(ClaimTypes.NameIdentifier),
          out var id) ? id : (int?)null;
      var codigo = error is null
          ? context.Response.StatusCode
          : StatusCodes.Status500InternalServerError;

      using var scope = scopeFactory.CreateScope();
      var db = scope.ServiceProvider.GetRequiredService<Hcu008DbContext>();
      db.RegistrosAcceso.Add(new RegistroAcceso
      {
        FechaUtc = DateTime.UtcNow,
        UsuarioId = usuarioId,
        Usuario = Limitar(context.User.FindFirstValue(ClaimTypes.Name) ?? "No identificado", 250),
        Rol = Limitar(context.User.FindFirstValue(ClaimTypes.Role) ?? "", 40),
        Metodo = Limitar(context.Request.Method, 12),
        Ruta = Limitar(context.Request.Path.Value ?? "", 300),
        DireccionIp = Limitar(context.Connection.RemoteIpAddress?.ToString() ?? "", 45),
        Evento = context.Request.Method.Equals("GET", StringComparison.OrdinalIgnoreCase)
            ? "Consulta"
            : "Operación",
        Resultado = error is null ? "Solicitud procesada" : "Error interno",
        CorrelacionId = Limitar(context.TraceIdentifier, 80),
        CodigoEstado = codigo,
        DuracionMs = duracionMs,
        Exitoso = codigo is >= 200 and < 400
      });

      await db.SaveChangesAsync(CancellationToken.None);
    }
    catch (Exception ex)
    {
      logger.LogError(ex, "No se pudo registrar el acceso de auditoría {TraceIdentifier}.", context.TraceIdentifier);
    }
  }

  private static string Limitar(string valor, int longitud)
  {
    return valor.Length <= longitud ? valor : valor[..longitud];
  }
}
