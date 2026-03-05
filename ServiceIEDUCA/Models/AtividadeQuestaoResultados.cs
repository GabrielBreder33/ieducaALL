using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    public class AtividadeQuestaoResultados
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ExecucaoId { get; set; }

        [Required]
        public int NumeroQuestao { get; set; }

        [Required]
        [MaxLength(10)]
        public string Resultado { get; set; } = string.Empty; // Acerto, Erro, Pulou

        [MaxLength(500)]
        public string? RespostaAluno { get; set; }

        [MaxLength(500)]
        public string? RespostaCorreta { get; set; }

        /// <summary>
        /// Tempo gasto nesta questão em segundos
        /// </summary>
        public int? TempoGastoSegundos { get; set; }

        [MaxLength(100)]
        public string? TopicoEspecifico { get; set; } // Para análise granular

        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        // Relacionamento
        [ForeignKey("ExecucaoId")]
        public virtual AtividadeExecucoes? Execucao { get; set; }
    }
}
