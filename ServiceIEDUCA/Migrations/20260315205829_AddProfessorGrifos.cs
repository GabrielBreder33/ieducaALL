using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ServiceIEDUCA.Migrations
{
    /// <inheritdoc />
    public partial class AddProfessorGrifos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProfessorRedacaoGrifos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RevisaoId = table.Column<int>(type: "integer", nullable: false),
                    PosicaoInicio = table.Column<int>(type: "integer", nullable: false),
                    PosicaoFim = table.Column<int>(type: "integer", nullable: false),
                    Cor = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "yellow"),
                    Comentario = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProfessorRedacaoGrifos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProfessorRedacaoGrifos_ProfessorRedacaoRevisoes_RevisaoId",
                        column: x => x.RevisaoId,
                        principalTable: "ProfessorRedacaoRevisoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProfessorRedacaoGrifos_RevisaoId",
                table: "ProfessorRedacaoGrifos",
                column: "RevisaoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProfessorRedacaoGrifos");
        }
    }
}
