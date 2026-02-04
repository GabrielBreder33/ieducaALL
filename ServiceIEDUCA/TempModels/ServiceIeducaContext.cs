using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace ServiceIEDUCA.TempModels;

public partial class ServiceIeducaContext : DbContext
{
    public ServiceIeducaContext(DbContextOptions<ServiceIeducaContext> options)
        : base(options)
    {
    }

    public virtual DbSet<RedacaoCorreco> RedacaoCorrecoes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RedacaoCorreco>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__RedacaoC__3214EC077FB040F6");

            entity.HasIndex(e => e.AtividadeExecucaoId, "IX_RedacaoCorrecao_AtividadeExecucaoId");

            entity.HasIndex(e => e.NotaTotal, "IX_RedacaoCorrecoes_NotaTotal");

            entity.HasIndex(e => e.UserId, "IX_RedacaoCorrecoes_UserId");

            entity.Property(e => e.ConfiancaAvaliacao).HasColumnType("decimal(3, 2)");
            entity.Property(e => e.CriadoEm).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.MotivoNotaZero).HasMaxLength(500);
            entity.Property(e => e.Progresso).HasDefaultValue(100);
            entity.Property(e => e.ResumoFinal).HasMaxLength(2000);
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("concluida");
            entity.Property(e => e.Tema).HasMaxLength(500);
            entity.Property(e => e.TipoAvaliacao)
                .HasMaxLength(50)
                .HasDefaultValue("ENEM");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
