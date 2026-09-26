using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hcu008.Api.Migrations
{
    /// <inheritdoc />
    public partial class CrearEgresos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Egresos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AtencionId = table.Column<int>(type: "int", nullable: false),
                    TipoEgreso = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    CondicionEgreso = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Destino = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    DiagnosticoEgreso = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    ResumenClinico = table.Column<string>(type: "nvarchar(1200)", maxLength: 1200, nullable: false),
                    Indicaciones = table.Column<string>(type: "nvarchar(1200)", maxLength: 1200, nullable: false),
                    SignosAlarma = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    TratamientoDomiciliario = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Recomendaciones = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Observacion = table.Column<string>(type: "nvarchar(800)", maxLength: 800, nullable: true),
                    RequiereControl = table.Column<bool>(type: "bit", nullable: false),
                    RequiereReferencia = table.Column<bool>(type: "bit", nullable: false),
                    NombreAcompanante = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true),
                    ParentescoAcompanante = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    FechaEgreso = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Egresos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Egresos_Atenciones_AtencionId",
                        column: x => x.AtencionId,
                        principalTable: "Atenciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Egresos_AtencionId",
                table: "Egresos",
                column: "AtencionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Egresos");
        }
    }
}
