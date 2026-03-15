using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ServiceIEDUCA.Migrations
{
    /// <inheritdoc />
    public partial class AddProfessorFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AtividadeAtribuicoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AtividadeId = table.Column<int>(type: "integer", nullable: false),
                    ProfessorId = table.Column<int>(type: "integer", nullable: false),
                    AlunoId = table.Column<int>(type: "integer", nullable: true),
                    EscolaId = table.Column<int>(type: "integer", nullable: false),
                    Prazo = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Instrucoes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Ativa"),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AtividadeAtribuicoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AtividadeAtribuicoes_Atividades_AtividadeId",
                        column: x => x.AtividadeId,
                        principalTable: "Atividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AtividadeAtribuicoes_Users_AlunoId",
                        column: x => x.AlunoId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AtividadeAtribuicoes_Users_ProfessorId",
                        column: x => x.ProfessorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AtividadeAtribuicoes_escola_EscolaId",
                        column: x => x.EscolaId,
                        principalTable: "escola",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProfessorRedacaoRevisoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RedacaoCorrecaoId = table.Column<int>(type: "integer", nullable: false),
                    ProfessorId = table.Column<int>(type: "integer", nullable: false),
                    NotaTotalProfessor = table.Column<decimal>(type: "numeric(7,2)", nullable: false),
                    ComentarioGeral = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProfessorRedacaoRevisoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProfessorRedacaoRevisoes_RedacaoCorrecoes_RedacaoCorrecaoId",
                        column: x => x.RedacaoCorrecaoId,
                        principalTable: "RedacaoCorrecoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProfessorRedacaoRevisoes_Users_ProfessorId",
                        column: x => x.ProfessorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProfessorCompetenciaRevisoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RevisaoId = table.Column<int>(type: "integer", nullable: false),
                    NumeroCompetencia = table.Column<int>(type: "integer", nullable: false),
                    NotaProfessor = table.Column<int>(type: "integer", nullable: false),
                    ComentarioProfessor = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProfessorCompetenciaRevisoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProfessorCompetenciaRevisoes_ProfessorRedacaoRevisoes_Revis~",
                        column: x => x.RevisaoId,
                        principalTable: "ProfessorRedacaoRevisoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AtividadeAtribuicoes_AlunoId_Status",
                table: "AtividadeAtribuicoes",
                columns: new[] { "AlunoId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_AtividadeAtribuicoes_AtividadeId",
                table: "AtividadeAtribuicoes",
                column: "AtividadeId");

            migrationBuilder.CreateIndex(
                name: "IX_AtividadeAtribuicoes_EscolaId",
                table: "AtividadeAtribuicoes",
                column: "EscolaId");

            migrationBuilder.CreateIndex(
                name: "IX_AtividadeAtribuicoes_ProfessorId_EscolaId",
                table: "AtividadeAtribuicoes",
                columns: new[] { "ProfessorId", "EscolaId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProfessorCompetenciaRevisoes_RevisaoId_Numero",
                table: "ProfessorCompetenciaRevisoes",
                columns: new[] { "RevisaoId", "NumeroCompetencia" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProfessorRedacaoRevisoes_ProfessorId",
                table: "ProfessorRedacaoRevisoes",
                column: "ProfessorId");

            migrationBuilder.CreateIndex(
                name: "IX_ProfessorRedacaoRevisoes_RedacaoCorrecaoId",
                table: "ProfessorRedacaoRevisoes",
                column: "RedacaoCorrecaoId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AtividadeAtribuicoes");

            migrationBuilder.DropTable(
                name: "ProfessorCompetenciaRevisoes");

            migrationBuilder.DropTable(
                name: "ProfessorRedacaoRevisoes");
        }
    }
}
