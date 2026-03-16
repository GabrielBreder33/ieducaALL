using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Models;

namespace ServiceIEDUCA.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }

        public DbSet<Conhecimento> areas_conhecimento { get; set; }
        public DbSet<Materias> materias { get; set; }

        public DbSet<Atividades> Atividades { get; set; }
        public DbSet<AtividadeExecucoes> AtividadeExecucoes { get; set; }
        public DbSet<AtividadeQuestaoResultados> AtividadeQuestaoResultados { get; set; }
        public DbSet<Escola> escola { get; set; }

        public DbSet<RedacaoCorrecoes> RedacaoCorrecoes { get; set; }
        public DbSet<RedacaoCompetencias> RedacaoCompetencias { get; set; }
        public DbSet<RedacaoErrosGramaticais> RedacaoErrosGramaticais { get; set; }
        public DbSet<RedacaoFeedbacks> RedacaoFeedbacks { get; set; }
        public DbSet<RedacaoPropostaIntervencao> RedacaoPropostaIntervencao { get; set; }
        public DbSet<RedacaoCustos> RedacaoCustos { get; set; }

        // Professor
        public DbSet<AtividadeAtribuicao> AtividadeAtribuicoes { get; set; }
        public DbSet<ProfessorRedacaoRevisao> ProfessorRedacaoRevisoes { get; set; }
        public DbSet<ProfessorCompetenciaRevisao> ProfessorCompetenciaRevisoes { get; set; }
        public DbSet<ProfessorRedacaoGrifo> ProfessorRedacaoGrifos { get; set; }

        // Notificações
        public DbSet<Notificacao> Notificacoes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nome).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Senha).IsRequired().HasMaxLength(255);
                entity.Property(e => e.DataCriacao).HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                // Relacionamento com Escola
                entity.HasOne<Escola>()
                    .WithMany()
                    .HasForeignKey(e => e.id_Escola)
                    .OnDelete(DeleteBehavior.Restrict)
                    .IsRequired(false);
            });

            // Configuração: Atividades
            modelBuilder.Entity<Atividades>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nome).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Tipo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.NivelDificuldade).IsRequired().HasMaxLength(50);
                entity.Property(e => e.CriadoEm).HasDefaultValueSql("CURRENT_TIMESTAMP");

                // Relacionamento com Materias
                entity.HasOne(e => e.Materia)
                    .WithMany()
                    .HasForeignKey(e => e.MateriaId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Índice para consultas por matéria
                entity.HasIndex(e => e.MateriaId);
            });

            // Configuração: AtividadeExecucoes (FACT TABLE - TABELA MAIS IMPORTANTE)
            modelBuilder.Entity<AtividadeExecucoes>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CriadoEm).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Em Andamento");

                // Relacionamentos comentados - não necessários pois usamos Select() direto
                // entity.HasOne(e => e.User)
                //     .WithMany()
                //     .HasForeignKey(e => e.UserId)
                //     .OnDelete(DeleteBehavior.Restrict);

                // entity.HasOne(e => e.Atividade)
                //     .WithMany(a => a.Execucoes)
                //     .HasForeignKey(e => e.AtividadeId)
                //     .OnDelete(DeleteBehavior.Restrict);

                // ÍNDICES ESTRATÉGICOS PARA PERFORMANCE E BI
                // Índice composto: histórico e evolução do aluno
                entity.HasIndex(e => new { e.UserId, e.CriadoEm })
                    .HasDatabaseName("IX_AtividadeExecucoes_UserId_CriadoEm");

                // Índice: relatórios por atividade
                entity.HasIndex(e => e.AtividadeId)
                    .HasDatabaseName("IX_AtividadeExecucoes_AtividadeId");

                // Índice: consultas por data (análises temporais)
                entity.HasIndex(e => e.CriadoEm)
                    .HasDatabaseName("IX_AtividadeExecucoes_CriadoEm");

                // Índice: filtros por status
                entity.HasIndex(e => e.Status)
                    .HasDatabaseName("IX_AtividadeExecucoes_Status");
            });

            // Configuração: AtividadeQuestaoResultados (Opcional - Análise Detalhada)
            modelBuilder.Entity<AtividadeQuestaoResultados>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Resultado).IsRequired().HasMaxLength(10);
                entity.Property(e => e.CriadoEm).HasDefaultValueSql("CURRENT_TIMESTAMP");

                // Relacionamento com AtividadeExecucoes
                entity.HasOne(e => e.Execucao)
                    .WithMany(ex => ex.QuestaoResultados)
                    .HasForeignKey(e => e.ExecucaoId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Índice composto: consultas por execução e número da questão
                entity.HasIndex(e => new { e.ExecucaoId, e.NumeroQuestao })
                    .HasDatabaseName("IX_AtividadeQuestaoResultados_ExecucaoId_NumeroQuestao");

                // Índice: análise por resultado (acertos/erros)
                entity.HasIndex(e => e.Resultado)
                    .HasDatabaseName("IX_AtividadeQuestaoResultados_Resultado");
            });

            // Configuração: RedacaoCorrecoes
            modelBuilder.Entity<RedacaoCorrecoes>(entity =>
            {
                entity.Property(e => e.NotaTotal)
                    .HasColumnType("int");
            });

            // Configuração: AtividadeAtribuicao
            modelBuilder.Entity<AtividadeAtribuicao>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).HasMaxLength(30).HasDefaultValue("Ativa");
                entity.Property(e => e.CriadoEm).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasIndex(e => new { e.ProfessorId, e.EscolaId })
                    .HasDatabaseName("IX_AtividadeAtribuicoes_ProfessorId_EscolaId");

                entity.HasIndex(e => new { e.AlunoId, e.Status })
                    .HasDatabaseName("IX_AtividadeAtribuicoes_AlunoId_Status");
            });

            // Configuração: ProfessorRedacaoRevisao
            modelBuilder.Entity<ProfessorRedacaoRevisao>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CriadoEm).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.NotaTotalProfessor).HasColumnType("decimal(7,2)");

                entity.HasIndex(e => e.RedacaoCorrecaoId)
                    .IsUnique()
                    .HasDatabaseName("IX_ProfessorRedacaoRevisoes_RedacaoCorrecaoId");

                entity.HasIndex(e => e.ProfessorId)
                    .HasDatabaseName("IX_ProfessorRedacaoRevisoes_ProfessorId");
            });

            // Configuração: ProfessorCompetenciaRevisao
            modelBuilder.Entity<ProfessorCompetenciaRevisao>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CriadoEm).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Revisao)
                    .WithMany(r => r.CompetenciaRevisoes)
                    .HasForeignKey(e => e.RevisaoId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => new { e.RevisaoId, e.NumeroCompetencia })
                    .IsUnique()
                    .HasDatabaseName("IX_ProfessorCompetenciaRevisoes_RevisaoId_Numero");
            });

            // Configuração: ProfessorRedacaoGrifo
            modelBuilder.Entity<ProfessorRedacaoGrifo>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CriadoEm).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.Cor).HasMaxLength(30).HasDefaultValue("yellow");
                entity.Property(e => e.Comentario).HasMaxLength(500);

                entity.HasOne(e => e.Revisao)
                    .WithMany(r => r.Grifos)
                    .HasForeignKey(e => e.RevisaoId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.RevisaoId)
                    .HasDatabaseName("IX_ProfessorRedacaoGrifos_RevisaoId");
            });

            modelBuilder.Entity<RedacaoCustos>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.PromptCacheHitPricing)
                    .HasColumnType("decimal(18,8)");

                entity.Property(e => e.PromptCacheMissPricing)
                    .HasColumnType("decimal(18,8)");

                entity.Property(e => e.CustoOutPricing)
                    .HasColumnType("decimal(18,8)");

                entity.Property(e => e.Total)
                    .HasColumnType("decimal(18,8)");

                entity.HasOne(e => e.Redacao)
                    .WithMany()
                    .HasForeignKey(e => e.FkRedacao)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.FkRedacao)
                    .IsUnique()
                    .HasDatabaseName("IX_RedacaoCustos_FkRedacao");
            });

            // Configuração: Notificacao
            modelBuilder.Entity<Notificacao>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CriadoEm).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.HasIndex(e => new { e.UserId, e.Lida })
                    .HasDatabaseName("IX_Notificacoes_UserId_Lida");
            });
        }
    }
}
