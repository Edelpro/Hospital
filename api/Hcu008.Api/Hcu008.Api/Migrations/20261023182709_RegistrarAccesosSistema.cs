using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hcu008.Api.Migrations
{
    /// <inheritdoc />
    public partial class RegistrarAccesosSistema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RegistrosAcceso",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FechaUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: true),
                    Usuario = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Rol = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Metodo = table.Column<string>(type: "nvarchar(12)", maxLength: 12, nullable: false),
                    Ruta = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    DireccionIp = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: false),
                    Evento = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Resultado = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    CorrelacionId = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    CodigoEstado = table.Column<int>(type: "int", nullable: false),
                    DuracionMs = table.Column<long>(type: "bigint", nullable: false),
                    Exitoso = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RegistrosAcceso", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RegistrosAcceso_Exitoso_FechaUtc",
                table: "RegistrosAcceso",
                columns: new[] { "Exitoso", "FechaUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_RegistrosAcceso_FechaUtc",
                table: "RegistrosAcceso",
                column: "FechaUtc");

            migrationBuilder.CreateIndex(
                name: "IX_RegistrosAcceso_UsuarioId_FechaUtc",
                table: "RegistrosAcceso",
                columns: new[] { "UsuarioId", "FechaUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RegistrosAcceso");
        }
    }
}
