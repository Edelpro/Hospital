using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Hcu008.Api.Helpers;
public sealed class DatabaseExceptionFilter : IExceptionFilter
{
  public void OnException(ExceptionContext context)
  {
    if (context.Exception is not (DbUpdateException or SqlException)) return;
    context.Result = new ConflictObjectResult("No se pudo guardar el cambio. Puede existir un registro duplicado o una modificación simultánea. Actualice la información y vuelva a intentarlo.");
    context.ExceptionHandled = true;
  }
}
