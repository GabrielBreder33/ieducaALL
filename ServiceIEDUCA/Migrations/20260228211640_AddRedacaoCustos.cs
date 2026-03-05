using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ServiceIEDUCA.Migrations
{
    /// <inheritdoc />
    public partial class AddRedacaoCustos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RedacaoCustos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FkRedacao = table.Column<int>(type: "integer", nullable: false),
                    PromptCacheHitTokens = table.Column<int>(type: "integer", nullable: false),
                    PromptCacheHitPricing = table.Column<decimal>(type: "numeric(18,8)", nullable: false),
                    PromptCacheMissTokens = table.Column<int>(type: "integer", nullable: false),
                    PromptCacheMissPricing = table.Column<decimal>(type: "numeric(18,8)", nullable: false),
                    CustoOut = table.Column<int>(type: "integer", nullable: false),
                    CustoOutPricing = table.Column<decimal>(type: "numeric(18,8)", nullable: false),
                    Total = table.Column<decimal>(type: "numeric(18,8)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RedacaoCustos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RedacaoCustos_RedacaoCorrecoes_FkRedacao",
                        column: x => x.FkRedacao,
                        principalTable: "RedacaoCorrecoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RedacaoCustos_FkRedacao",
                table: "RedacaoCustos",
                column: "FkRedacao",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RedacaoCustos");
        }
    }
}
