namespace Hcu008.Api.Models;

public class Triaje
{
  public int Id { get; set; }

  public int AtencionId { get; set; }
  public Atencion? Atencion { get; set; }

  public string Prioridad { get; set; } = "Verde";

  public string? DiscriminadorClinico { get; set; }
  public string? DiscriminadorClinicoOtro { get; set; }

  public int? EscalaDolor { get; set; }

  public int? FrecuenciaCardiaca { get; set; }
  public int? FrecuenciaRespiratoria { get; set; }
  public decimal? Temperatura { get; set; }
  public int? SaturacionOxigeno { get; set; }
  public int? GlicemiaCapilar { get; set; }

  public int? PresionSistolica { get; set; }
  public int? PresionDiastolica { get; set; }

  public decimal? PresionArterialMedia { get; set; }
  public decimal? PresionPulso { get; set; }

  public int? GlasgowOcular { get; set; }
  public int? GlasgowVerbal { get; set; }
  public int? GlasgowMotora { get; set; }
  public int? Glasgow { get; set; }

  public string? LlenadoCapilar { get; set; }
  public string? Pupilas { get; set; }

  public decimal? Peso { get; set; }
  public decimal? Talla { get; set; }
  public decimal? IndiceMasaCorporal { get; set; }

  public bool OxigenoSuplementario { get; set; }
  public decimal? FlujoOxigeno { get; set; }

  public bool AlergiaConocida { get; set; }
  public string? AlergiaDescripcion { get; set; }

  public bool RiesgoCaida { get; set; }

  public bool Aislamiento { get; set; }
  public string? TipoAislamiento { get; set; }

  public DateTime FechaRegistro { get; set; } = DateTime.Now;
}
