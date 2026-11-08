using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hcu008.Api.Migrations
{
    /// <inheritdoc />
    public partial class SepararPacientesYPlantillasCompartidas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RegistradoPorUsuarioId",
                table: "Pacientes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ResponsableUsuarioId",
                table: "Atenciones",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE a
                SET ResponsableUsuarioId = auditoria.UsuarioId
                FROM Atenciones a
                CROSS APPLY (
                    SELECT TOP (1) r.UsuarioId
                    FROM RegistrosAuditoria r
                    INNER JOIN UsuariosSistema u ON u.Id = r.UsuarioId AND u.Rol = 'Doctor'
                    WHERE r.Entidad = 'Atencion' AND r.RegistroId = a.Id AND r.Operacion = 'Creación'
                    ORDER BY r.FechaUtc ASC
                ) auditoria;

                UPDATE p
                SET RegistradoPorUsuarioId = auditoria.UsuarioId
                FROM Pacientes p
                CROSS APPLY (
                    SELECT TOP (1) r.UsuarioId
                    FROM RegistrosAuditoria r
                    WHERE r.Entidad = 'Paciente' AND r.RegistroId = p.Id AND r.Operacion = 'Creación'
                    ORDER BY r.FechaUtc ASC
                ) auditoria;
            ");

            migrationBuilder.CreateTable(
                name: "PlantillasClinicas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Modulo = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    ContenidoJson = table.Column<string>(type: "nvarchar(max)", maxLength: 12000, nullable: false),
                    ClaseColor = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    CreadoPorUsuarioId = table.Column<int>(type: "int", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlantillasClinicas", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Pacientes_RegistradoPorUsuarioId",
                table: "Pacientes",
                column: "RegistradoPorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Atenciones_ResponsableUsuarioId",
                table: "Atenciones",
                column: "ResponsableUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_PlantillasClinicas_Modulo_Activo",
                table: "PlantillasClinicas",
                columns: new[] { "Modulo", "Activo" });

            migrationBuilder.CreateIndex(
                name: "IX_PlantillasClinicas_Modulo_Nombre",
                table: "PlantillasClinicas",
                columns: new[] { "Modulo", "Nombre" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlantillasClinicas");

            migrationBuilder.DropIndex(
                name: "IX_Pacientes_RegistradoPorUsuarioId",
                table: "Pacientes");

            migrationBuilder.DropIndex(
                name: "IX_Atenciones_ResponsableUsuarioId",
                table: "Atenciones");

            migrationBuilder.DropColumn(
                name: "RegistradoPorUsuarioId",
                table: "Pacientes");

            migrationBuilder.DropColumn(
                name: "ResponsableUsuarioId",
                table: "Atenciones");
        }
    }
}
