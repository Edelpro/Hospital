using System.Security.Claims;
using Hcu008.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Data;

public class Hcu008DbContext : DbContext
{
  private readonly IHttpContextAccessor? httpContext;
  public Hcu008DbContext(DbContextOptions<Hcu008DbContext> options, IHttpContextAccessor? httpContext = null) : base(options)
  {
    this.httpContext = httpContext;
  }

  
  public DbSet<RegistroAuditoria> RegistrosAuditoria => Set<RegistroAuditoria>();
  public DbSet<Paciente> Pacientes => Set<Paciente>();
  public DbSet<Atencion> Atenciones => Set<Atencion>();
  public DbSet<Triaje> Triajes => Set<Triaje>();
  public DbSet<EvaluacionMedica> EvaluacionesMedicas => Set<EvaluacionMedica>();
  public DbSet<Diagnostico> Diagnosticos => Set<Diagnostico>();
  public DbSet<Prescripcion> Prescripciones => Set<Prescripcion>();
  public DbSet<Evolucion> Evoluciones => Set<Evolucion>();
  public DbSet<Examen> Examenes => Set<Examen>();
  public DbSet<Egreso> Egresos => Set<Egreso>();
  public DbSet<CatalogoItem> CatalogoItems => Set<CatalogoItem>();

  public DbSet<UsuarioSistema> UsuariosSistema => Set<UsuarioSistema>();
  public DbSet<SolicitudAcceso> SolicitudesAcceso => Set<SolicitudAcceso>();

  public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
  {
    ChangeTracker.DetectChanges();
    var actor = httpContext?.HttpContext?.User;
    var actorId = 0;
    var auditar = actor?.Identity?.IsAuthenticated == true && int.TryParse(actor.FindFirstValue(ClaimTypes.NameIdentifier), out actorId);
    var cambios = ChangeTracker.Entries()
      .Where(e => e.Entity is not RegistroAuditoria && e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
      .Select(e => new { Entry = e, State = e.State, Campos = string.Join(", ", e.Properties.Where(p => !p.Metadata.IsPrimaryKey() && (e.State != EntityState.Modified || p.IsModified)).Select(p => p.Metadata.Name == "ClaveHash" ? "Credencial" : p.Metadata.Name)) }).ToList();
    var affected = ChangeTracker.Entries()
        .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
        .Where(e => e.Metadata.FindProperty("AtencionId") != null)
        .Select(e => (int)e.Property("AtencionId").CurrentValue!).Where(id => id > 0).Distinct().ToList();
    var result = await base.SaveChangesAsync(cancellationToken);
    foreach (var id in affected)
    {
      var atencion = await Atenciones.FindAsync(new object[] { id }, cancellationToken);
      if (atencion is null || atencion.Estado == "Cerrada") continue;
      atencion.Estado = await Egresos.AnyAsync(e => e.AtencionId == id, cancellationToken) ? "Con egreso"
        : await Evoluciones.AnyAsync(e => e.AtencionId == id, cancellationToken) ? "Con evolución"
        : await Examenes.AnyAsync(e => e.AtencionId == id, cancellationToken) ? "Con exámenes"
        : await Prescripciones.AnyAsync(e => e.AtencionId == id, cancellationToken) ? "Con prescripción"
        : await Diagnosticos.AnyAsync(e => e.AtencionId == id, cancellationToken) ? "Con diagnóstico"
        : await EvaluacionesMedicas.AnyAsync(e => e.AtencionId == id, cancellationToken) ? "Con evaluación"
        : await Triajes.AnyAsync(e => e.AtencionId == id, cancellationToken) ? "En triaje" : "Abierta";
    }
    if (affected.Count > 0) await base.SaveChangesAsync(cancellationToken);
    if (auditar)
    {
      foreach (var cambio in cambios)
      {
        var entry = cambio.Entry;
        var key = entry.Metadata.FindPrimaryKey()?.Properties.FirstOrDefault();
        if (key is null || entry.Property(key.Name).CurrentValue is not int registroId) continue;
        var atencionId = entry.Entity is Atencion ? registroId : entry.Metadata.FindProperty("AtencionId") != null ? (int?)entry.Property("AtencionId").CurrentValue : null;
        RegistrosAuditoria.Add(new RegistroAuditoria {
          FechaUtc = DateTime.UtcNow, UsuarioId = actorId,
          Usuario = actor!.FindFirstValue(ClaimTypes.Name) ?? "Usuario", Rol = actor!.FindFirstValue(ClaimTypes.Role) ?? "",
          Entidad = entry.Metadata.ClrType.Name, RegistroId = registroId, AtencionId = atencionId,
          Operacion = cambio.State == EntityState.Added ? "Creación" : cambio.State == EntityState.Deleted ? "Eliminación" : "Modificación",
          Campos = cambio.Campos.Length > 2000 ? cambio.Campos[..2000] : cambio.Campos
        });
      }
      await base.SaveChangesAsync(cancellationToken);
    }
    return result;
  }

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    base.OnModelCreating(modelBuilder);
    modelBuilder.Entity<RegistroAuditoria>(entity => {
      entity.ToTable("RegistrosAuditoria");
      entity.HasIndex(a => a.FechaUtc);
      entity.HasIndex(a => new { a.AtencionId, a.FechaUtc });
    });

    modelBuilder.Entity<Paciente>(entity =>
    {
      entity.HasKey(p => p.Id);

      entity.Property(p => p.Cedula)
          .IsRequired()
          .HasMaxLength(10);

      entity.HasIndex(p => p.Cedula)
          .IsUnique();

      entity.Property(p => p.Nombres)
          .IsRequired()
          .HasMaxLength(120);

      entity.Property(p => p.Apellidos)
          .IsRequired()
          .HasMaxLength(120);

      entity.Property(p => p.Sexo)
          .IsRequired()
          .HasMaxLength(20);

      entity.Property(p => p.Telefono)
          .HasMaxLength(20);

      entity.Property(p => p.Direccion)
          .HasMaxLength(250);

      entity.Property(p => p.Provincia)
          .HasMaxLength(80);

      entity.Property(p => p.Canton)
          .HasMaxLength(80);

      entity.Property(p => p.Parroquia)
          .HasMaxLength(80);

      entity.HasMany(p => p.Atenciones)
          .WithOne(a => a.Paciente)
          .HasForeignKey(a => a.PacienteId)
          .OnDelete(DeleteBehavior.Restrict);
    });

    modelBuilder.Entity<Atencion>(entity =>
    {
      entity.HasKey(a => a.Id);

      entity.Property(a => a.MotivoConsulta)
          .IsRequired()
          .HasMaxLength(120);

      entity.Property(a => a.MotivoConsultaOtro)
          .HasMaxLength(250);

      entity.Property(a => a.EnfermedadActualBreve)
          .IsRequired();

      entity.Property(a => a.Procedencia)
          .IsRequired()
          .HasMaxLength(100);

      entity.Property(a => a.CondicionLlegada)
          .IsRequired()
          .HasMaxLength(100);

      entity.Property(a => a.NombreAcompanante)
          .HasMaxLength(180);

      entity.Property(a => a.ParentescoAcompanante)
          .HasMaxLength(80);

      entity.Property(a => a.TelefonoAcompanante)
          .HasMaxLength(20);

      entity.Property(a => a.Estado)
          .IsRequired()
          .HasMaxLength(40);

      entity.HasOne(a => a.Triaje)
          .WithOne(t => t.Atencion)
          .HasForeignKey<Triaje>(t => t.AtencionId)
          .OnDelete(DeleteBehavior.Cascade);

      entity.HasIndex(a => a.PacienteId);
      entity.HasIndex(a => a.Estado);
      entity.HasIndex(a => a.FechaIngreso);
    });

    modelBuilder.Entity<Triaje>(entity =>
    {
      entity.HasKey(t => t.Id);

      entity.Property(t => t.Prioridad)
          .IsRequired()
          .HasMaxLength(30);

      entity.Property(t => t.DiscriminadorClinico)
          .HasMaxLength(300);

      entity.Property(t => t.DiscriminadorClinicoOtro)
          .HasMaxLength(300);

      entity.Property(t => t.LlenadoCapilar)
          .HasMaxLength(120);

      entity.Property(t => t.Pupilas)
          .HasMaxLength(120);

      entity.Property(t => t.Temperatura)
          .HasPrecision(5, 2);

      entity.Property(t => t.Peso)
          .HasPrecision(6, 2);

      entity.Property(t => t.Talla)
          .HasPrecision(6, 2);

      entity.Property(t => t.PresionArterialMedia)
          .HasPrecision(6, 2);

      entity.Property(t => t.PresionPulso)
          .HasPrecision(6, 2);

      entity.Property(t => t.IndiceMasaCorporal)
          .HasPrecision(6, 2);

      entity.Property(t => t.FlujoOxigeno)
          .HasPrecision(5, 2);

      entity.Property(t => t.AlergiaDescripcion)
          .HasMaxLength(300);

      entity.Property(t => t.TipoAislamiento)
          .HasMaxLength(80);

      entity.HasIndex(t => t.AtencionId)
          .IsUnique();
    });

    modelBuilder.Entity<EvaluacionMedica>(entity =>
    {
      entity.ToTable("EvaluacionesMedicas");

      entity.HasKey(e => e.Id);

      entity.Property(e => e.EnfermedadActualAmpliada)
          .HasMaxLength(4000);

      entity.Property(e => e.AntecedentesPersonales)
          .HasMaxLength(3000);

      entity.Property(e => e.AntecedentesQuirurgicos)
          .HasMaxLength(3000);

      entity.Property(e => e.AntecedentesFamiliares)
          .HasMaxLength(3000);

      entity.Property(e => e.AntecedentesGinecoObstetricos)
          .HasMaxLength(3000);

      entity.Property(e => e.Alergias)
          .HasMaxLength(2000);

      entity.Property(e => e.EstadoGeneral)
          .HasMaxLength(80);

      entity.Property(e => e.EstadoConciencia)
          .HasMaxLength(80);

      entity.Property(e => e.Hidratacion)
          .HasMaxLength(100);

      entity.Property(e => e.Coloracion)
          .HasMaxLength(100);

      entity.Property(e => e.DolorActual)
          .HasMaxLength(100);

      entity.Property(e => e.CabezaCuello)
          .HasMaxLength(3000);

      entity.Property(e => e.Torax)
          .HasMaxLength(3000);

      entity.Property(e => e.Cardiopulmonar)
          .HasMaxLength(3000);

      entity.Property(e => e.Abdomen)
          .HasMaxLength(3000);

      entity.Property(e => e.Genitourinario)
          .HasMaxLength(3000);

      entity.Property(e => e.Extremidades)
          .HasMaxLength(3000);

      entity.Property(e => e.Neurologico)
          .HasMaxLength(3000);

      entity.Property(e => e.PielFaneras)
          .HasMaxLength(3000);

      entity.Property(e => e.AnalisisClinico)
          .HasMaxLength(5000);

      entity.Property(e => e.ProblemasActivos)
          .HasMaxLength(4000);

      entity.Property(e => e.RiesgoClinico)
          .HasMaxLength(80);

      entity.Property(e => e.ConductaInicial)
          .HasMaxLength(150);

      entity.Property(e => e.PlanMedico)
          .HasMaxLength(5000);

      entity.HasOne(e => e.Atencion)
          .WithOne(a => a.EvaluacionMedica)
          .HasForeignKey<EvaluacionMedica>(e => e.AtencionId)
          .OnDelete(DeleteBehavior.Cascade);

      entity.HasIndex(e => e.AtencionId)
          .IsUnique();
    });

    modelBuilder.Entity<Diagnostico>(entity =>
    {
      entity.ToTable("Diagnosticos");

      entity.HasKey(d => d.Id);

      entity.Property(d => d.CodigoCie10)
          .IsRequired()
          .HasMaxLength(15);

      entity.Property(d => d.DescripcionCie10)
          .IsRequired()
          .HasMaxLength(300);

      entity.Property(d => d.TipoDiagnostico)
          .IsRequired()
          .HasMaxLength(40);

      entity.Property(d => d.Condicion)
          .IsRequired()
          .HasMaxLength(40);

      entity.Property(d => d.Observacion)
          .HasMaxLength(1000);

      entity.HasOne(d => d.Atencion)
          .WithMany(a => a.Diagnosticos)
          .HasForeignKey(d => d.AtencionId)
          .OnDelete(DeleteBehavior.Cascade);

      entity.HasIndex(d => d.AtencionId);
      entity.HasIndex(d => d.CodigoCie10);
    });

    modelBuilder.Entity<Prescripcion>(entity =>
    {
      entity.HasKey(p => p.Id);

      entity.Property(p => p.Medicamento)
          .IsRequired()
          .HasMaxLength(180);

      entity.Property(p => p.Presentacion)
          .HasMaxLength(120);

      entity.Property(p => p.Dosis)
          .IsRequired()
          .HasMaxLength(80);

      entity.Property(p => p.ViaAdministracion)
          .IsRequired()
          .HasMaxLength(50);

      entity.Property(p => p.Frecuencia)
          .IsRequired()
          .HasMaxLength(80);

      entity.Property(p => p.Duracion)
          .IsRequired()
          .HasMaxLength(80);

      entity.Property(p => p.Cantidad)
          .HasMaxLength(80);

      entity.Property(p => p.Indicaciones)
          .HasMaxLength(800);

      entity.Property(p => p.Estado)
          .IsRequired()
          .HasMaxLength(40);

      entity.HasOne(p => p.Atencion)
          .WithMany(a => a.Prescripciones)
          .HasForeignKey(p => p.AtencionId)
          .OnDelete(DeleteBehavior.Cascade);

      entity.HasIndex(p => p.AtencionId);
    });

    modelBuilder.Entity<Evolucion>(entity =>
    {
      entity.HasKey(e => e.Id);

      entity.Property(e => e.TipoEvolucion)
          .IsRequired()
          .HasMaxLength(80);

      entity.Property(e => e.CondicionPaciente)
          .IsRequired()
          .HasMaxLength(80);

      entity.Property(e => e.Subjetivo)
          .HasMaxLength(800);

      entity.Property(e => e.Objetivo)
          .IsRequired()
          .HasMaxLength(1000);

      entity.Property(e => e.Analisis)
          .IsRequired()
          .HasMaxLength(1000);

      entity.Property(e => e.Plan)
          .IsRequired()
          .HasMaxLength(1000);

      entity.Property(e => e.SignosVitalesResumen)
          .HasMaxLength(300);

      entity.Property(e => e.RespuestaTratamiento)
          .HasMaxLength(800);

      entity.Property(e => e.Estado)
          .IsRequired()
          .HasMaxLength(40);

      entity.HasOne(e => e.Atencion)
          .WithMany(a => a.Evoluciones)
          .HasForeignKey(e => e.AtencionId)
          .OnDelete(DeleteBehavior.Cascade);

      entity.HasIndex(e => e.AtencionId);
    });

    modelBuilder.Entity<Examen>(entity =>
    {
      entity.HasKey(e => e.Id);

      entity.Property(e => e.TipoExamen)
          .IsRequired()
          .HasMaxLength(80);

      entity.Property(e => e.NombreExamen)
          .IsRequired()
          .HasMaxLength(180);

      entity.Property(e => e.Prioridad)
          .IsRequired()
          .HasMaxLength(40);

      entity.Property(e => e.IndicacionClinica)
          .IsRequired()
          .HasMaxLength(800);

      entity.Property(e => e.Observacion)
          .HasMaxLength(600);

      entity.Property(e => e.Estado)
          .IsRequired()
          .HasMaxLength(40);

      entity.Property(e => e.ResultadoResumen)
          .HasMaxLength(500);

      entity.HasOne(e => e.Atencion)
          .WithMany(a => a.Examenes)
          .HasForeignKey(e => e.AtencionId)
          .OnDelete(DeleteBehavior.Cascade);

      entity.HasIndex(e => e.AtencionId);
    });

    modelBuilder.Entity<Egreso>(entity =>
    {
      entity.HasKey(e => e.Id);

      entity.Property(e => e.TipoEgreso)
          .IsRequired()
          .HasMaxLength(80);

      entity.Property(e => e.CondicionEgreso)
          .IsRequired()
          .HasMaxLength(80);

      entity.Property(e => e.Destino)
          .IsRequired()
          .HasMaxLength(120);

      entity.Property(e => e.DiagnosticoEgreso)
          .HasMaxLength(250);

      entity.Property(e => e.ResumenClinico)
          .IsRequired()
          .HasMaxLength(1200);

      entity.Property(e => e.Indicaciones)
          .IsRequired()
          .HasMaxLength(1200);

      entity.Property(e => e.SignosAlarma)
          .IsRequired()
          .HasMaxLength(1000);

      entity.Property(e => e.TratamientoDomiciliario)
          .HasMaxLength(1000);

      entity.Property(e => e.Recomendaciones)
          .HasMaxLength(1000);

      entity.Property(e => e.Observacion)
          .HasMaxLength(800);

      entity.Property(e => e.NombreAcompanante)
          .HasMaxLength(160);

      entity.Property(e => e.ParentescoAcompanante)
          .HasMaxLength(80);

      entity.Property(e => e.Estado)
          .IsRequired()
          .HasMaxLength(40);

      entity.HasOne(e => e.Atencion)
          .WithOne(a => a.Egreso)
          .HasForeignKey<Egreso>(e => e.AtencionId)
          .OnDelete(DeleteBehavior.Cascade);

      entity.HasIndex(e => e.AtencionId)
          .IsUnique();
    });
    modelBuilder.Entity<CatalogoItem>(entity =>
    {
      entity.ToTable("CatalogoItems");

      entity.HasKey(c => c.Id);

      entity.Property(c => c.Tipo)
          .IsRequired()
          .HasMaxLength(80);

      entity.Property(c => c.Codigo)
          .IsRequired()
          .HasMaxLength(80);

      entity.Property(c => c.Nombre)
          .IsRequired()
          .HasMaxLength(160);

      entity.Property(c => c.Descripcion)
          .HasMaxLength(300);

      entity.Property(c => c.Orden)
          .HasDefaultValue(0);

      entity.Property(c => c.Activo)
          .HasDefaultValue(true);

      entity.Property(c => c.EsSistema)
          .HasDefaultValue(false);

      entity.Property(c => c.FechaCreacion)
          .HasDefaultValueSql("GETDATE()");

      entity.HasIndex(c => new { c.Tipo, c.Codigo })
          .IsUnique();

      entity.HasIndex(c => c.Tipo);
      entity.HasIndex(c => c.Activo);
    });


    modelBuilder.Entity<UsuarioSistema>(entity =>
    {
      entity.ToTable("UsuariosSistema");

      entity.HasKey(u => u.Id);

      entity.Property(u => u.Nombres)
          .IsRequired()
          .HasMaxLength(120);

      entity.Property(u => u.Apellidos)
          .IsRequired()
          .HasMaxLength(120);

      entity.Property(u => u.Correo)
          .IsRequired()
          .HasMaxLength(160);

      entity.Property(u => u.ClaveHash)
          .IsRequired()
          .HasMaxLength(500);

      entity.Property(u => u.Rol)
          .IsRequired()
          .HasMaxLength(40);

      entity.Property(u => u.Activo)
          .HasDefaultValue(true);

      entity.Property(u => u.FechaCreacion)
          .HasDefaultValueSql("GETDATE()");

      entity.HasIndex(u => u.Correo)
          .IsUnique();
    });

    modelBuilder.Entity<SolicitudAcceso>(entity =>
    {
      entity.ToTable("SolicitudesAcceso");

      entity.HasKey(s => s.Id);

      entity.Property(s => s.Nombres)
          .IsRequired()
          .HasMaxLength(160);

      entity.Property(s => s.Correo)
          .IsRequired()
          .HasMaxLength(160);

      entity.Property(s => s.RolSolicitado)
          .IsRequired()
          .HasMaxLength(40);

      entity.Property(s => s.Estado)
          .IsRequired()
          .HasMaxLength(40);

      entity.Property(s => s.ObservacionAdmin)
          .HasMaxLength(300);

      entity.Property(s => s.FechaSolicitud)
          .HasDefaultValueSql("GETDATE()");

      entity.HasIndex(s => s.Correo);
      entity.HasIndex(s => s.Estado);
    });

  }

}
