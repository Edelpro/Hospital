using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Hcu008.Api.Data;
using Hcu008.Api.Helpers;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
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

builder.Services.AddCors(options =>
{
  options.AddPolicy("AngularPolicy", policy =>
  {
    policy.WithOrigins(
            "http://localhost:4200"
        )
        .AllowAnyHeader()
        .AllowAnyMethod();
  });
});

var jwtKey = builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
  throw new InvalidOperationException("No se configuró Jwt:Key en appsettings.json.");
}

builder.Services.AddAuthentication(options =>
{
  options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
  options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
  options.RequireHttpsMetadata = false;
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

// Permite preparar una base nueva de forma explícita sin ejecutar migraciones
// durante cada inicio normal de la API.
if (builder.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup"))
{
  using var migrationScope = app.Services.CreateScope();
  var migrationContext = migrationScope.ServiceProvider.GetRequiredService<Hcu008DbContext>();
  await migrationContext.Database.MigrateAsync();
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AngularPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html").AllowAnonymous();

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
