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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nome).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Senha).IsRequired().HasMaxLength(255);
                entity.Property(e => e.DataCriacao).HasDefaultValueSql("GETDATE()");
                
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
                entity.Property(e => e.CriadoEm).HasDefaultValueSql("GETDATE()");

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
                entity.Property(e => e.CriadoEm).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Em Andamento");

                // Relacionamento com User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Relacionamento com Atividades
                entity.HasOne(e => e.Atividade)
                    .WithMany(a => a.Execucoes)
                    .HasForeignKey(e => e.AtividadeId)
                    .OnDelete(DeleteBehavior.Restrict);

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
                entity.Property(e => e.CriadoEm).HasDefaultValueSql("GETDATE()");

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
        }
    }
}
