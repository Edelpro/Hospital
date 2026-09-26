using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hcu008.Api.Migrations
{
    /// <inheritdoc />
    public partial class CrearEvoluciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Evoluciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AtencionId = table.Column<int>(type: "int", nullable: false),
                    TipoEvolucion = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    CondicionPaciente = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Subjetivo = table.Column<string>(type: "nvarchar(800)", maxLength: 800, nullable: true),
                    Objetivo = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Analisis = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Plan = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    SignosVitalesResumen = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    RespuestaTratamiento = table.Column<string>(type: "nvarchar(800)", maxLength: 800, nullable: true),
                    RequiereReevaluacion = table.Column<bool>(type: "bit", nullable: false),
                    EsCritica = table.Column<bool>(type: "bit", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Evoluciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Evoluciones_Atenciones_AtencionId",
                        column: x => x.AtencionId,
                        principalTable: "Atenciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Evoluciones_AtencionId",
                table: "Evoluciones",
                column: "AtencionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Evoluciones");
        }
    }
}
