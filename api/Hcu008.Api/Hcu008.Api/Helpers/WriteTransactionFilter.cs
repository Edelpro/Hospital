using System.Data;
using Hcu008.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Helpers;

// One short transaction per mutation. Serializes competing validation/write pairs
// across API processes sharing this database, without locking reads of the dashboard.
public sealed class WriteTransactionFilter(Hcu008DbContext db) : IAsyncActionFilter
{
  public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
  {
    if (HttpMethods.IsGet(context.HttpContext.Request.Method) ||
        context.ActionDescriptor.RouteValues["controller"] == "Auth")
    {
      await next(); return;
    }
    foreach (var value in context.ActionArguments.Values.Where(v => v is not null))
    {
      var type = db.Model.FindEntityType(value!.GetType());
      foreach (var property in value.GetType().GetProperties().Where(p => p.PropertyType == typeof(string)))
      {
        var max = type?.FindProperty(property.Name)?.GetMaxLength() ?? 5000;
        if (property.GetValue(value) is string text && text.Length > max)
        {
          context.Result = new BadRequestObjectResult($"{property.Name} no puede superar {max} caracteres.");
          return;
        }
      }
    }
    await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted);
    await db.Database.ExecuteSqlRawAsync("DECLARE @result int; EXEC @result = sys.sp_getapplock @Resource = N'Hcu008_Api_Write', @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 10000; IF @result < 0 THROW 51000, 'No se pudo obtener el bloqueo de escritura.', 1;");
    var executed = await next();
    var status = (executed.Result as Microsoft.AspNetCore.Mvc.Infrastructure.IStatusCodeActionResult)?.StatusCode ?? 200;
    if (executed.Exception is null && status < 400) await transaction.CommitAsync();
    // Disposal rolls back errors, including writes made before a validation failure.
  }
}
