using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

var opciones = Opciones.DesdeArgumentos(args);
using var clienteLogin = new HttpClient
{
  BaseAddress = new Uri(opciones.BaseUrl),
  Timeout = TimeSpan.FromSeconds(30)
};

Console.WriteLine($"HCU 008 - prueba de carga QA");
Console.WriteLine($"Destino: {opciones.BaseUrl}");
Console.WriteLine($"Solicitudes: {opciones.Solicitudes}; concurrencia: {opciones.Concurrencia}");

var credenciales = new List<(string correo, string clave)>
{
  ("doctor@hcu008.com", opciones.ClaveDoctor)
};
credenciales.AddRange(Enumerable.Range(1, 9)
    .Select(i => ($"doctorqa{i:00}@hcu008.local", opciones.ClaveDoctor)));

var sesiones = new List<SesionDoctor>();
foreach (var credencial in credenciales)
{
  using var respuesta = await clienteLogin.PostAsJsonAsync("/api/Auth/login", new
  {
    correo = credencial.correo,
    clave = credencial.clave
  });
  respuesta.EnsureSuccessStatusCode();
  var login = await respuesta.Content.ReadFromJsonAsync<LoginRespuesta>()
      ?? throw new InvalidOperationException("La API no devolvió la sesión esperada.");

  using var clienteDoctor = CrearCliente(opciones.BaseUrl, login.Token);
  var pacientes = await clienteDoctor.GetFromJsonAsync<List<ElementoId>>("/api/Pacientes") ?? [];
  var atenciones = await clienteDoctor.GetFromJsonAsync<List<ElementoId>>("/api/Atenciones") ?? [];

  if (pacientes.Count != 10 || atenciones.Count != 10)
  {
    throw new InvalidOperationException(
        $"Aislamiento incorrecto para {credencial.correo}: pacientes={pacientes.Count}, atenciones={atenciones.Count}. Se esperaban 10 y 10.");
  }

  sesiones.Add(new SesionDoctor(login.Token, atenciones[0].Id));
}

Console.WriteLine("Aislamiento por doctor: correcto (10 pacientes y 10 atenciones por cuenta).");

var latencias = new ConcurrentBag<long>();
var estados = new ConcurrentDictionary<int, int>();
var errores = new ConcurrentBag<string>();
var siguiente = -1;
var relojTotal = Stopwatch.StartNew();

var trabajadores = Enumerable.Range(0, opciones.Concurrencia).Select(async trabajador =>
{
  using var cliente = new HttpClient
  {
    BaseAddress = new Uri(opciones.BaseUrl),
    Timeout = TimeSpan.FromSeconds(30)
  };

  while (true)
  {
    var numero = Interlocked.Increment(ref siguiente);
    if (numero >= opciones.Solicitudes) break;

    var sesion = sesiones[numero % sesiones.Count];
    var ruta = (numero % 3) switch
    {
      0 => "/api/Pacientes",
      1 => "/api/Atenciones",
      _ => $"/api/Reportes/atencion/{sesion.AtencionId}"
    };

    using var solicitud = new HttpRequestMessage(HttpMethod.Get, ruta);
    solicitud.Headers.Authorization = new AuthenticationHeaderValue("Bearer", sesion.Token);
    var reloj = Stopwatch.StartNew();

    try
    {
      using var respuesta = await cliente.SendAsync(solicitud, HttpCompletionOption.ResponseHeadersRead);
      reloj.Stop();
      latencias.Add(reloj.ElapsedMilliseconds);
      estados.AddOrUpdate((int)respuesta.StatusCode, 1, (_, actual) => actual + 1);
      if (!respuesta.IsSuccessStatusCode)
      {
        errores.Add($"HTTP {(int)respuesta.StatusCode} en {ruta}");
      }
    }
    catch (Exception ex)
    {
      reloj.Stop();
      latencias.Add(reloj.ElapsedMilliseconds);
      errores.Add($"{ruta}: {ex.Message}");
    }
  }
});

await Task.WhenAll(trabajadores);
relojTotal.Stop();

var ordenadas = latencias.OrderBy(x => x).ToArray();
long Percentil(double porcentaje) => ordenadas.Length == 0
    ? 0
    : ordenadas[Math.Clamp((int)Math.Ceiling(ordenadas.Length * porcentaje) - 1, 0, ordenadas.Length - 1)];

var tasa = opciones.Solicitudes / Math.Max(0.001, relojTotal.Elapsed.TotalSeconds);
Console.WriteLine();
Console.WriteLine($"Duración total: {relojTotal.Elapsed.TotalSeconds:N2} s");
Console.WriteLine($"Rendimiento: {tasa:N1} solicitudes/s");
Console.WriteLine($"Latencia p50: {Percentil(0.50)} ms");
Console.WriteLine($"Latencia p95: {Percentil(0.95)} ms");
Console.WriteLine($"Latencia p99: {Percentil(0.99)} ms");
Console.WriteLine("Estados HTTP: " + string.Join(", ", estados.OrderBy(x => x.Key).Select(x => $"{x.Key}={x.Value}")));
Console.WriteLine($"Errores: {errores.Count}");

if (!errores.IsEmpty)
{
  foreach (var error in errores.Take(10)) Console.WriteLine($"  - {error}");
  Environment.ExitCode = 1;
}
else if (Percentil(0.95) > opciones.MaximoP95Ms)
{
  Console.WriteLine($"FALLO: p95 supera el límite de {opciones.MaximoP95Ms} ms.");
  Environment.ExitCode = 2;
}
else
{
  Console.WriteLine("RESULTADO: prueba aprobada sin errores HTTP y dentro del límite p95.");
}

static HttpClient CrearCliente(string baseUrl, string token)
{
  var cliente = new HttpClient { BaseAddress = new Uri(baseUrl), Timeout = TimeSpan.FromSeconds(30) };
  cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
  return cliente;
}

sealed record LoginRespuesta(string Token);
sealed record ElementoId(int Id);
sealed record SesionDoctor(string Token, int AtencionId);

sealed record Opciones(
    string BaseUrl,
    int Solicitudes,
    int Concurrencia,
    int MaximoP95Ms,
    string ClaveDoctor)
{
  public static Opciones DesdeArgumentos(string[] args)
  {
    string Valor(string nombre, string predeterminado)
    {
      var indice = Array.FindIndex(args, x => x.Equals(nombre, StringComparison.OrdinalIgnoreCase));
      return indice >= 0 && indice + 1 < args.Length ? args[indice + 1] : predeterminado;
    }

    return new Opciones(
        Valor("--url", "http://127.0.0.1:8091").TrimEnd('/'),
        int.Parse(Valor("--solicitudes", "600")),
        int.Parse(Valor("--concurrencia", "20")),
        int.Parse(Valor("--max-p95-ms", "3000")),
        Valor("--clave-doctor", "Doctor123"));
  }
}
