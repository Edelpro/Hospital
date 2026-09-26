using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hcu008.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCatalogos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CatalogoItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Tipo = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Codigo = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Orden = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    Activo = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    EsSistema = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatalogoItems", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Atenciones_Estado",
                table: "Atenciones",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Atenciones_FechaIngreso",
                table: "Atenciones",
                column: "FechaIngreso");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogoItems_Activo",
                table: "CatalogoItems",
                column: "Activo");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogoItems_Tipo",
                table: "CatalogoItems",
                column: "Tipo");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogoItems_Tipo_Codigo",
                table: "CatalogoItems",
                columns: new[] { "Tipo", "Codigo" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CatalogoItems");

            migrationBuilder.DropIndex(
                name: "IX_Atenciones_Estado",
                table: "Atenciones");

            migrationBuilder.DropIndex(
                name: "IX_Atenciones_FechaIngreso",
                table: "Atenciones");
        }
    }
}
