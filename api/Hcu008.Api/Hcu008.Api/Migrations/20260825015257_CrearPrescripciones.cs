using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hcu008.Api.Migrations
{
    /// <inheritdoc />
    public partial class CrearPrescripciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Prescripciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AtencionId = table.Column<int>(type: "int", nullable: false),
                    Medicamento = table.Column<string>(type: "nvarchar(180)", maxLength: 180, nullable: false),
                    Presentacion = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Dosis = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    ViaAdministracion = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Frecuencia = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Duracion = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Cantidad = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    Indicaciones = table.Column<string>(type: "nvarchar(800)", maxLength: 800, nullable: true),
                    AdministrarAhora = table.Column<bool>(type: "bit", nullable: false),
                    EsUrgente = table.Column<bool>(type: "bit", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Prescripciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Prescripciones_Atenciones_AtencionId",
                        column: x => x.AtencionId,
                        principalTable: "Atenciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Prescripciones_AtencionId",
                table: "Prescripciones",
                column: "AtencionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Prescripciones");
        }
    }
}
