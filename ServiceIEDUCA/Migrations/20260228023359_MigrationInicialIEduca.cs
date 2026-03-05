using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ServiceIEDUCA.Migrations
{
    /// <inheritdoc />
    public partial class MigrationInicialIEduca : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "areas_conhecimento",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_areas_conhecimento", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "escola",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    senha = table.Column<string>(type: "text", nullable: false),
                    data_criacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_escola", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "materias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    area_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_materias", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Senha = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Telefone = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    id_Escola = table.Column<int>(type: "integer", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_escola_id_Escola",
                        column: x => x.id_Escola,
                        principalTable: "escola",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Atividades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    MateriaId = table.Column<int>(type: "integer", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NivelDificuldade = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TotalQuestoes = table.Column<int>(type: "integer", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Atividades", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Atividades_materias_MateriaId",
                        column: x => x.MateriaId,
                        principalTable: "materias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AtividadeExecucoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    AtividadeId = table.Column<int>(type: "integer", nullable: false),
                    DataInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataFim = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TotalQuestoes = table.Column<int>(type: "integer", nullable: false),
                    Acertos = table.Column<int>(type: "integer", nullable: false),
                    Erros = table.Column<int>(type: "integer", nullable: false),
                    Nota = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    TempoGastoSegundos = table.Column<int>(type: "integer", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Em Andamento"),
                    Materia = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Segmento = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Ano = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Conteudo = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Nivel = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    GeradaPorIA = table.Column<bool>(type: "boolean", nullable: false),
                    QuestoesJson = table.Column<string>(type: "text", nullable: true),
                    GabaritoJson = table.Column<string>(type: "text", nullable: true),
                    RespostasJson = table.Column<string>(type: "text", nullable: true),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AtividadeExecucoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AtividadeExecucoes_Atividades_AtividadeId",
                        column: x => x.AtividadeId,
                        principalTable: "Atividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AtividadeQuestaoResultados",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExecucaoId = table.Column<int>(type: "integer", nullable: false),
                    NumeroQuestao = table.Column<int>(type: "integer", nullable: false),
                    Resultado = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    RespostaAluno = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RespostaCorreta = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TempoGastoSegundos = table.Column<int>(type: "integer", nullable: true),
                    TopicoEspecifico = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AtividadeQuestaoResultados", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AtividadeQuestaoResultados_AtividadeExecucoes_ExecucaoId",
                        column: x => x.ExecucaoId,
                        principalTable: "AtividadeExecucoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RedacaoCorrecoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AtividadeExecucaoId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Tema = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    TextoRedacao = table.Column<string>(type: "text", nullable: true),
                    NotaZero = table.Column<bool>(type: "boolean", nullable: false),
                    MotivoNotaZero = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    NotaTotal = table.Column<int>(type: "int", nullable: false),
                    ResumoFinal = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    VersaoReescrita = table.Column<string>(type: "text", nullable: true),
                    ConfiancaAvaliacao = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Progresso = table.Column<int>(type: "integer", nullable: false),
                    TipoAvaliacao = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RedacaoCorrecoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RedacaoCorrecoes_AtividadeExecucoes_AtividadeExecucaoId",
                        column: x => x.AtividadeExecucaoId,
                        principalTable: "AtividadeExecucoes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RedacaoCorrecoes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RedacaoCompetencias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RedacaoCorrecaoId = table.Column<int>(type: "integer", nullable: false),
                    NumeroCompetencia = table.Column<int>(type: "integer", nullable: false),
                    NomeCompetencia = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Nota = table.Column<int>(type: "integer", nullable: false),
                    Comentario = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Evidencias = table.Column<string>(type: "text", nullable: true),
                    Melhorias = table.Column<string>(type: "text", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RedacaoCompetencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RedacaoCompetencias_RedacaoCorrecoes_RedacaoCorrecaoId",
                        column: x => x.RedacaoCorrecaoId,
                        principalTable: "RedacaoCorrecoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RedacaoErrosGramaticais",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RedacaoCorrecaoId = table.Column<int>(type: "integer", nullable: false),
                    PosicaoInicio = table.Column<int>(type: "integer", nullable: false),
                    PosicaoFim = table.Column<int>(type: "integer", nullable: false),
                    TextoOriginal = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TextoSugerido = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Explicacao = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Severidade = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RedacaoErrosGramaticais", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RedacaoErrosGramaticais_RedacaoCorrecoes_RedacaoCorrecaoId",
                        column: x => x.RedacaoCorrecaoId,
                        principalTable: "RedacaoCorrecoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RedacaoFeedbacks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RedacaoCorrecaoId = table.Column<int>(type: "integer", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Conteudo = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Ordem = table.Column<int>(type: "integer", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RedacaoFeedbacks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RedacaoFeedbacks_RedacaoCorrecoes_RedacaoCorrecaoId",
                        column: x => x.RedacaoCorrecaoId,
                        principalTable: "RedacaoCorrecoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RedacaoPropostaIntervencao",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RedacaoCorrecaoId = table.Column<int>(type: "integer", nullable: false),
                    Avaliacao = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    SugestoesConcretas = table.Column<string>(type: "text", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RedacaoPropostaIntervencao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RedacaoPropostaIntervencao_RedacaoCorrecoes_RedacaoCorrecao~",
                        column: x => x.RedacaoCorrecaoId,
                        principalTable: "RedacaoCorrecoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AtividadeExecucoes_AtividadeId",
                table: "AtividadeExecucoes",
                column: "AtividadeId");

            migrationBuilder.CreateIndex(
                name: "IX_AtividadeExecucoes_CriadoEm",
                table: "AtividadeExecucoes",
                column: "CriadoEm");

            migrationBuilder.CreateIndex(
                name: "IX_AtividadeExecucoes_Status",
                table: "AtividadeExecucoes",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_AtividadeExecucoes_UserId_CriadoEm",
                table: "AtividadeExecucoes",
                columns: new[] { "UserId", "CriadoEm" });

            migrationBuilder.CreateIndex(
                name: "IX_AtividadeQuestaoResultados_ExecucaoId_NumeroQuestao",
                table: "AtividadeQuestaoResultados",
                columns: new[] { "ExecucaoId", "NumeroQuestao" });

            migrationBuilder.CreateIndex(
                name: "IX_AtividadeQuestaoResultados_Resultado",
                table: "AtividadeQuestaoResultados",
                column: "Resultado");

            migrationBuilder.CreateIndex(
                name: "IX_Atividades_MateriaId",
                table: "Atividades",
                column: "MateriaId");

            migrationBuilder.CreateIndex(
                name: "IX_RedacaoCompetencias_RedacaoCorrecaoId",
                table: "RedacaoCompetencias",
                column: "RedacaoCorrecaoId");

            migrationBuilder.CreateIndex(
                name: "IX_RedacaoCorrecoes_AtividadeExecucaoId",
                table: "RedacaoCorrecoes",
                column: "AtividadeExecucaoId");

            migrationBuilder.CreateIndex(
                name: "IX_RedacaoCorrecoes_UserId",
                table: "RedacaoCorrecoes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RedacaoErrosGramaticais_RedacaoCorrecaoId",
                table: "RedacaoErrosGramaticais",
                column: "RedacaoCorrecaoId");

            migrationBuilder.CreateIndex(
                name: "IX_RedacaoFeedbacks_RedacaoCorrecaoId",
                table: "RedacaoFeedbacks",
                column: "RedacaoCorrecaoId");

            migrationBuilder.CreateIndex(
                name: "IX_RedacaoPropostaIntervencao_RedacaoCorrecaoId",
                table: "RedacaoPropostaIntervencao",
                column: "RedacaoCorrecaoId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_id_Escola",
                table: "Users",
                column: "id_Escola");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "areas_conhecimento");

            migrationBuilder.DropTable(
                name: "AtividadeQuestaoResultados");

            migrationBuilder.DropTable(
                name: "RedacaoCompetencias");

            migrationBuilder.DropTable(
                name: "RedacaoErrosGramaticais");

            migrationBuilder.DropTable(
                name: "RedacaoFeedbacks");

            migrationBuilder.DropTable(
                name: "RedacaoPropostaIntervencao");

            migrationBuilder.DropTable(
                name: "RedacaoCorrecoes");

            migrationBuilder.DropTable(
                name: "AtividadeExecucoes");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Atividades");

            migrationBuilder.DropTable(
                name: "escola");

            migrationBuilder.DropTable(
                name: "materias");
        }
    }
}
