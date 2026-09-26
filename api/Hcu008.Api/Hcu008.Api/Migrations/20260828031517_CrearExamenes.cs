using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hcu008.Api.Migrations
{
    /// <inheritdoc />
    public partial class CrearExamenes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Examenes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AtencionId = table.Column<int>(type: "int", nullable: false),
                    TipoExamen = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    NombreExamen = table.Column<string>(type: "nvarchar(180)", maxLength: 180, nullable: false),
                    Prioridad = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    IndicacionClinica = table.Column<string>(type: "nvarchar(800)", maxLength: 800, nullable: false),
                    Observacion = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    RequiereAyuno = table.Column<bool>(type: "bit", nullable: false),
                    EsUrgente = table.Column<bool>(type: "bit", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    ResultadoResumen = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaSolicitud = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaResultado = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Examenes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Examenes_Atenciones_AtencionId",
                        column: x => x.AtencionId,
                        principalTable: "Atenciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Examenes_AtencionId",
                table: "Examenes",
                column: "AtencionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Examenes");
        }
    }
}
