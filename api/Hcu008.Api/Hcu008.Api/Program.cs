using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Hcu008.Api.Data;
using Hcu008.Api.Helpers;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using System.Threading.RateLimiting;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<WriteTransactionFilter>();
builder.Services.AddControllers(options => {
  options.Filters.AddService<WriteTransactionFilter>();
  options.Filters.Add<DatabaseExceptionFilter>();
})
    .AddJsonOptions(options =>
    {
      options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

var configuredConnection = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("No se configuró ConnectionStrings:DefaultConnection.");

builder.Services.AddDbContext<Hcu008DbContext>(options =>
    options.UseSqlServer(configuredConnection));

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
  options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
  if (builder.Configuration.GetValue<bool>("Security:TrustForwardedHeaders"))
  {
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
  }
});

builder.Services.AddCors(options =>
{
  options.AddPolicy("AngularPolicy", policy =>
  {
    var origenesConfigurados = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>() ?? Array.Empty<string>();

    policy.SetIsOriginAllowed(origin =>
        origenesConfigurados.Contains(origin, StringComparer.OrdinalIgnoreCase) ||
        (builder.Environment.IsDevelopment() &&
         Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
         (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
          uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase))))
        .AllowAnyHeader()
        .AllowAnyMethod();
  });
});

builder.Services.AddRateLimiter(options =>
{
  options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
  options.AddPolicy("login", context =>
  {
    var claveCliente = context.Connection.RemoteIpAddress?.ToString() ?? "desconocido";
    return RateLimitPartition.GetFixedWindowLimiter(claveCliente, _ => new FixedWindowRateLimiterOptions
    {
      PermitLimit = 10,
      Window = TimeSpan.FromMinutes(1),
      QueueLimit = 0,
      AutoReplenishment = true
    });
  });
  options.AddPolicy("public-request", context =>
  {
    var claveCliente = context.Connection.RemoteIpAddress?.ToString() ?? "desconocido";
    return RateLimitPartition.GetFixedWindowLimiter(claveCliente, _ => new FixedWindowRateLimiterOptions
    {
      PermitLimit = 5,
      Window = TimeSpan.FromMinutes(10),
      QueueLimit = 0,
      AutoReplenishment = true
    });
  });
});

var jwtKey = builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
  throw new InvalidOperationException("No se configuró Jwt:Key en appsettings.json.");
}

if (builder.Configuration.GetValue<bool>("Security:RequireExternalSecrets") &&
    jwtKey.Contains("DESARROLLO", StringComparison.OrdinalIgnoreCase))
{
  throw new InvalidOperationException("Producción requiere una clave JWT externa; no se permite la clave de desarrollo.");
}

builder.Services.AddAuthentication(options =>
{
  options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
  options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
  options.RequireHttpsMetadata = builder.Configuration.GetValue<bool>("Security:RequireHttps");
  options.SaveToken = false;

  options.Events = new JwtBearerEvents
  {
    OnTokenValidated = async context =>
    {
      try
      {
        var idText = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = context.Principal?.FindFirstValue(ClaimTypes.Role);

        if (!int.TryParse(idText, out var id))
        {
          context.Fail("Sesión no válida.");
          return;
        }

        if (string.IsNullOrWhiteSpace(role))
        {
          context.Fail("Rol de usuario no válido.");
          return;
        }

        var db = context.HttpContext.RequestServices.GetRequiredService<Hcu008DbContext>();

        var account = await db.UsuariosSistema.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id && u.Rol == role && u.Activo, context.HttpContext.RequestAborted);
        var existeUsuarioActivo = account != null && context.Principal?.FindFirstValue("session_stamp") == PasswordHelper.SessionStamp(account.ClaveHash, jwtKey);
        if (!existeUsuarioActivo)
        {
          context.Fail("La sesión ya no está autorizada.");
          return;
        }
      }
      catch (OperationCanceledException)
      {
        context.Fail("No se pudo validar la sesión.");
        return;
      }
    }
  };


  options.TokenValidationParameters = new TokenValidationParameters
  {
    ValidateIssuer = true,
    ValidateAudience = true,
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,

    ValidIssuer = builder.Configuration["Jwt:Issuer"],
    ValidAudience = builder.Configuration["Jwt:Audience"],
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

    ClockSkew = TimeSpan.FromMinutes(1)
  };
});

builder.Services.AddAuthorization(options =>
{
  var policy = new AuthorizationPolicyBuilder()
      .RequireAuthenticatedUser()
      .RequireRole("Admin", "Doctor")
      .Build();
  options.DefaultPolicy = policy;
  options.FallbackPolicy = policy;
});

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
  options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
  {
    Name = "Authorization",
    Type = SecuritySchemeType.Http,
    Scheme = "bearer",
    BearerFormat = "JWT",
    In = ParameterLocation.Header,
    Description = "Ingrese el token JWT. Ejemplo: Bearer eyJhbGciOiJIUzI1NiIs..."
  });

  options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.UseForwardedHeaders();

if (builder.Configuration.GetValue<bool>("Security:RequireHttps"))
{
  app.UseHsts();
  app.UseHttpsRedirection();
}

// Permite preparar una base nueva de forma explícita sin ejecutar migraciones
// durante cada inicio normal de la API.
if (builder.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup"))
{
  using var migrationScope = app.Services.CreateScope();
  var migrationContext = migrationScope.ServiceProvider.GetRequiredService<Hcu008DbContext>();
  await migrationContext.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
}

app.Use(async (context, next) =>
{
  context.Response.Headers["X-Content-Type-Options"] = "nosniff";
  context.Response.Headers["X-Frame-Options"] = "DENY";
  context.Response.Headers["Referrer-Policy"] = "same-origin";
  context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
  await next();
});

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AngularPolicy");
app.UseRateLimiter();

app.UseAuthentication();
app.UseMiddleware<RegistroAccesoMiddleware>();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/health/live", () => Results.Ok(new { estado = "activo" }))
    .AllowAnonymous();
app.MapGet("/health/ready", async (Hcu008DbContext db, CancellationToken cancellationToken) =>
    await db.Database.CanConnectAsync(cancellationToken)
        ? Results.Ok(new { estado = "listo", baseDatos = "conectada" })
        : Results.Problem("La base de datos no está disponible.", statusCode: 503))
    .AllowAnonymous();
app.MapFallbackToFile("index.html").AllowAnonymous();

if (builder.Configuration.GetValue<bool>("BootstrapAdmin:Enabled"))
using (var bootstrapScope = app.Services.CreateScope())
{
  var context = bootstrapScope.ServiceProvider.GetRequiredService<Hcu008DbContext>();
  if (!await context.UsuariosSistema.AnyAsync())
  {
    var correo = builder.Configuration["BootstrapAdmin:Email"]?.Trim().ToLowerInvariant();
    var clave = builder.Configuration["BootstrapAdmin:Password"];
    if (string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(clave) || clave.Length < 12)
    {
      throw new InvalidOperationException("BootstrapAdmin requiere correo y una contraseña de al menos 12 caracteres.");
    }

    context.UsuariosSistema.Add(new UsuarioSistema
    {
      Nombres = builder.Configuration["BootstrapAdmin:Nombres"]?.Trim() ?? "Administrador",
      Apellidos = builder.Configuration["BootstrapAdmin:Apellidos"]?.Trim() ?? "HCU 008",
      Correo = correo,
      Rol = "Admin",
      Activo = true,
      ClaveHash = PasswordHelper.HashPassword(clave),
      FechaCreacion = DateTime.Now
    });
    await context.SaveChangesAsync();
  }
}

if (app.Environment.IsDevelopment() && builder.Configuration.GetValue<bool>("Seed:Enabled"))
using (var scope = app.Services.CreateScope())
{
  var context = scope.ServiceProvider.GetRequiredService<Hcu008DbContext>();

  if (!context.UsuariosSistema.Any())
  {
    context.UsuariosSistema.AddRange(
        new UsuarioSistema
        {
          Nombres = "Edwin",
          Apellidos = "Salazar",
          Correo = "admin@hcu008.com",
          Rol = "Admin",
          Activo = true,
          ClaveHash = PasswordHelper.HashPassword(builder.Configuration["Seed:AdminPassword"] ?? throw new InvalidOperationException("Configure Seed:AdminPassword.")),
          FechaCreacion = DateTime.Now
        },
        new UsuarioSistema
        {
          Nombres = "Médico",
          Apellidos = "Emergencia",
          Correo = "doctor@hcu008.com",
          Rol = "Doctor",
          Activo = true,
          ClaveHash = PasswordHelper.HashPassword(builder.Configuration["Seed:DoctorPassword"] ?? throw new InvalidOperationException("Configure Seed:DoctorPassword.")),
          FechaCreacion = DateTime.Now
        }
    );

    context.SaveChanges();
  }
}

app.Run();
