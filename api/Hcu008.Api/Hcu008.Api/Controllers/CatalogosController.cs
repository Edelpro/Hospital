using Hcu008.Api.Data;
using Hcu008.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CatalogosController : ControllerBase
{
  private readonly Hcu008DbContext _context;

  public CatalogosController(Hcu008DbContext context)
  {
    _context = context;
  }

  [HttpGet]
  public async Task<ActionResult<IEnumerable<CatalogoItem>>> ObtenerTodos()
  {
    var items = await _context.CatalogoItems
        .AsNoTracking()
        .OrderBy(c => c.Tipo)
        .ThenBy(c => c.Orden)
        .ThenBy(c => c.Nombre)
        .ToListAsync();

    return Ok(items);
  }

  [HttpGet("activos")]
  public async Task<ActionResult<IEnumerable<CatalogoItem>>> ObtenerActivos()
  {
    var items = await _context.CatalogoItems
        .AsNoTracking()
        .Where(c => c.Activo)
        .OrderBy(c => c.Tipo)
        .ThenBy(c => c.Orden)
        .ThenBy(c => c.Nombre)
        .ToListAsync();

    return Ok(items);
  }

  [HttpGet("tipo/{tipo}")]
  public async Task<ActionResult<IEnumerable<CatalogoItem>>> ObtenerPorTipo(string tipo)
  {
    tipo = NormalizarTextoRequerido(tipo);

    if (string.IsNullOrWhiteSpace(tipo))
    {
      return BadRequest("Debe enviar el tipo de catálogo.");
    }

    var items = await _context.CatalogoItems
        .AsNoTracking()
        .Where(c => c.Tipo == tipo && c.Activo)
        .OrderBy(c => c.Orden)
        .ThenBy(c => c.Nombre)
        .ToListAsync();

    return Ok(items);
  }

  [HttpGet("{id:int}")]
  public async Task<ActionResult<CatalogoItem>> ObtenerPorId(int id)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar un identificador válido.");
    }

    var item = await _context.CatalogoItems
        .AsNoTracking()
        .FirstOrDefaultAsync(c => c.Id == id);

    if (item == null)
    {
      return NotFound("No se encontró el elemento del catálogo.");
    }

    return Ok(item);
  }

  [HttpPost]
  [Authorize(Roles = "Admin")]
  public async Task<ActionResult<CatalogoItem>> Crear(CatalogoItem item)
  {
    NormalizarCatalogo(item);

    var validacion = ValidarCatalogo(item);
    if (!string.IsNullOrWhiteSpace(validacion))
    {
      return BadRequest(validacion);
    }

    var existeCodigo = await _context.CatalogoItems.AnyAsync(c =>
        c.Tipo == item.Tipo &&
        c.Codigo == item.Codigo
    );

    if (existeCodigo)
    {
      return BadRequest("Ya existe un elemento con el mismo tipo y código.");
    }

    item.Id = 0;
    item.FechaCreacion = DateTime.Now;

    _context.CatalogoItems.Add(item);
    await _context.SaveChangesAsync();

    return CreatedAtAction(nameof(ObtenerPorId), new { id = item.Id }, item);
  }

  [HttpPut("{id:int}")]
  [Authorize(Roles = "Admin")]
  public async Task<IActionResult> Actualizar(int id, CatalogoItem item)
  {
    if (id <= 0)
    {
      return BadRequest("Debe enviar un identificador válido.");
    }

    if (id != item.Id)
    {
      return BadRequest("El identificador no coincide.");
    }

    NormalizarCatalogo(item);

    var validacion = ValidarCatalogo(item);
    if (!string.IsNullOrWhiteSpace(validacion))
    {
      return BadRequest(validacion);
    }

    var itemExistente = await _context.CatalogoItems.FindAsync(id);

    if (itemExistente == null)
    {
      return NotFound("No se encontró el elemento del catálogo.");
    }

    var existeCodigo = await _context.CatalogoItems.AnyAsync(c =>
        c.Id != id &&
        c.Tipo == item.Tipo &&
        c.Codigo == item.Codigo
    );

    if (existeCodigo)
    {
      return BadRequest("Ya existe otro elemento con el mismo tipo y código.");
    }

    itemExistente.Tipo = item.Tipo;
    itemExistente.Codigo = item.Codigo;
    itemExistente.Nombre = item.Nombre;
    itemExistente.Descripcion = item.Descripcion;
    itemExistente.Orden = item.Orden;
    itemExistente.Activo = item.Activo;
    itemExistente.EsSistema = item.EsSistema;

    await _context.SaveChangesAsync();

    return NoContent();
  }

  [HttpPut("{id:int}/activar")]
  [Authorize(Roles = "Admin")]
  public async Task<IActionResult> Activar(int id)
  {
    var item = await _context.CatalogoItems.FindAsync(id);

    if (item == null)
    {
      return NotFound("No se encontró el elemento del catálogo.");
    }

    item.Activo = true;
    await _context.SaveChangesAsync();

    return NoContent();
  }

  [HttpPut("{id:int}/desactivar")]
  [Authorize(Roles = "Admin")]
  public async Task<IActionResult> Desactivar(int id)
  {
    var item = await _context.CatalogoItems.FindAsync(id);

    if (item == null)
    {
      return NotFound("No se encontró el elemento del catálogo.");
    }

    item.Activo = false;
    await _context.SaveChangesAsync();

    return NoContent();
  }

  [HttpDelete("{id:int}")]
  [Authorize(Roles = "Admin")]
  public async Task<IActionResult> Eliminar(int id)
  {
    var item = await _context.CatalogoItems.FindAsync(id);

    if (item == null)
    {
      return NotFound("No se encontró el elemento del catálogo.");
    }

    if (item.EsSistema)
    {
      item.Activo = false;
    }
    else
    {
      _context.CatalogoItems.Remove(item);
    }

    await _context.SaveChangesAsync();

    return NoContent();
  }

  private static void NormalizarCatalogo(CatalogoItem item)
  {
    item.Tipo = NormalizarTextoRequerido(item.Tipo);
    item.Codigo = NormalizarTextoRequerido(item.Codigo).ToUpperInvariant();
    item.Nombre = NormalizarTextoRequerido(item.Nombre);
    item.Descripcion = NormalizarTextoOpcional(item.Descripcion);

    if (item.Orden < 0)
    {
      item.Orden = 0;
    }
  }

  private static string ValidarCatalogo(CatalogoItem item)
  {
    if (string.IsNullOrWhiteSpace(item.Tipo))
    {
      return "El tipo de catálogo es obligatorio.";
    }

    if (item.Tipo.Length > 80)
    {
      return "El tipo de catálogo no debe superar 80 caracteres.";
    }

    if (string.IsNullOrWhiteSpace(item.Codigo))
    {
      return "El código es obligatorio.";
    }

    if (item.Codigo.Length > 80)
    {
      return "El código no debe superar 80 caracteres.";
    }

    if (string.IsNullOrWhiteSpace(item.Nombre))
    {
      return "El nombre es obligatorio.";
    }

    if (item.Nombre.Length > 160)
    {
      return "El nombre no debe superar 160 caracteres.";
    }

    if (!string.IsNullOrWhiteSpace(item.Descripcion) && item.Descripcion.Length > 300)
    {
      return "La descripción no debe superar 300 caracteres.";
    }

    return string.Empty;
  }

  private static string NormalizarTextoRequerido(string? valor)
  {
    return (valor ?? string.Empty).Trim();
  }

  private static string? NormalizarTextoOpcional(string? valor)
  {
    var texto = (valor ?? string.Empty).Trim();
    return string.IsNullOrWhiteSpace(texto) ? null : texto;
  }
}
