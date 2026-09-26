using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hcu008.Api.Migrations
{
    /// <inheritdoc />
    public partial class AjusteAtencionTriajeCamposPredefinidos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Acompanante",
                table: "Atenciones",
                newName: "NombreAcompanante");

            migrationBuilder.AddColumn<bool>(
                name: "Aislamiento",
                table: "Triajes",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AlergiaConocida",
                table: "Triajes",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "AlergiaDescripcion",
                table: "Triajes",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DiscriminadorClinicoOtro",
                table: "Triajes",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FlujoOxigeno",
                table: "Triajes",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GlasgowMotora",
                table: "Triajes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GlasgowOcular",
                table: "Triajes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GlasgowVerbal",
                table: "Triajes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "OxigenoSuplementario",
                table: "Triajes",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "RiesgoCaida",
                table: "Triajes",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TipoAislamiento",
                table: "Triajes",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Procedencia",
                table: "Atenciones",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(80)",
                oldMaxLength: 80);

            migrationBuilder.AlterColumn<string>(
                name: "MotivoConsulta",
                table: "Atenciones",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "CondicionLlegada",
                table: "Atenciones",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(80)",
                oldMaxLength: 80);

            migrationBuilder.AddColumn<string>(
                name: "MotivoConsultaOtro",
                table: "Atenciones",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParentescoAcompanante",
                table: "Atenciones",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelefonoAcompanante",
                table: "Atenciones",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TieneAcompanante",
                table: "Atenciones",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Aislamiento",
                table: "Triajes");

            migrationBuilder.DropColumn(
                name: "AlergiaConocida",
                table: "Triajes");

            migrationBuilder.DropColumn(
                name: "AlergiaDescripcion",
                table: "Triajes");

            migrationBuilder.DropColumn(
                name: "DiscriminadorClinicoOtro",
                table: "Triajes");

            migrationBuilder.DropColumn(
                name: "FlujoOxigeno",
                table: "Triajes");

            migrationBuilder.DropColumn(
                name: "GlasgowMotora",
                table: "Triajes");

            migrationBuilder.DropColumn(
                name: "GlasgowOcular",
                table: "Triajes");

            migrationBuilder.DropColumn(
                name: "GlasgowVerbal",
                table: "Triajes");

            migrationBuilder.DropColumn(
                name: "OxigenoSuplementario",
                table: "Triajes");

            migrationBuilder.DropColumn(
                name: "RiesgoCaida",
                table: "Triajes");

            migrationBuilder.DropColumn(
                name: "TipoAislamiento",
                table: "Triajes");

            migrationBuilder.DropColumn(
                name: "MotivoConsultaOtro",
                table: "Atenciones");

            migrationBuilder.DropColumn(
                name: "ParentescoAcompanante",
                table: "Atenciones");

            migrationBuilder.DropColumn(
                name: "TelefonoAcompanante",
                table: "Atenciones");

            migrationBuilder.DropColumn(
                name: "TieneAcompanante",
                table: "Atenciones");

            migrationBuilder.RenameColumn(
                name: "NombreAcompanante",
                table: "Atenciones",
                newName: "Acompanante");

            migrationBuilder.AlterColumn<string>(
                name: "Procedencia",
                table: "Atenciones",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "MotivoConsulta",
                table: "Atenciones",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(120)",
                oldMaxLength: 120);

            migrationBuilder.AlterColumn<string>(
                name: "CondicionLlegada",
                table: "Atenciones",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);
        }
    }
}
