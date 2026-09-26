using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hcu008.Api.Migrations
{
    /// <inheritdoc />
    public partial class CrearEvaluacionMedica : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EvaluacionesMedicas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AtencionId = table.Column<int>(type: "int", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EnfermedadActualAmpliada = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    AntecedentesPersonales = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    AntecedentesQuirurgicos = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    AntecedentesFamiliares = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    AntecedentesGinecoObstetricos = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    Alergias = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    EstadoGeneral = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    EstadoConciencia = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    Hidratacion = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Coloracion = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DolorActual = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DificultadRespiratoria = table.Column<bool>(type: "bit", nullable: false),
                    DolorToracico = table.Column<bool>(type: "bit", nullable: false),
                    DeficitNeurologico = table.Column<bool>(type: "bit", nullable: false),
                    SangradoActivo = table.Column<bool>(type: "bit", nullable: false),
                    Fiebre = table.Column<bool>(type: "bit", nullable: false),
                    Trauma = table.Column<bool>(type: "bit", nullable: false),
                    SospechaSepsis = table.Column<bool>(type: "bit", nullable: false),
                    RiesgoObstetrico = table.Column<bool>(type: "bit", nullable: false),
                    RiesgoQuirurgico = table.Column<bool>(type: "bit", nullable: false),
                    RequiereAislamiento = table.Column<bool>(type: "bit", nullable: false),
                    CabezaCuello = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    Torax = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    Cardiopulmonar = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    Abdomen = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    Genitourinario = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    Extremidades = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    Neurologico = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    PielFaneras = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    AnalisisClinico = table.Column<string>(type: "nvarchar(max)", maxLength: 5000, nullable: true),
                    ProblemasActivos = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    RiesgoClinico = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    ConductaInicial = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    PlanMedico = table.Column<string>(type: "nvarchar(max)", maxLength: 5000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluacionesMedicas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvaluacionesMedicas_Atenciones_AtencionId",
                        column: x => x.AtencionId,
                        principalTable: "Atenciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EvaluacionesMedicas_AtencionId",
                table: "EvaluacionesMedicas",
                column: "AtencionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EvaluacionesMedicas");
        }
    }
}
