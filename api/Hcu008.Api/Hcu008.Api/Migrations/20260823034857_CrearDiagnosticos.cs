using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hcu008.Api.Migrations
{
    /// <inheritdoc />
    public partial class CrearDiagnosticos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Diagnosticos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AtencionId = table.Column<int>(type: "int", nullable: false),
                    CodigoCie10 = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    DescripcionCie10 = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    TipoDiagnostico = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Condicion = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Observacion = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Diagnosticos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Diagnosticos_Atenciones_AtencionId",
                        column: x => x.AtencionId,
                        principalTable: "Atenciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Diagnosticos_AtencionId",
                table: "Diagnosticos",
                column: "AtencionId");

            migrationBuilder.CreateIndex(
                name: "IX_Diagnosticos_CodigoCie10",
                table: "Diagnosticos",
                column: "CodigoCie10");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Diagnosticos");
        }
    }
}
