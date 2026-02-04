using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    [Table("RedacaoCorrecoes")]
    public class RedacaoCorrecoes
    {
        [Key]
        public int Id { get; set; }

        public int? AtividadeExecucaoId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Tema { get; set; } = string.Empty;

        public string? TextoRedacao { get; set; }

        public bool NotaZero { get; set; }

        [MaxLength(500)]
        public string? MotivoNotaZero { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal NotaTotal { get; set; }

        [MaxLength(2000)]
        public string? ResumoFinal { get; set; }

        public string? VersaoReescrita { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? ConfiancaAvaliacao { get; set; }

        public DateTime? CriadoEm { get; set; }

        public DateTime? AtualizadoEm { get; set; }

        [MaxLength(50)]
        public string? Status { get; set; }

        public int Progresso { get; set; }

        [MaxLength(30)]
        public string? TipoAvaliacao { get; set; }

        // Relacionamentos
        [ForeignKey("AtividadeExecucaoId")]
        public virtual AtividadeExecucoes? AtividadeExecucao { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        public virtual ICollection<RedacaoCompetencias>? Competencias { get; set; }
        public virtual ICollection<RedacaoErrosGramaticais>? ErrosGramaticais { get; set; }
        public virtual ICollection<RedacaoFeedbacks>? Feedbacks { get; set; }
        public virtual RedacaoPropostaIntervencao? PropostaIntervencao { get; set; }
    }
}
