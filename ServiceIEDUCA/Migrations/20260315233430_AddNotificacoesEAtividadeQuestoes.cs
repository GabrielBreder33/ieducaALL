using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ServiceIEDUCA.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificacoesEAtividadeQuestoes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExplicacoesJson",
                table: "Atividades",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GabaritoJson",
                table: "Atividades",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QuestoesJson",
                table: "Atividades",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Notificacoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Mensagem = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ReferenciaId = table.Column<int>(type: "integer", nullable: true),
                    ReferenciaTipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Lida = table.Column<bool>(type: "boolean", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notificacoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notificacoes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notificacoes_UserId_Lida",
                table: "Notificacoes",
                columns: new[] { "UserId", "Lida" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Notificacoes");

            migrationBuilder.DropColumn(
                name: "ExplicacoesJson",
                table: "Atividades");

            migrationBuilder.DropColumn(
                name: "GabaritoJson",
                table: "Atividades");

            migrationBuilder.DropColumn(
                name: "QuestoesJson",
                table: "Atividades");
        }
    }
}
