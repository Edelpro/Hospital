using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hcu008.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarSolicitudesAcceso : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SolicitudesAcceso",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombres = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    Correo = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    RolSolicitado = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    FechaSolicitud = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    FechaRespuesta = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ObservacionAdmin = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SolicitudesAcceso", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudesAcceso_Correo",
                table: "SolicitudesAcceso",
                column: "Correo");

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudesAcceso_Estado",
                table: "SolicitudesAcceso",
                column: "Estado");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SolicitudesAcceso");
        }
    }
}
